const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const { generateBlogSlug, generateTalkSlug } = require('./src/lib/slug-generation')

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
    createNodeField({
      node,
      name: `type`,
      value: sourceInstanceName
    })
    switch (sourceInstanceName) {
      case 'talks': {
        const filePath = createFilePath({ node, getNode, basePath: 'talks' })
        createNodeField({ node, name: `slug`, value: generateTalkSlug(filePath) })
        break
      }

      case 'posts': {
        const filePath = createFilePath({ node, getNode, basePath: 'pages' })
        createNodeField({ node, name: `slug`, value: generateBlogSlug(filePath) })
        break
      }
    }
  }
}

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions
  const topics = new Set()
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
          },
        })
        break
      }

    }

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

})
}
