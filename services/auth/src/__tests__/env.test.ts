import { describe, it, expect } from 'vitest'
import { validateEnv, type Env } from '../env'

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    AUTH_DB: undefined as unknown as D1Database,
    BASE_URL: 'https://auth.test',
    TRUSTED_ORIGINS: 'https://app.test,https://other.test',
    BETTER_AUTH_SECRET: 'secret',
    GITHUB_CLIENT_ID: 'x',
    GITHUB_CLIENT_SECRET: 'x',
    GITHUB_CMS_CLIENT_ID: 'x',
    GITHUB_CMS_CLIENT_SECRET: 'x',
    ...overrides,
  }
}

describe('validateEnv', () => {
  it('accepts a well-formed env', () => {
    expect(() => validateEnv(makeEnv())).not.toThrow()
  })

  it('accepts localhost http for local dev', () => {
    expect(() => validateEnv(makeEnv({
      BASE_URL: 'http://localhost:8787',
      TRUSTED_ORIGINS: 'http://localhost:3000',
    }))).not.toThrow()
  })

  it('rejects missing BETTER_AUTH_SECRET', () => {
    expect(() => validateEnv(makeEnv({ BETTER_AUTH_SECRET: '' })))
      .toThrow(/BETTER_AUTH_SECRET/)
  })

  it('rejects BASE_URL that isn\'t https', () => {
    expect(() => validateEnv(makeEnv({ BASE_URL: 'http://auth.test' })))
      .toThrow(/BASE_URL.*https/)
  })

  it('rejects BASE_URL with trailing slash', () => {
    expect(() => validateEnv(makeEnv({ BASE_URL: 'https://auth.test/' })))
      .toThrow(/BASE_URL.*trailing slash/)
  })

  it('rejects BASE_URL with a path', () => {
    expect(() => validateEnv(makeEnv({ BASE_URL: 'https://auth.test/auth' })))
      .toThrow(/BASE_URL.*origin/)
  })

  it('rejects BASE_URL with query or fragment', () => {
    expect(() => validateEnv(makeEnv({ BASE_URL: 'https://auth.test?x=1' })))
      .toThrow(/BASE_URL.*query/)
  })

  it('rejects empty TRUSTED_ORIGINS', () => {
    expect(() => validateEnv(makeEnv({ TRUSTED_ORIGINS: '' })))
      .toThrow(/TRUSTED_ORIGINS/)
  })

  it('rejects a TRUSTED_ORIGINS entry with a path appended', () => {
    expect(() => validateEnv(makeEnv({
      TRUSTED_ORIGINS: 'https://app.test,https://evil.test/path',
    }))).toThrow(/TRUSTED_ORIGINS entry/)
  })

  it('rejects malformed TRUSTED_ORIGINS entry (not a URL)', () => {
    expect(() => validateEnv(makeEnv({
      TRUSTED_ORIGINS: 'https://app.test,not-a-url',
    }))).toThrow(/TRUSTED_ORIGINS entry/)
  })

  it('is memoised per env reference (idempotent)', () => {
    const env = makeEnv()
    validateEnv(env)
    validateEnv(env)
    validateEnv(env)
  })
})
