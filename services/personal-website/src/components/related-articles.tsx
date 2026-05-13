import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import RelatedArticles from "@alexwilson/ds-legacy-components/src/related-articles"

type Article = {
  contentId: string
  slug: string
  url: string
  date: string
  title: string
  topics: { topicId: string; topic: string; slug: string }[]
}

function isWeeknote(article: Article) {
  return article.topics.some(({ topic }) => topic === "weeknotes")
}

function findPreviousWeeknote(articles: Article[], currentArticle: Article) {
  return (
    articles.find(
      (article) =>
        isWeeknote(article) &&
        new Date(article.date) < new Date(currentArticle.date),
    ) || null
  )
}

type Props = {
  article: Article
}

const RelatedArticlesContainer = ({ article: currentArticle }: Props) => {
  const data = useStaticQuery<{ posts: { nodes: Article[] } }>(graphql`
    query RelatedArticles {
      posts: allContent(
        sort: { order: DESC, fields: [date] }
        filter: { type: { eq: "article" } }
        limit: 1000
      ) {
        nodes {
          contentId
          slug
          url
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

  const allArticles = data.posts.nodes
  const currentArticleTopics =
    currentArticle.topics.map((topic) => topic.topicId) || []

  const maxArticles = 3
  const relatedArticles = new Set<Article>()

  const previousWeeknote = isWeeknote(currentArticle)
    ? findPreviousWeeknote(allArticles, currentArticle)
    : null
  if (previousWeeknote) {
    relatedArticles.add(previousWeeknote)
  }

  for (let granularity = 6; granularity >= 0; granularity--) {
    if (relatedArticles.size >= maxArticles) break

    for (const article of allArticles) {
      if (article.contentId === currentArticle.contentId) continue
      if (relatedArticles.size >= maxArticles) break

      const relatedArticleIsWeeknote = isWeeknote(article)

      if (granularity >= 1 && relatedArticleIsWeeknote) {
        continue
      }

      let similarity = 0

      for (const topic of article.topics) {
        if (currentArticleTopics.includes(topic.topicId)) {
          similarity++
        }
      }

      if (similarity >= granularity && !relatedArticles.has(article)) {
        relatedArticles.add(article)
      }
    }
  }

  return <RelatedArticles articles={Array.from(relatedArticles.values())} />
}

export default RelatedArticlesContainer
