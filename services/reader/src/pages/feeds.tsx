import React, { useMemo } from "react"
import { graphql, Link, PageProps } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import { relativeTime } from "../lib/entries"

type Feed = {
  id: string
  title: string | null
  folders: string[] | null
  count: number | null
  postsPerWeek: number | null
  medianIntervalDays: number | null
}

type ReaderData = {
  feedIndex: { feeds: Feed[] | null } | null
  allFeedDetail: {
    nodes: { feedId: string; entries: { title: string | null; publishedAt: string }[] | null }[]
  }
}

const UNCATEGORISED = "Uncategorised"

const DAY = 86_400_000
// Dormant = overdue relative to the feed's own rhythm (with a floor so a daily
// feed isn't flagged over a long weekend). Tunable.
const DORMANT_MIN_DAYS = 14
const DORMANT_FACTOR = 4

// Posting cadence as weather: heavier the rain, busier the feed. Dormancy
// (gone cold relative to its usual cadence) is checked first → ❄️.
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

const FeedsPage = ({ data, location }: PageProps<ReaderData>) => {
  const feeds = data.feedIndex?.feeds ?? []

  const latestByFeed = useMemo(() => {
    const latest = new Map<
      string,
      { title: string | null; publishedAt: string; at: number }
    >()
    for (const node of data.allFeedDetail.nodes) {
      for (const entry of node.entries ?? []) {
        const at = Date.parse(entry.publishedAt)
        const current = latest.get(node.feedId)
        if (!current || at > current.at) {
          latest.set(node.feedId, {
            title: entry.title,
            publishedAt: entry.publishedAt,
            at,
          })
        }
      }
    }
    return latest
  }, [data])

  const grouped = useMemo(() => {
    const byCategory = new Map<string, Feed[]>()
    for (const feed of feeds) {
      const cats =
        feed.folders && feed.folders.length ? feed.folders : [UNCATEGORISED]
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
        feeds: [...list].sort((a, b) =>
          (a.title ?? "").localeCompare(b.title ?? ""),
        ),
      }))
  }, [feeds])

  return (
    <Layout location={location}>
      <Stream
        className="reader-stream"
        header={
          <div className="reader-toolbar">
            <div>
              <Link className="reader-back" to="/">
                ← Firehose
              </Link>
              <h1>Feeds</h1>
            </div>
          </div>
        }
      >
        <div className="reader-feeds">
          {grouped.map((group) => (
            <section key={group.label} className="reader-feeds__group">
              <h3 className="reader-group">{group.label}</h3>
              <ul className="reader-feeds__list">
                {group.feeds.map((feed) => {
                  const latest = latestByFeed.get(feed.id)
                  const w = weather(
                    feed.medianIntervalDays,
                    feed.postsPerWeek,
                    latest?.at ?? null,
                  )
                  return (
                    <li key={feed.id} className="reader-feeds__item">
                      <div className="reader-feeds__head">
                        <span
                          className="reader-feeds__weather"
                          role="img"
                          aria-label={w.label}
                          title={w.label}
                          suppressHydrationWarning
                        >
                          {w.emoji}
                        </span>
                        <Link
                          className="reader-feeds__title"
                          to={`/feed/${feed.id}`}
                        >
                          {feed.title ?? feed.id}
                        </Link>
                        <span className="reader-feeds__count">
                          {feed.count ?? 0} posts
                        </span>
                      </div>
                      {latest?.title && (
                        <div className="reader-feeds__latest">
                          {latest.title}
                          <span
                            className="reader-feeds__latest-date"
                            suppressHydrationWarning
                          >
                            {" · "}
                            {relativeTime(latest.publishedAt)}
                          </span>
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
    </Layout>
  )
}

export default FeedsPage

export const Head = () => <title>Feeds</title>

export const query = graphql`
  query {
    feedIndex {
      feeds {
        id
        title
        folders
        count
        postsPerWeek
        medianIntervalDays
      }
    }
    allFeedDetail {
      nodes {
        feedId
        entries {
          title
          publishedAt
        }
      }
    }
  }
`
