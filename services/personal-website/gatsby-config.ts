import type { GatsbyConfig } from "gatsby"
import sanitizeHtml from "sanitize-html"

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Alex Wilson`,
    description: `Software Engineer, Technical Architect — Helping build a better, faster internet.`,
    siteUrl: `https://alexwilson.tech/`,
    author: `@antoligy`,
  },
  trailingSlash: "never",
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: "null",
        path: `${__dirname}`,
        ignore: [/.*/gi],
      },
    },

    {
      resolve: `gatsby-source-git`,
      options: {
        name: `posts`,
        remote: `https://alexwilson:${process.env.GITHUB_TOKEN}@github.com/alexwilson/content.git`,
        branch: `main`,
        patterns: [`posts/**`],
      },
    },

    {
      resolve: "@alexwilson/gatsby-remark-rewrite-images",
    },

    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-embed-video",
            options: {
              width: "100%",
              loadingStrategy: "lazy",
              containerClass: "embed-container",
              iframeId: true,
            },
          },
          {
            resolve: `gatsby-remark-embed-gist`,
          },
          {
            resolve: "@alexwilson/gatsby-remark-rewrite-images",
          },
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              showLineNumbers: false,
              prompt: {
                global: false,
              },
            },
          },
          {
            resolve: `gatsby-remark-twitter-cards`,
            options: {
              title: false,
              separator: false,
              author: "Alex Wilson",
              background: "#000000",
              fontColor: "#FFFFFF",
              titleFontSize: 96,
              subtitleFontSize: 60,
              fontStyle: "monospace",
            },
          },
        ],
      },
    },

    {
      resolve: `gatsby-plugin-sitemap`,
      options: {},
    },

    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({
              query: { site, recentContent },
            }: {
              query: {
                site: { siteMetadata: { title: string; siteUrl: string } }
                recentContent: {
                  nodes: {
                    title: string
                    date: string
                    url?: string
                    slug: string
                    author?: { name: string } | null
                    content: { snippet: string; preview: string }
                  }[]
                }
              }
            }) => {
              return recentContent.nodes.map((entry) => {
                const urlSource = entry.url || entry.slug
                const rawUrl =
                  urlSource && urlSource.startsWith("http")
                    ? new URL(urlSource)
                    : new URL(urlSource, site.siteMetadata.siteUrl)
                const guid = rawUrl.toString()
                rawUrl.searchParams.append("utm_source", "feed")
                const url = rawUrl.toString()

                const author = entry?.author?.name ?? site.siteMetadata.title

                const content = `
                  ${entry.content.preview}<br />
                  <a href="${url}">Read the full post here...</a>
                `

                const contentEncoded = sanitizeHtml(content, {
                  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
                  allowedAttributes: false,
                })

                return {
                  title: entry.title,
                  description: entry.content.snippet,
                  date: entry.date,
                  url,
                  guid,
                  author,
                  custom_elements: [
                    {
                      "content:encoded": contentEncoded,
                      "atom:link": {
                        _attr: {
                          rel: "self",
                          href: url,
                          type: "text/html",
                        },
                      },
                    },
                  ],
                }
              })
            },
            query: `
              fragment FeedContent on MarkdownRemark {
                snippet: excerpt(pruneLength: 220, format: PLAIN)
                preview: excerpt(pruneLength: 1000, format: HTML)
              }

              query Content {
                recentContent: allContent(
                  limit: 10,
                  sort: { order: DESC, fields: [date] }
                ) {
                  nodes {
                    title
                    date
                    url
                    slug
                    author {
                      name
                    }
                    content: parent {
                      ...FeedContent
                    }
                  }
                }
              }
            `,
            output: "/feed.xml",
            title: "Alex Wilson's writing",
            description: "Alex on engineering, products & everything in-between",
            match: "^/content/",
            ttl: 360,
            site_url: "https://alexwilson.tech/",
            generator: "alexwilson.tech",
            custom_namespaces: {
              atom: "http://www.w3.org/2005/Atom",
            },
            custom_elements: [
              {
                "atom:link": {
                  _attr: {
                    rel: "self",
                    href: "https://alexwilson.tech/feed.xml",
                    type: "application/rss+xml",
                  },
                },
              },
            ],
          },
        ],
      },
    },

    {
      resolve: `gatsby-plugin-sass`,
      options: {
        implementation: require("sass"),
      },
    },

    {
      resolve: `gatsby-plugin-web-font-loader`,
      options: {
        google: {
          families: ["Overpass:400,600,800"],
        },
      },
    },
  ],
}

export default config
