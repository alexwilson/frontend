// End-to-end flow through the real worker app and the real better-auth
// config: sign in, link the CMS provider, mint a token. Only D1 and GitHub
// are replaced. This is the test that fails when better-auth and its own
// dependencies do not fit together (the 1.7 upgrade broke the token mint
// while every unit test passed).
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { makeTestDb } from './test-db'
import { allowedEmail, user } from '../schema'

const t = makeTestDb()
vi.mock('drizzle-orm/d1', () => ({ drizzle: () => t.db }))

const EMAIL = 'me@example.com'
const ISS = encodeURIComponent('https://github.com/login/oauth')
const env = {
  AUTH_DB: {},
  BASE_URL: 'https://auth.test',
  TRUSTED_ORIGINS: 'https://app.test',
  BETTER_AUTH_SECRET: 'x'.repeat(40),
  GITHUB_CLIENT_ID: 'id',
  GITHUB_CLIENT_SECRET: 'secret',
  GITHUB_CMS_CLIENT_ID: 'cms-id',
  GITHUB_CMS_CLIENT_SECRET: 'cms-secret',
}

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })

function stubGitHub(input: RequestInfo | URL): Promise<Response> {
  const url = String(input instanceof Request ? input.url : input)
  if (url.includes('/login/oauth/access_token')) {
    return Promise.resolve(json({ access_token: 'gho_test', token_type: 'bearer', scope: 'user:email' }))
  }
  if (url.includes('api.github.com/user/emails')) {
    return Promise.resolve(json([{ email: EMAIL, primary: true, verified: true }]))
  }
  if (url.includes('api.github.com/user')) {
    return Promise.resolve(json({ id: 42, login: 'me', name: 'Me', email: EMAIL }))
  }
  return Promise.reject(new Error(`unexpected fetch: ${url}`))
}

describe('sign in, link the CMS provider, mint a token', () => {
  const cookies = new Map<string, string>()
  let app: typeof import('../index').default

  async function call(path: string, body?: unknown): Promise<Response> {
    const headers = new Headers({ origin: 'https://app.test' })
    if (cookies.size) headers.set('cookie', [...cookies].map(([k, v]) => `${k}=${v}`).join('; '))
    if (body !== undefined) headers.set('content-type', 'application/json')
    const res = await app.fetch(
      new Request(`https://auth.test${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      env as never,
    )
    for (const cookie of res.headers.getSetCookie()) {
      const pair = cookie.split(';')[0]
      const eqAt = pair.indexOf('=')
      cookies.set(pair.slice(0, eqAt), pair.slice(eqAt + 1))
    }
    return res
  }

  async function authorizeState(res: Response): Promise<string> {
    const { url } = (await res.json()) as { url: string }
    return new URL(url).searchParams.get('state') ?? ''
  }

  beforeAll(async () => {
    vi.stubGlobal('fetch', stubGitHub)
    app = (await import('../index')).default
    await t.db.insert(allowedEmail).values({ email: EMAIL, createdAt: new Date().toISOString() }).run()
  })
  afterAll(() => {
    vi.unstubAllGlobals()
    t.close()
  })

  it('signs in with the identity provider', async () => {
    const start = await call('/auth/sign-in/social', { provider: 'github', callbackURL: 'https://app.test/done' })
    expect(start.status).toBe(200)

    const callback = await call(`/auth/callback/github?code=c1&state=${await authorizeState(start)}&iss=${ISS}`)
    expect(callback.headers.get('location')).toBe('https://app.test/done')

    await t.db.update(user).set({ role: 'admin' }).where(eq(user.email, EMAIL)).run()
  })

  it('asks for a link before the CMS provider is linked', async () => {
    const res = await call('/auth/app/cms/token', {})
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ needsLink: true, provider: 'github-cms' })
  })

  it('links the CMS provider on its own callback path', async () => {
    const start = await call('/auth/link-social', { provider: 'github-cms', callbackURL: 'https://app.test/done' })
    expect(start.status).toBe(200)
    const { url } = (await start.clone().json()) as { url: string }
    expect(new URL(url).searchParams.get('redirect_uri')).toBe('https://auth.test/auth/callback/github-cms')

    const callback = await call(`/auth/callback/github-cms?code=c2&state=${await authorizeState(start)}&iss=${ISS}`)
    expect(callback.headers.get('location')).toBe('https://app.test/done')
  })

  it('mints a signed token once linked', async () => {
    const res = await call('/auth/app/cms/token', {})
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(Object.values(body).some((v) => typeof v === 'string' && v.split('.').length === 3)).toBe(true)
  })
})
