import React from "react"
import { graphql, HeadProps, Link, PageProps } from "gatsby"

import { formatUTC } from "@alexwilson/ds-legacy-components/src/util-date"

import ArticleLayout from "@alexwilson/ds-legacy-components/src/article-layout"
import Header from "@alexwilson/ds-legacy-components/src/header"
import Infobox from "@alexwilson/ds-legacy-components/src/infobox"
import ShareWidget from "@alexwilson/ds-legacy-components/src/share-widget"
import Webmentions from "@alexwilson/ds-legacy-components/src/webmentions"
import {
  Form,
  InlineGroup,
  Input,
  Submit,
} from "@alexwilson/ds-legacy-components/src/form"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Article from "../schema-org/article"
import RelatedArticles from "../components/related-articles"
import WeeknoteNavigation from "../components/weeknote-navigation"

type ArticleData = {
  content: {
    contentId: string
    title: string
    author?: { name: string }
    topics: { topicId: string; topic: string; slug: string }[]
    date: string
    flast_modified_at?: string
    image: { image: string; credit?: string }
    content: { html: string; excerpt: string }
    slug: string
  }
  site: { siteMetadata: { siteUrl: string } }
}

const ArticleTemplate = ({ data, location }: PageProps<ArticleData>) => {
  const post = data.content
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)
  const datePublished = new Date(post.date)

  return (
    <Layout location={location}>
      <Header
        location={location}
        section="blog"
        image={post.image.image}
        compact
      />
      <ArticleLayout
        headline={<h1 itemProp="name headline">{post.title}</h1>}
        aside={
          <>
            <div className="alex-article__aside-start">
              {post.topics ? (
                <div className="alex-article__topics">
                  <strong>Topics: </strong>
                  <ul>
                    {post.topics.map((topic) => (
                      <li key={topic.topicId}>
                        <Link to={topic.slug}>{topic.topic}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
          </>
        }
      >
        <div className="alex-article__byline">
          Posted
          {post.author && post.author.name ? (
            <>
              {` by `}
              <span
                itemProp="author"
                itemScope
                itemType="http://schema.org/Person"
              >
                <a href="/about">
                  <span itemProp="name">Alex</span>
                </a>
                <meta itemProp="url" content={`https://alexwilson.tech/`} />
              </span>
            </>
          ) : null}
          {datePublished ? (
            <>
              {` on `}
              <time
                className="alex-article__main__date"
                dateTime={datePublished.toISOString()}
                itemProp="datePublished"
              >
                {formatUTC(post.date, "PPPP")}
              </time>
              .
            </>
          ) : null}
          {post.image.credit ? <>{` ${post.image.credit}`}</> : null}
        </div>
        <article
          dangerouslySetInnerHTML={{ __html: post.content.html }}
          className="alex-article__body article-description"
          itemProp="articleBody"
        />

        <WeeknoteNavigation article={post} />

        <footer>
          <Infobox>
            If you enjoyed this article and want to read more, you can follow me:
            <ul style={{ marginTop: 0 }}>
              <li className="bullet--rss">
                <a href="/feed.xml">With your feed reader</a>,
              </li>
              <li className="bullet--twitter">
                {`On `}
                <a rel="me" href="https://twitter.com/alexwilsonv1">
                  Twitter
                </a>
                {` , `}
                <a
                  rel="me"
                  href="https://bsky.app/profile/alexwilson.bsky.social"
                >
                  Bluesky
                </a>
                {` or `}
                <a rel="me" href="https://mastodon.social/@alexwilson">
                  Mastodon
                </a>
                ,
              </li>
              <li className="bullet--email">
                <label htmlFor="subscribe_by_email">
                  And in your inbox, by email:
                </label>
                <Form
                  action="https://tech.us21.list-manage.com/subscribe/post?u=e0869bce049cbcd034fc8edd2&amp;id=7733fc6e4f&amp;f_id=00ef5be1f0"
                  method="post"
                  rel="noreferrer"
                  target="_blank"
                >
                  <InlineGroup>
                    <Input
                      placeholder="Your email address"
                      type="email"
                      name="EMAIL"
                      id="subscribe_by_email"
                    />
                    <Submit value="Subscribe" />
                  </InlineGroup>
                </Form>
              </li>
            </ul>
            Before you go, if you're here via social media: Please leave a like,
            reply or repost. It really helps with reach!
          </Infobox>
        </footer>
      </ArticleLayout>
    </Layout>
  )
}

export default ArticleTemplate

export const Head = ({ data, location }: HeadProps<ArticleData>) => {
  const post = data.content
  const url = new URL(location.pathname, data.site.siteMetadata.siteUrl)
  const datePublished = new Date(post.date)
  const dateModified = new Date(post.flast_modified_at || datePublished)

  return (
    <SEO
      title={post.title}
      description={post.content.excerpt}
      pathname={location.pathname}
      twitterCard="summary_large_image"
      twitterSite="@alexwilsonv1"
      twitterImage={`${url}/twitter-card.jpg`}
    >
      <script type="application/ld+json">
        {JSON.stringify(
          Article({
            url: url.toString(),
            title: post.title,
            image: post.image.image,
            description: post.content.excerpt,
            dateModified: dateModified,
            datePublished: datePublished,
          }),
        )}
      </script>
    </SEO>
  )
}

export const pageQuery = graphql`
  fragment ArticleContent on MarkdownRemark {
    html
    excerpt: excerpt
  }
  query BlogPostBySlug($contentId: String!) {
    content(contentId: { eq: $contentId }) {
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
