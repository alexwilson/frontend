import type { Meta, StoryObj } from "@storybook/react"
import { subDays } from "date-fns"
import React from "react"
import TimelineScroll from "."

const today = new Date()
const dates = [
  ...Array.from({ length: 200 }, (_, i) => subDays(today, Math.floor(i / 3))),
  ...Array.from({ length: 120 }, (_, i) => subDays(today, 70 + i * 7)),
]

const meta: Meta<typeof TimelineScroll> = {
  title: "Legacy/Molecules/TimelineScroll",
  component: TimelineScroll,
  args: {
    dates,
    visibleRange: [subDays(today, 12), subDays(today, 7)],
    onJump: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ height: "80vh", width: "16rem" }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Levels auto-detect from the content.
export const Days: Story = {}
export const Months: Story = { args: { defaultLevel: "month" } }
export const Years: Story = { args: { defaultLevel: "year" } }

// A short span auto-detects to Days only (no switcher).
export const SingleMonth: Story = {
  args: { dates: Array.from({ length: 40 }, (_, i) => subDays(today, i)) },
}

// An explicit `levels` forces them regardless of content.
export const ForcedLevels: Story = {
  args: { levels: ["month", "year"], defaultLevel: "month" },
}
