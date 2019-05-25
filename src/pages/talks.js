import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import ArticleCard from "../components/article-card"

export default ({ data, location }) => {
  return (<Layout location={location}>
    <div class="alex-stream">
      <h1>Talks</h1>
      {data.allMarkdownRemark.edges.map(({ node }) => (
          <ArticleCard key={node.id} article={node} />
      ))}
    </div>
  </Layout>)
}

export const query = graphql`
  query {
    allMarkdownRemark(
      filter: {
        frontmatter: {date: {ne: null}},
        fields: {type: {eq: "talks"}}
      }
      sort: {
        fields: [frontmatter___date],
        order: DESC
      }
    ) {
      totalCount
      edges {
        node {
          id
          fields {
            slug
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
