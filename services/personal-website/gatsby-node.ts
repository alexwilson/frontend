import path from "path"
import type { GatsbyNode } from "gatsby"

import {
  contentFromMarkdownRemark,
  topicsFromMarkdownRemark,
  createTopicNode,
  createContentNode,
} from "./src/schema/on-create-node"

export const onCreateNode: GatsbyNode["onCreateNode"] = ({
  node,
  createNodeId,
  getNode,
  createContentDigest,
  actions,
}) => {
  if (node.internal.type === `MarkdownRemark`) {
    const { createNodeField } = actions
    const markdownNode = node as unknown as Parameters<
      typeof contentFromMarkdownRemark
    >[0]["node"]

    const content = contentFromMarkdownRemark({ node: markdownNode })
    const topics = topicsFromMarkdownRemark({ node: markdownNode })

    content.topics = topics.map(({ topicId }) => topicId)

    for (const topic of topics) {
      createTopicNode(topic, {
        node: markdownNode,
        createNodeId,
        getNode,
        createContentDigest,
        actions,
      })
    }
    createContentNode(content, {
      node: markdownNode,
      createNodeId,
      createContentDigest,
      actions,
    })

    createNodeField({ node, name: "slug", value: content.slug })
  }
}

export const createSchemaCustomization: GatsbyNode["createSchemaCustomization"] = ({
  actions,
}) => {
  const { createTypes } = actions
  const typeDefs = `
    type Content implements Node @dontInfer {
      contentId: String!
      title: String!
      slug: String!
      url: String!
      type: String!
      date: Date!

      author: Person

      topics: [Topic] @link(by: "topicId")

      image: ContentImageFields!

      link: String
    }

    type ContentImageFields @dontInfer {
      image: String
      thumbnail: String
      credit: String
      altText: String
    }

    type Topic implements Node @dontInfer {
      topicId: String!
      topic: String!
      slug: String!
      content: [Content] @link(by: "topics", from: "topicId")
    }

    type Person {
      name: String!
    }
  `
  createTypes(typeDefs)
}

type TopicResolverSource = { topicId: string }
type ResolverContext = {
  nodeModel: {
    findAll: (args: {
      type: string
      query: unknown
    }) => Promise<{ entries: unknown[] }>
  }
}

export const createResolvers: GatsbyNode["createResolvers"] = ({ createResolvers }) => {
  createResolvers({
    Topic: {
      content: {
        type: "[Content]",
        resolve: async (
          source: TopicResolverSource,
          _args: unknown,
          context: ResolverContext,
        ) => {
          const result = await context.nodeModel.findAll({
            type: "Content",
            query: {
              filter: {
                topics: { elemMatch: { topicId: { eq: source.topicId } } },
              },
            },
          })
          return result.entries
        },
      },
    },
  })
}

export const createPages: GatsbyNode["createPages"] = async ({ graphql, actions }) => {
  const { createPage } = actions
  const articleTemplate = path.resolve(`./src/templates/article.tsx`)
  const talkTemplate = path.resolve(`./src/templates/talk.tsx`)
  const placeholderTemplate = path.resolve(`./src/templates/content-placeholder.tsx`)

  type ContentNode = { contentId: string; slug: string; type: string }
  type TopicNode = { topicId: string; topic: string; slug: string }
  type CreatePagesQuery = {
    content: { nodes: ContentNode[] }
    topics: { nodes: TopicNode[] }
  }

  const { data } = await graphql<CreatePagesQuery>(`
    query {
      content: allContent {
        nodes {
          contentId
          slug
          type
        }
      }
      topics: allTopic {
        nodes {
          topicId
          topic
          slug
        }
      }
    }
  `)

  if (!data) return

  data.content.nodes.forEach((node) => {
    const templateFromContentType = (contentType: string) => {
      switch (contentType) {
        case "content-placeholder":
          return placeholderTemplate
        case "talk":
          return talkTemplate
        case "article":
          return articleTemplate
      }
      return articleTemplate
    }
    createPage({
      path: node.slug,
      component: templateFromContentType(node.type),
      context: {
        contentId: node.contentId,
      },
    })
  })
  data.topics.nodes.forEach((node) => {
    createPage({
      path: node.slug,
      component: path.resolve(`./src/templates/topic.tsx`),
      context: {
        topicId: node.topicId,
      },
    })
  })
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
