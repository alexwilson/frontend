import React from "react"
import PropTypes from "prop-types"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import Header from "@alexwilson/legacy-components/src/header"

const TopicsTemplate = ({ pageContext, data, location }) => {
  const { topic } = pageContext
  const { totalCount } = data.content

  return (<Layout location={location}>
    <Header location={location} section="blog" linkImplementation={Link} />
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
          date
          content: parent {
            ...TopicPageContent
          }
        }
      }
    }
  }
`
