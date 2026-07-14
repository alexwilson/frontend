import React from "react"
import RelatedArticles from "@alexwilson/ds-legacy-components/src/related-articles"

import useArticles from "../hooks/useArticles"
import { selectRelatedArticles } from "../lib/related-articles"
import { type Article } from "../lib/weeknotes"

type Props = {
  article: Article
}

const RelatedArticlesContainer = ({ article: currentArticle }: Props) => {
  const articles = useArticles()

  return (
    <RelatedArticles
      articles={selectRelatedArticles(articles, currentArticle)}
    />
  )
}

export default RelatedArticlesContainer
