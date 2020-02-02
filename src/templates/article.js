import React from "react"
import { graphql, Link } from "gatsby"
import loadable from '@loadable/component'

import Layout from "../components/layout"
import Header from "../components/header"
import ShareWidget from "../components/share-widget"
import RelatedArticles from "../components/related-articles"
import SEO from "../components/seo"
import Article from "../schema-org/article";

const Webmentions = loadable(() => import("../components/webmentions"))

export default ({ data, location }) => {
  const post = data.markdownRemark
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)

  const datePublished = new Date(post.frontmatter.date)
  const dateModified = new Date(post.frontmatter.last_modified_at || datePublished)

  return (
    <Layout location={location}>
      <Header location={location} image={post.fields.image} />
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

            {(datePublished ?
              <>
                {` on `}
                <time
                  className="alex-article__main__date"
                  dateTime={datePublished}
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
          <ShareWidget title={post.frontmatter.title} url={url} />
          <Webmentions url={url} />

        </div>


        <div className="alex-article__aside">
          {post.frontmatter.tags ?
          <div className="alex-article__topics">
            <strong>Topics: </strong>
            <ul>
            {post.frontmatter.tags.map(topic => {
              return <li key={topic}>
                <Link to={`/topic/${topic}`}>{topic}</Link>
              </li>
            })}
            </ul>
          </div>:null}

          <div className="alex-article__recommended">
            <h2>Read Next</h2>
            <RelatedArticles article={post}/>
          </div>
        </div>
      </div>
      <SEO title={post.frontmatter.title} description={post.excerpt}>
        <script type="application/ld+json">{JSON.stringify(Article({
          url: url,
          title: post.frontmatter.title,
          image: post.fields.image,
          description: post.frontmatter.excerpt,
          dateModified: dateModified,
          datePublished: datePublished
        }))}</script>
      </SEO>
    </Layout>
  )
}

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      timeToRead
      excerpt
      frontmatter {
        title
        tags
        date
        last_modified_at
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
`
