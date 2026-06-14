# @alexwilson/remark-content-blocks

The remark utility that implements the content blocks described by [`@alexwilson/content`](../content).

```js
unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkContentBlocks, { emitHtmlHints: true })
  .use(remarkRehype)
  .use(rehypeStringify)
```

## Adding a block

Add a guard + handler in `src/index.ts` and describe the block in `@alexwilson/content`.
