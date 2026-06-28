import React, { useEffect, useMemo } from "react"
import { Link, useLoaderData } from "react-router-dom"

import Stream from "@alexwilson/ds-legacy-components/src/stream"

import { relativeTime } from "../lib/entries"
import { getIndex, type Feed, type Index } from "../lib/api"
import { swr } from "../lib/cache"

const UNCATEGORISED = "Uncategorised"

const DAY = 86_400_000
// Dormant = overdue vs the feed's own cadence, with a floor (tunable).
const DORMANT_MIN_DAYS = 14
const DORMANT_FACTOR = 4

// Posting cadence as weather; dormancy (overdue vs usual cadence) wins → ❄️.
const weather = (
  medianDays: number | null,
  postsPerWeek: number | null,
  lastPostAt: number | null,
) => {
  let days = medianDays ?? null
  if (days == null || days <= 0) {
    days = postsPerWeek != null && postsPerWeek > 0 ? 7 / postsPerWeek : null
  }
  if (days != null && lastPostAt != null) {
    const sinceDays = (Date.now() - lastPostAt) / DAY
    if (sinceDays > Math.max(DORMANT_MIN_DAYS, DORMANT_FACTOR * days)) {
      return { emoji: "❄️", label: "dormant — overdue vs its usual cadence" }
    }
  }
  if (days == null) return { emoji: "💤", label: "cadence unknown" }
  if (days < 1) return { emoji: "⛈️", label: "multiple posts a day" }
  if (days <= 3) return { emoji: "🌧️", label: "around daily" }
  if (days <= 14) return { emoji: "⛅", label: "around weekly" }
  return { emoji: "☀️", label: "infrequent" }
}

export async function feedsLoader() {
  return { index: await swr("index", getIndex) }
}

export function FeedsRoute() {
  const { index } = useLoaderData() as { index: Index }

  useEffect(() => {
    document.title = "Feeds"
  }, [])

  return <FeedsView feeds={index.feeds} />
}

function FeedsView({ feeds }: { feeds: Feed[] }) {
  const grouped = useMemo(() => {
    const byCategory = new Map<string, Feed[]>()
    for (const feed of feeds) {
      const cats = feed.folders.length ? feed.folders : [UNCATEGORISED]
      for (const cat of cats) {
        const list = byCategory.get(cat)
        if (list) list.push(feed)
        else byCategory.set(cat, [feed])
      }
    }
    return [...byCategory.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, list]) => ({
        label,
        feeds: [...list].sort((a, b) => a.title.localeCompare(b.title)),
      }))
  }, [feeds])

  return (
    <Stream
      className="reader-stream"
      header={
        <div className="reader-toolbar">
          <h1>Feeds</h1>
        </div>
      }
    >
      <div className="reader-feeds">
        {grouped.map((group) => (
          <section key={group.label} className="reader-feeds__group">
            <h3 className="reader-group">{group.label}</h3>
            <ul className="reader-feeds__list">
              {group.feeds.map((feed) => {
                const lastPostAt = feed.updatedAt ?? feed.latestPost?.publishedAt ?? null
                const w = weather(
                  feed.medianIntervalDays,
                  feed.postsPerWeek,
                  lastPostAt ? Date.parse(lastPostAt) : null,
                )
                return (
                  <li key={feed.id} className="reader-feeds__item">
                    <div className="reader-feeds__head">
                      <span
                        className="reader-feeds__weather"
                        role="img"
                        aria-label={w.label}
                        title={w.label}
                      >
                        {w.emoji}
                      </span>
                      <Link className="reader-feeds__title" to={`/feed/${feed.id}`}>
                        {feed.title}
                      </Link>
                      <span className="reader-feeds__count">{feed.count} posts</span>
                    </div>
                    {feed.latestPost?.title && (
                      <div className="reader-feeds__latest">
                        {feed.latestPost.title}
                        {lastPostAt && (
                          <span className="reader-feeds__latest-date">
                            {" · "}
                            {relativeTime(lastPostAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Stream>
  )
}
