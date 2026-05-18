import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import React from 'react'

// Component tests exercise UI state transitions, not JWT signature verification.
// Replace `jwtVerify` with a decode-only fall-through so test fixtures don't
// need a real key pair, and short-circuit `createRemoteJWKSet` so jose
// doesn't attempt to fetch /auth/jwks. Real verification is exercised in
// client.test.ts.
vi.mock('jose', async () => {
  const actual = await vi.importActual<typeof import('jose')>('jose')
  return {
    ...actual,
    jwtVerify: vi.fn(async (jwt: string) => ({
      payload: actual.decodeJwt(jwt),
      protectedHeader: {},
    })),
    createRemoteJWKSet: vi.fn(() => () => null),
  }
})

import { base64url } from 'jose'
import { makeCmsLogin, type AuthClient } from '../component'

function b64url(s: string): string {
  return base64url.encode(new TextEncoder().encode(s))
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = b64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT', kid: 'k1' }))
  const body = b64url(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

function accessJwt(overrides: Partial<Record<string, unknown>> = {}): string {
  const now = Math.floor(Date.now() / 1000)
  return makeJwt({
    sub: 'user-1',
    email: 'user@example.com',
    app: 'cms',
    typ: 'access',
    scope: 'cms:read cms:write',
    access_token: 'ghu_test',
    iat: now,
    exp: now + 900,
    ...overrides,
  })
}

function stubAuthClient(overrides: Partial<{
  signIn: { social: ReturnType<typeof vi.fn> }
  oauth2: { link: ReturnType<typeof vi.fn> }
}> = {}): AuthClient {
  return {
    signIn: { social: vi.fn().mockResolvedValue({ data: { url: 'https://github.com/login/oauth/authorize?test=1' }, error: null }) },
    oauth2: { link: vi.fn().mockResolvedValue({ data: { url: 'https://github.com/login/oauth/authorize?link=1' }, error: null }) },
    ...overrides,
  } as unknown as AuthClient
}

function mockFetchResponse(opts: { status: number; body?: unknown }) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: opts.status >= 200 && opts.status < 300,
    status: opts.status,
    json: () => Promise.resolve(opts.body ?? {}),
  }))
}

function setHash(hash: string) {
  history.replaceState(null, '', window.location.pathname + window.location.search + hash)
}

