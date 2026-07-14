export type Article = {
  contentId: string
  slug: string
  date: string
  title: string
  topics: { topicId: string; topic: string; slug: string }[]
}

export type WeeknoteNavigation = {
  previous: Article | null
  next: Article | null
  latest: Article | null
}

export function isWeeknote(article: Article) {
  return article.topics.some(({ topic }) => topic === "weeknotes")
}

export function selectWeeknoteNavigation(
  articlesNewestFirst: Article[],
  currentArticle: Article,
): WeeknoteNavigation {
  const empty = { previous: null, next: null, latest: null }
  if (!isWeeknote(currentArticle)) return empty

  const weeknotes = articlesNewestFirst.filter(isWeeknote)
  const position = weeknotes.findIndex(
    (weeknote) => weeknote.contentId === currentArticle.contentId,
  )
  if (position === -1) return empty

  return {
    next: weeknotes[position - 1] ?? null,
    previous: weeknotes[position + 1] ?? null,
    // Null on the newest weeknote, where "latest" is where you already are.
    latest: position === 0 ? null : weeknotes[0],
  }
}
