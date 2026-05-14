import React from 'react'
import type { Meta, StoryObj, Decorator } from '@storybook/react'
import ArticleLayout from '.'
import RelatedArticles from '../related-articles'
import ShareWidget from '../share-widget'
import Webmentions from '../webmentions'
import Infobox from '../infobox'
import type { Topic } from '../stream-filters/stream-filters'

const relatedArticles = [
  { contentId: '1', title: 'Building a design system', slug: '/blog/design-system', date: '2024-03-01', image: { thumbnail: 'https://picsum.photos/seed/ds/400/300' }, content: { excerpt: '' } },
  { contentId: '2', title: 'On engineering leadership', slug: '/blog/eng-leadership', date: '2023-11-15', image: { thumbnail: 'https://picsum.photos/seed/lead/400/300' }, content: { excerpt: '' } },
  { contentId: '3', title: 'Weeknotes #42', slug: '/blog/weeknotes-42', date: '2023-09-05', image: null, content: { excerpt: '' } },
]

const sampleTopics: Topic[] = [
  { topicId: 'engineering', topic: 'Engineering', slug: '/topic/engineering' },
  { topicId: 'leadership', topic: 'Leadership', slug: '/topic/leadership' },
]

const mockFetch: Decorator = (Story) => {
  ;(globalThis as { fetch: unknown }).fetch = async () => ({ ok: true, json: async () => ({ children: [] }) })
  return <Story />
}

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

type AsideProps = { topics?: Topic[] }

const Aside = ({ topics = sampleTopics }: AsideProps) => (
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

const meta: Meta<typeof ArticleLayout> = {
  title: 'Legacy/Templates/ArticleLayout',
  component: ArticleLayout,
  parameters: { layout: 'fullscreen' },
  decorators: [mockFetch],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <ArticleLayout headline={<Headline />}><Body /></ArticleLayout>,
}

export const WithAside: Story = {
  render: () => (
    <ArticleLayout headline={<Headline />} aside={<Aside />}>
      <Body />
    </ArticleLayout>
  ),
}
