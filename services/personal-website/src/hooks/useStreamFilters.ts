import { useState, useMemo } from "react"

type Topic = { topicId: string; topic: string; slug?: string }
type StreamItem = { date: string; topics?: Topic[] }

export default function useStreamFilters<T extends StreamItem>(items: T[]) {
  const [selectedYears, setSelectedYears] = useState<number[]>([])

  const years = useMemo(
    () =>
      [...new Set(items.map((n) => new Date(n.date).getFullYear()))].sort(
        (a, b) => b - a,
      ),
    [items],
  )

  const topics = useMemo(() => {
    const seen = new Map<string, Topic>()
    items.forEach((n) => {
      ;(n.topics || []).forEach((t) => {
        if (!seen.has(t.topicId)) seen.set(t.topicId, t)
      })
    })
    return [...seen.values()].sort((a, b) => a.topic.localeCompare(b.topic))
  }, [items])

  const toggleYear = (year: number) =>
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
    )

  const filteredItems = useMemo(
    () =>
      items.filter(
        (n) =>
          selectedYears.length === 0 ||
          selectedYears.includes(new Date(n.date).getFullYear()),
      ),
    [items, selectedYears],
  )

  return {
    selectedYears,
    years,
    topics,
    toggleYear,
    filteredItems,
    clearYears: () => setSelectedYears([]),
  }
}
