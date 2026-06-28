import React, { useEffect, useMemo, useState } from "react"
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom"

import Stream from "@alexwilson/ds-legacy-components/src/stream"

import { FeedList } from "../components/feed-list"
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
        entries={visible}
        readIds={readIds}
        restoreKey={`feed:${feedId}:${unreadOnly ? 1 : 0}`}
        onOpen={(id) => setRead(id, true)}
        onToggle={setRead}
        empty="No posts."
      />
    </Stream>
  )
}
