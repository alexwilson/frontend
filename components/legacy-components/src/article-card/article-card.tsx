import React from "react"
import Link from '../link'
import ResponsiveImage from '../responsive-image'
import { formatUTC } from '../util-date'

export type Article = {
  title: string
  slug?: string
  url?: string
  date: string
  content?: { excerpt: string } | null
  image?: { thumbnail?: string } | null
  contentId?: string
}

type Props = {
  article: Article
  withBody?: boolean
  withImage?: boolean
  withDate?: boolean
  newTab?: boolean
}

export default function ArticleCard({ article, withBody = true, withImage = true, withDate = true, newTab = false }: Props) {

  const date = new Date(article.date)
  const destination = article.url || article.slug
  const isInternalLink = destination && destination.startsWith('/')

  return (
    <div className="alex-card">

      <div className="alex-card__content--container">

        <div className="alex-card__title">
          <h3>
            {isInternalLink
              ? <Link to={ destination }>{ article.title }</Link>
              : <a href={ destination } target={ newTab ? '_blank' : undefined } rel={ newTab ? 'noopener noreferrer' : undefined }>{ article.title }</a>}
          </h3>
        </div>

        {(withBody !== false && article.content) ?
          <div className="alex-card__abstract">
          <p>
            { article.content.excerpt }
          </p>
        </div>
        :null}

        {(withDate !== false) ?
          <div className="alex-card__timetamp">
            <span className="dateline">
              <time dateTime={date.toISOString()}>{ formatUTC(date, "d MMM yyyy") }</time>
            </span>
          </div>
        :null}

      </div>

      {(withImage !== false && article.image && article.image.thumbnail) ?
        <div className="alex-card__image">
          <ResponsiveImage src={ article.image.thumbnail } width={ 400 } />
        </div>
      :null}

    </div>
  )

}
