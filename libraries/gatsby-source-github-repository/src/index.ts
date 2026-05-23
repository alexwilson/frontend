import fs from "node:fs/promises";

// loadNodeContent must live outside gatsby-node.js: Gatsby's API validator rejects non-lifecycle exports there.
export const loadNodeContent = (node: { absolutePath: string }): Promise<string> =>
  fs.readFile(node.absolutePath, "utf-8");
