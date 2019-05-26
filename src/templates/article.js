import React from "react"
import { graphql, StaticQuery, Link } from "gatsby"
import Layout from "../components/layout"
import ShareWidget from "../components/share-widget"
import RelatedArticles from "../components/related-articles"

export default ({ data, location }) => {
  const post = data.markdownRemark
  return (
    <Layout location={location} headerImage={post.fields.image}>
      <div className="alex-article">
        <div className="alex-article__main">
          <h1 itemProp="name headline">{post.frontmatter.title}</h1>
          <div className="alex-article__main__byline">
            Posted

            {(post.frontmatter.author ?
              <>
                {` by `}
                <span itemProp="author" itemType="http://schema.org/Person">
                  <a href="/">
                    <span itemProp="name">Alex</span>
                  </a>
                </span>
              </>
            :null)}

            {(post.fields.date ?
              <>
                {` on `}
                <time
                  className="alex-article__main__date"
                  dateTime={post.fields.date}
                  itemProp="datePublished"
                >{post.fields.formattedDate}</time>.
              </>
            :null)}

            {(post.frontmatter.image_credit ?
              <>
                {` ${post.frontmatter.image_credit}`}
              </>
            :null)}

          </div>
          <article
            dangerouslySetInnerHTML={{ __html: post.html }}
            className="alex-article__body article-description"
            itemProp="articleBody"
          />

          <hr />
          <h3 className="share">Share</h3>
          <ShareWidget title={post.frontmatter.title} url={new URL(location.pathname, data.site.siteMetadata.siteUrl)} />

        </div>


        <div className="alex-article__aside">
          <div className="alex-article__topics">
            <strong>Topics: </strong>
            <ul>
            {post.frontmatter.tags.map(topic => {
              return <li key={topic}>
                <Link to={`/topic/${topic}`}>{topic}</Link>
              </li>
            })}
            </ul>
          </div>

          <div className="alex-article__recommended">
            <h2>Read Next</h2>
            <RelatedArticles article={post}/>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      timeToRead
      frontmatter {
        title
        tags
        date
        author
        image_credit
      }
      fields {
        formattedDate: date(formatString: "dddd, MMMM Do, YYYY")
        image
        date
        slug
      }
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`;
