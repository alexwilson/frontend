import React from 'react'
import './pagination.scss'
import Link from '../link'

export default function Pagination({ currentPage, totalPages, basePath = '/' }) {
  const pageUrl = (n) => (n === 1 ? basePath : `${basePath}/${n}`)
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <ul className="alex-pagination">
      <li className={`previous${!hasPrev ? ' disabled' : ''}`}>
        {hasPrev
          ? <Link to={pageUrl(currentPage - 1)}>← Newer</Link>
          : <span>← Newer</span>}
      </li>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <li key={page}>
          {page === currentPage
            ? <span>{page}</span>
            : <Link to={pageUrl(page)}>{page}</Link>}
        </li>
      ))}
      <li className={`next${!hasNext ? ' disabled' : ''}`}>
        {hasNext
          ? <Link to={pageUrl(currentPage + 1)}>Older →</Link>
          : <span>Older →</span>}
      </li>
    </ul>
  )
}
