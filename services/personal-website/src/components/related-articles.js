import React from 'react'
import { useStaticQuery, graphql } from "gatsby"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"

export default ({article: currentArticle}) => {
  const data = useStaticQuery(graphql`
    query RelatedArticles {
      posts: allContent(
        sort: { order: DESC, fields: [date] }
        filter: {
          type: {eq: "posts"}
        }
        limit: 1000
      ) {
        nodes {
          contentId
          slug
          date
          title
          topics {
            topicId
            topic
            slug
          }
        }
      }
    }
  `)

  const currentArticleTopics = currentArticle.topics.map(topic => topic.topicId) || []

  const maxArticles = 3
  const relatedArticles = new Set()
  for (let granularity = 3; granularity >= 0; granularity--) {
    if (relatedArticles.size >= maxArticles) break;

    for (const article of data.posts.nodes) {
      if (article.contentId === currentArticle.contentId) continue;
      if (relatedArticles.size >= maxArticles) break;

      let similarity = 0

      for (const topic of article.topics.map(topic => topic.topicId)) {
        if (currentArticleTopics.includes(topic)) {
          similarity++;
        }
      }

      // Match to avoid processing articles multiple times.
      if (similarity >= granularity && !relatedArticles.has(article)) {
        relatedArticles.add(article)
      }
    }

  }

  return (
    <>
      {Array.from(relatedArticles.values()).map(
        article => <ArticleCard key={article.contentId} article={article} withBody={false} withDate={false}
      />)}
    </>
  )
}
