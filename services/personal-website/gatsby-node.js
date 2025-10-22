const path = require('path')
const {v5} = require('uuid')

const { contentFromMarkdownRemark, topicsFromMarkdownRemark, createTopicNode, createContentNode } = require('./src/schema/on-create-node.js')

exports.onCreateNode = ({ node, createNodeId, getNode, createContentDigest, actions }) => {
  if (node.internal.type === `MarkdownRemark`) {

    const {createNodeField} = actions

    // Generate content & topic entities from RemarkNode
    const content = contentFromMarkdownRemark({ node, getNode })
    const topics = topicsFromMarkdownRemark({ node })

    // Append topic IDs back to content entity.
    content.topics = topics.map(({topicId}) => (topicId))

    // Create nodes for topics and content
    for (const topic of topics) {
      createTopicNode(topic, {node, createNodeId, getNode, createContentDigest, actions})
    }
    createContentNode(content, {node, createNodeId, createContentDigest, actions})

    // For compat. with other plugins, stub the slug field.
    createNodeField({ node, name: 'slug', value: content.slug })
  }
}

exports.createSchemaCustomization = ({actions}) => {
  const { createTypes } = actions
  const typeDefs = `
    type Content implements Node @dontInfer {
      contentId: String!
      title: String!
      slug: String!
      type: String!
      date: Date!

      author: Person

      topics: [Topic] @link(by: "topicId")

      image: ContentImageFields!
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

exports.createResolvers = ({ createResolvers }) => {
  createResolvers({
    Topic: {
      content: {
        type: "[Content]",
        resolve: async (source, args, context, info) => {
          const result = await context.nodeModel.findAll({
            type: "Content",
            query: {
              filter: {
                topics: { elemMatch: {
                    topicId: { eq: source.topicId }
                } }
              }
            }
          })
          return result.entries
        }
      }
    }
  })
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const {data} = await graphql(`
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

  data.content.nodes.forEach((node) => {
    // Create a page
    createPage({
      path: node.slug,
      component: node.type === "talk" ? path.resolve(`./src/templates/talk.js`) : path.resolve(`./src/templates/article.js`),
      context: {
        contentId: node.contentId
      }
    })
  })
  data.topics.nodes.forEach((node) => {
    createPage({
      path: node.slug,
      component: path.resolve(`./src/templates/topic.js`),
      context: {
        topicId: node.topicId
      }
    })
  })

}

const gatsbyLinkAdapter = path.resolve(__dirname, 'src/components/GatsbyLink.js')

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      alias: {
        '@alexwilson/legacy-components/src/link': gatsbyLinkAdapter,
        '@alexwilson/legacy-components/src/link/index.js': gatsbyLinkAdapter
      }
    }
  })
}
