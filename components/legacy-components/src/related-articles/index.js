import React from 'react'
import ArticleCard from '../article-card'

export default function RelatedArticles({ articles }) {
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
