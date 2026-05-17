import { describe, it, expect } from 'vitest'
import { normalizeEmail } from '../email-normalize'

describe('normalizeEmail — happy path', () => {
  it('lowercases ASCII emails', () => {
    expect(normalizeEmail('Alex@Example.COM')).toEqual({ ok: true, email: 'alex@example.com' })
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeEmail('  alex@example.com  ')).toEqual({ ok: true, email: 'alex@example.com' })
  })

  it('passes single-script non-Latin emails (Japanese local-part)', () => {
    const result = normalizeEmail('田中@example.co.jp')
    expect(result).toEqual({ ok: true, email: '田中@example.co.jp' })
  })

  it('passes single-script Cyrillic emails (no Latin mixed in)', () => {
    const result = normalizeEmail('пользователь@example.ru')
    expect(result.ok).toBe(true)
  })

  it('NFKC folds fullwidth Latin to ASCII', () => {
    // ａ (U+FF41) is fullwidth Latin small a; NFKC normalizes to ASCII a.
    const result = normalizeEmail('ａlex@example.com')
    expect(result).toEqual({ ok: true, email: 'alex@example.com' })
  })

  it('NFKC folds ligatures', () => {
    // ﬁ (U+FB01) is the fi ligature; NFKC decomposes to fi.
    const result = normalizeEmail('ﬁnal@example.com')
    expect(result).toEqual({ ok: true, email: 'final@example.com' })
  })
})

describe('normalizeEmail — homoglyph / mixed-script rejection', () => {
  it('rejects Cyrillic а mixed into a Latin local-part', () => {
    // 'аlex' — first character is Cyrillic а (U+0430), rest Latin.
    const result = normalizeEmail('аlex@example.com')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/Cyrillic/)
  })

  it('rejects Cyrillic homoglyph in domain', () => {
    // 'аlexwilson.tech' — Cyrillic а at position 0.
    const result = normalizeEmail('alex@аlexwilson.tech')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/Cyrillic/)
  })

  it('rejects Greek omicron mixed into Latin', () => {
    // 'οmega' — first char is Greek ο (U+03BF).
    const result = normalizeEmail('οmega@example.com')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/Greek/)
  })
})

describe('normalizeEmail — invalid input', () => {
  it('rejects empty', () => {
    expect(normalizeEmail('').ok).toBe(false)
    expect(normalizeEmail('   ').ok).toBe(false)
  })

  it('rejects no-@', () => {
    expect(normalizeEmail('not-an-email').ok).toBe(false)
  })

  it('rejects @ at start or end', () => {
    expect(normalizeEmail('@example.com').ok).toBe(false)
    expect(normalizeEmail('alex@').ok).toBe(false)
  })
})
