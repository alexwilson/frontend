import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"

 const BlogPage = ({ data, location }) => {
  return (<Layout location={location}>
    <div className="alex-stream">
      <h1>My Blog</h1>
      <h4>{data.content.totalCount} Posts</h4>
      {data.content.edges.map(({ node }) => (
          <ArticleCard key={node.id} article={node} />
      ))}
    </div>
  </Layout>)
}

export default BlogPage

export const query = graphql`
  fragment BlogPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query {
    content: allContent(
      filter: {
        type: {eq: "posts"}
      }
      sort: {
        fields: [date],
        order: DESC
      }
    ) {
      totalCount
      edges {
        node {
          contentId
          title
          date
          slug
          image {
            thumbnail
          }
          content: parent {
            ...BlogPageContent
          }
        }
      }
    }
  }
`
