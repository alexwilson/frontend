import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { graphql, PageProps } from "gatsby"
import Layout from "../components/layout"
import Stream from "@alexwilson/ds-legacy-components/src/stream"
import StreamFilters from "@alexwilson/ds-legacy-components/src/stream-filters"
import ArticleCard from "@alexwilson/ds-legacy-components/src/article-card"
import TimelineScroll, {
  TimelineLevel,
  bucketKey,
} from "@alexwilson/ds-legacy-components/src/timeline-scroll"
import { utcDate } from "@alexwilson/ds-legacy-components/src/util-date"
import Header from "@alexwilson/ds-legacy-components/src/header"
import SEO from "../components/seo"
import useStreamFilters from "../hooks/useStreamFilters"

type Post = {
  id?: string
  contentId: string
  title: string
  date: string
  url: string
  slug: string
  topics: { topicId: string; topic: string; slug: string }[]
  content: { excerpt: string } | null
}

type BlogData = {
  content: { totalCount: number; edges: { node: Post }[] }
  site: { siteMetadata: { siteUrl: string } }
}

const BlogPage = ({ data, location }: PageProps<BlogData>) => {
  const allPosts = useMemo(
    () => data.content.edges.map(({ node }) => node),
    [data],
  )
  const { topics, filteredItems } = useStreamFilters(allPosts)

  // Calendar rail: jump the page to the newest post in a clicked bucket. The
  // feed isn't virtualized, so we scroll the matching card into view directly.
  const cardRefs = useRef(new Map<string, HTMLDivElement>())
  const [level, setLevel] = useState<TimelineLevel>("day")
  const timelineDates = useMemo(
    () => filteredItems.map((node) => utcDate(node.date)),
    [filteredItems],
  )
  const jumpToDate = useCallback(
    (date: Date) => {
      const target = bucketKey(date, level)
      const match = filteredItems.find(
        (node) => bucketKey(utcDate(node.date), level) === target,
      )
      const el = match && cardRefs.current.get(match.contentId)
      if (!el) return
      // The site header is sticky and overlays the feed, so offset the scroll
      // by its live height (it shrinks as you scroll) plus a small gap.
      const header = document.querySelector(".alex-header")
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0
      const top = el.getBoundingClientRect().top + window.scrollY - headerBottom - 16
      window.scrollTo({ top, behavior: "smooth" })
    },
    [filteredItems, level],
  )

  // Highlight the calendar buckets for the posts currently on screen. The page
  // (not an inner list) scrolls, so we track card visibility directly.
  const [visibleRange, setVisibleRange] = useState<[Date, Date] | null>(null)
  const dateById = useMemo(() => {
    const map = new Map<string, number>()
    filteredItems.forEach((node) => map.set(node.contentId, utcDate(node.date).getTime()))
    return map
  }, [filteredItems])
  useEffect(() => {
    const onScreen = new Set<string>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.contentId
        if (!id) continue
        if (entry.isIntersecting) onScreen.add(id)
        else onScreen.delete(id)
      }
      let lo = Infinity
      let hi = -Infinity
      onScreen.forEach((id) => {
        const time = dateById.get(id)
        if (time === undefined) return
        if (time < lo) lo = time
        if (time > hi) hi = time
      })
      setVisibleRange(lo <= hi ? [new Date(lo), new Date(hi)] : null)
    })
    cardRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [dateById])

  return (
    <Layout location={location}>
      <Header location={location} section="blog" compact />
      <Stream
        className="blog-stream"
        sidebar={
          <>
            <StreamFilters topics={topics} />
            <TimelineScroll
              className="blog-calendar"
              dates={timelineDates}
              visibleRange={visibleRange}
              onJump={jumpToDate}
              level={level}
              onLevelChange={setLevel}
            />
          </>
        }
        header={
          <>
            <h1>My Blog</h1>
            <h4>{filteredItems.length} Posts</h4>
          </>
        }
      >
        {filteredItems.map((node) => (
          <div
            key={node.id}
            data-content-id={node.contentId}
            ref={(el) => {
              if (el) cardRefs.current.set(node.contentId, el)
              else cardRefs.current.delete(node.contentId)
            }}
          >
            <ArticleCard article={node} withImage={false} />
          </div>
        ))}
      </Stream>
    </Layout>
  )
}

export default BlogPage

export const Head = () => <SEO title="Blog" />

export const query = graphql`
  fragment BlogPageContent on MarkdownRemark {
    excerpt: excerpt
  }
  query {
    content: allContent(
      filter: {
        type: { in: ["article", "content-placeholder"] }
        topics: { elemMatch: { topic: { ne: "lists" } } }
      }
      sort: { date: DESC }
    ) {
      totalCount
      edges {
        node {
          contentId
          title
          date
          url
          slug
          topics {
            topicId
            topic
            slug
          }
          content: parent {
            ...BlogPageContent
          }
        }
      }
    }
    site {
      siteMetadata {
        siteUrl
      }
    }
  }
`
