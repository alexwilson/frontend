import React from 'react'
import Link from '../link'

export type Topic = {
  topicId: string
  topic: string
  slug?: string
}

export type FilterOption = {
  id: string
  label: string
  count?: number
  href?: string
}

export type FilterSection = {
  title: string
  options: FilterOption[]
  selected: string[]
  onSelect?: (id: string) => void
  defaultOpen?: boolean
}

type Props = {
  years?: number[]
  selectedYears?: number[]
  onYearToggle?: (year: number) => void
  topics?: Topic[]
  selectedTopics?: string[]
  sections?: FilterSection[]
  onClear?: () => void
}

const StreamFilters = ({
  years = [],
  selectedYears = [],
  onYearToggle,
  topics = [],
  selectedTopics = [],
  sections = [],
  onClear,
}: Props) => {
  const hasFilters = selectedYears.length > 0

  return (
    <>
      {sections.map((section) => (
        <details
          key={section.title}
          className="alex-stream__filter-section"
          open={section.defaultOpen || undefined}
        >
          <summary>
            <strong>{section.title}</strong>
          </summary>
          <ul className="alex-stream__topics-list">
            {section.options.map((option) => {
              const content = (
                <>
                  <span className="alex-stream__filter-label">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="alex-stream__filter-count">{option.count}</span>
                  )}
                </>
              )
              if (option.href) {
                return (
                  <li key={option.id}>
                    <Link to={option.href} className="alex-stream__filter-option">
                      {content}
                    </Link>
                  </li>
                )
              }
              const active = section.selected.includes(option.id)
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={
                      active
                        ? "alex-stream__filter-option alex-stream__filter-option--active"
                        : "alex-stream__filter-option"
                    }
                    aria-pressed={active}
                    onClick={() => section.onSelect?.(option.id)}
                  >
                    {content}
                  </button>
                </li>
              )
            })}
          </ul>
        </details>
      ))}

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
