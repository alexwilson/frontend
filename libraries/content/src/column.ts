import type { ContainerDirective } from 'mdast-util-directive'

export const COLUMN_DIRECTIVE = 'column'

export interface ColumnDirective extends ContainerDirective {
  name: typeof COLUMN_DIRECTIVE
}

export interface ColumnContent {
  lang?: string
  content: string
}
