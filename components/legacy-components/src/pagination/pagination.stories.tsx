import type { Meta, StoryObj } from '@storybook/react'
import Pagination from '.'

const meta: Meta<typeof Pagination> = {
  title: 'Legacy/Molecules/Pagination',
  component: Pagination,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { currentPage: 3, totalPages: 7, basePath: '/blog' },
}

export const FirstPage: Story = {
  args: { currentPage: 1, totalPages: 5, basePath: '/blog' },
}

export const LastPage: Story = {
  args: { currentPage: 5, totalPages: 5, basePath: '/blog' },
}

export const TwoPages: Story = {
  args: { currentPage: 1, totalPages: 2, basePath: '/blog' },
}
