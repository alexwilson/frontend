import type { ContainerDirective } from 'mdast-util-directive'

export const COLUMNS_DIRECTIVE = 'columns'

export const SPLITS = {
  full: { slots: 1, ratio: false },
  'two-equal': { slots: 2, ratio: false },
  'two-wide-left': { slots: 2, ratio: true },
  'two-wide-right': { slots: 2, ratio: true },
  three: { slots: 3, ratio: false },
  'three-wide-center': { slots: 3, ratio: true },
  // Equal content columns plus an intrinsic-width aside (last slot): the aside
  // is sized to itself (~a bio pic), the content columns share the remainder.
  'two-equal-aside': { slots: 3, ratio: true },
} as const

export type SplitName = keyof typeof SPLITS

export const SPLIT_NAMES = Object.keys(SPLITS) as SplitName[]

export const FALLBACK_SPLIT: SplitName = 'full'

export function isSplitName(value: unknown): value is SplitName {
  return typeof value === 'string' && value in SPLITS
}

export interface ColumnsDirective extends ContainerDirective {
  name: typeof COLUMNS_DIRECTIVE
}
