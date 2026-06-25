import type { GatsbyConfig } from "gatsby"

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Reader`,
    description: `A firehose feed reader.`,
    siteUrl: `https://alexwilson.tech/reader`,
  },
  // Reader is served under /reader (gated by auth middleware). The prefix keeps
  // location.pathname under /reader, so the shared Header only marks "Home"
  // active on the real site root (/), never on the reader.
  pathPrefix: `/reader`,
  trailingSlash: "never",
  plugins: [
    {
      resolve: `gatsby-source-github-repository`,
      options: {
        name: `feeds`,
        owner: `alexwilson`,
        repo: `flat-feeds`,
        ref: process.env.FEEDS_REF ?? `main`,
        patterns: [`data/*.json`, `data/feeds/*.json`],
        token: process.env.GITHUB_TOKEN,
        pollInterval: process.env.NODE_ENV === `development` ? 30 : 0,
      },
    },
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        implementation: require("sass"),
        api: "modern",
        sassOptions: {
          importers: [new (require("sass").NodePackageImporter)()],
        },
      },
    },
  ],
}

export default config
