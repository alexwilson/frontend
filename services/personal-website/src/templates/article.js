import React from "react"
import { graphql, Link } from "gatsby"

import Header from "@alexwilson/legacy-components/src/header"
import ShareWidget from "@alexwilson/legacy-components/src/share-widget"
import Webmentions from "@alexwilson/legacy-components/src/webmentions"
import {Form, InlineGroup, Input, Submit} from "@alexwilson/legacy-components/src/form"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Article from "../schema-org/article";
import RelatedArticles from "../components/related-articles"

const InfoBox = ({icon, children}) => (
  <p class="alex-article__infobox">
    {children}
  </p>
)

const ArticleTemplate = ({ data, location }) => {
  const post = data.markdownRemark
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)
  const alternativeUrl = new URL(post.fields['_legacy_slug'], data.site.siteMetadata.siteUrl)

  const datePublished = new Date(post.frontmatter.date)
  const dateModified = new Date(post.frontmatter.last_modified_at || datePublished)

  return (
    <Layout location={location}>
      <Header location={location} image={post.fields.image} />
      <div className="alex-article">
        <h1 class="alex-article__headline" itemProp="name headline">{post.frontmatter.title}</h1>
        <div className="alex-article__main">
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

            <footer>
              <InfoBox>
                If you enjoyed this article and want to read more, you can follow me:
                <ul style={{marginTop: 0}}>
                  <li class="bullet--rss"><a href="/feed.xml">With your feed reader</a>,</li>
                  <li class="bullet--twitter">
                    On <a href="https://twitter.com/alexwilsonv1">Twitter</a>,
                  </li>
                  <li class="bullet--email">
                    <label for="subscribe_by_email">Or to my digest, by email:</label>
                    <Form action="http://newsletter.alexwilson.tech/add_subscriber" method="post" rel="noreferrer" target="_blank">
                      <InlineGroup>
                        <Input placeholder="Your email address" type="email" name="member[email]" id="subscribe_by_email" />
                        <Submit value="Subscribe" />
                      </InlineGroup>
                      <div class="text--small">
                        By subscribing, you agree with Revue’s <a target="_blank" href="https://www.getrevue.co/terms">Terms of Service</a> and <a target="_blank" href="https://www.getrevue.co/privacy">Privacy Policy</a>.
                      </div>
                    </Form>
                  </li>
                </ul>
                Before you go, if you're here via social media: Please leave a like, reply or repost. It really helps with reach!
              </InfoBox>
            </footer>

          <div class="alex-article__sharing-block">

          </div>

        </div>


        <div className="alex-article__aside">

          <div className="alex-article__aside-start">

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

          </div>

          <div className="alex-article__aside-mid">

            <div className="alex-article__recommended">
              <h2>Read Next</h2>
              <RelatedArticles article={post}/>
            </div>

          </div>

          <div className="alex-article__aside-bottom alex-article__sharing-block">

            <ShareWidget title={post.frontmatter.title} url={url} />
            <Webmentions urls={[url, `${url}/`, alternativeUrl]} />

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

export default ArticleTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
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
        _legacy_slug
      }
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`
