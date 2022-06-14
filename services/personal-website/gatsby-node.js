const path = require('path')
const {v5} = require('uuid')

const { createMarkdownRemarkFields, contentFromMarkdownRemark, topicsFromMarkdownRemark, createTopicNode, createContentNode } = require('./src/schema/on-create-node.js')

exports.onCreateNode = ({ node, createNodeId, getNode, createContentDigest, actions }) => {
  if (node.internal.type === `MarkdownRemark`) {

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

    // Lastly, apply custom fields to markdownremark
    // @todo remove this
    createMarkdownRemarkFields({ content, node, actions })
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

      topics: [Topic] @link(by: "topicId")

      image: ContentImageFields!
      deprecatedFields: ContentDeprecatedFields!
    }

    type ContentImageFields @dontInfer {
      image: String
      thumbnail: String
    }

    type ContentDeprecatedFields @dontInfer {
      legacySlugs: [String]
    }

    type Topic implements Node @dontInfer {
      topicId: String!
      slug: String!
      content: [Content] @link(by: "topics", from: "topicId")
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

exports.createPages = ({ graphql, actions }) => {
  const { createPage, createRedirect } = actions
  const topics = new Set()
  return graphql(`
    {
      allMarkdownRemark {
        edges {
          node {
            frontmatter {
              tags
              image
              thumbnail
            }
            fields {
              type
              id
              slug
              _legacy_slug
            }
          }
        }
      }
    }
  `
).then(result => {
  result.data.allMarkdownRemark.edges.forEach(({ node }) => {
    switch(node.fields.type) {
      case 'talks': {
        createPage({
          path: node.fields.slug,
          component: path.resolve(`./src/templates/talk.js`),
          context: {
            slug: node.fields.slug,
            '_legacy_slug': node.fields['_legacy_slug']
          },
        })
        break
      }

      case 'posts': {
        createPage({
          path: node.fields.slug,
          component: path.resolve(`./src/templates/article.js`),
          context: {
            slug: node.fields.slug,
            '_legacy_slug': node.fields['_legacy_slug']
          },
        })
        break
      }
    }

    if ('_legacy_slug' in node.fields && node.fields['_legacy_slug']) {
      createRedirect({
        fromPath: node.fields['_legacy_slug'],
        toPath: node.fields.slug,
      })
    }

    // Collect all tags into a set.
    if (node.frontmatter.tags) {
      node.frontmatter.tags.forEach(tag => topics.add(tag))
    }

  })

  // Create topic pages for each tag
  for (topic of topics) {
    createPage({
      path: `/topic/${topic}/`,
      component: path.resolve(`./src/templates/topic.js`),
      context: {
        topic: topic
      },
    })
  }
})
}
