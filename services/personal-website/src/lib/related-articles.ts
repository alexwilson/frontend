import {
  isWeeknote,
  selectWeeknoteNavigation,
  type Article,
} from "./weeknotes"

const MAX_ARTICLES = 3
const MAX_GRANULARITY = 6

export function selectRelatedArticles(
  articlesNewestFirst: Article[],
  currentArticle: Article,
): Article[] {
  const currentArticleIsWeeknote = isWeeknote(currentArticle)
  const currentArticleTopics = currentArticle.topics.map(
    (topic) => topic.topicId,
  )

  const relatedArticles = new Set<Article>()

  const { latest } = selectWeeknoteNavigation(articlesNewestFirst, currentArticle)
  if (latest) {
    relatedArticles.add(latest)
  }

  const trailingWeeknote = currentArticleIsWeeknote
    ? null
    : (articlesNewestFirst.find(isWeeknote) ?? null)
  const topicalLimit = trailingWeeknote ? MAX_ARTICLES - 1 : MAX_ARTICLES

  for (
    let granularity = MAX_GRANULARITY;
    granularity >= 0 && relatedArticles.size < topicalLimit;
    granularity--
  ) {
    for (const article of articlesNewestFirst) {
      if (relatedArticles.size >= topicalLimit) break
      if (article.contentId === currentArticle.contentId) continue
      if (relatedArticles.has(article)) continue

      // Weeknotes are their own reading thread — never let them fill topical slots;
      // the single weeknote in this rail is placed deliberately, above or below.
      if (isWeeknote(article)) continue

      const similarity = article.topics.filter((topic) =>
        currentArticleTopics.includes(topic.topicId),
      ).length

      if (similarity >= granularity) {
        relatedArticles.add(article)
      }
    }
  }

  if (trailingWeeknote && relatedArticles.size < MAX_ARTICLES) {
    relatedArticles.add(trailingWeeknote)
  }

  return Array.from(relatedArticles)
}
