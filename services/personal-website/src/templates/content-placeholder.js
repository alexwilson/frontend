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
  const destination = ensureAbsoluteUrl(data.content.url, data.site.siteMetadata.siteUrl)

  useEffect(() => {
    if (destination) {
      window.location.replace(destination)
    }
  }, [destination])

  return (
    <Layout location={location}>
      <SEO title={data.content.title} description={data.content?.content?.excerpt} canonicalUrl={destination}>
        <meta httpEquiv="refresh" content={`0;url=${destination}`} />
      </SEO>
      <div className="alex-article">
        <p>
          Redirecting to <a href={destination}>{destination}</a>...
        </p>
      </div>
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
