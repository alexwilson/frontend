import { format, startOfDay, startOfMonth, startOfYear } from "date-fns"

export type TimelineLevel = "day" | "month" | "year"

export type TimelineBucket = {
  key: string
  date: Date
  count: number
}

const KEY_FORMAT: Record<TimelineLevel, string> = {
  day: "yyyy-MM-dd",
  month: "yyyy-MM",
  year: "yyyy",
}

const START_OF: Record<TimelineLevel, (date: Date) => Date> = {
  day: startOfDay,
  month: startOfMonth,
  year: startOfYear,
}

export const bucketKey = (date: Date, level: TimelineLevel): string =>
  format(date, KEY_FORMAT[level])

export const bucketStart = (date: Date, level: TimelineLevel): Date =>
  START_OF[level](date)

// Newest-first, to mirror the reader's reverse-chronological feed.
export const buildBuckets = (dates: Date[], level: TimelineLevel): TimelineBucket[] => {
  const byKey = new Map<string, TimelineBucket>()
  for (const date of dates) {
    const key = bucketKey(date, level)
    const existing = byKey.get(key)
    if (existing) existing.count += 1
    else byKey.set(key, { key, date: bucketStart(date, level), count: 1 })
  }
  return [...byKey.values()].sort((a, b) => b.date.getTime() - a.date.getTime())
}

// visibleRange is [oldest, newest]; reduced to the bucket keys at its endpoints.
// Fixed-width keys (yyyy-MM-dd etc.) compare lexicographically in date order, so
// a bucket is highlighted when lo <= key <= hi.
export type ActiveRange = { lo: string; hi: string }

export const activeRange = (
  visibleRange: [Date, Date] | null,
  level: TimelineLevel,
): ActiveRange | null => {
  if (!visibleRange) return null
  const [oldest, newest] = visibleRange
  return { lo: bucketKey(oldest, level), hi: bucketKey(newest, level) }
}

export const isActive = (key: string, range: ActiveRange | null): boolean =>
  !!range && key >= range.lo && key <= range.hi

export const detectLevels = (dates: Date[]): TimelineLevel[] => {
  const months = new Set<string>()
  const years = new Set<string>()
  for (const date of dates) {
    months.add(bucketKey(date, "month"))
    years.add(bucketKey(date, "year"))
  }
  const levels: TimelineLevel[] = ["day"]
  if (months.size > 1) levels.push("month")
  if (years.size > 1) levels.push("year")
  return levels
}
