import { describe, it, expect } from 'vitest'
import app from '../index'

// Hono app.fetch() lets us exercise routing without spinning a real worker.
// AUTH_DB / secrets are only touched if the route reaches auth.handler — the
// tests below only cover paths that short-circuit before that (unknown app
// ids, CORS preflights, missing routes).
const env = {
  AUTH_DB: undefined as unknown,
  BASE_URL: 'https://auth.test',
  TRUSTED_ORIGINS: 'https://app.test,https://other.test',
  BETTER_AUTH_SECRET: 'unused-in-routing-tests',
  GITHUB_CLIENT_ID: 'x',
  GITHUB_CLIENT_SECRET: 'x',
  GITHUB_CMS_CLIENT_ID: 'x',
  GITHUB_CMS_CLIENT_SECRET: 'x',
}

describe('routing', () => {
  it('unknown app id under /auth/app/:id/token → 404', async () => {
    const res = await app.fetch(
      new Request('https://auth.test/auth/app/unknown/token', { method: 'POST' }),
      env,
    )
    expect(res.status).toBe(404)
  })

  it('GET on /auth/app/:id/token is not a registered route (no scope-in-URL)', async () => {
    // POST-only — RFC 6749 §3.2. A GET request shouldn't match our handler;
    // if it falls through to the better-auth catch-all, that's fine. The
    // assertion is just that we don't return a 200 minted-token response.
    const res = await app.fetch(new Request('https://auth.test/auth/app/cms/token'), env)
    expect(res.status).not.toBe(200)
  })

  it('paths outside /auth → 404 (no fall-through)', async () => {
    const res = await app.fetch(new Request('https://auth.test/something-else'), env)
    expect(res.status).toBe(404)
  })
})

describe('CORS preflight', () => {
  it('trusted origin → 204 with Allow-Origin echoed back', async () => {
    const res = await app.fetch(
      new Request('https://auth.test/auth/app/cms/token', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://app.test',
          'Access-Control-Request-Method': 'GET',
        },
      }),
      env,
    )
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('https://app.test')
    expect(res.headers.get('access-control-allow-credentials')).toBe('true')
  })

  it('untrusted origin → no Allow-Origin header (browser rejects)', async () => {
    const res = await app.fetch(
      new Request('https://auth.test/auth/app/cms/token', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://evil.test',
          'Access-Control-Request-Method': 'GET',
        },
      }),
      env,
    )
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})

describe('/auth/error security headers', () => {
  it('emits CSP + the standard hardening headers', async () => {
    const res = await app.fetch(new Request('https://auth.test/auth/error?error=EMAIL_NOT_ALLOWED'), env)
    expect(res.status).toBe(200)
    const csp = res.headers.get('content-security-policy') ?? ''
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(res.headers.get('strict-transport-security') ?? '').toContain('max-age=')
  })
})

describe('rate limiting', () => {
  it('429 when the limiter binding rejects', async () => {
    const limiterEnv = {
      ...env,
      RATE_LIMITER: { limit: async () => ({ success: false }) },
    }
    const res = await app.fetch(
      new Request('https://auth.test/auth/manage/sign-in', {
        headers: { 'cf-connecting-ip': '203.0.113.1' },
      }),
      limiterEnv,
    )
    expect(res.status).toBe(429)
  })

  it('passes through when the binding is absent', async () => {
    // No RATE_LIMITER in env → skipped. Sign-in path will attempt auth and
    // fail downstream because AUTH_DB is undefined, but we should at least
    // not 429.
    const res = await app.fetch(
      new Request('https://auth.test/auth/manage/sign-in', {
        headers: { 'cf-connecting-ip': '203.0.113.1' },
      }),
      env,
    )
    expect(res.status).not.toBe(429)
  })
})
