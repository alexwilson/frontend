import React, { useMemo } from "react"
import { graphql, HeadProps, PageProps } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import TimelineScroll from "@alexwilson/ds-legacy-components/src/timeline-scroll"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"
import useStreamTopics from "../hooks/useStreamTopics"
import useTimelineScroll from "../hooks/useTimelineScroll"

type Post = {
  id?: string
  contentId: string
  title: string
  date: string
  url: string
  slug: string
  topics: { topicId: string; topic: string; slug: string }[]
  content: { excerpt: string } | null
}

type BlogData = {
  content: { totalCount: number; edges: { node: Post }[] }
  site: { siteMetadata: { siteUrl: string } }
}

const BlogPage = ({ data, location }: PageProps<BlogData>) => {
  const allPosts = useMemo(
    () => data.content.edges.map(({ node }) => node),
    [data],
  )
  const topics = useStreamTopics(allPosts)
  const {
    level,
    setLevel,
    timelineDates,
    visibleRange,
    jumpToDate,
    registerCard,
  } = useTimelineScroll(allPosts)

  return (
    <Layout location={location}>
      <Header location={location} section="blog" compact />
      <Stream
        className="stream-page"
        sidebar={
          <>
            <StreamFilters topics={topics} />
            <TimelineScroll
              className="stream-calendar"
              dates={timelineDates}
              visibleRange={visibleRange}
              onJump={jumpToDate}
              level={level}
              onLevelChange={setLevel}
            />
          </>
        }
        header={
          <>
            <h1>My Blog</h1>
            <h4>{allPosts.length} Posts</h4>
          </>
        }
      >
        {allPosts.map((node) => (
          <div
            key={node.id}
            data-content-id={node.contentId}
            ref={registerCard(node.contentId)}
          >
            <ArticleCard article={node} withImage={false} />
          </div>
        ))}
      </Stream>
    </Layout>
  )
}

export default BlogPage

export const Head = ({ location }: HeadProps) => (
  <SEO title="Blog" pathname={location.pathname} />
)

export const query = graphql`
  fragment BlogPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query {
    content: allContent(
      filter: {
        type: { in: ["article", "content-placeholder"] }
        topics: { elemMatch: { topic: { ne: "lists" } } }
      }
      sort: { date: DESC }
    ) {
      totalCount
      edges {
        node {
          contentId
          title
          date
          url
          slug
          topics {
            topicId
            topic
            slug
          }
          content: parent {
            ...BlogPageContent
          }
        }
      }
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`
