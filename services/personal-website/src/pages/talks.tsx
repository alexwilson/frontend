import React, { useMemo } from "react"
import { graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"
import useStreamFilters from "../hooks/useStreamFilters"

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
  const {
    selectedYears,
    years,
    topics,
    toggleYear,
    filteredItems,
    clearYears,
  } = useStreamFilters(allTalks)

  return (
    <Layout location={location}>
      <Header location={location} section="talks" compact />
      <Stream
        sidebar={
          <StreamFilters
            years={years}
            selectedYears={selectedYears}
            onYearToggle={toggleYear}
            topics={topics}
            onClear={clearYears}
          />
        }
        header={
          <>
            <h1>Talks</h1>
            <h4>{filteredItems.length} Talks</h4>
          </>
        }
      >
        {filteredItems.map((node) => (
          <ArticleCard key={node.id} article={node} />
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
