import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Stream from '.'
import StreamFilters from '../stream-filters'
import ArticleCard from '../article-card'

const sampleArticles = [
  { contentId: '1', title: 'Building a design system', slug: '/blog/design-system', date: '2024-03-01', content: { excerpt: 'How to build a robust design system from scratch.' }, image: { thumbnail: 'https://picsum.photos/seed/ds/400/300' } },
  { contentId: '2', title: 'On engineering leadership', slug: '/blog/eng-leadership', date: '2023-11-15', content: { excerpt: 'Lessons learned from leading engineering teams.' }, image: { thumbnail: 'https://picsum.photos/seed/lead/400/300' } },
  { contentId: '3', title: 'Weeknotes #42', slug: '/blog/weeknotes-42', date: '2023-09-05', content: { excerpt: 'A quiet week. Some progress on the monorepo.' }, image: null },
]

const sampleTopics = [
  { topicId: 'engineering', topic: 'Engineering', slug: '/topic/engineering' },
  { topicId: 'leadership', topic: 'Leadership', slug: '/topic/leadership' },
  { topicId: 'weeknotes', topic: 'Weeknotes', slug: '/topic/weeknotes' },
]

const meta: Meta<typeof Stream> = {
  title: 'Legacy/Organisms/Stream',
  component: Stream,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Stream header={<h1>Writing</h1>}>
      {sampleArticles.map(a => <ArticleCard key={a.contentId} article={a} withImage={false} />)}
    </Stream>
  ),
}

export const WithSidebar: Story = {
  render: () => {
    const [selectedYears, setSelectedYears] = useState<number[]>([])
    const years = [2024, 2023, 2022]
    return (
      <Stream
        header={<><h1>Writing</h1><h4>{sampleArticles.length} Posts</h4></>}
        sidebar={
          <StreamFilters
            years={years}
            selectedYears={selectedYears}
            onYearToggle={y => setSelectedYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])}
            topics={sampleTopics}
            onClear={selectedYears.length > 0 ? () => setSelectedYears([]) : undefined}
          />
        }
      >
        {sampleArticles.map(a => <ArticleCard key={a.contentId} article={a} withImage={false} />)}
      </Stream>
    )
  },
}

export const WithActiveTopic: Story = {
  render: () => (
    <Stream
      header={<h1>2 posts tagged with &ldquo;Engineering&rdquo;</h1>}
      sidebar={
        <StreamFilters
          topics={sampleTopics}
          selectedTopics={['engineering']}
        />
      }
    >
      {sampleArticles.slice(0, 2).map(a => <ArticleCard key={a.contentId} article={a} withImage={false} />)}
    </Stream>
  ),
}
