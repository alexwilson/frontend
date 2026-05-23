// Gatsby looks for `gatsby-node.{js,ts,mjs,cjs}` at the plugin root by filename
// convention. This shim forwards to the compiled TypeScript output in dist/.
export * from "./dist/gatsby-node.js";
