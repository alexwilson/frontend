import React from "react"
import { graphql } from "gatsby"
import ShareWidget from "@alexwilson/legacy-components/src/share-widget"
import Layout from "../components/layout"

const TalkTemplate = ({ data, location }) => {
  const post = data.markdownRemark
  return (
    <Layout location={location}>
      <div class="alex-article">
        <div class="alex-article__main">
          <h1 itemprop="name headline">{post.frontmatter.title}</h1>
          <article
            dangerouslySetInnerHTML={{ __html: post.html }}
            className="alex-article__body article-description"
            itemprop="articleBody"
          />
          <h3 class="share">Share</h3>
          <ShareWidget title={post.frontmatter.title} url={new URL(location.pathname, data.site.siteMetadata.siteUrl)} />
        </div>
        <div class="alex-article__aside">
        </div>
      </div>
    </Layout>
  )
}

export default TalkTemplate

export const pageQuery = graphql`
  query TalkBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      frontmatter {
        title
        date
        author
        image_credit
      }
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`;
