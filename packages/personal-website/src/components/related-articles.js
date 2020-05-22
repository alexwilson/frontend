import React from 'react'
import { useStaticQuery, graphql } from "gatsby"
import ArticleCard from './article-card'

export default ({article: currentArticle}) => {
  const data = useStaticQuery(graphql`
    query RelatedArticles {
      posts: allMarkdownRemark(
        sort: { order: DESC, fields: [fields___date] }
        filter: {
          frontmatter: {
            date: {ne: null},
            tags: {ne: null}
          },
          fields: {type: {eq: "posts"}}
        }
        limit: 1000
      ) {
        nodes {
          id
          fields {
            slug
            date
          }
          frontmatter {
            title
            tags
          }
        }
      }
    }
  `)

  const currentArticleTags = currentArticle.frontmatter.tags || []

  const maxArticles = 3
  const relatedArticles = new Set()
  for (let granularity = 3; granularity >= 0; granularity--) {
    if (relatedArticles.size >= maxArticles) break;

    for (const article of data.posts.nodes) {
      if (article.id === currentArticle.id) continue;
      if (relatedArticles.size >= maxArticles) break;

      let similarity = 0

      for (const tag of article.frontmatter.tags) {
        if (currentArticleTags.includes(tag)) {
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
        article => <ArticleCard key={article.id} article={article}
      />)}
    </>
  )
}
