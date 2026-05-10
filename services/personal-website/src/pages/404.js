import React from "react"
import { graphql } from 'gatsby'

import ArticleCard from "@alexwilson/legacy-components/src/article-card"
import Header from "@alexwilson/legacy-components/src/header"
import Layout from "../components/layout"
import SEO from "../components/seo"

const NotFoundPage = ({ data, location }) => {
  const nodes = [
    ...data.allButWeeknotesAndLists.nodes,
    ...data.onlyWeeknotes.nodes,
    ...data.onlyLists.nodes,
  ]

  return (
    <Layout location={location}>
      <Header location={location} compact />
      <SEO title="404: Not found" />
      <div className="alex-home">
        <h1 className="heading heading--large">Page Not Found</h1>
        {nodes.length > 0 && <>
          <p>Sorry, but that page could not be found, it was either moved, deleted or hasn't been written yet! Here's what I've been writing recently:</p>
          <section className="alex-home__section">
            <div className="alex-home__tilestack">
              {nodes.map(node => (
                <div key={node.contentId} className="alex-home__tilestack-item">
                  <ArticleCard article={node} withImage={false} withDate={false} />
                </div>
              ))}
            </div>
          </section>
        </>}
      </div>
    </Layout>
  )
}

export const query = graphql`
  fragment FourOhFourContent on MarkdownRemark {
    excerpt
  }

  query {
    allButWeeknotesAndLists: allContent(
      sort: {fields: [date], order: DESC}
      filter: { topics: { elemMatch: { topic: { nin: ["weeknotes", "lists"] }} }}
      limit: 1
    ) {
      nodes {
        contentId
        title
        url
        slug
        date
        content: parent {
          ...FourOhFourContent
        }
      }
    }
    onlyWeeknotes: allContent(
      sort: {fields: [date], order: DESC}
      filter: { topics: { elemMatch: { topic: { eq: "weeknotes" }} }}
      limit: 1
    ) {
      nodes {
        contentId
        title
        url
        slug
        date
        content: parent {
          ...FourOhFourContent
        }
      }
    }
    onlyLists: allContent(
      sort: {fields: [date], order: DESC}
      filter: { topics: { elemMatch: { topic: { eq: "lists" }} }}
      limit: 1
    ) {
      nodes {
        contentId
        title
        url
        slug
        date
        content: parent {
          ...FourOhFourContent
        }
      }
    }
  }
`

export default NotFoundPage
