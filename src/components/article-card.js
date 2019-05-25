import { Link } from "gatsby"
import PropTypes, { node } from "prop-types"
import React from "react"
import ResponsiveImage from './responsive-image'

export default function articleCard({article, withBody = true, withImage = true, withDate = true}) {

  const date = new Date(article.frontmatter.date || "now")
  const month = {
    0: "Dec",
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
  }

  return (
    <div className="alex-card{% if include.modifier %} {{include.modifier}}{% endif %}">

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
              <time dateTime="{{ post.date | date_to_xmlschema }}">{ `${date.getUTCDate()} ${month[parseInt(date.getUTCMonth())]} ${date.getUTCFullYear()}` }</time>
            </span>
          </div>
        :null}

      </div>

      {(withImage !== false) ?
        <div className="alex-card__image">
          <ResponsiveImage src={article.frontmatter.image} width={400}></ResponsiveImage>
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
