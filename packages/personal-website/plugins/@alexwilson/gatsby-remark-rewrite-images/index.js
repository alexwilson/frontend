const visit = require('unist-util-visit')
const rewriteImages = require('../../../src/utils/rewrite-images')

module.exports = ({ markdownAST }) => {
  visit(markdownAST, 'image', node => {
    if (node.url) {
      node.url = rewriteImages(node.url);
    }
    return node;
  })
  return markdownAST;
}
