const sanitizeHtml = require("sanitize-html")

module.exports = {
  siteMetadata: {
    title: `Alex Wilson`,
    description: `Software Engineer, Technical Architect — Helping build a better, faster internet.`,
    siteUrl: `https://alexwilson.tech/`,
    author: `@antoligy`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    // {
    //   resolve: `gatsby-source-filesystem`,
    //   options: {
    //     name: `images`,
    //     path: `${__dirname}/src/images`,
    //   },
    // },
    // `gatsby-transformer-sharp`,
    // `gatsby-plugin-sharp`,
    // {
    //   resolve: `gatsby-plugin-manifest`,
    //   options: {
    //     name: `gatsby-starter-default`,
    //     short_name: `starter`,
    //     start_url: `/`,
    //     background_color: `#663399`,
    //     theme_color: `#663399`,
    //     display: `minimal-ui`,
    //     icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
    //   },
    // },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // 'gatsby-plugin-offline',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: 'null',
        path: `${__dirname}`,
        ignore: [/.*/ig]
      }
    },

    {
      resolve: `gatsby-source-git`,
      options: {
        name: `posts`,
        remote: `https://alexwilson:${process.env.GITHUB_TOKEN}@github.com/alexwilson/content.git`,
        branch: `main`,
        patterns: `posts/**`,
      }
    },

    {
      resolve: `gatsby-source-git`,
      options: {
        name: `talks`,
        remote: `https://alexwilson:${process.env.GITHUB_TOKEN}@github.com/alexwilson/content.git`,
        branch: `main`,
        patterns: `talks/**`,
      }
    },

    {
      resolve: '@alexwilson/gatsby-remark-rewrite-images'
    },

    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-embed-video",
            options: {
              width: "100%",
              loadingStrategy: 'lazy',
              containerClass: "embed-container",
              iframeId: true,
            },
          },
          {
            resolve: `gatsby-remark-embed-gist`
          },
          {
            resolve: '@alexwilson/gatsby-remark-rewrite-images'
          },
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              showLineNumbers: false,
              prompt: {
                global: false
              }
            }
          },
          {
            resolve: `gatsby-remark-twitter-cards`,
            options: {
              title: false,
              separator: false,
              author: 'Alex Wilson',
              background: '#000000',
              fontColor: '#FFFFFF',
              titleFontSize: 96,
              subtitleFontSize: 60,
              fontStyle: 'monospace'
            },

          },
        ],
      },
    },

    {
      resolve: `gatsby-plugin-sitemap`,
      options: {}
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
            serialize: ({ query: { site, recentContent } }) => {
              return recentContent.nodes.map(content => {
                const url = new URL(content.slug, site.siteMetadata.siteUrl)
                const guid = url.toString()
                url.searchParams.append('utm_source', 'feed')
                return {
                  title: content.title,
                  description: content.content.snippet,
                  date: content.date,
                  url: url.toString(),
                  guid,
                  custom_elements: [{
                    "content:encoded": sanitizeHtml(
                      `${content.content.preview}<br /><a href="${url}">Read the full article...</a>`,
                      {
                        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
                        allowedAttributes: false
                      }
                    ),
                    "atom:link": {
                      "_attr": {
                        "rel": "self",
                        "href": url.toString(),
                        "type": "text/html"
                      }
                    }
                  }],
                }
              })
            },
            query: `
              fragment Content on MarkdownRemark {
                html
                snippet: excerpt(pruneLength: 220, format: PLAIN)
                preview: excerpt(pruneLength: 600, format: HTML)
              }

              query Content {
                recentContent: allContent(
                  limit: 10,
                  sort: { order: DESC, fields: [date] }
                ) {
                  nodes {
                    title
                    date
                    slug
                    content: parent {
                      ...Content
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
              "atom": "http://www.w3.org/2005/Atom"
            },
            custom_elements: [{
              "atom:link": {
                "_attr": {
                  "rel": "self",
                  "href": "https://alexwilson.tech/feed.xml",
                  "type": "application/rss+xml"
                }
              }
            }]
          },
        ],
      },
    },


    {
      resolve: `gatsby-plugin-sass`,
      options: {
        implementation: require('sass'),
      },
    },


    {
      resolve: `gatsby-plugin-web-font-loader`,
      options: {
        google: {
          families: ['Overpass:400,600,800']
        }
      }
    }
  ],
}
