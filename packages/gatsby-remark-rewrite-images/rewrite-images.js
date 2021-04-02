const mediaDomain = 'https://media.alexwilson.tech/'
const rewriteImage = (src) => src
    .replace(/^https?\:\/\/alexwilson.tech\//, '')
    .replace(/^\/pictures\//, mediaDomain)

module.exports = rewriteImage
