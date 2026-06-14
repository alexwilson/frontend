import type { ContainerDirective } from 'mdast-util-directive'
import {
  COLUMNS_DIRECTIVE,
  COLUMN_DIRECTIVE,
  type ColumnsDirective,
  type ColumnDirective,
} from '@alexwilson/content'

export function isColumnsDirective(node: unknown): node is ColumnsDirective {
  const n = node as ContainerDirective | undefined
  return n?.type === 'containerDirective' && n?.name === COLUMNS_DIRECTIVE
}

export function isColumnDirective(node: unknown): node is ColumnDirective {
  const n = node as ContainerDirective | undefined
  return n?.type === 'containerDirective' && n?.name === COLUMN_DIRECTIVE
}

export function getColumns(node: ColumnsDirective): ColumnDirective[] {
  return (node.children ?? []).filter((child) => isColumnDirective(child)) as ColumnDirective[]
}
