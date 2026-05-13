import React, { useMemo } from "react"
import { graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"
import useStreamFilters from "../hooks/useStreamFilters"

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
  const {
    selectedYears,
    years,
    topics,
    toggleYear,
    filteredItems,
    clearYears,
  } = useStreamFilters(allPosts)

  return (
    <Layout location={location}>
      <Header location={location} section="blog" compact />
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
            <h1>My Blog</h1>
            <h4>{filteredItems.length} Posts</h4>
          </>
        }
      >
        {filteredItems.map((node) => (
          <ArticleCard key={node.id} article={node} withImage={false} />
        ))}
      </Stream>
    </Layout>
  )
}

export default BlogPage

export const Head = () => <SEO title="Blog" />

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
      sort: { fields: [date], order: DESC }
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
