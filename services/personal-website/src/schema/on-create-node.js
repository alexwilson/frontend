const {v5} = require('uuid')

const contentFromMarkdownRemark = ({node, getNode}) => {
  const contentId = node.frontmatter.id
  const slug = `/content/${contentId}`
  const title = node.frontmatter['title'] || ''
  const date = new Date(node.frontmatter.date)

  // Determine content type by looking at collection (aka parent node)
  // @todo Move this into directly article schema instead?
  const { sourceInstanceName: type } = getNode(node.parent)

  let image = undefined
  let thumbnail = undefined
  if (node.frontmatter && node.frontmatter.image) {
    image = node.frontmatter.image_cropped ? node.frontmatter.image_cropped : node.frontmatter.image
    thumbnail = node.frontmatter.thumbnail ? node.frontmatter.thumbnail : node.frontmatter.image
  }

  const legacySlugs = []
  if (node.frontmatter && node.frontmatter['_legacy_slug']) {
    legacySlugs.push(node.frontmatter['_legacy_slug'])
  }

  // Content schema
  const content = {
    contentId,
    slug,
    title,
    type,
    date,
    image: {
      image,
      thumbnail
    },
    deprecatedFields: {
      legacySlugs
    },
    topics: []
  }

  return content
}

const topicsFromMarkdownRemark = ({node}) => {

  const topics = []

  if (node.frontmatter && node.frontmatter.tags) {
    for (const topicSlug of node.frontmatter.tags) {

      const topic = {
        // Deterministically generate a UUIDv5 from a topic slug, namespaced to `https://alexwilson.tech/topics/`.
        topicId: v5(topicSlug, v5('https://alexwilson.tech/topic/', v5.URL)),
        slug: topicSlug
      }

      topics.push(topic)
    }

  }

  return topics
}

const createTopicNode = (topic, {node, createNodeId, getNode, createContentDigest, actions}) => {
  const {createNode, createParentChildLink} = actions

  const topicNodeId = createNodeId(topic.topicId)

  let topicNode = getNode(topicNodeId)
  if (!topicNode) {
    topicNode = {
      id: topicNodeId,
      parent: node.id,
      children: [],
      internal: {
        content: topic.slug,
        type: "Topic"
      },
      ...topic
    }

    topicNode.internal.contentDigest = createContentDigest(topicNode)
    createNode(topicNode)

    // For Gatsby cache we assign the current MarkdownRemark node as a parent.
    // This is semantically wrong however while topics are stored in articles
    // this will have to do.
    createParentChildLink({ parent: node, child: topicNode})
  }

  return topicNode
}

const createContentNode = (content, {node, createNodeId, createContentDigest, actions}) => {
  const { createNode, createParentChildLink} = actions
    // Export to new node type.
    const contentNode = {
      id: createNodeId(content.contentId),
      parent: node.id,
      children: [],
      internal: {
        content: JSON.stringify(node),
        type: "Content"
      },
      ...content
    }

    contentNode.internal.contentDigest = createContentDigest(contentNode)
    createNode(contentNode)

    // For Gatsby cache we assign the current MarkdownRemark node as a parent.
    // This is semantically correct.
    createParentChildLink({ parent: node, child: contentNode })
}


// Keeping these fields on MarkdownRemark is legacy behaviour
const createMarkdownRemarkFields = ({content, node, actions}) => {
  const {createNodeField} = actions

  createNodeField({ node, name: 'id', value: content.contentId })
  createNodeField({ node, name: 'title', value: content.title })
  createNodeField({ node, name: 'date', value: content.date })
  createNodeField({ node, name: 'slug', value: content.slug })
  createNodeField({ node, name: 'type', value: content.type })

  if (content.image.image) {
    createNodeField({ node, name: 'image', value: content.image.image })
  }
  if (content.image.thumbnail) {
    createNodeField({ node, name: 'thumbnail', value: content.image.thumbnail })
  }
  if (content.deprecatedFields.legacySlugs.length === 1) {
    createNodeField({ node, name: '_legacy_slug', value: content.deprecatedFields.legacySlugs.shift() })
  }
}

module.exports = { createMarkdownRemarkFields, contentFromMarkdownRemark, topicsFromMarkdownRemark, createTopicNode, createContentNode }
