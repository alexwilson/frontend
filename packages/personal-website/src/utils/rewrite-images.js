const mediaDomain = 'https://media.alexwilson.tech/'
const rewriteImage = (src) => {
  src = src.replace(/^https?\:\/\/alexwilson.tech\/pictures\//, mediaDomain)
  src = src.replace(/^\/pictures\//, mediaDomain)
  return src
}

module.exports = rewriteImage
