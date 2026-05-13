/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import PropTypes from "prop-types"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"
import Organization from "../schema-org/organization"
import Person from "../schema-org/person"

function SEO({ description, lang, meta, keywords, title, canonicalUrl, children }) {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            author
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={`%s - ${site.siteMetadata.title}`}
      meta={[
        {
          name: `description`,
          content: metaDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          name: `twitter:card`,
          content: `summary`,
        },
        {
          name: `twitter:creator`,
          content: site.siteMetadata.author,
        },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: metaDescription,
        },
      ]
        .concat(
          keywords.length > 0
            ? {
                name: `keywords`,
                content: keywords.join(`, `),
              }
            : []
        )
        .concat(meta)}
    >
      <link rel="alternate" type="application/rss+xml" title="Alex Wilson's writing via RSS" href="/feed.xml" />
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      <script type="application/ld+json">{JSON.stringify({
        "@type":"WebPage",
        "@context":"http://schema.org",
        "name": site.siteMetadata.title,
        "description": site.siteMetadata.description,
        "copyrightHolder": Person(),
        "publisher": Organization()
      })}</script>
      <link rel="webmention" href="https://webmention.io/alexwilson.tech/webmention" />
      <link rel="pingback" href="https://webmention.io/alexwilson.tech/xmlrpc" />
      {children}
    </Helmet>
  )
}

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  keywords: [],
}

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.array,
  keywords: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string.isRequired,
  canonicalUrl: PropTypes.string,
}

export default SEO
