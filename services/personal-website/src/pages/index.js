import React from "react"
import { graphql } from 'gatsby'

import Layout from "../components/layout"
import ArticleCard from "../components/article-card"
import SEO from "../components/seo"

const IndexPage = ({ data, location }) => (
  <Layout location={location}>
    <SEO title="Home" keywords={[`gatsby`, `application`, `react`]} />
    <div className="alex-home">
        <section className="alex-home__section">
            <h1><a className="heading" href="/blog/">Recent Content</a></h1>
            <div className="alex-home__tilestack">
            {data.allMarkdownRemark.edges.map(({ node }) =>
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
    allMarkdownRemark(sort: {
        fields: [frontmatter___date],
        order: DESC
    }, limit: 3) {
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
