import React from 'react'
import HomeLayout, { HomeSection, HomeTilestack, HomeTilestackItem } from '.'
import ArticleCard from '../article-card'

const writing = [
  { contentId: '1', title: 'Building a design system', slug: '/blog/design-system', date: '2024-03-01', topics: [], image: null, content: { excerpt: 'How to build a robust design system from scratch.' } },
  { contentId: '2', title: 'On engineering leadership', slug: '/blog/eng-leadership', date: '2023-11-15', topics: [], image: null, content: { excerpt: 'Lessons learned from leading engineering teams.' } },
  { contentId: '3', title: 'The case for boring technology', slug: '/blog/boring-tech', date: '2023-06-20', topics: [], image: null, content: { excerpt: 'Choosing dull tools is often the most exciting decision.' } },
]

const weeknotes = [
  { contentId: '4', title: 'Weeknotes #42', slug: '/blog/weeknotes-42', date: '2023-09-05', topics: [], image: null, content: { excerpt: 'A quiet week. Some progress on the monorepo.' } },
  { contentId: '5', title: 'Weeknotes #41', slug: '/blog/weeknotes-41', date: '2023-08-29', topics: [], image: null, content: { excerpt: 'Shipped the redesign.' } },
  { contentId: '6', title: 'Weeknotes #40', slug: '/blog/weeknotes-40', date: '2023-08-22', topics: [], image: null, content: { excerpt: 'Back from holiday.' } },
]

export default {
  title: 'Legacy/Templates/HomeLayout',
  component: HomeLayout,
  parameters: { layout: 'fullscreen' },
}

export const Default = {
  render: () => (
    <HomeLayout>
      <HomeSection>
        <h2><a className="heading" href="/blog/">Latest Writing</a></h2>
        <HomeTilestack>
          {writing.map(article => (
            <HomeTilestackItem key={article.contentId}>
              <ArticleCard article={article} withImage={false} withDate={false} />
            </HomeTilestackItem>
          ))}
        </HomeTilestack>
      </HomeSection>
      <HomeSection>
        <h2><a className="heading" href="/topic/weeknotes">Latest Notes</a></h2>
        <HomeTilestack>
          {weeknotes.map(article => (
            <HomeTilestackItem key={article.contentId}>
              <ArticleCard article={article} withImage={false} withDate={false} />
            </HomeTilestackItem>
          ))}
        </HomeTilestack>
      </HomeSection>
    </HomeLayout>
  ),
}
