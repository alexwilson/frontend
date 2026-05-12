import React from 'react'
import ResponsiveImage from '.'

const src = 'https://picsum.photos/seed/storybook/800/600'

export default {
  title: 'Legacy/Molecules/ResponsiveImage',
  component: ResponsiveImage,
  parameters: { layout: 'centered' },
}

export const Default = {
  args: { src, alt: 'A sample image' },
}

export const WithDimensions = {
  args: { src, alt: 'Resized to 400×300', width: 400, height: 300 },
}

export const WithFormat = {
  args: { src, alt: 'Converted to WebP', width: 400, format: 'webp' },
}

export const WithQuality = {
  args: { src, alt: 'Low quality (50)', width: 400, quality: 50 },
}
