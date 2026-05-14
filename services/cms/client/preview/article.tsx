import React, { Component } from "react";
import { format } from "date-fns";
import type { PreviewTemplateComponentProps } from 'decap-cms-core';

import ArticleLayout from "@alexwilson/ds-legacy-components/src/article-layout";

import styles from "./article.scss";
export const ArticlePreviewStyles = styles;

export class ArticlePreview extends Component<PreviewTemplateComponentProps> {
  render() {
    const { entry } = this.props;
    const title = entry.getIn(["data", "title"]) as string | undefined;
    const date = entry.getIn(["data", "date"]) as string | undefined;
    const author = entry.getIn(["data", "author"]) as string | undefined;
    const tags = (entry.getIn(["data", "tags"]) as { toJS(): string[] } | undefined)?.toJS() || [];

    return (
      <ArticleLayout
        headline={<h1 itemProp="name headline">{title}</h1>}
        aside={tags.length > 0 && (
          <div className="alex-article__aside-start">
            <div className="alex-article__topics">
              <strong>Topics: </strong>
              <ul>
                {tags.map(tag => <li key={tag}>{tag}</li>)}
              </ul>
            </div>
          </div>
        )}
      >
        <div className="alex-article__byline">
          Posted
          {author && <>
            {` by `}
            <span itemProp="author" itemType="http://schema.org/Person">
              <a href="/"><span itemProp="name">{author}</span></a>
            </span>
          </>}
          {date && <>
            {` on `}
            <time
              className="alex-article__main__date"
              dateTime={date}
              itemProp="datePublished"
            >{format(new Date(date), "PPPP")}</time>.
          </>}
        </div>
        <article
          className="alex-article__body article-description"
          itemProp="articleBody"
        >
          {this.props.widgetFor("body")}
        </article>
      </ArticleLayout>
    );
  }
}

export default ArticlePreview;
