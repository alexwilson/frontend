import type { Meta, StoryObj } from '@storybook/react'
import Header from '.'

const meta: Meta<typeof Header> = {
  title: 'Legacy/Organisms/Header',
  component: Header,
  args: {
    location: { pathname: '/' },
    image: 'https://picsum.photos/seed/header/1920/600',
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const BlogSection: Story = {
  args: {
    location: { pathname: '/blog' },
    section: 'blog',
  },
}

export const TalksSection: Story = {
  args: {
    location: { pathname: '/talks' },
    section: 'talks',
  },
}

export const NoImage: Story = {
  args: { image: null },
}

export const Compact: Story = {
  args: { compact: true },
}

export const CompactBlog: Story = {
  args: {
    compact: true,
    location: { pathname: '/blog' },
    section: 'blog',
  },
}

export const CompactTalks: Story = {
  args: {
    compact: true,
    location: { pathname: '/talks' },
    section: 'talks',
  },
}

export const CompactNoImage: Story = {
  args: { compact: true, image: null },
}
