import type { Meta, StoryObj } from '@storybook/react'
import ShareWidget from '.'

const meta: Meta<typeof ShareWidget> = {
  title: 'Legacy/Molecules/ShareWidget',
  component: ShareWidget,
  args: {
    url: 'https://alexwilson.tech/blog/example-post',
    title: 'An example post',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
