import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { safeNavigate } from '../component'

describe('safeNavigate', () => {
  let errSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    errSpy.mockRestore()
  })

  it('accepts https://github.com URLs', () => {
    // jsdom emits its own "Not implemented: navigation" console.error here when
    // location.href is assigned — irrelevant to safeNavigate's contract. We
    // only care that our own rejection message wasn't logged.
    expect(safeNavigate('https://github.com/login/oauth/authorize?x=1')).toBe(true)
    expect(errSpy.mock.calls.some(args => /untrusted origin/.test(String(args[0])))).toBe(false)
  })

  // Regression: a hostname-only check waved `javascript://github.com/...` through
  // because the URL parser reports its hostname as 'github.com'. Matching on
  // origin instead rejects it (opaque-scheme origins are the literal "null").
  it('rejects javascript: URLs whose hostname spoofs github.com', () => {
    expect(safeNavigate('javascript://github.com/%0Aalert(1)')).toBe(false)
    expect(errSpy.mock.calls[0]?.[0]).toMatch(/untrusted origin/)
  })

  it('rejects http://github.com (scheme downgrade)', () => {
    expect(safeNavigate('http://github.com/login/oauth/authorize')).toBe(false)
    expect(errSpy.mock.calls[0]?.[0]).toMatch(/untrusted origin/)
  })

  it('rejects different hosts', () => {
    expect(safeNavigate('https://evil.example/login')).toBe(false)
    expect(errSpy.mock.calls[0]?.[0]).toMatch(/untrusted origin/)
  })

  it('rejects unparseable input', () => {
    expect(safeNavigate('not a url')).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(safeNavigate(undefined)).toBe(false)
    expect(safeNavigate(null)).toBe(false)
    expect(safeNavigate({ href: 'https://github.com/' })).toBe(false)
  })
})
