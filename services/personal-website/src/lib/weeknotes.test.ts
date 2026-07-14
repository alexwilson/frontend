import { describe, it, expect } from "vitest"
import { isWeeknote, selectWeeknoteNavigation, type Article } from "./weeknotes"

const topic = (name: string) => ({
  topicId: `t-${name}`,
  topic: name,
  slug: `/topic/${name}`,
})

const article = (
  contentId: string,
  date: string,
  topics: string[] = [],
): Article => ({
  contentId,
  slug: `/${contentId}`,
  date,
  title: contentId,
  topics: topics.map(topic),
})

const weeknote = (contentId: string, date: string, extra: string[] = []) =>
  article(contentId, date, ["weeknotes", ...extra])

// Newest first, as the GraphQL query returns them.
const wk5 = weeknote("wk5", "2026-02-01")
const wk4 = weeknote("wk4", "2026-01-25")
const wk3 = weeknote("wk3", "2026-01-18")
const wk2 = weeknote("wk2", "2026-01-11")
const wk1 = weeknote("wk1", "2026-01-04")
const essay = article("essay", "2026-01-20", ["cooking"])
const articles = [wk5, wk4, essay, wk3, wk2, wk1]

describe("isWeeknote", () => {
  it("matches on the weeknotes topic", () => {
    expect(isWeeknote(wk1)).toBe(true)
    expect(isWeeknote(essay)).toBe(false)
  })
})

describe("selectWeeknoteNavigation", () => {
  it("returns nothing when the current article is not a weeknote", () => {
    expect(selectWeeknoteNavigation(articles, essay)).toEqual({
      previous: null,
      next: null,
      latest: null,
    })
  })

  it("returns previous, next and latest for a weeknote mid-series", () => {
    expect(selectWeeknoteNavigation(articles, wk2)).toEqual({
      previous: wk1,
      next: wk3,
      latest: wk5,
    })
  })

  it("ignores non-weeknotes when finding neighbours", () => {
    // `essay` sits between wk3 and wk4 by date, but must not become a neighbour.
    expect(selectWeeknoteNavigation(articles, wk3)).toMatchObject({
      previous: wk2,
      next: wk4,
    })
  })

  it("omits next and latest on the newest weeknote, so both grey out", () => {
    expect(selectWeeknoteNavigation(articles, wk5)).toEqual({
      previous: wk4,
      next: null,
      latest: null,
    })
  })

  it("keeps latest live on the second-newest, even though it is also next", () => {
    expect(selectWeeknoteNavigation(articles, wk4)).toEqual({
      previous: wk3,
      next: wk5,
      latest: wk5,
    })
  })

  it("omits previous on the oldest weeknote", () => {
    expect(selectWeeknoteNavigation(articles, wk1)).toEqual({
      previous: null,
      next: wk2,
      latest: wk5,
    })
  })

  it("returns nothing when the current weeknote is absent from the list", () => {
    const orphan = weeknote("orphan", "2026-03-01")
    expect(selectWeeknoteNavigation(articles, orphan)).toEqual({
      previous: null,
      next: null,
      latest: null,
    })
  })
})
