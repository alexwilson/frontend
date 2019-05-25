const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const { format } = require('date-fns')

exports.generateBlogSlug = (filePath) => {
  const { name } = path.parse(filePath)
  const pattern = /^(?<date>[0-9]+-[0-9]+-[0-9]+)-(?<slug>.*)$/ig
  const {groups: {date, slug}} = pattern.exec(name)

  return path.posix.join(
    `/blog`,
    format(new Date(date), "YYYY/MM/DD"),
    slug,
    `/`
  )
}

exports.generateTalkSlug = (filePath) => {
  const { name } = path.parse(filePath)
  const pattern = /^(?<date>[0-9]+-[0-9]+-[0-9]+)-(?<slug>.*)$/ig
  const {groups: {date, slug}} = pattern.exec(name)

  return path.posix.join(
    `/talks`,
    format(new Date(date), "YYYY/MM/DD"),
    slug,
    `/`
  )
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
        createNodeField({ node, name: `slug`, value: exports.generateTalkSlug(filePath) })
        break
      }

      case 'posts': {
        const filePath = createFilePath({ node, getNode, basePath: 'pages' })
        createNodeField({ node, name: `slug`, value: exports.generateBlogSlug(filePath) })
        break
      }
    }
  }
}

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions
  return graphql(`
    {
      allMarkdownRemark {
        edges {
          node {
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
      }

      case 'posts': {
        createPage({
          path: node.fields.slug,
          component: path.resolve(`./src/templates/blog-post.js`),
          context: {
            slug: node.fields.slug,
          },
        })
      }

    }
  })
  })
}
