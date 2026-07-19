import type { Meta, StoryObj } from '@storybook/react'
import WeeknoteNavigation from '.'

const previous = {
  contentId: '1',
  title: 'Weeknotes: Battery — Week 12, 2026',
  slug: '/blog/weeknotes-week-12-2026',
  date: '2026-03-22',
}

const next = {
  contentId: '2',
  title: 'Weeknotes: Sweet Amber — Week 14, 2026',
  slug: '/blog/weeknotes-week-14-2026',
  date: '2026-04-05',
}

const meta: Meta<typeof WeeknoteNavigation> = {
  title: 'Legacy/Organisms/WeeknoteNavigation',
  component: WeeknoteNavigation,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof meta>

// Mid-series: both directions have somewhere to go.
export const Default: Story = {
  args: { previous, next },
}

// The newest weeknote: nothing newer exists, so only Previous renders.
export const NewestWeeknote: Story = {
  args: { previous, next: null },
}

// The oldest weeknote: nothing older exists, so only Next renders.
export const OldestWeeknote: Story = {
  args: { previous: null, next },
}

// Not a weeknote: renders nothing at all.
export const Empty: Story = {
  args: { previous: null, next: null },
}
