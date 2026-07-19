import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom"

import Stream from "@alexwilson/ds-legacy-components/src/stream"
import TimelineScroll, {
  TimelineLevel,
  bucketKey,
} from "@alexwilson/ds-legacy-components/src/timeline-scroll"
import { utcDate } from "@alexwilson/ds-legacy-components/src/util-date"

import { FeedList, FeedListHandle } from "../components/feed-list"
import { byPublishedDesc, type FeedEntry } from "../lib/entries"
import { useReadState } from "../lib/read-state"
import { getFeed, getIndex, type Index } from "../lib/api"
import { swr } from "../lib/cache"

export async function feedLoader({ params }: LoaderFunctionArgs) {
  const id = params.feedId ?? ""
  const [entries, index] = await Promise.all([
    swr(`feed:${id}`, () => getFeed(id)),
    swr("index", getIndex),
  ])
  return { entries, index, feedId: id }
}

export function FeedRoute() {
  const { entries, index, feedId } = useLoaderData() as {
    entries: FeedEntry[]
    index: Index
    feedId: string
  }
  const title = index.feeds.find((f) => f.id === feedId)?.title ?? feedId

  useEffect(() => {
    document.title = title
  }, [title])

  return <FeedView feedId={feedId} title={title} entries={entries} />
}

function FeedView({
  feedId,
  title,
  entries: raw,
}: {
  feedId: string
  title: string
  entries: FeedEntry[]
}) {
  const entries = useMemo(() => [...raw].sort(byPublishedDesc), [raw])

  const { readIds, setRead, markRead } = useReadState()
  const [unreadOnly, setUnreadOnly] = useState(false)

  const visible = useMemo(
    () => (unreadOnly ? entries.filter((e) => !readIds.has(e.id)) : entries),
    [entries, readIds, unreadOnly],
  )
  const unread = useMemo(
    () => entries.filter((e) => !readIds.has(e.id)).length,
    [entries, readIds],
  )

  // Calendar rail: track the on-screen range and jump to a clicked date. The
  // feed is reverse-chronological, so startIndex is newest and endIndex oldest.
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

  return (
    <Stream
      className="reader-stream"
      header={
        <div className="reader-toolbar">
          <h1>{title}</h1>
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
          <p className="reader-sidebar-count">{unread} unread</p>
          <label className="reader-filter__toggle">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>
          <button
            className="alex-stream__filter-clear"
            onClick={() => markRead(entries.map((e) => e.id))}
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
        restoreKey={`feed:${feedId}:${unreadOnly ? 1 : 0}`}
        onOpen={(id) => setRead(id, true)}
        onToggle={setRead}
        onRangeChange={setRange}
        empty="No posts."
      />
    </Stream>
  )
}
