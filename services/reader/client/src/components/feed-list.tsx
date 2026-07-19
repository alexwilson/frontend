import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react"
import { Virtuoso, VirtuosoHandle } from "react-virtuoso"
import { FeedEntry } from "../lib/entries"
import { loadSnapshot, saveSnapshot } from "../lib/scroll-state"
import { ReaderItem } from "./reader-item"

export type FeedListHandle = { scrollToIndex: (index: number) => void }

type Props = {
  entries: FeedEntry[]
  readIds: Set<string>
  showSummary?: boolean
  restoreKey?: string
  onOpen: (id: string) => void
  onToggle: (id: string, read: boolean) => void
  onRangeChange?: (range: { startIndex: number; endIndex: number }) => void
  empty?: string
}

export const FeedList = forwardRef<FeedListHandle, Props>(function FeedList(
  {
    entries,
    readIds,
    showSummary = true,
    restoreKey,
    onOpen,
    onToggle,
    onRangeChange,
    empty = "Nothing to read.",
  },
  handle,
) {
  const ref = useRef<VirtuosoHandle>(null)
  useImperativeHandle(
    handle,
    () => ({
      scrollToIndex: (index) =>
        ref.current?.scrollToIndex({ index, align: "start", behavior: "smooth" }),
    }),
    [],
  )
  // Snapshot for this filter/view, read once so Virtuoso can restore scroll.
  const initialState = useMemo(() => loadSnapshot(restoreKey), [restoreKey])

  // With no snapshot (forward nav / new filter) start at the top. On unmount
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
      rangeChanged={onRangeChange}
      // A restored scroll snapshot can reference indices past a now-shorter list
      // (different/stale capture), so tolerate an out-of-range entry rather than
      // crash; Virtuoso self-corrects on the next layout.
      computeItemKey={(index, entry) => entry?.id ?? index}
      itemContent={(_index, entry) =>
        entry ? (
          <ReaderItem
            entry={entry}
            read={readIds.has(entry.id)}
            showSummary={showSummary}
            onOpen={onOpen}
            onToggle={onToggle}
          />
        ) : null
      }
    />
  )
})

export default FeedList
