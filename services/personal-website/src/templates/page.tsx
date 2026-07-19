import React from "react"
import { graphql, HeadProps, PageProps } from "gatsby"

import ArticleLayout from "@alexwilson/ds-legacy-components/src/article-layout"
import RelatedArticles from "@alexwilson/ds-legacy-components/src/related-articles"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Person from "../schema-org/person"

type RecentArticle = {
  contentId: string
  title: string
  slug: string
  url: string
  date: string
}

type PageData = {
  page: {
    pageId: string
    title: string
    path: string
    layout: string
    keywords: string[]
    description: string | null
    content: { html: string; excerpt: string } | null
  } | null
  recentArticles: { nodes: RecentArticle[] }
  site: { siteMetadata: { siteUrl: string; aboutPath: string } }
}

const PageTemplate = ({ data, location }: PageProps<PageData>) => {
  const page = data.page
  if (!page) return null

  const body = (
    <article
      className="alex-article__body"
      dangerouslySetInnerHTML={{ __html: page.content?.html ?? "" }}
    />
  )

  // Article layout without the onward-journey apparatus (topics, related-by-
  // topic, sharing): just a rail of recent writing. Pages have no tags.
  if (page.layout === "article") {
    return (
      <Layout location={location}>
        <ArticleLayout
          aside={
            <div className="alex-article__aside-mid">
              <div className="alex-article__recommended">
                <h2>Latest Writing</h2>
                <RelatedArticles articles={data.recentArticles.nodes} />
              </div>
            </div>
          }
        >
          {body}
        </ArticleLayout>
      </Layout>
    )
  }

  return (
    <Layout location={location}>
      <div className="alex-page">{body}</div>
    </Layout>
  )
}

export default PageTemplate

export const Head = ({ data }: HeadProps<PageData>) => {
  const page = data.page
  if (!page) return null

  const { siteUrl, aboutPath } = data.site.siteMetadata
  const normalisedPath = `/${page.path.replace(/^\//, "")}`
  const canonicalUrl = new URL(normalisedPath, siteUrl).toString()
  const isAboutPage = normalisedPath === aboutPath

  return (
    <SEO
      title={page.title}
      description={page.description ?? page.content?.excerpt ?? undefined}
      keywords={page.keywords}
      canonicalUrl={canonicalUrl}
    >
      {isAboutPage ? (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: { ...Person(), url: canonicalUrl },
          })}
        </script>
      ) : null}
    </SEO>
  )
}

export const pageQuery = graphql`
  query ($pageId: String!) {
    page(pageId: { eq: $pageId }) {
      pageId
      title
      path
      layout
      keywords
      description
      content: parent {
        ... on MarkdownRemark {
          html
          excerpt
        }
      }
    }
    recentArticles: allContent(
      filter: { type: { eq: "article" } }
      sort: { date: DESC }
      limit: 4
    ) {
      nodes {
        contentId
        title
        slug
        url
        date
      }
    }
    site {
      siteMetadata {
        siteUrl
        aboutPath
      }
    }
  }
`
