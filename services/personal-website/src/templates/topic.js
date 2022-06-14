import React from "react"
import PropTypes from "prop-types"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"
import { graphql } from "gatsby"
import Layout from "../components/layout"

const TopicsTemplate = ({ pageContext, data, location }) => {
  const { topic } = pageContext
  const { totalCount } = data.allContent

  return (<Layout location={location}>
    <div class="alex-stream">
      <h1>{`${totalCount} post${totalCount === 1 ? "" : "s"} tagged with "${topic}"`}</h1>
      {data.allContent.edges.map(({ node }) => (
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
  query($topic: String) {
    allContent(
      sort: { fields: [date], order: DESC }
      filter: { topics: { elemMatch: { slug: { eq: $topic }} }}
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
