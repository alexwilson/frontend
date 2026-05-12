import { useState, useMemo } from "react"

export default function useStreamFilters(items) {
  const [selectedYears, setSelectedYears] = useState([])

  const years = useMemo(() =>
    [...new Set(items.map(n => new Date(n.date).getFullYear()))].sort((a, b) => b - a),
    [items]
  )

  const topics = useMemo(() => {
    const seen = new Map()
    items.forEach(n => {
      (n.topics || []).forEach(t => {
        if (!seen.has(t.topicId)) seen.set(t.topicId, t)
      })
    })
    return [...seen.values()].sort((a, b) => a.topic.localeCompare(b.topic))
  }, [items])

  const toggleYear = (year) => setSelectedYears(prev =>
    prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
  )

  const filteredItems = useMemo(() =>
    items.filter(n => selectedYears.length === 0 || selectedYears.includes(new Date(n.date).getFullYear())),
    [items, selectedYears]
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
