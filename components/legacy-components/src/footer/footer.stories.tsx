import type { Meta, StoryObj } from '@storybook/react'
import Footer from '.'

const meta: Meta<typeof Footer> = {
  title: 'Legacy/Organisms/Footer',
  component: Footer,
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
