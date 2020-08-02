const path = require(`path`)
const fs = require(`fs`).promises
const { createFilePath } = require(`gatsby-source-filesystem`)
const { generateBlogSlug, generateTalkSlug } = require('./src/lib/slug-generation')

// Persist redirects to `/redirects.json`
const writeRedirectsFile = (redirects) => {
  const plainRedirects = Object.create(null)
  for (let [oldUrl, newUrl] of redirects) {
    plainRedirects[oldUrl] = newUrl
  }

  const redirectsPath = path.join(process.cwd(), 'public', 'redirects.json')
  fs.writeFile(redirectsPath, JSON.stringify(plainRedirects), 'utf8')
    .then(_ => console.info(`REDIRECTS_INFO: Redirects saved saved to ${redirectsPath}`))
    .catch(_ => console.error(`REDIRECTS_ERROR: Error writing redirects to ${redirectsPath}`))
}

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    // Front-matter dates are abbreviated, so explicitly parse it to a date.
    if (node.frontmatter && node.frontmatter.date) {
      createNodeField({
        node,
        name: `date`,
        value: new Date(node.frontmatter.date)
      })
    }

    // Articles can have both thumbnails and images.
    if (node.frontmatter && node.frontmatter.image) {
      // For images, optionally supply a cropped version.
      createNodeField({
        node,
        name: `image`,
        value: node.frontmatter.image_cropped ? node.frontmatter.image_cropped : node.frontmatter.image
      })
      // For thumbnails, optionally supply a thumbnailed version.
      createNodeField({
        node,
        name: `thumbnail`,
        value: node.frontmatter.thumbnail ? node.frontmatter.thumbnail : node.frontmatter.image
      })
    }

    // Customise per-content-type.
    const { sourceInstanceName } = getNode(node.parent)
    createNodeField({ node, name: `type`, value: sourceInstanceName })

    let legacySlug = ""
    if (sourceInstanceName === "talks") {
      legacySlug = generateTalkSlug(createFilePath({ node, getNode, basePath: 'talks' }))
    } else if (sourceInstanceName === "posts") {
      legacySlug = generateBlogSlug(createFilePath({ node, getNode, basePath: 'pages' }))
    }
    createNodeField({ node, name: `legacyslug`, value: legacySlug })

    const {uuid} = node.frontmatter
    const slug = `/content/${uuid}`
    createNodeField({ node, name: 'uuid', value: uuid })
    createNodeField({ node, name: 'slug', value: slug })
  }
}

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions
  const topics = new Set()
  const redirects = new Map()
  return graphql(`
    {
      allMarkdownRemark {
        edges {
          node {
            frontmatter {
              tags
              image
              thumbnail
            }
            fields {
              type
              slug
              legacyslug
            }
          }
        }
      }
    }
  `
).then(result => {
  result.data.allMarkdownRemark.edges.forEach(({ node }) => {
    switch(node.fields.type) {
      case 'talks': {
        createPage({
          path: node.fields.slug,
          component: path.resolve(`./src/templates/talk.js`),
          context: {
            slug: node.fields.slug,
            'legacyslug': node.fields['legacyslug']
          },
        })
        break
      }

      case 'posts': {
        createPage({
          path: node.fields.slug,
          component: path.resolve(`./src/templates/article.js`),
          context: {
            slug: node.fields.slug,
            'legacyslug': node.fields['legacyslug']
          },
        })
        break
      }
    }

    redirects.set(node.fields['legacyslug'], node.fields['slug'])

    // Collect all tags into a set.
    if (node.frontmatter.tags) {
      node.frontmatter.tags.forEach(tag => topics.add(tag))
    }

  })

  // Create topic pages for each tag
  for (topic of topics) {
    createPage({
      path: `/topic/${topic}/`,
      component: path.resolve(`./src/templates/topic.js`),
      context: {
        topic: topic
      },
    })
  }

  writeRedirectsFile(redirects)
})
}
