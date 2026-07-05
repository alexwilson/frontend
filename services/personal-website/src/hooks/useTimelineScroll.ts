import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  TimelineLevel,
  bucketKey,
} from "@alexwilson/ds-legacy-components/src/timeline-scroll"
import { utcDate } from "@alexwilson/ds-legacy-components/src/util-date"

type TimelineItem = { contentId: string; date: string }

export default function useTimelineScroll<T extends TimelineItem>(items: T[]) {
  const cardRefs = useRef(new Map<string, HTMLDivElement>())
  const [level, setLevel] = useState<TimelineLevel>("day")
  const timelineDates = useMemo(
    () => items.map((node) => utcDate(node.date)),
    [items],
  )

  const jumpToDate = useCallback(
    (date: Date) => {
      const target = bucketKey(date, level)
      const match = items.find(
        (node) => bucketKey(utcDate(node.date), level) === target,
      )
      const el = match && cardRefs.current.get(match.contentId)
      if (!el) return
      const header = document.querySelector(".alex-header")
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0
      const top =
        el.getBoundingClientRect().top + window.scrollY - headerBottom - 16
      window.scrollTo({ top, behavior: "smooth" })
    },
    [items, level],
  )

  const [visibleRange, setVisibleRange] = useState<[Date, Date] | null>(null)
  const dateById = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((node) =>
      map.set(node.contentId, utcDate(node.date).getTime()),
    )
    return map
  }, [items])
  useEffect(() => {
    const onScreen = new Set<string>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.contentId
        if (!id) continue
        if (entry.isIntersecting) onScreen.add(id)
        else onScreen.delete(id)
      }
      let lo = Infinity
      let hi = -Infinity
      onScreen.forEach((id) => {
        const time = dateById.get(id)
        if (time === undefined) return
        if (time < lo) lo = time
        if (time > hi) hi = time
      })
      setVisibleRange(lo <= hi ? [new Date(lo), new Date(hi)] : null)
    })
    cardRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [dateById])

  const registerCard = useCallback(
    (contentId: string) => (el: HTMLDivElement | null) => {
      if (el) cardRefs.current.set(contentId, el)
      else cardRefs.current.delete(contentId)
    },
    [],
  )

  return {
    level,
    setLevel,
    timelineDates,
    visibleRange,
    jumpToDate,
    registerCard,
  }
}
