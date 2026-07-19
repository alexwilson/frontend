import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLoaderData, useRevalidator } from "react-router-dom"

import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters, {
  FilterSection,
} from "@alexwilson/ds-legacy-components/src/stream-filters"
import TimelineScroll, {
  TimelineLevel,
  bucketKey,
} from "@alexwilson/ds-legacy-components/src/timeline-scroll"
import { utcDate } from "@alexwilson/ds-legacy-components/src/util-date"

import { FeedList, FeedListHandle } from "../components/feed-list"
import { FeedEntry, byPublishedDesc, relativeTime } from "../lib/entries"
import { useReadState } from "../lib/read-state"
import { getIndex, getRiver, type Feed, type Index, type River } from "../lib/api"
import { refreshToken } from "../lib/auth"
import { invalidate, swr } from "../lib/cache"

const REFRESH_MS = 5 * 60_000

const ALL = "all"
type View = "firehose" | "slow"

// "Slow" ordering: score each post by recency × rarity (1 / sqrt(postsPerWeek))
// and sort descending, so quiet feeds surface without stale posts topping the
// list. "Firehose" is plain recency.
const HALFLIFE_DAYS = 10

const slowOrder = (entries: FeedEntry[], postsPerWeek: Map<string, number>) => {
  const now = Date.now()
  const scored = entries.map((entry) => {
    const ageDays = Math.max(0, (now - Date.parse(entry.publishedAt)) / 86_400_000)
    const recency = Math.exp(-ageDays / HALFLIFE_DAYS)
    const freq = Math.max(0.1, postsPerWeek.get(entry.feedId ?? "") ?? 1)
    return { entry, score: recency / Math.sqrt(freq) }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.map((s) => s.entry)
}

export async function readerLoader() {
  const [river, index] = await Promise.all([swr("river", getRiver), swr("index", getIndex)])
  return { river, index }
}

export function ReaderRoute() {
  const { river, index } = useLoaderData() as { river: River; index: Index }
  const revalidator = useRevalidator()

  useEffect(() => {
    document.title = "Reader"
  }, [])

  // Background refresh as a revalidation (not a navigation) so the page stays put.
  useEffect(() => {
    const id = window.setInterval(() => {
      invalidate("river")
      refreshToken().then(() => revalidator.revalidate())
    }, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [revalidator])

  return (
    <ReaderView
      entries={river.entries ?? []}
      feeds={index.feeds ?? []}
      generatedAt={river.generatedAt}
    />
  )
}

type ReaderViewProps = {
  entries: FeedEntry[]
  feeds: Feed[]
  generatedAt: string | null
}

function ReaderView({ entries, feeds, generatedAt }: ReaderViewProps) {
  const river = useMemo(() => [...entries].sort(byPublishedDesc), [entries])

  // Only feeds present in the firehose — empty ones are just filter noise.
  const presentFeedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const entry of river) if (entry.feedId) ids.add(entry.feedId)
    return ids
  }, [river])
  const presentFeeds = useMemo(
    () => feeds.filter((f) => presentFeedIds.has(f.id)),
    [feeds, presentFeedIds],
  )

  const feedFolders = useMemo(
    () => new Map(feeds.map((f) => [f.id, f.folders ?? []])),
    [feeds],
  )
  const feedFreq = useMemo(
    () => new Map(feeds.map((f) => [f.id, f.postsPerWeek ?? Infinity])),
    [feeds],
  )
  const sources = useMemo(
    () =>
      presentFeeds
        .map((f) => ({ id: f.id, title: f.title ?? f.id }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [presentFeeds],
  )
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const feed of presentFeeds) for (const c of feed.folders ?? []) set.add(c)
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [presentFeeds])

  const { readIds, setRead, markRead } = useReadState()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [source, setSource] = useState<string>(ALL)
  const [category, setCategory] = useState<string>(ALL)
  const [view, setView] = useState<View>("firehose")
  const [showSummary, setShowSummary] = useState(true)

  // Filters live in the URL (Back / reload / share restores them).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("view") === "slow") setView("slow")
    const s = params.get("source")
    if (s) setSource(s)
    const c = params.get("category")
    if (c) setCategory(c)
    if (params.get("unread") === "1") setUnreadOnly(true)
    setShowSummary(window.localStorage.getItem("reader:summaries") !== "off")
  }, [])

  const updateParam = useCallback((key: string, value: string, fallback: string) => {
    const url = new URL(window.location.href)
    if (value === fallback) url.searchParams.delete(key)
    else url.searchParams.set(key, value)
    window.history.replaceState(null, "", url)
  }, [])

  const changeView = useCallback(
    (next: View) => {
      setView(next)
      updateParam("view", next, "firehose")
    },
    [updateParam],
  )
  const changeSource = useCallback(
    (next: string) => {
      setSource(next)
      updateParam("source", next, ALL)
    },
    [updateParam],
  )
  const changeCategory = useCallback(
    (next: string) => {
      setCategory(next)
      updateParam("category", next, ALL)
    },
    [updateParam],
  )
  const changeUnreadOnly = useCallback(
    (next: boolean) => {
      setUnreadOnly(next)
      updateParam("unread", next ? "1" : "0", "0")
    },
    [updateParam],
  )

  const toggleSummary = useCallback(() => {
    setShowSummary((prev) => {
      const next = !prev
      window.localStorage.setItem("reader:summaries", next ? "on" : "off")
      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    changeSource(ALL)
    changeCategory(ALL)
    changeUnreadOnly(false)
  }, [changeSource, changeCategory, changeUnreadOnly])

  const matches = useCallback(
    (entry: FeedEntry) => {
      if (source !== ALL && entry.feedId !== source) return false
      if (category !== ALL) {
        const folders = entry.feedId ? feedFolders.get(entry.feedId) ?? [] : []
        if (!folders.includes(category)) return false
      }
      return true
    },
    [source, category, feedFolders],
  )

  const arranged = useMemo(() => {
    const filtered = river.filter(matches)
    return view === "slow" ? slowOrder(filtered, feedFreq) : filtered
  }, [river, matches, view, feedFreq])

  const visible = useMemo(
    () => (unreadOnly ? arranged.filter((e) => !readIds.has(e.id)) : arranged),
    [arranged, unreadOnly, readIds],
  )
  const unreadCount = useMemo(
    () => arranged.filter((e) => !readIds.has(e.id)).length,
    [arranged, readIds],
  )

  // Timeline rail: track which entries are on screen and let the rail jump to a
  // date. Virtuoso's rendered range is reverse-chronological, so startIndex is
  // the newest visible entry and endIndex the oldest.
  const listRef = useRef<FeedListHandle>(null)
  const [range, setRange] = useState<{ startIndex: number; endIndex: number } | null>(null)
  const [level, setLevel] = useState<TimelineLevel>("day")

  const timelineDates = useMemo(
    () => visible.map((e) => utcDate(e.publishedAt)),
    [visible],
  )
  const visibleRange = useMemo<[Date, Date] | null>(() => {
    if (!range || visible.length === 0) return null
    const newest = visible[Math.min(range.startIndex, visible.length - 1)]
    const oldest = visible[Math.min(range.endIndex, visible.length - 1)]
    if (!newest || !oldest) return null
    return [utcDate(oldest.publishedAt), utcDate(newest.publishedAt)]
  }, [range, visible])

  const jumpToDate = useCallback(
    (date: Date) => {
      const target = bucketKey(date, level)
      const idx = visible.findIndex(
        (e) => bucketKey(utcDate(e.publishedAt), level) === target,
      )
      if (idx >= 0) listRef.current?.scrollToIndex(idx)
    },
    [visible, level],
  )

  const unreadTotal = useMemo(
    () => river.filter((e) => !readIds.has(e.id)).length,
    [river, readIds],
  )
  const unreadBySource = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of river) {
      if (readIds.has(entry.id) || !entry.feedId) continue
      counts.set(entry.feedId, (counts.get(entry.feedId) ?? 0) + 1)
    }
    return counts
  }, [river, readIds])
  const unreadByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of river) {
      if (readIds.has(entry.id) || !entry.feedId) continue
      for (const c of feedFolders.get(entry.feedId) ?? []) {
        counts.set(c, (counts.get(c) ?? 0) + 1)
      }
    }
    return counts
  }, [river, readIds, feedFolders])

  const sections = useMemo<FilterSection[]>(
    () => [
      {
        title: "Sources",
        selected: [source],
        onSelect: changeSource,
        options: [
          { id: ALL, label: "All sources", count: unreadTotal },
          ...sources.map((s) => ({
            id: s.id,
            label: s.title,
            count: unreadBySource.get(s.id) ?? 0,
          })),
        ],
      },
      {
        title: "Categories",
        selected: [category],
        onSelect: changeCategory,
        options: [
          { id: ALL, label: "All categories", count: unreadTotal },
          ...categories.map((c) => ({
            id: c,
            label: c,
            count: unreadByCategory.get(c) ?? 0,
          })),
        ],
      },
    ],
    [
      sources,
      categories,
      source,
      category,
      unreadTotal,
      unreadBySource,
      unreadByCategory,
      changeSource,
      changeCategory,
    ],
  )

  const filtersActive = source !== ALL || category !== ALL || unreadOnly

  return (
    <Stream
      className="reader-stream"
      header={
        <div className="reader-toolbar">
          <h1>{view === "slow" ? "Slow" : "Firehose"}</h1>
          <h4 className="reader-toolbar__count">{unreadCount} unread</h4>
          {generatedAt && (
            <span className="reader-updated" suppressHydrationWarning>
              Updated {relativeTime(generatedAt)}
            </span>
          )}
          <div className="reader-tabs" role="group" aria-label="View">
            <button
              type="button"
              aria-pressed={view === "firehose"}
              className={view === "firehose" ? "is-active" : undefined}
              onClick={() => changeView("firehose")}
            >
              Firehose
            </button>
            <button
              type="button"
              aria-pressed={view === "slow"}
              className={view === "slow" ? "is-active" : undefined}
              onClick={() => changeView("slow")}
            >
              Slow
            </button>
          </div>
        </div>
      }
      sidebar={
        <>
          <details className="reader-calendar">
            <summary className="reader-calendar__summary">Calendar</summary>
            <TimelineScroll
              dates={timelineDates}
              visibleRange={visibleRange}
              onJump={jumpToDate}
              level={level}
              onLevelChange={setLevel}
            />
          </details>
          <StreamFilters sections={sections} />
          <label className="reader-filter__toggle">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => changeUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>
          <label className="reader-filter__toggle">
            <input type="checkbox" checked={showSummary} onChange={toggleSummary} />
            Show summaries
          </label>
          {filtersActive && (
            <button className="alex-stream__filter-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
          <button
            className="alex-stream__filter-clear"
            onClick={() => markRead(arranged.map((e) => e.id))}
          >
            Mark all read
          </button>
        </>
      }
    >
      <FeedList
        ref={listRef}
        entries={visible}
        readIds={readIds}
        showSummary={showSummary}
        restoreKey={`${view}:${source}:${category}:${unreadOnly ? 1 : 0}`}
        onOpen={(id) => setRead(id, true)}
        onToggle={setRead}
        onRangeChange={setRange}
      />
    </Stream>
  )
}