describe('CmsLogin', () => {
  beforeEach(() => {
    setHash('')
    vi.unstubAllGlobals()
    mockFetchResponse({ status: 401, body: {} })
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders a disabled status button while bootstrapping', () => {
    const Component = makeCmsLogin('https://auth.test', stubAuthClient())
    render(<Component onLogin={vi.fn()} />)

    const btn = screen.getByRole('button', { name: /checking sign-in/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: /^sign in$/i })).toBeNull()
  })

  it('renders Sign-in button after bootstrap probe finds no brokerable token', async () => {
    const Component = makeCmsLogin('https://auth.test', stubAuthClient())
    render(<Component onLogin={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /^sign in$/i })).toBeDefined()
  })

  it('bootstrap auto-hands off when an existing session can broker a token', async () => {
    mockFetchResponse({ status: 200, body: { jwt: accessJwt({ access_token: 'ghu_existing' }) } })
    const social = vi.fn()
    const onLogin = vi.fn()
    const Component = makeCmsLogin('https://auth.test', stubAuthClient({ signIn: { social } }))
    render(<Component onLogin={onLogin} />)

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1))
    expect(onLogin.mock.calls[0][0]).toMatchObject({ token: 'ghu_existing', provider: 'github' })
    // No orphan session created: signIn.social must not fire during bootstrap.
    expect(social).not.toHaveBeenCalled()
  })

  it('bootstrap does NOT auto-redirect on needsLink (no auto-login)', async () => {
    // Even though the user has a valid session, the CMS App isn't linked yet.
    // Auto-redirecting to GitHub here would be surprising — the rule is that
    // OAuth round-trips require an explicit user click. Bootstrap must drop
    // to `idle` instead, exposing the Sign in button.
    mockFetchResponse({ status: 401, body: { needsLink: true, provider: 'github-cms' } })
    const link = vi.fn()
    const Component = makeCmsLogin('https://auth.test', stubAuthClient({ oauth2: { link } }))
    render(<Component onLogin={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /^sign in$/i })).toBeDefined()
    expect(link).not.toHaveBeenCalled()
  })

  it('bootstrap → 403 surfaces the role error directly (no silent bounce to idle)', async () => {
    // User is signed in but lacks the cms-editor role. Bootstrap must NOT
    // silently fall through to `idle` — that would just bounce them through
    // OAuth on the next click to learn the same thing.
    mockFetchResponse({ status: 403 })
    const Component = makeCmsLogin('https://auth.test', stubAuthClient())
    render(<Component onLogin={vi.fn()} />)

    await waitFor(() => expect(screen.getByText(/lacks CMS access/i)).toBeDefined())
    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined()
    // No Sign in affordance — proves we didn't drop to idle.
    expect(screen.queryByRole('button', { name: /^sign in$/i })).toBeNull()
  })

  it('click → 403 surfaces the role error without bouncing through OAuth', async () => {
    // Bootstrap probe returns 401 (no session) → idle. User clicks Sign in,
    // and now the probe returns 403 (e.g., they signed in on another tab
    // but lack the role). signIn.social must NOT fire — that would orphan
    // a fresh OAuth round-trip whose only payoff is the same error message.
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: false, status: 403, json: () => Promise.resolve({}) })
    vi.stubGlobal('fetch', fetchMock)

    const social = vi.fn()
    const Component = makeCmsLogin('https://auth.test', stubAuthClient({ signIn: { social } }))
    render(<Component onLogin={vi.fn()} />)

    const btn = await screen.findByRole('button', { name: /^sign in$/i })
    fireEvent.click(btn)

    await waitFor(() => expect(screen.getByText(/lacks CMS access/i)).toBeDefined())
    expect(social).not.toHaveBeenCalled()
  })

  it('click triggers authClient.signIn.social when no existing session', async () => {
    const social = vi.fn().mockResolvedValue({
      data: { url: 'https://github.com/login/oauth/authorize?test=1' },
      error: null,
    })
    const Component = makeCmsLogin('https://auth.test', stubAuthClient({
      signIn: { social },
    }))
    render(<Component onLogin={vi.fn()} />)

    const btn = await screen.findByRole('button', { name: /^sign in$/i })
    fireEvent.click(btn)

    await waitFor(() => expect(social).toHaveBeenCalledTimes(1))
    const callArg = social.mock.calls[0][0]
    expect(callArg.provider).toBe('github')
    expect(callArg.callbackURL).toMatch(/#\/cms-pending-signin$/)
  })

  it('click triggers oauth2.link when session exists but CMS not yet linked', async () => {
    mockFetchResponse({ status: 401, body: { needsLink: true, provider: 'github-cms' } })
    const link = vi.fn().mockResolvedValue({
      data: { url: 'https://github.com/login/oauth/authorize?link=1' },
      error: null,
    })
    const social = vi.fn()
    const Component = makeCmsLogin('https://auth.test', stubAuthClient({
      signIn: { social },
      oauth2: { link },
    }))
    render(<Component onLogin={vi.fn()} />)

    const btn = await screen.findByRole('button', { name: /^sign in$/i })
    fireEvent.click(btn)

    await waitFor(() => expect(link).toHaveBeenCalledTimes(1))
    expect(link.mock.calls[0][0]).toMatchObject({ providerId: 'github-cms' })
    expect(social).not.toHaveBeenCalled()
  })

  it('rejects redirect URLs whose scheme is not https (open-redirect / javascript:)', async () => {
    // Hostname allowlist alone isn't enough: `new URL('javascript://github.com/%0Aalert(1)')`
    // parses with hostname 'github.com', so a bad worker response could turn into
    // script execution in the CMS origin. safeNavigate must require https:.
    const social = vi.fn().mockResolvedValue({
      data: { url: 'javascript://github.com/%0Aalert(1)' },
      error: null,
    })
    const Component = makeCmsLogin('https://auth.test', stubAuthClient({ signIn: { social } }))
    render(<Component onLogin={vi.fn()} />)

    const btn = await screen.findByRole('button', { name: /^sign in$/i })
    fireEvent.click(btn)

    await waitFor(() => expect(screen.getByText(/unexpected redirect target/i)).toBeDefined())
  })

  it('button is disabled and shows progress label while redirecting', async () => {
    // signIn.social hangs forever after bootstrap+click probe falls through.
    const social = vi.fn(() => new Promise(() => {}))
    const Component = makeCmsLogin('https://auth.test', stubAuthClient({ signIn: { social } }))
    render(<Component onLogin={vi.fn()} />)

    const signInBtn = await screen.findByRole('button', { name: /^sign in$/i })
    fireEvent.click(signInBtn)

    const btn = await screen.findByRole('button', { name: /signing in/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('starts in probing state when URL hash matches pending-signin', async () => {
    setHash('#/cms-pending-signin')
    mockFetchResponse({ status: 200, body: { jwt: accessJwt({ access_token: 'ghu_test' }) } })
    const onLogin = vi.fn()
    const Component = makeCmsLogin('https://auth.test', stubAuthClient())
    render(<Component onLogin={onLogin} />)

    const btn = screen.getByRole('button', { name: /signing in/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1))
    expect(onLogin.mock.calls[0][0]).toMatchObject({
      token: 'ghu_test',
      provider: 'github',
    })
  })

  it('probing → 401 needsLink triggers authClient.oauth2.link', async () => {
    setHash('#/cms-pending-signin')
    mockFetchResponse({ status: 401, body: { needsLink: true, provider: 'github-cms' } })
    const link = vi.fn().mockResolvedValue({
      data: { url: 'https://github.com/login/oauth/authorize?link=1' },
      error: null,
    })
    const Component = makeCmsLogin('https://auth.test', stubAuthClient({
      oauth2: { link },
    }))
    render(<Component onLogin={vi.fn()} />)

    await waitFor(() => expect(link).toHaveBeenCalledTimes(1))
    expect(link.mock.calls[0][0]).toMatchObject({
      providerId: 'github-cms',
    })
    expect(link.mock.calls[0][0].callbackURL).toMatch(/#\/cms-pending-signin$/)
  })

  it('probing → 403 → error state with retry button', async () => {
    setHash('#/cms-pending-signin')
    mockFetchResponse({ status: 403 })
    const Component = makeCmsLogin('https://auth.test', stubAuthClient())
    render(<Component onLogin={vi.fn()} />)

    await waitFor(() => expect(screen.getByText(/lacks CMS access/i)).toBeDefined())
    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined()
  })

  it('retry from error returns to idle (sign-in button)', async () => {
    setHash('#/cms-pending-signin')
    mockFetchResponse({ status: 403 })
    const Component = makeCmsLogin('https://auth.test', stubAuthClient())
    render(<Component onLogin={vi.fn()} />)

    const retry = await screen.findByRole('button', { name: /try again/i })
    fireEvent.click(retry)

    await waitFor(() => expect(screen.getByRole('button', { name: /^sign in$/i })).toBeDefined())
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
  })

  it('successful token → handing off → clearHash + onLogin both called', async () => {
    setHash('#/cms-pending-signin')
    mockFetchResponse({ status: 200, body: { jwt: accessJwt({ access_token: 'ghu_x' }) } })
    const clearHash = vi.fn()
    const onLogin = vi.fn()
    const Component = makeCmsLogin('https://auth.test', stubAuthClient())
    render(<Component onLogin={onLogin} clearHash={clearHash} />)

    await waitFor(() => expect(onLogin).toHaveBeenCalled())
    expect(clearHash).toHaveBeenCalledTimes(1)
    expect(onLogin.mock.calls[0][0]).toMatchObject({ token: 'ghu_x', provider: 'github' })
  })
})
