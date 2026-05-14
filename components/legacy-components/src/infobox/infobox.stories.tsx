import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Infobox from '.'

const meta: Meta<typeof Infobox> = {
  title: 'Legacy/Molecules/Infobox',
  component: Infobox,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Infobox>
      <p><strong>Stay up to date</strong></p>
      <ul>
        <li className="bullet--rss">Subscribe via RSS</li>
        <li className="bullet--email">Subscribe by email</li>
        <li className="bullet--twitter">Follow on Twitter</li>
      </ul>
    </Infobox>
  ),
}

export const TextOnly: Story = {
  render: () => (
    <Infobox>
      <p><strong>Note:</strong> This article was originally published in 2019 and may contain outdated information.</p>
    </Infobox>
  ),
}
