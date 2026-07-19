import React, { useMemo } from "react"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import { graphql, HeadProps, PageProps } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import TimelineScroll from "@alexwilson/ds-legacy-components/src/timeline-scroll"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"
import useTimelineScroll from "../hooks/useTimelineScroll"

type TopicNode = { topicId: string; topic: string; slug: string }
type Post = {
  id: string
  contentId: string
  title: string
  slug: string
  url: string
  date: string
  content: { excerpt: string } | null
}

type TopicData = {
  topic: TopicNode
  allTopic: { nodes: TopicNode[] }
  content: { totalCount: number; edges: { node: Post }[] }
  site: { siteMetadata: { siteUrl: string } }
}

const TopicsTemplate = ({ data, location }: PageProps<TopicData>) => {
  const allPosts = useMemo(
    () => data.content.edges.map(({ node }) => node),
    [data.content.edges],
  )

  const allTopics = useMemo(() => {
    return [...data.allTopic.nodes].sort((a, b) =>
      a.topic.localeCompare(b.topic),
    )
  }, [data.allTopic.nodes])

  const {
    level,
    setLevel,
    timelineDates,
    visibleRange,
    jumpToDate,
    registerCard,
  } = useTimelineScroll(allPosts)

  const sidebar = (
    <>
      <StreamFilters
        topics={allTopics}
        selectedTopics={[data.topic.topicId]}
      />
      <TimelineScroll
        className="stream-calendar"
        dates={timelineDates}
        visibleRange={visibleRange}
        onJump={jumpToDate}
        level={level}
        onLevelChange={setLevel}
      />
    </>
  )

  return (
    <Layout location={location}>
      <Header location={location} section="blog" compact />
      <Stream
        className="stream-page"
        sidebar={sidebar}
        header={
          <h1>{`${allPosts.length} post${allPosts.length === 1 ? "" : "s"} tagged with "${data.topic.topic}"`}</h1>
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

export default TopicsTemplate

export const Head = ({ data, location }: HeadProps<TopicData>) => (
  <SEO title={data.topic.topic} pathname={location.pathname} />
)

export const pageQuery = graphql`
  fragment TopicPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query ($topicId: String) {
    topic(topicId: { eq: $topicId }) {
      topicId
      topic
      slug
    }
    allTopic {
      nodes {
        topicId
        topic
        slug
      }
    }
    content: allContent(
      sort: { date: DESC }
      filter: { topics: { elemMatch: { topicId: { eq: $topicId } } } }
    ) {
      totalCount
      edges {
        node {
          id
          contentId
          title
          slug
          url
          date
          content: parent {
            ...TopicPageContent
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
