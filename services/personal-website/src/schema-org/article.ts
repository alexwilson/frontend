import Organization from './organization'
import Person from './person'

const Article = ({
  url = '',
  title = '',
  image = '',
  description = '',
  dateModified = new Date(),
  datePublished = new Date()
}) => ({
  '@context':'http://schema.org',
  '@type':'Article',
  'mainEntityOfPage': {
    '@type':'WebPage',
    '@id':url
  },
  'url': url,
  'headline':title,
  'dateModified': dateModified.toISOString(),
  'datePublished': datePublished.toISOString(),
  'publisher': Organization(),
  'author': Person(),
  'image': image,
  'description': description,
})

export default Article
