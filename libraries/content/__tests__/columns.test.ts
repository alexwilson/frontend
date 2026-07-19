import { describe, it, expect } from 'vitest'
import { SPLITS, SPLIT_NAMES, isSplitName, FALLBACK_SPLIT } from '../src/columns'

describe('split vocabulary', () => {
  it('exposes every split name', () => {
    expect(SPLIT_NAMES).toEqual([
      'full',
      'two-equal',
      'two-wide-left',
      'two-wide-right',
      'three',
      'three-wide-center',
      'two-equal-aside',
    ])
  })

  it('records the slot count and ratio flag for each split', () => {
    expect(SPLITS['two-equal']).toEqual({ slots: 2, ratio: false })
    expect(SPLITS['two-wide-left']).toEqual({ slots: 2, ratio: true })
    expect(SPLITS.three).toEqual({ slots: 3, ratio: false })
  })

  it('marks only ratio splits as ratio: true', () => {
    expect(SPLIT_NAMES.filter((name) => SPLITS[name].ratio)).toEqual([
      'two-wide-left',
      'two-wide-right',
      'three-wide-center',
      'two-equal-aside',
    ])
  })

  it('narrows known and rejects unknown split names', () => {
    expect(isSplitName('two-equal')).toBe(true)
    expect(isSplitName('two-wide')).toBe(false)
    expect(isSplitName(undefined)).toBe(false)
  })

  it('falls back to a real split', () => {
    expect(isSplitName(FALLBACK_SPLIT)).toBe(true)
  })
})
