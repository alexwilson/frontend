import React, { useEffect, useMemo, useRef } from "react"
import { Virtuoso, VirtuosoHandle } from "react-virtuoso"
import { FeedEntry } from "../lib/entries"
import { loadSnapshot, saveSnapshot } from "../lib/scroll-state"
import { ReaderItem } from "./reader-item"

type Props = {
  entries: FeedEntry[]
  readIds: Set<string>
  showSummary?: boolean
  restoreKey?: string
  onOpen: (id: string) => void
  onToggle: (id: string, read: boolean) => void
  empty?: string
}

export const FeedList = ({
  entries,
  readIds,
  showSummary = true,
  restoreKey,
  onOpen,
  onToggle,
  empty = "Nothing to read.",
}: Props) => {
  const ref = useRef<VirtuosoHandle>(null)
  // Snapshot for this filter/view, read once so Virtuoso can restore scroll.
  const initialState = useMemo(() => loadSnapshot(restoreKey), [restoreKey])

  // With no snapshot (forward nav / new filter) start at the top — Gatsby's
  // scroll handling is disabled for these pages (see gatsby-browser). On unmount
  // capture the position so returning restores it (getState is synchronous).
  useEffect(() => {
    if (!initialState && typeof window !== "undefined") window.scrollTo(0, 0)
    return () => {
      ref.current?.getState((s) => saveSnapshot(restoreKey, s))
    }
  }, [restoreKey, initialState])

  if (entries.length === 0) return <p className="reader-status">{empty}</p>

  return (
    <Virtuoso
      ref={ref}
      useWindowScroll
      data={entries}
      restoreStateFrom={initialState}
      initialItemCount={Math.min(8, entries.length)}
      computeItemKey={(_index, entry) => entry.id}
      itemContent={(_index, entry) => (
        <ReaderItem
          entry={entry}
          read={readIds.has(entry.id)}
          showSummary={showSummary}
          onOpen={onOpen}
          onToggle={onToggle}
        />
      )}
    />
  )
}

export default FeedList
