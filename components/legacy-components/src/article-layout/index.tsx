import React from 'react'
import './article-layout.scss'

type Props = {
  headline?: React.ReactNode
  children?: React.ReactNode
  aside?: React.ReactNode
}

export default function ArticleLayout({ headline, children, aside }: Props) {
  return (
    <div className="alex-article">
      {headline && <div className="alex-article__headline">{headline}</div>}
      <div className="alex-article__main">{children}</div>
      {aside && <div className="alex-article__aside">{aside}</div>}
    </div>
  )
}
