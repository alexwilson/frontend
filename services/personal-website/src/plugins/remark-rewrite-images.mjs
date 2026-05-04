import { visit } from 'unist-util-visit';

const mediaDomain = 'https://media.alexwilson.tech/';

export function rewriteImage(src) {
  return src
    .replace(/^https?:\/\/alexwilson\.tech\//, '/')
    .replace(/^\/pictures\//, mediaDomain);
}

function isRelativeImage(url) {
  if (!url) return false;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return false;
  return /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url);
}

export function remarkRewriteImages() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url) {
        // Convert bare relative image references (e.g. "photo.png") to media domain
        if (isRelativeImage(node.url)) {
          node.url = `${mediaDomain}${node.url}`;
        } else {
          node.url = rewriteImage(node.url);
        }
      }
    });
  };
}
