import React, { useMemo } from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"
import useStreamFilters from "../hooks/useStreamFilters"

const TalksPage = ({ data, location }) => {
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)
  const allTalks = useMemo(() => data.talks.edges.map(({ node }) => node), [data])
  const { selectedYears, years, topics, toggleYear, filteredItems, clearYears } = useStreamFilters(allTalks)

  return (
    <Layout location={location}>
      <SEO title="Talks" url={url} />
      <Header location={location} section="talks" compact />
      <Stream
        sidebar={<StreamFilters years={years} selectedYears={selectedYears} onYearToggle={toggleYear} topics={topics} onClear={clearYears} />}
        header={<><h1>Talks</h1><h4>{filteredItems.length} Talks</h4></>}
      >
        {filteredItems.map(node => (
          <ArticleCard key={node.id} article={node} />
        ))}
      </Stream>
    </Layout>
  )
}

export default TalksPage

export const query = graphql`
  fragment TalkPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query {
    talks: allContent(
      filter: {
        type: {eq: "talk"}
      }
      sort: {
        fields: [date],
        order: DESC
      }
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
