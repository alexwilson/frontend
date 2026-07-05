import { renderHook } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import useStreamTopics from "./useStreamTopics"

const topic = (topicId: string, name: string, slug = name.toLowerCase()) => ({
  topicId,
  topic: name,
  slug,
})

describe("useStreamTopics", () => {
  it("dedupes topics shared across items and sorts alphabetically", () => {
    const items = [
      { topics: [topic("t-react", "React"), topic("t-arch", "Architecture")] },
      { topics: [topic("t-react", "React"), topic("t-testing", "Testing")] },
    ]
    const { result } = renderHook(() => useStreamTopics(items))
    expect(result.current.map((t) => t.topic)).toEqual([
      "Architecture",
      "React",
      "Testing",
    ])
  })

  it("keeps the first-seen instance of a duplicated topicId", () => {
    const items = [
      { topics: [topic("t-react", "React", "react")] },
      { topics: [topic("t-react", "React", "react-alias")] },
    ]
    const { result } = renderHook(() => useStreamTopics(items))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].slug).toBe("react")
  })

  it("ignores items with no topics", () => {
    const items = [{ date: "x" }, { topics: [topic("t-a", "Alpha")] }, {}]
    const { result } = renderHook(() => useStreamTopics(items))
    expect(result.current.map((t) => t.topic)).toEqual(["Alpha"])
  })

  it("returns a stable reference while items are unchanged", () => {
    const items = [{ topics: [topic("t-a", "Alpha")] }]
    const { result, rerender } = renderHook(() => useStreamTopics(items))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
