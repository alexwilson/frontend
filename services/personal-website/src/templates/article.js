import React from "react"
import { graphql, Link } from "gatsby"

import { format } from "date-fns"

import Header from "@alexwilson/legacy-components/src/header"
import ShareWidget from "@alexwilson/legacy-components/src/share-widget"
import Webmentions from "@alexwilson/legacy-components/src/webmentions"
import { Form, InlineGroup, Input, Submit } from "@alexwilson/legacy-components/src/form"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Article from "../schema-org/article";
import RelatedArticles from "../components/related-articles"

const InfoBox = ({ icon, children }) => (
  <p class="alex-article__infobox">
    {children}
  </p>
)

const ArticleTemplate = ({ data, location }) => {
  const post = data.content
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)

  const datePublished = new Date(post.date)
  const dateModified = new Date(post.flast_modified_at || datePublished)

  return (
    <Layout location={location}>
      <Header location={location} section="blog" image={post.image.image} linkImplementation={Link} />
      <div className="alex-article">
        <h1 class="alex-article__headline" itemProp="name headline">{post.title}</h1>
        <div className="alex-article__main">
          <div className="alex-article__byline">
            Posted

            {(post.author && post.author.name ?
              <>
                {` by `}
                <span itemProp="author" itemScope itemType="http://schema.org/Person">
                  <a href="/about-me">
                    <span itemProp="name">Alex</span>
                  </a>
                  <meta itemProp="url" content={`https://alexwilson.tech/`} />
                </span>
              </>
              : null)}

            {(datePublished ?
              <>
                {` on `}
                <time
                  className="alex-article__main__date"
                  dateTime={datePublished}
                  itemProp="datePublished"
                >{format(new Date(post.date), "PPPP")}</time>.
              </>
              : null)}

            {(post.image.credit ?
              <>
                {` ${post.image.credit}`}
              </>
              : null)}

          </div>
          <article
            dangerouslySetInnerHTML={{ __html: post.content.html }}
            className="alex-article__body article-description"
            itemProp="articleBody"
          />

          <footer>
            <InfoBox>
              If you enjoyed this article and want to read more, you can follow me:
              <ul style={{ marginTop: 0 }}>
                <li class="bullet--rss"><a href="/feed.xml">With your feed reader</a>,</li>
                <li class="bullet--twitter">{`On `}
                  <a rel="me" href="https://twitter.com/alexwilsonv1">Twitter</a>{` , `}
                  <a rel="me" href="https://bsky.app/profile/alexwilson.bsky.social">Bluesky</a>{` or `}
                  <a rel="me" href="https://mastodon.social/@alexwilson">Mastodon</a>,
                </li>
                <li class="bullet--email">
                  <label for="subscribe_by_email">And in your inbox, by email:</label>
                  <Form action="https://tech.us21.list-manage.com/subscribe/post?u=e0869bce049cbcd034fc8edd2&amp;id=7733fc6e4f&amp;f_id=00ef5be1f0" method="post" rel="noreferrer" target="_blank">
                    <InlineGroup>
                      <Input placeholder="Your email address" type="email" name="EMAIL" id="subscribe_by_email" />
                      <Submit value="Subscribe" />
                    </InlineGroup>
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
              </div> : null}

          </div>

          <div className="alex-article__aside-mid">

            <div className="alex-article__recommended">
              <h2>Read Next</h2>
              <RelatedArticles article={post} />
            </div>

          </div>

          <div className="alex-article__aside-bottom alex-article__sharing-block">

            <ShareWidget title={post.title} url={url} />
            <Webmentions contentId={post.contentId} />

          </div>

        </div>

      </div>
      <SEO title={post.title} description={post.content.excerpt} url={url} image={`${url}/twitter-card.jpg`}>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:description" content={post.content.excerpt} />
        <meta name="twitter:site" content="@alexwilsonv1" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:image" content={`${url}/twitter-card.jpg`} />
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
      contentId
      title
      author {
        name
      }
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
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`
