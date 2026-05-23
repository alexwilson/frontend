import React, { useState, useMemo } from "react"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import { graphql, HeadProps, PageProps } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"

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
  const [selectedYears, setSelectedYears] = useState<number[]>([])

  const allPosts = data.content.edges.map(({ node }) => node)

  const years = useMemo(() => {
    const ys = [
      ...new Set(allPosts.map((n) => new Date(n.date).getFullYear())),
    ].sort((a, b) => b - a)
    return ys
  }, [allPosts])

  const allTopics = useMemo(() => {
    return [...data.allTopic.nodes].sort((a, b) =>
      a.topic.localeCompare(b.topic),
    )
  }, [data.allTopic.nodes])

  const toggleYear = (year: number) =>
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
    )

  const filteredPosts = useMemo(() => {
    return allPosts.filter((node) => {
      if (
        selectedYears.length > 0 &&
        !selectedYears.includes(new Date(node.date).getFullYear())
      )
        return false
      return true
    })
  }, [allPosts, selectedYears])

  const sidebar = (
    <StreamFilters
      years={years}
      selectedYears={selectedYears}
      onYearToggle={toggleYear}
      topics={allTopics}
      selectedTopics={[data.topic.topicId]}
      onClear={
        selectedYears.length > 0 ? () => setSelectedYears([]) : undefined
      }
    />
  )

  return (
    <Layout location={location}>
      <Header location={location} section="blog" compact />
      <Stream
        sidebar={sidebar}
        header={
          <h1>{`${filteredPosts.length} post${filteredPosts.length === 1 ? "" : "s"} tagged with "${data.topic.topic}"`}</h1>
        }
      >
        {filteredPosts.map((node) => (
          <ArticleCard key={node.id} article={node} withImage={false} />
        ))}
      </Stream>
    </Layout>
  )
}

export default TopicsTemplate

export const Head = ({ data }: HeadProps<TopicData>) => (
  <SEO title={data.topic.topic} />
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
