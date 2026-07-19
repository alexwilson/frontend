import { v5 } from "uuid"
import type { Node, NodePluginArgs } from "gatsby"

type Frontmatter = {
  id: string
  title?: string
  date: string
  type?: string
  link?: string
  image?: string
  image_cropped?: string
  thumbnail?: string
  image_credit?: string
  alt_text?: string
  author?: string
  tags?: string[]
  // Page collection frontmatter.
  path?: string
  description?: string
  keywords?: string[]
  layout?: string
}

type MarkdownRemarkNode = Node & {
  frontmatter: Frontmatter
}

type Topic = { topicId: string; slug: string; topic: string }

type ContentEntity = {
  contentId: string
  slug: string
  url: string
  title: string
  type: string
  date: Date
  image: {
    image?: string
    thumbnail?: string
    credit?: string
    altText?: string
  }
  topics: string[]
  author?: { name: string }
}

type PageEntity = {
  pageId: string
  title: string
  path: string
  keywords: string[]
  layout: string
  description?: string
}

type NodeBuildArgs = Pick<
  NodePluginArgs,
  "createNodeId" | "getNode" | "createContentDigest" | "actions"
> & {
  node: MarkdownRemarkNode
}

export const isPagesCollectionNode = ({
  node,
  getNode,
}: {
  node: Pick<Node, "parent">
  getNode: NodePluginArgs["getNode"]
}): boolean => {
  const parent = node.parent ? getNode(node.parent) : undefined
  return (parent as { sourceInstanceName?: string } | undefined)
    ?.sourceInstanceName === "pages"
}

export const contentFromMarkdownRemark = ({
  node,
}: {
  node: MarkdownRemarkNode
}): ContentEntity => {
  const contentId = node.frontmatter.id
  const slug = `/content/${contentId}`
  const title = node.frontmatter.title || ""
  const date = new Date(node.frontmatter.date)
  const type = node.frontmatter.type || "article"
  const link = node.frontmatter.link

  let url = slug
  if (type === "content-placeholder" && link) {
    url = link
  }

  const content: ContentEntity = {
    contentId,
    slug,
    url,
    title,
    type,
    date,
    image: {},
    topics: [],
  }

  if (node.frontmatter.image) {
    content.image = {
      image: node.frontmatter.image_cropped || node.frontmatter.image,
      thumbnail: node.frontmatter.thumbnail || node.frontmatter.image,
      credit: node.frontmatter.image_credit,
      altText: node.frontmatter.alt_text,
    }
  }

  if (node.frontmatter.author) {
    content.author = { name: node.frontmatter.author }
  }

  return content
}

export const topicsFromMarkdownRemark = ({
  node,
}: {
  node: MarkdownRemarkNode
}): Topic[] => {
  const topics: Topic[] = []

  if (node.frontmatter && node.frontmatter.tags) {
    for (const topicSlug of node.frontmatter.tags) {
      topics.push({
        topicId: v5(topicSlug, v5("https://alexwilson.tech/topic/", v5.URL)),
        slug: `/topic/${topicSlug}`,
        topic: topicSlug,
      })
    }
  }

  return topics
}

export const createTopicNode = (
  topic: Topic,
  {
    node,
    createNodeId,
    getNode,
    createContentDigest,
    actions,
  }: NodeBuildArgs,
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
        contentDigest: "",
        owner: "",
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
  content: ContentEntity,
  {
    node,
    createNodeId,
    createContentDigest,
    actions,
  }: Omit<NodeBuildArgs, "getNode">,
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
      owner: "",
    },
    ...content,
  }

  contentNode.internal.contentDigest = createContentDigest(contentNode)
  createNode(contentNode)

  createParentChildLink({ parent: node, child: contentNode })
}

export const pageFromMarkdownRemark = ({
  node,
}: {
  node: MarkdownRemarkNode
}): PageEntity => {
  const page: PageEntity = {
    pageId: node.frontmatter.id,
    title: node.frontmatter.title || "",
    path: node.frontmatter.path || "",
    keywords: node.frontmatter.keywords ?? [],
    layout: node.frontmatter.layout || "full",
  }

  if (node.frontmatter.description) {
    page.description = node.frontmatter.description
  }

  return page
}

export const createPageNode = (
  page: PageEntity,
  {
    node,
    createNodeId,
    createContentDigest,
    actions,
  }: Omit<NodeBuildArgs, "getNode">,
) => {
  const { createNode, createParentChildLink } = actions
  const pageNode = {
    id: createNodeId(page.pageId),
    parent: node.id,
    children: [],
    internal: {
      content: JSON.stringify(node),
      type: "Page",
      contentDigest: "",
      owner: "",
    },
    ...page,
  }

  pageNode.internal.contentDigest = createContentDigest(pageNode)
  createNode(pageNode)

  createParentChildLink({ parent: node, child: pageNode })
}
