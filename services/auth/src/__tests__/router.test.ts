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
    const res = await app.fetch(new Request('https://auth.test/auth/app/unknown/token'), env)
    expect(res.status).toBe(404)
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
