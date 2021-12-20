import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"

 const BlogPage = ({ data, location }) => {
  return (<Layout location={location}>
    <div className="alex-stream">
      <h1>My Blog</h1>
      <h4>{data.allMarkdownRemark.totalCount} Posts</h4>
      {data.allMarkdownRemark.edges.map(({ node }) => (
          <ArticleCard key={node.id} article={node} />
      ))}
    </div>
  </Layout>)
}

export default BlogPage

export const query = graphql`
  query {
    allMarkdownRemark(
      filter: {
        frontmatter: {date: {ne: null}},
        fields: {type: {eq: "posts"}}
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
            thumbnail
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
