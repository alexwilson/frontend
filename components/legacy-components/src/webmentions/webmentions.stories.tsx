import React from 'react'
import type { Meta, StoryObj, Decorator } from '@storybook/react'
import Webmentions from '.'

type MentionData = {
  'wm-id': number
  'wm-property': string
  author: { name: string; url: string; photo: string }
}

const makeMention = (id: number, property: string, name: string, photo?: string): MentionData => ({
  'wm-id': id,
  'wm-property': property,
  author: {
    name,
    url: `https://example.com/${name.toLowerCase().replace(' ', '-')}`,
    photo: photo ?? `https://picsum.photos/seed/${id}/64/64`,
  },
})

const withFetchStub = (mentions: MentionData[]): { decorators: Decorator[] } => ({
  decorators: [
    (Story) => {
      ;(globalThis as { fetch: unknown }).fetch = async () => ({
        ok: true,
        json: async () => ({ children: mentions }),
      })
      return <Story />
    },
  ],
})

const meta: Meta<typeof Webmentions> = {
  title: 'Legacy/Organisms/Webmentions',
  component: Webmentions,
}

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { contentId: 'example-post-id' },
}

export const WithLikes: Story = {
  args: { contentId: 'example-post-id' },
  ...withFetchStub([
    makeMention(1, 'like-of', 'Alice'),
    makeMention(2, 'like-of', 'Bob'),
    makeMention(3, 'like-of', 'Carol'),
  ]),
}

export const WithReposts: Story = {
  args: { contentId: 'example-post-id' },
  ...withFetchStub([
    makeMention(4, 'repost-of', 'Dave'),
    makeMention(5, 'repost-of', 'Eve'),
  ]),
}

export const WithAll: Story = {
  args: { contentId: 'example-post-id' },
  ...withFetchStub([
    makeMention(1, 'like-of', 'Alice'),
    makeMention(2, 'like-of', 'Bob'),
    makeMention(3, 'like-of', 'Carol'),
    makeMention(4, 'repost-of', 'Dave'),
    makeMention(5, 'repost-of', 'Eve'),
  ]),
}
