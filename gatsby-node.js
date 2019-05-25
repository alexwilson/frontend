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


exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const filePath = createFilePath({ node, getNode, basePath: 'pages' })
    const slug = exports.generateBlogSlug(filePath)
    createNodeField({ node, name: `slug`, value: slug })

    if (node.frontmatter && node.frontmatter.date) {
      createNodeField({
        node,
        name: `date`,
        value: new Date(node.frontmatter.date)
      })
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
              slug
            }
          }
        }
      }
    }
  `
).then(result => {
  result.data.allMarkdownRemark.edges.forEach(({ node }) => {
    console.log(node.fields.slug)
    createPage({
      path: node.fields.slug,
      component: path.resolve(`./src/templates/blog-post.js`),
      context: {
        slug: node.fields.slug,
      },
    })
  })
  })
}
