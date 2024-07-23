import React, { Component } from "react";
import { format } from "date-fns";

import styles from "./article.scss";
export const ArticlePreviewStyles = styles;

export class ArticlePreview extends Component {
  render() {
    const { entry, fieldsMetaData } = this.props;
    const title = entry.getIn(["data", "title"]);
    const date = entry.getIn(["data", "date"]);
    const author = entry.getIn(["data", "author"]);

    return (
      <div className="alex-article">
        <h1 class="alex-article__headline" itemProp="name headline">
          {title}
        </h1>
        <div className="alex-article__main">
          <div className="alex-article__byline">
            Posted
            <>
              {` by `}
              <span itemProp="author" itemType="http://schema.org/Person">
                <a href="/">
                  <span itemProp="name">{author}</span>
                </a>
              </span>
            </>
            <>
              {` on `}
              <time
                className="alex-article__main__date"
                dateTime={date}
                itemProp="datePublished"
              >
                {format(new Date(date), "PPPP")}
              </time>
              .
            </>
          </div>
          <article
            className="alex-article__body article-description"
            itemProp="articleBody"
          >
            {this.props.widgetFor("body")}
          </article>
        </div>

        <div className="alex-article__aside">
          <div className="alex-article__aside-start"></div>
          <div className="alex-article__aside-mid"></div>
          <div className="alex-article__aside-bottom alex-article__sharing-block"></div>
        </div>
      </div>
    );
  }
}

export default ArticlePreview;
