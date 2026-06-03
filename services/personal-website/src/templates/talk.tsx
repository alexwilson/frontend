import React from "react"
import { graphql, HeadProps, PageProps } from "gatsby"
import Header from "@alexwilson/ds-legacy-components/src/header"
import ShareWidget from "@alexwilson/ds-legacy-components/src/share-widget"
import Layout from "../components/layout"
import SEO from "../components/seo"

type TalkData = {
  content: {
    contentId: string
    title: string
    date: string
    slug: string
    content: { html: string; excerpt: string }
    image: { credit?: string }
  }
  site: { siteMetadata: { siteUrl: string } }
}

const TalkTemplate = ({ data, location }: PageProps<TalkData>) => {
  const post = data.content
  return (
    <Layout location={location}>
      <Header location={location} section="talks" />
      <div className="alex-article">
        <div className="alex-article__main">
          <h1 itemProp="name headline">{post.title}</h1>
          <article
            dangerouslySetInnerHTML={{ __html: post.content.html }}
            className="alex-article__body article-description"
            itemProp="articleBody"
          />
          <ShareWidget
            title={post.title}
            url={new URL(post.slug, data.site.siteMetadata.siteUrl)}
          />
        </div>
      </div>
    </Layout>
  )
}

export default TalkTemplate

export const Head = ({ data, location }: HeadProps<TalkData>) => (
  <SEO title={data.content.title} pathname={location.pathname} />
)

export const pageQuery = graphql`
  fragment TalkContent on MarkdownRemark {
    html
    excerpt: excerpt
  }
  query TalkBySlug($contentId: String!) {
    content(contentId: { eq: $contentId }) {
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
`
