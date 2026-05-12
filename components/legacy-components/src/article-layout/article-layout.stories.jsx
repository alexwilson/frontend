import React from 'react'
import ArticleLayout from '.'
import RelatedArticles from '../related-articles'
import ShareWidget from '../share-widget'
import Webmentions from '../webmentions'
import Infobox from '../infobox'

const relatedArticles = [
  { contentId: '1', title: 'Building a design system', slug: '/blog/design-system', topics: [], image: { thumbnail: 'https://picsum.photos/seed/ds/400/300' }, content: { excerpt: '' } },
  { contentId: '2', title: 'On engineering leadership', slug: '/blog/eng-leadership', topics: [], image: { thumbnail: 'https://picsum.photos/seed/lead/400/300' }, content: { excerpt: '' } },
  { contentId: '3', title: 'Weeknotes #42', slug: '/blog/weeknotes-42', topics: [], image: null, content: { excerpt: '' } },
]

const sampleTopics = [
  { topicId: 'engineering', topic: 'Engineering', slug: '/topic/engineering' },
  { topicId: 'leadership', topic: 'Leadership', slug: '/topic/leadership' },
]

const mockFetch = async () => ({ ok: true, json: async () => ({ children: [] }) })

const Headline = () => <h1>A Sample Article Heading</h1>

const Body = () => (
  <div className="typeset">
    <p>
      This is the main article body. Body copy sits in the wider column of the
      grid, with plenty of room for long-form reading.
    </p>
    <h2>A Section Heading</h2>
    <p>
      Headings, paragraphs, blockquotes, and lists all receive the full typeset
      treatment inside the main column.
    </p>
    <blockquote>
      <p>Good typography is invisible; it carries the reader without interruption.</p>
    </blockquote>
    <Infobox>
      <p><strong>Subscribe</strong> to get new posts by email or RSS.</p>
    </Infobox>
  </div>
)

const Aside = ({ topics = sampleTopics }) => (
  <>
    <div className="alex-article__aside-start">
      {topics.length > 0 && (
        <div className="alex-article__topics">
          <strong>Topics: </strong>
          <ul>
            {topics.map(topic => (
              <li key={topic.topicId}><a href={topic.slug}>{topic.topic}</a></li>
            ))}
          </ul>
        </div>
      )}
    </div>
    <div className="alex-article__aside-mid">
      <div className="alex-article__recommended">
        <h2>Read Next</h2>
        <RelatedArticles articles={relatedArticles} />
      </div>
    </div>
    <div className="alex-article__aside-bottom alex-article__sharing-block">
      <ShareWidget title="A Sample Article" url="https://alexwilson.tech/blog/sample" />
      <Webmentions contentId="sample" />
    </div>
  </>
)

export default {
  title: 'Legacy/Templates/ArticleLayout',
  component: ArticleLayout,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => {
      globalThis.fetch = mockFetch
      return <Story />
    },
  ],
}

export const Default = {
  render: () => <ArticleLayout headline={<Headline />}><Body /></ArticleLayout>,
}

export const WithAside = {
  render: () => (
    <ArticleLayout headline={<Headline />} aside={<Aside />}>
      <Body />
    </ArticleLayout>
  ),
}

