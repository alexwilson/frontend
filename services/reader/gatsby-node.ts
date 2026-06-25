import path from "path"
import type { GatsbyNode } from "gatsby"

export const createPages: GatsbyNode["createPages"] = async ({
  graphql,
  actions,
}) => {
  const result = await graphql<{
    allFeedDetail: { nodes: { feedId: string }[] }
    feedIndex: { feeds: { id: string; title: string | null }[] } | null
  }>(`
    query {
      allFeedDetail {
        nodes {
          feedId
        }
      }
      feedIndex {
        feeds {
          id
          title
        }
      }
    }
  `)
  if (!result.data) return

  const titleById = new Map(
    (result.data.feedIndex?.feeds ?? []).map((f) => [f.id, f.title]),
  )
  const template = path.resolve("./src/templates/feed.tsx")

  for (const node of result.data.allFeedDetail.nodes) {
    actions.createPage({
      path: `/feed/${node.feedId}`,
      component: template,
      context: {
        feedId: node.feedId,
        feedTitle: titleById.get(node.feedId) ?? node.feedId,
      },
    })
  }
}

// flat-feeds publishes:
//   data/river.json        — { version, generatedAt, entries: [...] } (firehose)
//   data/index.json        — { version, generatedAt, feeds: [...] }   (manifest)
//   data/feeds/<id>.json   — [ ...entries ]                           (full per-feed)
// We build nodes by hand (rather than gatsby-transformer-json) because the
// per-feed files are arrays: the transformer would emit a node per element AND
// overwrite each entry's `id` with a generated node id, breaking read-state.
// Keeping entries nested in one node per file preserves their `id`.
export const createSchemaCustomization: GatsbyNode["createSchemaCustomization"] = ({
  actions,
}) => {
  actions.createTypes(`
    type FeedEntry {
      id: String!
      feedId: String
      feedTitle: String
      title: String
      url: String!
      publishedAt: Date! @dateformat
      summary: String
      contentHtml: String
      readingMinutes: Int
      sentimentLabel: String
    }
    type FeedRiver implements Node @dontInfer {
      version: Int
      generatedAt: Date @dateformat
      entries: [FeedEntry!]
    }
    type FeedDetail implements Node @dontInfer {
      feedId: String!
      entries: [FeedEntry!]
    }
    type Feed {
      id: String!
      title: String
      folders: [String!]
      count: Int
      postsPerWeek: Float
      medianIntervalDays: Float
    }
    type FeedIndex implements Node @dontInfer {
      version: Int
      generatedAt: Date @dateformat
      feeds: [Feed!]
    }
  `)
}

type SourcedFile = {
  internal: { type: string }
  sourceInstanceName?: string
  extension?: string
  relativeDirectory?: string
  name?: string
  id: string
}

export const onCreateNode: GatsbyNode["onCreateNode"] = async ({
  node,
  actions,
  loadNodeContent,
  createNodeId,
  createContentDigest,
}) => {
  const file = node as unknown as SourcedFile
  if (
    file.internal.type !== "File" ||
    file.sourceInstanceName !== "feeds" ||
    file.extension !== "json"
  ) {
    return
  }

  const content = await loadNodeContent(node)
  const parsed = JSON.parse(content)
  const create = (type: string, fields: Record<string, unknown>) => {
    const child = {
      ...fields,
      id: createNodeId(`${type}-${file.name}`),
      parent: node.id,
      children: [],
      internal: { type, contentDigest: createContentDigest(content) },
    }
    actions.createNode(child)
    // Link as a child of the File node so Gatsby keeps it across incremental
    // builds. Without this, unchanged files skip onCreateNode and these derived
    // nodes get garbage-collected as stale (feedRiver/feedIndex come back null).
    actions.createParentChildLink({
      parent: node,
      child: child as unknown as typeof node,
    })
  }

  if (file.relativeDirectory === "data/feeds") {
    create("FeedDetail", { feedId: file.name, entries: parsed })
  } else if (file.name === "river") {
    create("FeedRiver", {
      version: parsed.version,
      generatedAt: parsed.generatedAt,
      entries: parsed.entries,
    })
  } else if (file.name === "index") {
    create("FeedIndex", {
      version: parsed.version,
      generatedAt: parsed.generatedAt,
      feeds: parsed.feeds,
    })
  }
}

export const onCreateWebpackConfig: GatsbyNode["onCreateWebpackConfig"] = ({
  actions,
  getConfig,
}) => {
  const config = getConfig()

  type WebpackRule = { test?: RegExp | string | unknown }
  const hasSvgTest = (rule: unknown): rule is WebpackRule & { test: RegExp } => {
    const r = rule as WebpackRule
    return r.test instanceof RegExp && r.test.source.includes("svg")
  }
  const urlLoaderRule = config.module.rules.find(hasSvgTest)
  if (urlLoaderRule) {
    urlLoaderRule.test = /\.(ico|jpg|jpeg|png|gif|webp|avif)(\?.*)?$/
  }

  config.module.rules.push({
    test: /\.svg$/,
    type: "asset/resource",
  })

  actions.replaceWebpackConfig(config)
}
