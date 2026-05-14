import React, { useState, useMemo } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Stream from '../stream'
import StreamFilters from '../stream-filters'
import ArticleCard from '../article-card'
import Pagination from '../pagination'
import type { Article } from '../article-card/article-card'
import type { Topic } from '../stream-filters/stream-filters'

const allPosts: Article[] = [
  { contentId: '1', title: 'Building a design system', slug: '/blog/design-system', date: '2024-03-01', image: null, content: { excerpt: 'How to build a robust design system from scratch.' } },
  { contentId: '2', title: 'On engineering leadership', slug: '/blog/eng-leadership', date: '2023-11-15', image: null, content: { excerpt: 'Lessons learned from leading engineering teams.' } },
  { contentId: '3', title: 'Weeknotes #42', slug: '/blog/weeknotes-42', date: '2023-09-05', image: null, content: { excerpt: 'A quiet week. Some progress on the monorepo.' } },
  { contentId: '4', title: 'The case for boring technology', slug: '/blog/boring-tech', date: '2023-06-20', image: null, content: { excerpt: 'Choosing dull tools is often the most exciting decision.' } },
  { contentId: '5', title: 'Notes on distributed systems', slug: '/blog/distributed', date: '2022-04-10', image: null, content: { excerpt: 'Observations from running systems at scale.' } },
  { contentId: '6', title: 'Weeknotes #38', slug: '/blog/weeknotes-38', date: '2022-02-14', image: null, content: { excerpt: 'A productive fortnight.' } },
]

const topics: Topic[] = [
  { topicId: 'engineering', topic: 'Engineering', slug: '/topic/engineering' },
  { topicId: 'leadership',  topic: 'Leadership',  slug: '/topic/leadership' },
  { topicId: 'weeknotes',   topic: 'Weeknotes',   slug: '/topic/weeknotes' },
]

function BlogTemplate() {
  const [selectedYears, setSelectedYears] = useState<number[]>([])

  const years = useMemo(() =>
    [...new Set(allPosts.map(p => new Date(p.date).getFullYear()))].sort((a, b) => b - a),
    []
  )

  const toggleYear = (year: number) => setSelectedYears(prev =>
    prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
  )

  const filtered = allPosts.filter(p =>
    selectedYears.length === 0 || selectedYears.includes(new Date(p.date).getFullYear())
  )

  return (
    <Stream
      header={<><h1>My Blog</h1><h4>{filtered.length} Posts</h4></>}
      sidebar={
        <StreamFilters
          years={years}
          selectedYears={selectedYears}
          onYearToggle={toggleYear}
          topics={topics}
          onClear={() => setSelectedYears([])}
        />
      }
    >
      {filtered.map(post => (
        <ArticleCard key={post.contentId} article={post} withImage={false} />
      ))}
    </Stream>
  )
}

const meta: Meta = {
  title: 'Legacy/Templates/StreamLayout',
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <BlogTemplate />,
}

export const WithPagination: Story = {
  render: () => (
    <Stream
      header={<><h1>My Blog</h1><h4>6 Posts</h4></>}
      sidebar={<StreamFilters years={[2024, 2023, 2022]} selectedYears={[]} topics={topics} />}
    >
      {allPosts.map(post => (
        <ArticleCard key={post.contentId} article={post} withImage={false} />
      ))}
      <Pagination currentPage={2} totalPages={5} basePath="/blog" />
    </Stream>
  ),
}
