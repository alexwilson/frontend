import { useMemo } from "react"

type Topic = { topicId: string; topic: string; slug?: string }
type StreamItem = { topics?: Topic[] }

export default function useStreamTopics<T extends StreamItem>(items: T[]) {
  return useMemo(() => {
    const seen = new Map<string, Topic>()
    items.forEach((n) => {
      ;(n.topics || []).forEach((t) => {
        if (!seen.has(t.topicId)) seen.set(t.topicId, t)
      })
    })
    return [...seen.values()].sort((a, b) => a.topic.localeCompare(b.topic))
  }, [items])
}
