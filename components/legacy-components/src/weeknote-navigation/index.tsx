import React from 'react'
import './weeknote-navigation.scss'
import ArticleCard, { type Article } from '../article-card'

type Props = {
  previous?: Article | null
  next?: Article | null
}

type Entry = { label: string; weeknote: Article }

export default function WeeknoteNavigation({ previous, next }: Props) {
  const entries = [
    { label: 'Previous Week', weeknote: previous },
    { label: 'Next Week', weeknote: next },
  ].filter((entry): entry is Entry => Boolean(entry.weeknote))

  if (entries.length === 0) return null

  return (
    <nav className="alex-weeknote-nav" aria-label="Weeknotes">
      <ul>
        {entries.map(({ label, weeknote }) => (
          <li key={label}>
            <span className="alex-weeknote-nav__label">{label}</span>
            <ArticleCard article={weeknote} withBody={false} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
