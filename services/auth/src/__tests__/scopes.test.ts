import { describe, it, expect } from 'vitest'
import {
  SCOPES,
  ROLE_SCOPES,
  scopesForRole,
  intersectScopes,
  parseScopeParam,
} from '../scopes'

describe('scopesForRole', () => {
  it('admin → every defined scope', () => {
    expect([...scopesForRole('admin')].sort()).toEqual([...Object.values(SCOPES)].sort())
  })

  it('cms-editor → cms scopes only', () => {
    expect([...scopesForRole('cms-editor')].sort()).toEqual(
      [SCOPES.CMS_READ, SCOPES.CMS_WRITE, SCOPES.CMS_PUBLISH].sort(),
    )
  })

  it("'user' role → no scopes", () => {
    expect(scopesForRole('user')).toEqual([])
  })

  it('unknown role → no scopes', () => {
    expect(scopesForRole('nobody')).toEqual([])
  })

  it('null / undefined → no scopes', () => {
    expect(scopesForRole(null)).toEqual([])
    expect(scopesForRole(undefined)).toEqual([])
  })
})

describe('intersectScopes', () => {
  it('intersects two sets', () => {
    expect(intersectScopes(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c'])
  })

  it('intersects three sets — only items in all of them survive', () => {
    expect(intersectScopes(['a', 'b', 'c'], ['b', 'c'], ['c', 'd'])).toEqual(['c'])
  })

  it('empty set in the chain → empty result', () => {
    expect(intersectScopes(['a', 'b'], [])).toEqual([])
  })

  it('zero sets → empty result', () => {
    expect(intersectScopes()).toEqual([])
  })

  it('result is sorted + deduped for stability', () => {
    expect(intersectScopes(['c', 'a', 'b', 'a'], ['a', 'b', 'c', 'c'])).toEqual(['a', 'b', 'c'])
  })
})

describe('parseScopeParam', () => {
  it('splits on whitespace, dedupes', () => {
    expect(parseScopeParam('cms:read  cms:write\tcms:read')).toEqual(['cms:read', 'cms:write'])
  })

  it('null / empty → empty array', () => {
    expect(parseScopeParam(null)).toEqual([])
    expect(parseScopeParam('')).toEqual([])
    expect(parseScopeParam('   ')).toEqual([])
  })
})

describe('ROLE_SCOPES — registry consistency', () => {
  it('every value in ROLE_SCOPES is a defined SCOPE', () => {
    const known = new Set(Object.values(SCOPES))
    for (const [, scopes] of Object.entries(ROLE_SCOPES)) {
      for (const s of scopes) expect(known.has(s)).toBe(true)
    }
  })
})
