import type { Meta, StoryObj } from '@storybook/react'
import ArticleCard from '.'

const meta: Meta<typeof ArticleCard> = {
  title: 'Legacy/Molecules/ArticleCard',
  component: ArticleCard,
  args: {
    article: {
      title: 'An example article',
      slug: '/blog/example-article',
      date: '2024-06-01',
      content: { excerpt: 'This is a short excerpt describing the article content.' },
      image: { thumbnail: 'https://picsum.photos/seed/article/400/300' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithoutImage: Story = {
  args: { withImage: false },
}

export const WithoutDate: Story = {
  args: { withDate: false },
}

export const WithoutBody: Story = {
  args: { withBody: false },
}

export const RelatedArticle: Story = {
  args: { withBody: false, withDate: false },
}

export const ExternalLink: Story = {
  args: {
    article: {
      title: 'An external article',
      url: 'https://example.com/post',
      date: '2024-06-01',
      content: { excerpt: 'This article links to an external site.' },
      image: null,
    },
  },
}
