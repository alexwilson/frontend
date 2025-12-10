import React from "react"
import PropTypes from "prop-types"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import Header from "@alexwilson/legacy-components/src/header"
import SEO from "../components/seo"

const TopicsTemplate = ({ pageContext, data, location }) => {
  const { topic } = pageContext
  const { totalCount } = data.content
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)

  return (<Layout location={location}>
    <SEO title={data.topic.topic} url={url} />
    <Header location={location} section="blog" />
    <div class="alex-stream">
      <h1>{`${totalCount} post${totalCount === 1 ? "" : "s"} tagged with "${data.topic.topic}"`}</h1>
      {data.content.edges.map(({ node }) => (
          <ArticleCard key={node.id} article={node} />
      ))}
    </div>
  </Layout>)
}

export default TopicsTemplate

export const pageQuery = graphql`
  fragment TopicPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query($topicId: String) {
    topic(topicId: {eq: $topicId}) {
      topic
    }
    content: allContent(
      sort: { fields: [date], order: DESC }
      filter: { topics: { elemMatch: { topicId: { eq: $topicId }} }}
    ) {
      totalCount
      edges {
        node {
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
