const rewriteImage = require('./rewrite-images')
const IMAGE_KEYS = [
  'image',
  'image_cropped',
  'thumbnail',
];

exports.onCreateNode = ({node}) => {
  if (node.internal.type === "MarkdownRemark" && 'frontmatter' in node) {

    Object.keys(node.frontmatter)
      .filter(key => IMAGE_KEYS.includes(key))
      .forEach(key => {
        node.frontmatter[key] = rewriteImage(node.frontmatter[key])
      });

    return node.frontmatter;
  }
}
