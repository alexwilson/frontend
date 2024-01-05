import React from "react"
import { graphql } from 'gatsby'

import ArticleCard from "@alexwilson/legacy-components/src/article-card"
import Layout from "../components/layout"
import SEO from "../components/seo"

const IndexPage = ({ data, location }) => (
  <Layout location={location}>
    <SEO title="Home" keywords={[`gatsby`, `application`, `react`]} />
    <div className="alex-home">
        <section className="alex-home__section">
        </section>
        <section className="alex-home__section">
            <h2><a className="heading" href="/blog/">Latest Writing</a></h2>
            <div className="alex-home__tilestack">
            {data.allButWeeknotes.nodes.map((node) =>
              <div key={node.contentId} className="alex-home__tilestack-item">
                <ArticleCard article={node} withImage={false} withDate={false} />
              </div>
            )}
            </div>
        </section>
        <section className="alex-home__section">
            <h2><a className="heading" href="/topic/weeknotes">Latest Notes</a></h2>
            <div className="alex-home__tilestack">
            {data.onlyWeeknotes.nodes.map((node) =>
              <div key={node.contentId} className="alex-home__tilestack-item">
                <ArticleCard article={node} withImage={false} withDate={false} />
              </div>
            )}
            </div>
        </section>
    </div>
  </Layout>
)

export const query = graphql`
  fragment HomepageContent on MarkdownRemark {
    excerpt: excerpt
  }

  query {
    allButWeeknotes: allContent(
      sort: {fields: [date], order: DESC}
      filter: { topics: { elemMatch: { topic: { ne: "weeknotes" }} }}
      limit: 3
    ) {
      nodes {
        contentId
        title
        slug
        date
        content: parent {
          ...HomepageContent
        }
      }
    }
    onlyWeeknotes: allContent(
      sort: {fields: [date], order: DESC}
      filter: { topics: { elemMatch: { topic: { eq: "weeknotes" }} }}
      limit: 3
    ) {
      nodes {
        contentId
        title
        slug
        date
        content: parent {
          ...HomepageContent
        }
      }
    }
  }

`
export default IndexPage
