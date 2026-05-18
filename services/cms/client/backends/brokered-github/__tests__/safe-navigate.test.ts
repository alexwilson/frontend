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
    // jsdom logs its own navigation-not-implemented error; filter for ours.
    expect(safeNavigate('https://github.com/login/oauth/authorize?x=1')).toBe(true)
    expect(errSpy.mock.calls.some(args => /untrusted origin/.test(String(args[0])))).toBe(false)
  })

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
