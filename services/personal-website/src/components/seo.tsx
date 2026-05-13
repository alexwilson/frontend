import React, { ReactNode } from "react"
import { useStaticQuery, graphql } from "gatsby"
import Organization from "../schema-org/organization"
import Person from "../schema-org/person"

type SEOProps = {
  description?: string
  lang?: string
  keywords?: string[]
  title: string
  canonicalUrl?: string
  twitterCard?: "summary" | "summary_large_image"
  twitterImage?: string
  twitterSite?: string
  children?: ReactNode
}

function SEO({
  description,
  lang = "en",
  keywords = [],
  title,
  canonicalUrl,
  twitterCard = "summary",
  twitterImage,
  twitterSite,
  children,
}: SEOProps) {
  const { site } = useStaticQuery<{
    site: {
      siteMetadata: { title: string; description: string; author: string }
    }
  }>(
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
    `,
  )

  const metaDescription = description || site.siteMetadata.description
  const fullTitle = `${title} - ${site.siteMetadata.title}`

  return (
    <>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:creator" content={site.siteMetadata.author} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      <link
        rel="alternate"
        type="application/rss+xml"
        title="Alex Wilson's writing via RSS"
        href="/feed.xml"
      />
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      <script type="application/ld+json">
        {JSON.stringify({
          "@type": "WebPage",
          "@context": "http://schema.org",
          name: site.siteMetadata.title,
          description: site.siteMetadata.description,
          copyrightHolder: Person(),
          publisher: Organization(),
        })}
      </script>
      <link
        rel="webmention"
        href="https://webmention.io/alexwilson.tech/webmention"
      />
      <link
        rel="pingback"
        href="https://webmention.io/alexwilson.tech/xmlrpc"
      />
      {children}
    </>
  )
}

export default SEO
