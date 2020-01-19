import { Link } from "gatsby"
import { format as formatDate } from 'date-fns'
import PropTypes, { node } from "prop-types"
import React from "react"
import ResponsiveImage from './responsive-image'

export default function articleCard({article, withBody = true, withImage = true, withDate = true}) {

  const date = new Date(article.fields.date)

  return (
    <div className="alex-card">

      <div className="alex-card__content--container">

        <div className="alex-card__title">
          <h3><Link to={ article.fields.slug }>{ article.frontmatter.title }</Link></h3>
        </div>

        {(withBody !== false) ?
          <div className="alex-card__abstract">
          <p>
            { article.excerpt }
          </p>
        </div>
        :null}

        {(withDate !== false) ?
          <div className="alex-card__timetamp">
            <span className="dateline">
              <time dateTime={date.toISOString()}>{ formatDate(date, "d MMM yyyy") }</time>
            </span>
          </div>
        :null}

      </div>

      {(withImage !== false && article.fields.thumbnail) ?
        <div className="alex-card__image">
          <ResponsiveImage src={ article.fields.thumbnail } width={ 400 } />
        </div>
      :null}

    </div>
  )

}

// export const query = graphql`
//   fragment SiteInformation on Site {
//     siteMetadata {
//       title
//       siteDescription
//     }
//   }
// `
