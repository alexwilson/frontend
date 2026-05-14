import type { Meta, StoryObj } from '@storybook/react'
import RelatedArticles from '.'

const articles = [
  {
    contentId: '1',
    title: 'Building a design system',
    slug: '/blog/design-system',
    date: '2024-03-01',
    image: { thumbnail: 'https://picsum.photos/seed/ds/400/300' },
    content: { excerpt: 'How to build a robust design system from scratch.' },
  },
  {
    contentId: '2',
    title: 'On engineering leadership',
    slug: '/blog/eng-leadership',
    date: '2023-11-15',
    image: { thumbnail: 'https://picsum.photos/seed/lead/400/300' },
    content: { excerpt: 'Lessons learned from leading engineering teams.' },
  },
  {
    contentId: '3',
    title: 'Weeknotes #42',
    slug: '/blog/weeknotes-42',
    date: '2023-09-05',
    image: null,
    content: { excerpt: 'A quiet week.' },
  },
]

const meta: Meta<typeof RelatedArticles> = {
  title: 'Legacy/Organisms/RelatedArticles',
  component: RelatedArticles,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { articles },
}

export const Single: Story = {
  args: { articles: articles.slice(0, 1) },
}

export const Empty: Story = {
  args: { articles: [] },
}
