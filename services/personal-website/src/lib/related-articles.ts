import type { ContentModel } from './content';

function isWeeknote(article: ContentModel): boolean {
  return article.topics.some(({ topic }) => topic === 'weeknotes');
}

function findPreviousWeeknote(
  articles: ContentModel[],
  currentArticle: ContentModel,
): ContentModel | null {
  return (
    articles.find(
      (article) =>
        isWeeknote(article) &&
        new Date(article.date) < new Date(currentArticle.date),
    ) || null
  );
}

export function findRelatedArticles(
  currentArticle: ContentModel,
  allArticles: ContentModel[],
  maxArticles = 3,
): ContentModel[] {
  const currentArticleTopics = currentArticle.topics.map((t) => t.topicId);
  const relatedArticles = new Set<ContentModel>();

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

      // Reduce relevance of weeknotes
      if (granularity >= 1 && relatedArticleIsWeeknote) {
        continue;
      }

      let similarity = 0;
      for (const topic of article.topics) {
        if (currentArticleTopics.includes(topic.topicId)) {
          similarity++;
        }
      }

      if (similarity >= granularity && !relatedArticles.has(article)) {
        relatedArticles.add(article);
      }
    }
  }

  return Array.from(relatedArticles.values());
}
