const fs = require('fs')
const path = require('path')

const indexPath = `./public/__content.json`
const collectionPath = `./public/__content/`

exports.onPostBuild = ({graphql}) => {
  graphql(`
    {
      content: allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___date] },
      ) {
        edges {
          node {
            snippet: excerpt(pruneLength: 220, format: PLAIN)
            html
            fields {
              id
              slug
              _legacy_slug
            }
            frontmatter {
              title
              tags
              date
            }
          }
        }
      }
    }
  `).then(result => {
    if (!fs.existsSync(collectionPath)) fs.mkdirSync(collectionPath)

    const topics = {}
    const content = result.data.content.edges.map(({ node }) => {
      const packet = {
        id: node.fields.id,
        raw: node
      }

      if (node.frontmatter.tags) {
        node.frontmatter.tags.forEach(tag => {
          if (!(tag in topics)) {
            topics[tag] = {
              members: [],
              total: 0
            }
          }
          topics[tag].members.push(packet.id)
          topics[tag].total++
        })
      }

      return packet
    })

    const all = {
      content,
      topics,
      meta: {
        content: content.length,
        topics: topics.length,
        updated: (new Date).toISOString()
      }
    }
    fs.writeFileSync(path.resolve(indexPath), JSON.stringify(all))

    content.map(content => {
      fs.writeFileSync(path.resolve(collectionPath, `${content.id}.json`), JSON.stringify(content))
    })
  })
}
