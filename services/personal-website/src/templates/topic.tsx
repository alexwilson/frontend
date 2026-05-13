import React, { useState, useMemo } from "react"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import { graphql, navigate } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"

const TopicsTemplate = ({ pageContext, data, location }) => {
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)

  const [selectedYears, setSelectedYears] = useState([])

  const allPosts = data.content.edges.map(({ node }) => node)

  const years = useMemo(() => {
    const ys = [...new Set(allPosts.map(n => new Date(n.date).getFullYear()))].sort((a, b) => b - a)
    return ys
  }, [allPosts])

  const allTopics = useMemo(() => {
    return data.allTopic.nodes.sort((a, b) => a.topic.localeCompare(b.topic))
  }, [data.allTopic.nodes])

  const toggleYear = (year) => setSelectedYears(prev =>
    prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
  )

  const toggleTopic = (topicId) => {
    if (topicId === data.topic.topicId) {
      navigate("/blog")
    } else {
      const t = allTopics.find(t => t.topicId === topicId)
      if (t?.slug) navigate(t.slug)
    }
  }

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
      topics={allTopics}
      selectedTopics={[data.topic.topicId]}
      onTopicToggle={toggleTopic}
      onClear={selectedYears.length > 0 ? () => setSelectedYears([]) : undefined}
    />
  )

  return (
    <Layout location={location}>
      <SEO title={data.topic.topic} url={url} />
      <Header location={location} section="blog" compact />
      <Stream sidebar={sidebar} header={<h1>{`${filteredPosts.length} post${filteredPosts.length === 1 ? "" : "s"} tagged with "${data.topic.topic}"`}</h1>}>
        {filteredPosts.map(node => (
          <ArticleCard key={node.id} article={node} withImage={false} />
        ))}
      </Stream>
    </Layout>
  )
}

export default TopicsTemplate

export const pageQuery = graphql`
  fragment TopicPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query($topicId: String) {
    topic(topicId: {eq: $topicId}) {
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
      sort: { fields: [date], order: DESC }
      filter: { topics: { elemMatch: { topicId: { eq: $topicId }} }}
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
