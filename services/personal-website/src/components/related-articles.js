import React from 'react'
import { useStaticQuery, graphql } from "gatsby"
import ArticleCard from "@alexwilson/legacy-components/src/article-card"

export default ({article: currentArticle}) => {
  const data = useStaticQuery(graphql`
    query RelatedArticles {
      posts: allContent(
        sort: { order: DESC, fields: [date] }
        filter: {
          type: {eq: "article"}
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
  for (let granularity = 6; granularity >= 0; granularity--) {
    if (relatedArticles.size >= maxArticles) break;

    for (const article of data.posts.nodes) {
      if (article.contentId === currentArticle.contentId) continue;
      if (relatedArticles.size >= maxArticles) break;

      const isWeeknote = (article.topics.filter(({topic}) => topic == "weeknotes").length > 0)

      // Hack to reduce relevance of weeknotes.
      if (granularity >= 1 && isWeeknote) {
        continue
      }

      let similarity = 0

      for (const topic of article.topics) {
        if (currentArticleTopics.includes(topic.topicId)) {
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
        (article) => <ArticleCard key={article.contentId} article={article} withBody={false} withDate={false}
      />)}
    </>
  )
}
