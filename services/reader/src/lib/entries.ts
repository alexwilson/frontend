export type FeedEntry = {
  id: string
  feedId?: string | null
  feedTitle?: string | null
  title: string | null
  url: string
  publishedAt: string
  summary: string | null
  readingMinutes: number | null
  sentimentLabel: string | null
}

export const byPublishedDesc = (a: FeedEntry, b: FeedEntry) =>
  Date.parse(b.publishedAt) - Date.parse(a.publishedAt)

const RELATIVE_TIME = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
]

export const relativeTime = (iso: string) => {
  const diff = Date.parse(iso) - Date.now()
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) {
      return RELATIVE_TIME.format(Math.round(diff / ms), unit)
    }
  }
  return "just now"
}
