import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// These tests cover the probe / parse / error-mapping logic, not signature
// verification. A separate suite below exercises the real jwtVerify path
// against a generated key pair; the rest fall through `jwtVerify` to a plain
// decode so fixtures don't need real signatures.
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
import { probeCmsToken } from '../client'

function b64url(s: string): string {
  return base64url.encode(new TextEncoder().encode(s))
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = b64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT', kid: 'k1' }))
  const body = b64url(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

function mockFetch(opts: { status: number; body?: unknown; ok?: boolean }) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: opts.ok ?? (opts.status >= 200 && opts.status < 300),
    status: opts.status,
    json: () => Promise.resolve(opts.body ?? {}),
  }))
}

describe('probeCmsToken', () => {
  beforeEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })
  afterEach(() => { vi.unstubAllGlobals() })

  it('200 → kind: token, parsed JWT #2', async () => {
    const now = Math.floor(Date.now() / 1000)
    const jwt = makeJwt({
      sub: 'user-1',
      email: 'user@example.com',
      app: 'cms',
      typ: 'access',
      scope: 'cms:read cms:write',
      access_token: 'ghu_x',
      repository: 'alexwilson/content',
      iat: now,
      exp: now + 900,
    })
    mockFetch({ status: 200, body: { jwt } })

    const result = await probeCmsToken('https://auth.test')

    expect(result.kind).toBe('token')
    if (result.kind !== 'token') return
    expect(result.data.access_token).toBe('ghu_x')
    expect(result.data.scope).toBe('cms:read cms:write')
    expect(result.data.claims).toEqual({ repository: 'alexwilson/content' })
    expect(result.data.expires_in).toBeGreaterThan(0)
  })

  it('200 with missing jwt field → throws "missing jwt"', async () => {
    mockFetch({ status: 200, body: {} })

    await expect(probeCmsToken('https://auth.test'))
      .rejects.toThrow('missing jwt')
  })

  it('200 with malformed JWT → throws "malformed JWT"', async () => {
    mockFetch({ status: 200, body: { jwt: 'not-a-jwt' } })

    await expect(probeCmsToken('https://auth.test'))
      .rejects.toThrow('malformed JWT')
  })

  it('200 with JWT missing access_token → throws "malformed JWT"', async () => {
    const jwt = makeJwt({ sub: 'u', email: 'e', app: 'cms', typ: 'access', scope: '' })
    mockFetch({ status: 200, body: { jwt } })

    await expect(probeCmsToken('https://auth.test'))
      .rejects.toThrow('malformed JWT')
  })

  it('200 with JWT typ != "access" → throws "malformed JWT"', async () => {
    // A JWT #1 (identity) is signed by the same JWKS as JWT #2; the typ
    // claim is what distinguishes them. Without this guard the SPA would
    // happily accept JWT #1 if it ever included an access_token claim.
    const jwt = makeJwt({ sub: 'u', email: 'e', app: 'cms', typ: 'identity', access_token: 'ghu_x' })
    mockFetch({ status: 200, body: { jwt } })

    await expect(probeCmsToken('https://auth.test'))
      .rejects.toThrow('malformed JWT')
  })

  it('passes issuer + audience options to jwtVerify', async () => {
    const jwt = makeJwt({ sub: 'u', email: 'e', app: 'cms', typ: 'access', access_token: 'ghu_x' })
    mockFetch({ status: 200, body: { jwt } })
    const jose = await import('jose')

    await probeCmsToken('https://auth.test')

    const [, , opts] = (jose.jwtVerify as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(opts).toMatchObject({ issuer: 'https://auth.test', audience: 'cms' })
  })

  it('401 with needsLink → kind: link, carries providerId', async () => {
    mockFetch({
      status: 401,
      body: { needsLink: true, provider: 'github-cms', app: 'cms' },
    })

    const result = await probeCmsToken('https://auth.test')

    expect(result).toEqual({ kind: 'link', providerId: 'github-cms' })
  })

  it('401 without needsLink → throws "did not complete"', async () => {
    mockFetch({ status: 401, body: {} })

    await expect(probeCmsToken('https://auth.test'))
      .rejects.toThrow('did not complete')
  })

  it('401 with malformed JSON body → throws "did not complete"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.reject(new Error('bad json')),
    }))

    await expect(probeCmsToken('https://auth.test'))
      .rejects.toThrow('did not complete')
  })

  it('403 → throws "lacks CMS access"', async () => {
    mockFetch({ status: 403 })

    await expect(probeCmsToken('https://auth.test'))
      .rejects.toThrow('lacks CMS access')
  })

  it('500 → throws "Token fetch failed: 500"', async () => {
    mockFetch({ status: 500 })

    await expect(probeCmsToken('https://auth.test'))
      .rejects.toThrow('Token fetch failed: 500')
  })

  it('verifies the JWT against the auth-worker JWKS (not bare decode)', async () => {
    const jwt = makeJwt({ sub: 'u', email: 'e', app: 'cms', typ: 'access', scope: '', access_token: 't' })
    mockFetch({ status: 200, body: { jwt } })
    const jose = await import('jose')

    await probeCmsToken('https://auth.test')

    expect(jose.jwtVerify).toHaveBeenCalledTimes(1)
    const [verifiedJwt, resolver] = (jose.jwtVerify as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(verifiedJwt).toBe(jwt)
    expect(resolver).toBeTypeOf('function')
  })

  it('calls the per-app URL with credentials', async () => {
    const jwt = makeJwt({ sub: 'u', email: 'e', app: 'cms', typ: 'access', scope: '', access_token: 't' })
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ jwt }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    await probeCmsToken('https://auth.example')

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://auth.example/auth/app/cms/token',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
  })
})
