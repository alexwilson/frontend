import React from 'react'
import ArticleCard, { type Article } from '../article-card'

type Props = {
  articles?: Article[]
}

export default function RelatedArticles({ articles }: Props) {
  if (!articles || articles.length === 0) return null
  return (
    <>
      {articles.map((article) => (
        <ArticleCard
          key={article.contentId}
          article={article}
          withBody={false}
          withDate={false}
        />
      ))}
    </>
  )
}
