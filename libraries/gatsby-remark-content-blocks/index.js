// gatsby-transformer-remark parses with `remark.parse()` and never runs remark
// transformers, so this sub-plugin needs two hooks:
//   1. setParserPlugins: remark-directive (the syntax extension) so `::::columns`
//      parses into directive nodes.
//   2. default export: the AST mutator gatsby runs after parse, applying the
//      content-blocks transform (validate + stamp the data-* hints).
// remark-directive is pinned to v1 to match the transformer's remark-parse@9.
// CommonJS so gatsby can require it; it require()s the ESM transform (Node >=22.12).
const remarkDirective = require("remark-directive")
const remarkContentBlocks = require("@alexwilson/remark-content-blocks").default

const applyContentBlocks = remarkContentBlocks({ emitHtmlHints: true })

module.exports = function gatsbyRemarkContentBlocks({ markdownAST, reporter }) {
  const file = {
    message(reason) {
      if (reporter && typeof reporter.warn === "function") {
        reporter.warn(`remark-content-blocks: ${reason}`)
      }
      return { fatal: null }
    },
  }
  applyContentBlocks(markdownAST, file)
  return markdownAST
}

module.exports.setParserPlugins = function setParserPlugins() {
  return [remarkDirective]
}
