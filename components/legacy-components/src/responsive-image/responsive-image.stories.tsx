import type { Meta, StoryObj } from '@storybook/react'
import ResponsiveImage from '.'

const src = 'https://picsum.photos/seed/storybook/800/600'

const meta: Meta<typeof ResponsiveImage> = {
  title: 'Legacy/Molecules/ResponsiveImage',
  component: ResponsiveImage,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { src, alt: 'A sample image' },
}

export const WithDimensions: Story = {
  args: { src, alt: 'Resized to 400×300', width: 400, height: 300 },
}

export const WithFormat: Story = {
  args: { src, alt: 'Converted to WebP', width: 400, format: 'webp' },
}

export const WithQuality: Story = {
  args: { src, alt: 'Low quality (50)', width: 400, quality: '50' },
}
