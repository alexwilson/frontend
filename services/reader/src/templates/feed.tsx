import React, { useMemo, useState } from "react"
import { graphql, HeadProps, Link, PageProps } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import { FeedList } from "../components/feed-list"
import { FeedEntry, byPublishedDesc } from "../lib/entries"
import { useReadState } from "../lib/read-state"

type Data = { feedDetail: { entries: FeedEntry[] | null } | null }
type Context = { feedId: string; feedTitle: string }

const FeedTemplate = ({ data, pageContext, location }: PageProps<Data, Context>) => {
  const entries = useMemo(() => {
    const raw = data.feedDetail?.entries ?? []
    return [...raw].sort(byPublishedDesc)
  }, [data])

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
    <Layout location={location}>
      <Stream
        className="reader-stream"
        header={
          <div className="reader-toolbar">
            <div>
              <Link className="reader-back" to="/feeds">
                ← Feeds
              </Link>
              <h1>{pageContext.feedTitle}</h1>
            </div>
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
          restoreKey={`feed:${pageContext.feedId}:${unreadOnly ? 1 : 0}`}
          onOpen={(id) => setRead(id, true)}
          onToggle={setRead}
          empty="No posts."
        />
      </Stream>
    </Layout>
  )
}

export default FeedTemplate

export const Head = ({ pageContext }: HeadProps<Data, Context>) => (
  <title>{pageContext.feedTitle}</title>
)

export const query = graphql`
  query ($feedId: String!) {
    feedDetail(feedId: { eq: $feedId }) {
      entries {
        id
        title
        url
        publishedAt
        summary
        readingMinutes
        sentimentLabel
      }
    }
  }
`
