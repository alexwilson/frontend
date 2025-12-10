import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import ArticleCard from "@alexwilson/legacy-components/src/article-card";

function isWeeknote(article) {
  return article.topics.some(({ topic }) => topic === "weeknotes");
}

function findPreviousWeeknote(articles, currentArticle) {
  // Find the first weeknote that has a date smaller than the current article's date
  return (
    articles.find(
      (article) =>
        isWeeknote(article) &&
        new Date(article.date) < new Date(currentArticle.date),
    ) || null
  );
}

export default ({ article: currentArticle }) => {
  const data = useStaticQuery(graphql`
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
  `);

  const allArticles = data.posts.nodes;
  const currentArticleTopics =
    currentArticle.topics.map((topic) => topic.topicId) || [];

  const maxArticles = 3;
  const relatedArticles = new Set();

  // Find and add the previous weeknote if the current article is a weeknote
  const previousWeeknote = isWeeknote(currentArticle)
    ? findPreviousWeeknote(allArticles, currentArticle)
    : null;
  if (previousWeeknote) {
    relatedArticles.add(previousWeeknote);
  }

  for (let granularity = 6; granularity >= 0; granularity--) {
    if (relatedArticles.size >= maxArticles) break;

    for (const article of allArticles) {
      if (article.contentId === currentArticle.contentId) continue;
      if (relatedArticles.size >= maxArticles) break;

      const relatedArticleIsWeeknote = isWeeknote(article);

      // Hack to reduce relevance of weeknotes.
      if (granularity >= 1 && relatedArticleIsWeeknote) {
        continue;
      }

      let similarity = 0;

      for (const topic of article.topics) {
        if (currentArticleTopics.includes(topic.topicId)) {
          similarity++;
        }
      }

      // Match to avoid processing articles multiple times.
      if (similarity >= granularity && !relatedArticles.has(article)) {
        relatedArticles.add(article);
      }
    }
  }

  return (
    <>
      {Array.from(relatedArticles.values()).map((article) => (
        <ArticleCard
          key={article.contentId}
          article={article}
          withBody={false}
          withDate={false}
        />
      ))}
    </>
  );
};
