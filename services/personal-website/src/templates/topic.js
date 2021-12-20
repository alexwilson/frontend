import React from "react"
import PropTypes from "prop-types"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"
import { graphql } from "gatsby"
import Layout from "../components/layout"

const TopicsTemplate = ({ pageContext, data, location }) => {
  const { topic } = pageContext
  const { totalCount } = data.allMarkdownRemark

  return (<Layout location={location}>
    <div class="alex-stream">
      <h1>{`${totalCount} post${totalCount === 1 ? "" : "s"} tagged with "${topic}"`}</h1>
      {data.allMarkdownRemark.edges.map(({ node }) => (
          <ArticleCard key={node.id} article={node} />
      ))}
    </div>
  </Layout>)
}

TopicsTemplate.propTypes = {
  pageContext: PropTypes.shape({
    tag: PropTypes.string.isRequired,
  }),
  data: PropTypes.shape({
    allMarkdownRemark: PropTypes.shape({
      totalCount: PropTypes.number.isRequired,
      edges: PropTypes.arrayOf(
        PropTypes.shape({
          node: PropTypes.shape({
            frontmatter: PropTypes.shape({
              title: PropTypes.string.isRequired,
            }),
            fields: PropTypes.shape({
              slug: PropTypes.string.isRequired,
            }),
          }),
        }).isRequired
      ),
    }),
  }),
}

export default TopicsTemplate

export const pageQuery = graphql`
  query($topic: String) {
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$topic] } } }
    ) {
      totalCount
      edges {
        node {
          id
          fields {
            slug
            date
          }
          frontmatter {
            title
            date
          }
          excerpt
        }
      }
    }
  }
`
