import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"

const TalksPage = ({ data, location }) => {
  return (<Layout location={location}>
    <div className="alex-stream">
      <h1>Talks</h1>
      {data.allMarkdownRemark.edges.map(({ node }) => (
          <ArticleCard key={node.id} article={node} />
      ))}
    </div>
  </Layout>)
}

export default TalksPage

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
