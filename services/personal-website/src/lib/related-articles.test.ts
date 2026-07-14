import { describe, it, expect } from "vitest"
import { selectRelatedArticles } from "./related-articles"
import { isWeeknote, type Article } from "./weeknotes"

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

const ids = (articles: Article[]) => articles.map((a) => a.contentId)

describe("selectRelatedArticles on a weeknote", () => {
  it("leads with the latest weeknote, then recommends no other weeknote", () => {
    const current = weeknote("wk3", "2026-01-18")
    const articles = [
      weeknote("wk5", "2026-02-01"),
      weeknote("wk4", "2026-01-25"),
      current,
      article("essay", "2025-06-01", ["cooking"]),
      weeknote("wk2", "2026-01-11"),
    ]

    // wk5 is the latest; wk4 and wk2 are weeknotes and must not be recommended.
    expect(ids(selectRelatedArticles(articles, current))).toEqual([
      "wk5",
      "essay",
    ])
  })

  it("fills behind the latest weeknote with topically similar posts first", () => {
    const current = weeknote("wk3", "2026-01-18", ["cooking"])
    const articles = [
      weeknote("wk4", "2026-01-25"),
      article("recent", "2026-01-20", ["kubernetes"]),
      current,
      article("cooking-post", "2024-01-01", ["cooking"]),
    ]

    // `cooking-post` is the oldest, but shares a topic, so it outranks `recent`.
    expect(ids(selectRelatedArticles(articles, current))).toEqual([
      "wk4",
      "cooking-post",
      "recent",
    ])
  })

  it("offers no latest weeknote when already on the latest one", () => {
    const current = weeknote("wk4", "2026-01-25")
    const articles = [
      current,
      article("a", "2026-01-10"),
      article("b", "2026-01-09"),
      article("c", "2026-01-08"),
      weeknote("wk3", "2026-01-18"),
    ]

    expect(ids(selectRelatedArticles(articles, current))).toEqual([
      "a",
      "b",
      "c",
    ])
  })

  it("falls back to recent non-weeknotes when there is no topical overlap", () => {
    const current = weeknote("wk3", "2026-01-18")
    const articles = [
      weeknote("wk4", "2026-01-25"),
      article("a", "2026-01-10"),
      article("b", "2026-01-09"),
      article("c", "2026-01-08"),
      article("d", "2026-01-07"),
      current,
    ]

    expect(ids(selectRelatedArticles(articles, current))).toEqual([
      "wk4",
      "a",
      "b",
    ])
  })
})

describe("selectRelatedArticles off a weeknote", () => {
  it("ranks by topic overlap, most similar first", () => {
    const current = article("current", "2026-01-18", ["aws", "kubernetes"])
    const articles = [
      article("one-topic", "2026-01-17", ["aws"]),
      article("two-topics", "2026-01-16", ["aws", "kubernetes"]),
      current,
    ]

    expect(ids(selectRelatedArticles(articles, current))).toEqual([
      "two-topics",
      "one-topic",
    ])
  })

  it("trails with the latest weeknote, behind the regular picks", () => {
    const current = article("current", "2026-01-18", ["aws"])
    const articles = [
      weeknote("wk-new", "2026-02-01"),
      article("aws-post", "2025-01-01", ["aws"]),
      article("filler", "2024-06-01"),
      current,
      weeknote("wk-old", "2025-06-01"),
    ]

    // Two regular posts lead; the newest weeknote takes the last slot.
    expect(ids(selectRelatedArticles(articles, current))).toEqual([
      "aws-post",
      "filler",
      "wk-new",
    ])
  })

  it("includes no more than one weeknote", () => {
    const current = article("current", "2026-01-18", ["aws"])
    const articles = [
      weeknote("wk-new", "2026-02-01"),
      weeknote("wk-mid", "2026-01-25"),
      article("aws-post", "2025-01-01", ["aws"]),
      current,
      weeknote("wk-old", "2025-06-01"),
    ]

    const result = selectRelatedArticles(articles, current)
    expect(result.filter(isWeeknote)).toHaveLength(1)
    expect(ids(result)).toEqual(["aws-post", "wk-new"])
  })

  it("fills every slot with regular posts when no weeknote exists", () => {
    const current = article("current", "2026-01-18", ["aws"])
    const articles = [
      current,
      article("a", "2026-01-17", ["aws"]),
      article("b", "2026-01-16", ["aws"]),
      article("c", "2026-01-15", ["aws"]),
      article("d", "2026-01-14", ["aws"]),
    ]

    expect(ids(selectRelatedArticles(articles, current))).toEqual(["a", "b", "c"])
  })
})
