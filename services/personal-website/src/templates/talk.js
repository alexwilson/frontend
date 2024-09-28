import React from "react"
import { graphql, Link } from "gatsby"
import Header from "@alexwilson/legacy-components/src/header"
import ShareWidget from "@alexwilson/legacy-components/src/share-widget"
import Layout from "../components/layout"

const TalkTemplate = ({ data, location }) => {
  const post = data.content
  return (
    <Layout location={location}>
      <Header location={location} section="talks" linkImplementation={Link} />
      <div class="alex-article">
        <div class="alex-article__main">
          <h1 itemprop="name headline">{post.title}</h1>
          <article
            dangerouslySetInnerHTML={{ __html: post.content.html }}
            className="alex-article__body article-description"
            itemprop="articleBody"
          />
          <ShareWidget title={post.title} url={new URL(post.slug, data.site.siteMetadata.siteUrl)} />
        </div>
        <div class="alex-article__aside">
        </div>
      </div>
    </Layout>
  )
}

export default TalkTemplate

export const pageQuery = graphql`
  fragment TalkContent on MarkdownRemark {
    html
    excerpt: excerpt
  }
  query TalkBySlug($contentId: String!) {
    content(contentId: {eq: $contentId}) {
      contentId
      title
      date
      slug
      content: parent {
        ...TalkContent
      }
      image {
        credit
      }
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`;
