import React from "react"
import { Link } from "react-router-dom"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import { FeedEntry } from "../lib/entries"

const SENTIMENT_EMOJI: Record<string, string> = {
  positive: "🙂",
  neutral: "😐",
  negative: "🙁",
}

type Props = {
  entry: FeedEntry
  read: boolean
  showSummary?: boolean
  onOpen: (id: string) => void
  onToggle: (id: string, read: boolean) => void
}

// Memoised so a read-state change re-renders only the affected row. Combined
// with virtualisation, interaction stays cheap regardless of list length.
export const ReaderItem = React.memo(function ReaderItem({
  entry,
  read,
  showSummary = true,
  onOpen,
  onToggle,
}: Props) {
  const emoji = entry.sentimentLabel
    ? SENTIMENT_EMOJI[entry.sentimentLabel]
    : undefined
  const hasMeta = entry.readingMinutes != null || emoji

  return (
    <div
      className="reader-item"
      data-read={read}
      onClick={() => onOpen(entry.id)}
    >
      <div className="reader-item__bar">
        {entry.feedTitle && entry.feedId ? (
          <Link
            to={`/feed/${entry.feedId}`}
            className="reader-item__source"
            onClick={(event) => event.stopPropagation()}
          >
            {entry.feedTitle}
          </Link>
        ) : entry.feedTitle ? (
          <span className="reader-item__source">{entry.feedTitle}</span>
        ) : null}
        {hasMeta && (
          <span className="reader-item__meta">
            {entry.readingMinutes != null && (
              <span>{entry.readingMinutes} min read</span>
            )}
            {emoji && (
              <span
                className="reader-item__sentiment"
                role="img"
                aria-label={entry.sentimentLabel ?? undefined}
                title={entry.sentimentLabel ?? undefined}
              >
                {emoji}
              </span>
            )}
          </span>
        )}
        <button
          type="button"
          className="reader-item__toggle"
          onClick={(event) => {
            event.stopPropagation()
            onToggle(entry.id, !read)
          }}
        >
          {read ? "Mark unread" : "Mark read"}
        </button>
      </div>
      <ArticleCard
        article={{
          title: entry.title ?? "(untitled)",
          url: entry.url,
          date: entry.publishedAt,
          content: entry.summary ? { excerpt: entry.summary } : null,
        }}
        withImage={false}
        withBody={showSummary}
        newTab
      />
    </div>
  )
})

export default ReaderItem
