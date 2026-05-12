import React from 'react'
import Link from '../link'

const StreamFilters = ({
  years = [],
  selectedYears = [],
  onYearToggle,
  topics = [],
  selectedTopics = [],
  onClear,
}) => {
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
              .map(t => (
                <li key={t.topicId}>
                  <Link
                    to={t.slug}
                    className={selectedTopics.includes(t.topicId) ? 'alex-stream__topic-link--active' : ''}
                  >
                    {t.topic}
                  </Link>
                </li>
              ))}
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
                    onChange={() => onYearToggle(y)}
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
