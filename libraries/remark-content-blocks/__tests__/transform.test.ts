import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

import remarkContentBlocks, {
  type RemarkContentBlocksOptions,
} from '../src/index'

const TWO_EQUAL = `::::columns{split=two-equal}
:::column{lang=ja}
日本語

- リスト
:::

:::column{lang=en}
English side.
:::
::::
`

const UNKNOWN_SPLIT = `::::columns{split=two-wide}
:::column
A
:::

:::column
B
:::
::::
`

const WRONG_COUNT = `::::columns{split=three}
:::column
A
:::

:::column
B
:::
::::
`

function toHtml(markdown: string, options?: RemarkContentBlocksOptions) {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkContentBlocks, options)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(markdown)
}

function findColumns(markdown: string, options?: RemarkContentBlocksOptions) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkContentBlocks, options)
  const tree = processor.runSync(processor.parse(markdown)) as unknown
  let columns: any
  visit(tree as any, (node: any) => {
    if (node.type === 'containerDirective' && node.name === 'columns') {
      columns = node
    }
  })
  return columns
}

describe('remarkContentBlocks (hints on)', () => {
  it('stamps the presentation classes and split into HTML', () => {
    const html = String(toHtml(TWO_EQUAL))
    expect(html).toContain('class="alex-columns"')
    expect(html).toContain('data-split="two-equal"')
    expect(html).toContain('class="alex-column"')
    expect(html).toContain('lang="ja"')
    expect(html).toContain('lang="en"')
  })

  it('emits no diagnostics for a conforming block', () => {
    expect(toHtml(TWO_EQUAL).messages).toHaveLength(0)
  })

  it('warns and falls back to full on an unknown split', () => {
    const file = toHtml(UNKNOWN_SPLIT)
    const html = String(file)
    expect(html).toContain('data-split="full"')
    expect(html).not.toContain('two-wide')
    expect(file.messages).toHaveLength(1)
    expect(file.messages[0].reason).toMatch(/Unknown split "two-wide"/)
    expect(file.messages[0].fatal).not.toBe(true)
  })

  it('warns and falls back to full on a column-count mismatch', () => {
    const file = toHtml(WRONG_COUNT)
    expect(String(file)).toContain('data-split="full"')
    expect(file.messages[0].reason).toMatch(/expects 3 column\(s\), found 2/)
  })

  it('escalates the diagnostic to fatal when failOnError is set', () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkContentBlocks, { failOnError: true })
    const file = new VFile(UNKNOWN_SPLIT)
    processor.runSync(processor.parse(file), file)
    expect(file.messages).toHaveLength(1)
    expect(file.messages[0].fatal).toBe(true)
  })
})

describe('remarkContentBlocks (hints off)', () => {
  it('checks conformance without stamping hints', () => {
    const columns = findColumns(TWO_EQUAL, { emitHtmlHints: false })
    expect(columns).toBeDefined()
    expect(columns.data?.hName).toBeUndefined()
  })

  it('still reports diagnostics with hints off', () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkContentBlocks, { emitHtmlHints: false })
    const file = new VFile(UNKNOWN_SPLIT)
    processor.runSync(processor.parse(file), file)
    expect(file.messages).toHaveLength(1)
  })
})
