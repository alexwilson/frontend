import React, { useMemo } from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"
import useStreamFilters from "../hooks/useStreamFilters"

const BlogPage = ({ data, location }) => {
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)
  const allPosts = useMemo(() => data.content.edges.map(({ node }) => node), [data])
  const { selectedYears, years, topics, toggleYear, filteredItems, clearYears } = useStreamFilters(allPosts)

  return (
    <Layout location={location}>
      <SEO title="Blog" url={url} />
      <Header location={location} section="blog" compact />
      <Stream
        sidebar={<StreamFilters years={years} selectedYears={selectedYears} onYearToggle={toggleYear} topics={topics} onClear={clearYears} />}
        header={<><h1>My Blog</h1><h4>{filteredItems.length} Posts</h4></>}
      >
        {filteredItems.map(node => (
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
