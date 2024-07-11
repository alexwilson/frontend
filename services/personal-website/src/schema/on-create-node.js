const {v5} = require('uuid')

const contentFromMarkdownRemark = ({node, getNode}) => {
  const contentId = node.frontmatter.id
  const slug = `/content/${contentId}`
  const title = node.frontmatter['title'] || ''
  const date = new Date(node.frontmatter.date)
  const type = node.frontmatter['type'] || 'article'

  let image
  let thumbnail
  let credit
  let altText
  if (node.frontmatter.image) {
    image = node.frontmatter.image_cropped ? node.frontmatter.image_cropped : node.frontmatter.image
    thumbnail = node.frontmatter.thumbnail ? node.frontmatter.thumbnail : node.frontmatter.image

    if (node.frontmatter['image_credit']) credit = node.frontmatter['image_credit']
    if (node.frontmatter['alt_text']) altText = node.frontmatter['alt_text']
  }

  let author
  if (node.frontmatter.author) author = node.frontmatter.author

  // Content schema
  const content = {
    contentId,
    slug,
    title,
    type,
    date,
    image: {},
    topics: []
  }
  if (author) {
    content.author = {
      name: author
    }
  }
  if (image) {
    content.image = {
      image,
      thumbnail,
      credit,
      altText
    }
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
        slug: `/topic/${topicSlug}`,
        topic: topicSlug
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

module.exports = { contentFromMarkdownRemark, topicsFromMarkdownRemark, createTopicNode, createContentNode }
