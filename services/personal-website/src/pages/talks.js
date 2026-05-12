import React, { useState, useMemo } from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import Stream from "../components/stream"
import StreamFilters from "../components/stream-filters"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"

const TalksPage = ({ data, location }) => {
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)

  const [selectedYears, setSelectedYears] = useState([])

  const allTalks = data.talks.edges.map(({ node }) => node)

  const years = useMemo(() => {
    const ys = [...new Set(allTalks.map(n => new Date(n.date).getFullYear()))].sort((a, b) => b - a)
    return ys
  }, [allTalks])

  const topics = useMemo(() => {
    const seen = new Map()
    allTalks.forEach(n => {
      (n.topics || []).forEach(t => {
        if (!seen.has(t.topicId)) seen.set(t.topicId, t)
      })
    })
    return [...seen.values()].sort((a, b) => a.topic.localeCompare(b.topic))
  }, [allTalks])

  const toggleYear = (year) => setSelectedYears(prev =>
    prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
  )

  const filteredTalks = useMemo(() => {
    return allTalks.filter(node => {
      if (selectedYears.length > 0 && !selectedYears.includes(new Date(node.date).getFullYear())) return false
      return true
    })
  }, [allTalks, selectedYears])

  const sidebar = (
    <StreamFilters
      years={years}
      selectedYears={selectedYears}
      onYearToggle={toggleYear}
      topics={topics}
      onClear={() => setSelectedYears([])}
    />
  )

  return (
    <Layout location={location}>
      <SEO title="Talks" url={url} />
      <Header location={location} section="talks" compact />
      <Stream sidebar={sidebar} header={<><h1>Talks</h1><h4>{filteredTalks.length} Talks</h4></>}>
        {filteredTalks.map(node => (
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
