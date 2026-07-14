import React from "react"
import WeeknoteNavigation from "@alexwilson/ds-legacy-components/src/weeknote-navigation"

import useArticles from "../hooks/useArticles"
import { selectWeeknoteNavigation, type Article } from "../lib/weeknotes"

type Props = {
  article: Article
}

const WeeknoteNavigationContainer = ({ article: currentArticle }: Props) => {
  const articles = useArticles()
  // `latest` belongs to the Read Next rail, not the pager.
  const { previous, next } = selectWeeknoteNavigation(articles, currentArticle)

  return <WeeknoteNavigation previous={previous} next={next} />
}

export default WeeknoteNavigationContainer
