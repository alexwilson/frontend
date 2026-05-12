import React from 'react'
import RelatedArticles from '.'

const articles = [
  {
    contentId: '1',
    title: 'Building a design system',
    slug: '/blog/design-system',
    topics: [{ topicId: 'engineering', topic: 'Engineering', slug: '/topic/engineering' }],
    image: { thumbnail: 'https://picsum.photos/seed/ds/400/300' },
    content: { excerpt: 'How to build a robust design system from scratch.' },
  },
  {
    contentId: '2',
    title: 'On engineering leadership',
    slug: '/blog/eng-leadership',
    topics: [{ topicId: 'leadership', topic: 'Leadership', slug: '/topic/leadership' }],
    image: { thumbnail: 'https://picsum.photos/seed/lead/400/300' },
    content: { excerpt: 'Lessons learned from leading engineering teams.' },
  },
  {
    contentId: '3',
    title: 'Weeknotes #42',
    slug: '/blog/weeknotes-42',
    topics: [{ topicId: 'weeknotes', topic: 'Weeknotes', slug: '/topic/weeknotes' }],
    image: null,
    content: { excerpt: 'A quiet week.' },
  },
]

export default {
  title: 'Legacy/Organisms/RelatedArticles',
  component: RelatedArticles,
  parameters: { layout: 'padded' },
}

export const Default = {
  args: { articles },
}

export const Single = {
  args: { articles: articles.slice(0, 1) },
}

export const Empty = {
  args: { articles: [] },
}
