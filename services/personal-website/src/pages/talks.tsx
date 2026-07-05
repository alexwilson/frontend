import React, { useMemo } from "react"
import { graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import TimelineScroll from "@alexwilson/ds-legacy-components/src/timeline-scroll"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"
import useStreamTopics from "../hooks/useStreamTopics"
import useTimelineScroll from "../hooks/useTimelineScroll"

type Talk = {
  id: string
  contentId: string
  title: string
  date: string
  url: string
  slug: string
  topics: { topicId: string; topic: string; slug: string }[]
  image: { thumbnail?: string }
  content: { excerpt: string } | null
}

type TalksData = {
  talks: { edges: { node: Talk }[] }
  site: { siteMetadata: { siteUrl: string } }
}

const TalksPage = ({ data, location }: PageProps<TalksData>) => {
  const allTalks = useMemo(
    () => data.talks.edges.map(({ node }) => node),
    [data],
  )
  const topics = useStreamTopics(allTalks)
  const {
    level,
    setLevel,
    timelineDates,
    visibleRange,
    jumpToDate,
    registerCard,
  } = useTimelineScroll(allTalks)

  return (
    <Layout location={location}>
      <Header location={location} section="talks" compact />
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
            <h1>Talks</h1>
            <h4>{allTalks.length} Talks</h4>
          </>
        }
      >
        {allTalks.map((node) => (
          <div
            key={node.id}
            data-content-id={node.contentId}
            ref={registerCard(node.contentId)}
          >
            <ArticleCard article={node} />
          </div>
        ))}
      </Stream>
    </Layout>
  )
}

export default TalksPage

export const Head = () => <SEO title="Talks" />

export const query = graphql`
  fragment TalkPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query {
    talks: allContent(
      filter: { type: { eq: "talk" } }
      sort: { date: DESC }
    ) {
      edges {
        node {
          id
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
          image {
            thumbnail
          }
          content: parent {
            ...TalkPageContent
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
