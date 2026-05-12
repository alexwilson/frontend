import React, { useState, useMemo } from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import Stream from "../components/stream"
import StreamFilters from "../components/stream-filters"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"

const BlogPage = ({ data, location }) => {
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)

  const [selectedYears, setSelectedYears] = useState([])

  const allPosts = data.content.edges.map(({ node }) => node)

  const years = useMemo(() => {
    const ys = [...new Set(allPosts.map(n => new Date(n.date).getFullYear()))].sort((a, b) => b - a)
    return ys
  }, [allPosts])

  const topics = useMemo(() => {
    const seen = new Map()
    allPosts.forEach(n => {
      (n.topics || []).forEach(t => {
        if (!seen.has(t.topicId)) seen.set(t.topicId, t)
      })
    })
    return [...seen.values()].sort((a, b) => a.topic.localeCompare(b.topic))
  }, [allPosts])

  const toggleYear = (year) => setSelectedYears(prev =>
    prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
  )

  const filteredPosts = useMemo(() => {
    return allPosts.filter(node => {
      if (selectedYears.length > 0 && !selectedYears.includes(new Date(node.date).getFullYear())) return false
      return true
    })
  }, [allPosts, selectedYears])

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
      <SEO title="Blog" url={url} />
      <Header location={location} section="blog" compact />
      <Stream sidebar={sidebar} header={<><h1>My Blog</h1><h4>{filteredPosts.length} Posts</h4></>}>
        {filteredPosts.map(node => (
          <ArticleCard key={node.id} article={node} withImage={false} />
        ))}
      </Stream>
    </Layout>
  )
}

export default BlogPage

export const query = graphql`
  fragment BlogPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query {
    content: allContent(
      filter: {
        type: {in: ["article", "content-placeholder"]}
        topics: {elemMatch: {topic: {ne: "lists"}}}
      }
      sort: {
        fields: [date],
        order: DESC
      }
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
