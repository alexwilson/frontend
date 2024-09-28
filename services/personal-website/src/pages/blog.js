import React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"
import Header from "@alexwilson/legacy-components/src/header"

 const BlogPage = ({ data, location }) => {
  return (<Layout location={location}>
    <Header location={location} section="blog" linkImplementation={Link} />
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
        type: {eq: "article"}
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
