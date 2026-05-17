import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { makeTestDb, type TestDb } from './test-db'
import * as allowlist from '../domain/allowlist'

let t: TestDb

beforeEach(() => { t = makeTestDb() })
afterEach(() => { t.close() })

describe('allowlist.allow', () => {
  it('inserts a normalized email', async () => {
    const result = await allowlist.allow(t.db, 'Alex@Example.COM', 'admin@example.com')
    expect(result).toEqual({ ok: true })

    const all = await allowlist.list(t.db)
    expect(all).toHaveLength(1)
    expect(all[0].email).toBe('alex@example.com')
    expect(all[0].createdBy).toBe('admin@example.com')
  })

  it('is idempotent on duplicate (first writer wins)', async () => {
    await allowlist.allow(t.db, 'alex@example.com', 'admin@example.com')
    const second = await allowlist.allow(t.db, 'alex@example.com', 'someone-else@example.com')
    expect(second).toEqual({ ok: true })
    const all = await allowlist.list(t.db)
    expect(all).toHaveLength(1)
    expect(all[0].createdBy).toBe('admin@example.com')
  })

  it('rejects mixed-script homoglyph emails before insert', async () => {
    // 'аlex' starts with Cyrillic а (U+0430).
    const result = await allowlist.allow(t.db, 'аlex@example.com', 'admin@example.com')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/Cyrillic/)
    expect(await allowlist.list(t.db)).toHaveLength(0)
  })
})

describe('allowlist.isAllowed', () => {
  beforeEach(async () => {
    await allowlist.allow(t.db, 'alex@example.com', 'admin@example.com')
  })

  it('matches the stored normalized email', async () => {
    expect(await allowlist.isAllowed(t.db, 'alex@example.com')).toBe(true)
  })

  it('matches case-insensitively (normalizes input)', async () => {
    expect(await allowlist.isAllowed(t.db, 'ALEX@example.com')).toBe(true)
  })

  it('does not match a Cyrillic-homoglyph lookalike', async () => {
    expect(await allowlist.isAllowed(t.db, 'аlex@example.com')).toBe(false)
  })

  it('returns false for unknown emails', async () => {
    expect(await allowlist.isAllowed(t.db, 'someone@example.com')).toBe(false)
  })

  it('returns false for malformed input', async () => {
    expect(await allowlist.isAllowed(t.db, 'not-an-email')).toBe(false)
    expect(await allowlist.isAllowed(t.db, '')).toBe(false)
  })
})

describe('allowlist.revoke', () => {
  beforeEach(async () => {
    await allowlist.allow(t.db, 'alex@example.com', 'admin@example.com')
    await allowlist.allow(t.db, 'editor@example.com', 'admin@example.com')
  })

  it('removes the matching email', async () => {
    await allowlist.revoke(t.db, 'alex@example.com')
    const all = await allowlist.list(t.db)
    expect(all.map((e) => e.email)).toEqual(['editor@example.com'])
  })

  it('normalizes input before deleting', async () => {
    await allowlist.revoke(t.db, 'ALEX@example.com')
    const all = await allowlist.list(t.db)
    expect(all.map((e) => e.email)).toEqual(['editor@example.com'])
  })

  it('is a no-op for unknown emails', async () => {
    const result = await allowlist.revoke(t.db, 'nobody@example.com')
    expect(result).toEqual({ ok: true })
    expect(await allowlist.list(t.db)).toHaveLength(2)
  })

  it('rejects mixed-script input rather than silently failing', async () => {
    const result = await allowlist.revoke(t.db, 'аlex@example.com')
    expect(result.ok).toBe(false)
  })
})

describe('allowlist.list', () => {
  it('returns empty when no rows', async () => {
    expect(await allowlist.list(t.db)).toEqual([])
  })

  it('returns emails sorted alphabetically', async () => {
    await allowlist.allow(t.db, 'zara@example.com', 'admin@example.com')
    await allowlist.allow(t.db, 'alex@example.com', 'admin@example.com')
    await allowlist.allow(t.db, 'maya@example.com', 'admin@example.com')
    const all = await allowlist.list(t.db)
    expect(all.map((e) => e.email)).toEqual([
      'alex@example.com',
      'maya@example.com',
      'zara@example.com',
    ])
  })
})
