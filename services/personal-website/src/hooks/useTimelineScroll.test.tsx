import React from "react"
import { render, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { utcDate } from "@alexwilson/ds-legacy-components/src/util-date"
import useTimelineScroll from "./useTimelineScroll"

type Item = { contentId: string; date: string }

// jsdom has no IntersectionObserver; capture instances so tests can drive
// visibility events directly through the observer callback.
class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  elements = new Set<Element>()
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    observers.push(this)
  }
  observe(el: Element) {
    this.elements.add(el)
  }
  unobserve(el: Element) {
    this.elements.delete(el)
  }
  disconnect() {
    this.elements.clear()
  }
}
let observers: MockIntersectionObserver[] = []

let latest: ReturnType<typeof useTimelineScroll<Item>>
function Harness({ items }: { items: Item[] }) {
  const hook = useTimelineScroll(items)
  latest = hook
  return (
    <div>
      {items.map((item) => (
        <div
          key={item.contentId}
          data-content-id={item.contentId}
          ref={hook.registerCard(item.contentId)}
        >
          {item.contentId}
        </div>
      ))}
    </div>
  )
}

const items: Item[] = [
  { contentId: "a", date: "2020-03-01T00:00:00Z" },
  { contentId: "b", date: "2021-06-15T00:00:00Z" },
  { contentId: "c", date: "2022-09-30T00:00:00Z" },
]

const entry = (target: Element, isIntersecting: boolean) =>
  ({ target, isIntersecting }) as unknown as IntersectionObserverEntry

const fire = (entries: IntersectionObserverEntry[]) => {
  const observer = observers[observers.length - 1]
  act(() => observer.callback(entries, observer as unknown as IntersectionObserver))
}

beforeEach(() => {
  observers = []
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)
  window.scrollTo = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("useTimelineScroll", () => {
  it("maps every item's date into a timeline date", () => {
    render(<Harness items={items} />)
    expect(latest.timelineDates.map((d) => d.getTime())).toEqual(
      items.map((it) => utcDate(it.date).getTime()),
    )
  })

  it("scrolls the matching card into view when a bucket is jumped to", () => {
    render(<Harness items={items} />)
    act(() => latest.jumpToDate(utcDate("2021-06-15T00:00:00Z")))
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    )
  })

  it("does nothing when no card matches the jumped bucket", () => {
    render(<Harness items={items} />)
    act(() => latest.jumpToDate(utcDate("1999-01-01T00:00:00Z")))
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it("reports the visible range spanning the cards on screen", () => {
    const { container } = render(<Harness items={items} />)
    const el = (id: string) =>
      container.querySelector(`[data-content-id="${id}"]`) as Element
    fire([entry(el("a"), true), entry(el("c"), true)])
    expect(latest.visibleRange).toEqual([
      utcDate("2020-03-01T00:00:00Z"),
      utcDate("2022-09-30T00:00:00Z"),
    ])
  })

  it("clears the visible range once every card leaves the viewport", () => {
    const { container } = render(<Harness items={items} />)
    const el = (id: string) =>
      container.querySelector(`[data-content-id="${id}"]`) as Element
    fire([entry(el("b"), true)])
    expect(latest.visibleRange).toEqual([
      utcDate("2021-06-15T00:00:00Z"),
      utcDate("2021-06-15T00:00:00Z"),
    ])
    fire([entry(el("b"), false)])
    expect(latest.visibleRange).toBeNull()
  })
})
