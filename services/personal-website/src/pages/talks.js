import React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"
import Header from "@alexwilson/legacy-components/src/header"

const TalksPage = ({ data, location }) => {
  return (<Layout location={location}>
    <Header location={location} section="talks" linkImplementation={Link} />
    <div className="alex-stream">
      <h1>Talks</h1>
      {data.talks.edges.map(({ node }) => (
          <ArticleCard key={node.id} article={node} />
      ))}
    </div>
  </Layout>)
}

export default TalksPage

export const query = graphql`
  fragment TalkPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query {
    talks: allContent(
      filter: {
        type: {eq: "talk"}
      }
      sort: {
        fields: [date],
        order: DESC
      }
    ) {
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
