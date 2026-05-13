import Organization from "./organization"
import Person from "./person"

type ArticleProps = {
  url?: string
  title?: string
  image?: string
  description?: string
  dateModified?: Date
  datePublished?: Date
}

const Article = ({
  url = "",
  title = "",
  image = "",
  description = "",
  dateModified = new Date(),
  datePublished = new Date(),
}: ArticleProps) => ({
  "@context": "http://schema.org",
  "@type": "Article",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": url,
  },
  url: url,
  headline: title,
  dateModified: dateModified.toISOString(),
  datePublished: datePublished.toISOString(),
  publisher: Organization(),
  author: Person(),
  image: image,
  description: description,
})

export default Article
