import { Link } from "@reach/router";
import { format as formatDate } from "date-fns";
import React from "react";
import ResponsiveImage from "../responsive-image";

export function ArticleCard({
  article,
  linkImplementation = Link,
  withBody = true,
  withImage = true,
  withDate = true,
}) {
  const date = new Date(article.date);
  const LinkImplementation = linkImplementation;

  return (
    <div className="alex-card">
      <div className="alex-card__content--container">
        <div className="alex-card__title">
          <h3>
            <LinkImplementation to={article.slug}>
              {article.title}
            </LinkImplementation>
          </h3>
        </div>

        {withBody !== false ? (
          <div className="alex-card__abstract">
            <p>{article.content.excerpt}</p>
          </div>
        ) : null}

        {withDate !== false ? (
          <div className="alex-card__timetamp">
            <span className="dateline">
              <time dateTime={date.toISOString()}>
                {formatDate(date, "d MMM yyyy")}
              </time>
            </span>
          </div>
        ) : null}
      </div>

      {withImage !== false && article.image && article.image.thumbnail ? (
        <div className="alex-card__image">
          <ResponsiveImage src={article.image.thumbnail} width={400} />
        </div>
      ) : null}
    </div>
  );
}

export default ArticleCard;
