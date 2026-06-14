/// <reference types="mdast-util-to-hast" />
import type { Plugin } from 'unified'
import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { VFile } from 'vfile'
import { visit } from 'unist-util-visit'
import {
  SPLITS,
  SPLIT_NAMES,
  FALLBACK_SPLIT,
  isSplitName,
  type ColumnsDirective,
  type SplitName,
} from '@alexwilson/content'
import {
  COLUMNS_CLASS,
  COLUMN_CLASS,
  SPLIT_ATTRIBUTE,
} from '@alexwilson/ds-columns/dist/contract.js'

import { isColumnsDirective, getColumns } from './nodes.js'

export interface RemarkContentBlocksOptions {
  /** Fail the build on a non-conforming block instead of warning + stacking. */
  failOnError?: boolean
  /** Stamp hName/hProperties for the remark-rehype HTML-string path.
      Set false on pure-React paths that map components on the directive names. */
  emitHtmlHints?: boolean
}

interface BlockContext {
  emitHints: boolean
  failOnError: boolean
  file: VFile
}

const remarkContentBlocks: Plugin<[RemarkContentBlocksOptions?], Root> = (
  options = {},
) => {
  const base = {
    emitHints: options.emitHtmlHints !== false,
    failOnError: !!options.failOnError,
  }

  return (tree, file) => {
    visit(tree, (node) => {
      // Add a block: a guard + handler here.
      if (isColumnsDirective(node)) {
        applyColumns(node, { ...base, file })
      }
    })
  }
}

function applyColumns(node: ColumnsDirective, ctx: BlockContext) {
  const columns = getColumns(node)
  const split = node.attributes?.split ?? undefined
  const spec = isSplitName(split) ? SPLITS[split] : undefined
  const ok = !!spec && columns.length === spec.slots

  if (!ok) {
    const message = !spec
      ? `Unknown split "${split}". Use one of: ${SPLIT_NAMES.join(', ')}.`
      : `Split "${split}" expects ${spec.slots} column(s), found ${columns.length}.`
    const m = ctx.file.message(message, node)
    if (ctx.failOnError) m.fatal = true
  }

  if (!ctx.emitHints) return

  const resolved: SplitName = ok ? (split as SplitName) : FALLBACK_SPLIT
  decorate(node, { className: [COLUMNS_CLASS], [SPLIT_ATTRIBUTE]: resolved })
  for (const column of columns) {
    const lang = column.attributes?.lang ?? undefined
    decorate(
      column,
      lang ? { className: [COLUMN_CLASS], lang } : { className: [COLUMN_CLASS] },
    )
  }
}

function decorate(
  node: ContainerDirective,
  properties: Record<string, string | string[]>,
) {
  node.data = {
    ...node.data,
    hName: 'div',
    hProperties: { ...node.data?.hProperties, ...properties },
  }
}

export default remarkContentBlocks
