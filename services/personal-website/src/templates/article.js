import React from "react"
import { graphql, Link } from "gatsby"

import { format } from "date-fns"

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
  const post = data.content
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)
  const alternativeUrls = post.deprecatedFields.legacySlugs.map(slug => new URL(slug, data.site.siteMetadata.siteUrl))

  const datePublished = new Date(post.date)
  const dateModified = new Date(post.flast_modified_at || datePublished)

  return (
    <Layout location={location}>
      <Header location={location} image={post.image.image} />
      <div className="alex-article">
        <h1 class="alex-article__headline" itemProp="name headline">{post.title}</h1>
        <div className="alex-article__main">
          <div className="alex-article__main__byline">
            Posted

            {/* {(post.frontmatter.author ? */}
              <>
                {` by `}
                <span itemProp="author" itemType="http://schema.org/Person">
                  <a href="/">
                    <span itemProp="name">Alex</span>
                  </a>
                </span>
              </>
            {/* :null)} */}

            {(datePublished ?
              <>
                {` on `}
                <time
                  className="alex-article__main__date"
                  dateTime={datePublished}
                  itemProp="datePublished"
                >{format(new Date(post.date), "PPPP")}</time>.
              </>
            :null)}

            {(post.image.credit ?
              <>
                {` ${post.image.credit}`}
              </>
            :null)}

          </div>
          <article
            dangerouslySetInnerHTML={{ __html: post.content.html }}
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
                    <label for="subscribe_by_email">And in your inbox, by email:</label>
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

            {post.topics ?
            <div className="alex-article__topics">
              <strong>Topics: </strong>
              <ul>
              {post.topics.map(topic => {
                return <li key={topic.topicId}>
                  <Link to={topic.slug}>{topic.topic}</Link>
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

            <ShareWidget title={post.title} url={url} />
            <Webmentions urls={[url, `${url}/`, ...alternativeUrls]} />

          </div>

        </div>

      </div>
      <SEO title={post.title} description={post.excerpt}>
        <script type="application/ld+json">{JSON.stringify(Article({
          url: url,
          title: post.title,
          image: post.image.image,
          description: post.content.excerpt,
          dateModified: dateModified,
          datePublished: datePublished
        }))}</script>
      </SEO>
    </Layout>
  )
}

export default ArticleTemplate

export const pageQuery = graphql`
  fragment ArticleContent on MarkdownRemark {
    html
    excerpt: excerpt
  }
  query BlogPostBySlug($contentId: String!) {
    content(contentId: {eq: $contentId}) {
      title
      topics {
        topicId
        topic
        slug
      }
      date
      image {
        image
        credit
      }
      content: parent {
        ...ArticleContent
      }
      slug
      deprecatedFields {
        legacySlugs
      }
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`
