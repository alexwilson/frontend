import { v5 } from "uuid"

export const contentFromMarkdownRemark = ({ node }: any): any => {
  const contentId = node.frontmatter.id
  const slug = `/content/${contentId}`
  const title = node.frontmatter["title"] || ""
  const date = new Date(node.frontmatter.date)
  const type = node.frontmatter["type"] || "article"
  const link = node.frontmatter["link"]

  let url = slug
  if (type === "content-placeholder") {
    url = link
  }

  let image
  let thumbnail
  let credit
  let altText
  if (node.frontmatter.image) {
    image = node.frontmatter.image_cropped
      ? node.frontmatter.image_cropped
      : node.frontmatter.image
    thumbnail = node.frontmatter.thumbnail
      ? node.frontmatter.thumbnail
      : node.frontmatter.image

    if (node.frontmatter["image_credit"]) credit = node.frontmatter["image_credit"]
    if (node.frontmatter["alt_text"]) altText = node.frontmatter["alt_text"]
  }

  let author
  if (node.frontmatter.author) author = node.frontmatter.author

  const content: any = {
    contentId,
    slug,
    url,
    title,
    type,
    date,
    image: {},
    topics: [],
  }

  if (author) {
    content.author = {
      name: author,
    }
  }
  if (image) {
    content.image = {
      image,
      thumbnail,
      credit,
      altText,
    }
  }

  return content
}

export const topicsFromMarkdownRemark = ({ node }: any) => {
  const topics: { topicId: string; slug: string; topic: string }[] = []

  if (node.frontmatter && node.frontmatter.tags) {
    for (const topicSlug of node.frontmatter.tags) {
      const topic = {
        topicId: v5(topicSlug, v5("https://alexwilson.tech/topic/", v5.URL)),
        slug: `/topic/${topicSlug}`,
        topic: topicSlug,
      }

      topics.push(topic)
    }
  }

  return topics
}

export const createTopicNode = (
  topic: { topicId: string; slug: string; topic: string },
  {
    node,
    createNodeId,
    getNode,
    createContentDigest,
    actions,
  }: any,
) => {
  const { createNode, createParentChildLink } = actions

  const topicNodeId = createNodeId(topic.topicId)

  let topicNode = getNode(topicNodeId)
  if (!topicNode) {
    topicNode = {
      id: topicNodeId,
      parent: node.id,
      children: [],
      internal: {
        content: topic.slug,
        type: "Topic",
      },
      ...topic,
    }

    topicNode.internal.contentDigest = createContentDigest(topicNode)
    createNode(topicNode)

    createParentChildLink({ parent: node, child: topicNode })
  }

  return topicNode
}

export const createContentNode = (
  content: any,
  { node, createNodeId, createContentDigest, actions }: any,
) => {
  const { createNode, createParentChildLink } = actions
  const contentNode = {
    id: createNodeId(content.contentId),
    parent: node.id,
    children: [],
    internal: {
      content: JSON.stringify(node),
      type: "Content",
      contentDigest: "",
    },
    ...content,
  }

  contentNode.internal.contentDigest = createContentDigest(contentNode)
  createNode(contentNode)

  createParentChildLink({ parent: node, child: contentNode })
}
