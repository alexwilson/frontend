# @alexwilson/content

A declarative description of what is possible with content. In the spirit of [unist](https://github.com/syntax-tree/unist): this is only grammar. Vocabulary and types lives in outside of it.

## What it declares

- **Vocabulary** — `SPLITS` (the split enum and its column-count rule), `SplitName`,
  `SPLIT_NAMES`, `isSplitName`, `FALLBACK_SPLIT`, the `columns`/`column` directive
  names.
- **Node shapes** — `ColumnsDirective` / `ColumnDirective` as
  [`mdast-util-directive`](https://github.com/syntax-tree/mdast-util-directive)
  extensions, and `ColumnContent` (the authoring shape). Just the shapes — the guards
  and accessors that *operate* on them are AST utilities and live with the
  transform; the DOM hooks live with the presentation.


## Adding a block

Drop `src/<block>.ts` declaring its vocabulary and node shape, re-export from
`src/index.ts`, and keep it free of behaviour, AST logic and presentation.
