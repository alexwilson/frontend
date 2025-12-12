import React, { useEffect } from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"

const ensureAbsoluteUrl = (url, siteUrl) => {
  if (!url) return siteUrl
  try {
    return new URL(url).toString()
  } catch (e) {
    return new URL(url, siteUrl).toString()
  }
}

const ContentPlaceholderTemplate = ({ data, location }) => {
  const isSamePage = data.content.url === location.pathname
  const destination = ensureAbsoluteUrl(data.content.url, data.site.siteMetadata.siteUrl)
  useEffect(() => {
    if (!isSamePage) {
      window.location.replace(destination)
    }
  }, [isSamePage, destination])

  if (isSamePage) {
    // return null;
  }

  return (
    <Layout location={location}>
      <SEO title={data.content.title} description={data.content?.content?.excerpt} canonicalUrl={destination}>
        <meta httpEquiv="refresh" content={`15;url=${destination}?a`} />
      </SEO>
      Redirecting to <a href={destination}>{destination}</a>...
    </Layout>
  )
}

export default ContentPlaceholderTemplate

export const pageQuery = graphql`
  fragment PlaceholderContent on MarkdownRemark {
    excerpt
  }
  query PlaceholderBySlug($contentId: String!) {
    content(contentId: {eq: $contentId}) {
      contentId
      title
      url
      content: parent {
        ...PlaceholderContent
      }
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`
