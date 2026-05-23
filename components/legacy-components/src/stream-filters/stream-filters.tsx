import React from 'react'
import Link from '../link'

export type Topic = {
  topicId: string
  topic: string
  slug?: string
}

type Props = {
  years?: number[]
  selectedYears?: number[]
  onYearToggle?: (year: number) => void
  topics?: Topic[]
  selectedTopics?: string[]
  onClear?: () => void
}

const StreamFilters = ({
  years = [],
  selectedYears = [],
  onYearToggle,
  topics = [],
  selectedTopics = [],
  onClear,
}: Props) => {
  const hasFilters = selectedYears.length > 0

  return (
    <>
      {topics.length > 0 && (
        <details className="alex-stream__filter-section" open={selectedTopics.length > 0 || undefined}>
          <summary><strong>Topics</strong></summary>
          <ul className="alex-stream__topics-list alex-stream__topics-list--links">
            {[...topics]
              .sort((a, b) => {
                const aActive = selectedTopics.includes(a.topicId)
                const bActive = selectedTopics.includes(b.topicId)
                if (aActive && !bActive) return -1
                if (!aActive && bActive) return 1
                return 0
              })
              .map(t => {
                const isActive = selectedTopics.includes(t.topicId)
                return (
                  <li key={t.topicId}>
                    {isActive || !t.slug
                      ? <span className={isActive ? 'alex-stream__topic-link--active' : ''}>{t.topic}</span>
                      : <Link to={t.slug}>{t.topic}</Link>}
                  </li>
                )
              })}
          </ul>
        </details>
      )}

      {years.length > 0 && (
        <details className="alex-stream__filter-section">
          <summary><strong>Year</strong></summary>
          <ul className="alex-stream__topics-list">
            {years.map(y => (
              <li key={y}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(y)}
                    onChange={() => onYearToggle?.(y)}
                  />
                  {y}
                </label>
              </li>
            ))}
          </ul>
        </details>
      )}

      {hasFilters && onClear && (
        <button className="alex-stream__filter-clear" onClick={onClear}>
          Clear filters
        </button>
      )}
    </>
  )
}

export default StreamFilters
