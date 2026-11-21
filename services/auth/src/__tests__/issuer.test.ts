import { describe, it, expect, vi } from 'vitest'
import app from '../index'

// Stands in for better-auth, so a test can tell that a request reached it.
vi.mock('../auth', () => ({
  createAuth: () => ({ handler: async () => new Response('better-auth', { status: 404 }) }),
}))

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

describe('OAuth callback issuer check (RFC 9207)', () => {
  const callback = (path: string) => app.fetch(new Request(`https://auth.test${path}`), env)
  const github = encodeURIComponent('https://github.com/login/oauth')

  it('redirects to the error page when iss does not match the app provider', async () => {
    const res = await callback('/auth/callback/github-cms?code=c&state=s&iss=https%3A%2F%2Fevil.test')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/auth/error?error=issuer_mismatch')
  })

  it('rejects a wrong iss when the provider id is percent-encoded', async () => {
    const res = await callback('/auth/callback/github%2Dcms?code=c&state=s&iss=https%3A%2F%2Fevil.test')
    expect(res.headers.get('location')).toBe('/auth/error?error=issuer_mismatch')
  })

  it('passes a matching iss to better-auth', async () => {
    const res = await callback(`/auth/callback/github-cms?code=c&state=s&iss=${github}`)
    expect(await res.text()).toBe('better-auth')
  })

  // Same as better-auth 1.6: only a wrong iss is rejected. See ADR 0013.
  it.each(['', '&iss='])('passes a callback with no iss value (%j) to better-auth', async (iss) => {
    const res = await callback(`/auth/callback/github-cms?code=c&state=s${iss}`)
    expect(await res.text()).toBe('better-auth')
  })

  it('does not check providers outside the app registry', async () => {
    const res = await callback('/auth/callback/github?code=c&state=s&iss=https%3A%2F%2Fevil.test')
    expect(await res.text()).toBe('better-auth')
  })
})
