const path = require('path')
const { format } = require('date-fns')

/**
 * Add a prefix of /blog/ and use a folder structure for the date.
 * e.g. /blog/2019/04/03/blog-title-here/
 */
const generateBlogSlug = (filePath) => {
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

/**
 * Add a prefix of /talks/.
 * @todo Change the permalink format for talks
 */
const generateTalkSlug = (filePath) => {
  return path.posix.join(
    `/talks`,
    filePath,
    `/`
  )
}

module.exports = {
  generateBlogSlug,
  generateTalkSlug
}
