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
    `gatsby-transformer-sharp`,
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
        name: `posts`,
        path: `${__dirname}/posts/`,
      },
    },

    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `talks`,
        path: `${__dirname}/talks/`,
      },
    },

    {
      resolve: `gatsby-transformer-remark`,
      options: {
        commonmark: true,
        footnotes: true,
        pedantic: true,
        gfm: true,
        plugins: [],
      },
    },

    {
      resolve: `gatsby-plugin-sitemap`,
      options: {}
    },

    {
      resolve: `gatsby-plugin-sass`,
      options: {
        implementation: require('sass'),
      },
    },


    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: "UA-16800366-1",
        head: false,
        anonymize: true,
        respectDNT: true,
        // exclude: ["/preview/**", "/do-not-track/me/too/"],
        optimizeId: "GTM-M22MJGG",
        // experimentId: "YOUR_GOOGLE_EXPERIMENT_ID",
        // variationId: "YOUR_GOOGLE_OPTIMIZE_VARIATION_ID",
        siteSpeedSampleRate: 100,
        cookieDomain: "alexwilson.tech",
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
