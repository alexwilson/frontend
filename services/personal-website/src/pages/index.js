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
            {data.allButWeeknotes.edges.map(({ node }) =>
              <div key={node.id} className="alex-home__tilestack-item">
                <ArticleCard article={node} withImage={false} withDate={false} />
              </div>
            )}
            </div>
        </section>
        <section className="alex-home__section">
            <h2><a className="heading" href="/topic/weeknotes">Latest Weeknotes</a></h2>
            <div className="alex-home__tilestack">
            {data.onlyWeeknotes.edges.map(({ node }) =>
              <div key={node.id} className="alex-home__tilestack-item">
                <ArticleCard article={node} withImage={false} withDate={false} />
              </div>
            )}
            </div>
        </section>
    </div>
  </Layout>
)

export const query = graphql`
  query {
    allButWeeknotes: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC },
      filter: { frontmatter: { tags: { nin: ["weeknotes"] } } }
      limit: 3
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
    onlyWeeknotes: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC },
      filter: { frontmatter: { tags: { in: ["weeknotes"] } } }
      limit: 3
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
export default IndexPage
