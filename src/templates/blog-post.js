import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import ShareWidget from "../components/share-widget"

export default ({ data, location }) => {
  const post = data.markdownRemark
  return (
    <Layout location={location}>
      <div class="alex-article">
        <div class="alex-article__main">
          <h1 itemprop="name headline">{post.frontmatter.title}</h1>
          <div class="alex-article__main__byline">
            Posted

            {(post.frontmatter.author ?
              <>
                {` by `}
                <span itemprop="author" itemtype="http://schema.org/Person">
                  <a href="/">
                    <span itemprop="name">Alex</span>
                  </a>
                </span>
              </>
            :null)}

            {(post.fields.date ?
              <>
                {` on `}
                <time
                  className="alex-article__main__date"
                  datetime={post.fields.date}
                  itemprop="datePublished"
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
            itemprop="articleBody"
          />

          <hr />
          <h3 class="share">Share</h3>
          <ShareWidget title={post.frontmatter.title} url={new URL(location.pathname, data.site.siteMetadata.siteUrl)} />

        </div>


        <div class="alex-article__aside">
          <div class="alex-article__topics">
            <strong>Topics:</strong>
          </div>

          <div class="alex-article__recommended">
            <h2>Read Next</h2>
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
        date
        author
        image_credit
      }
      fields {
        formattedDate: date(formatString: "dddd, MMMM Do, YYYY")
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
