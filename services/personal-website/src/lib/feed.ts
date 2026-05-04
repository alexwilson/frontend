import sanitizeHtml from 'sanitize-html';
import type { ContentModel } from './content';

const SITE_URL = 'https://alexwilson.tech';
const SITE_TITLE = 'Alex Wilson';

export interface FeedEntry {
  title: string;
  slug: string;
  url: string;
  date: Date;
  author?: { name: string };
  excerpt?: string;
  htmlExcerpt?: string;
}

export function buildFeedItemUrl(entry: FeedEntry): string {
  const urlSource = entry.url || entry.slug;
  const rawUrl =
    urlSource && urlSource.startsWith('http')
      ? new URL(urlSource)
      : new URL(urlSource, SITE_URL);
  rawUrl.searchParams.append('utm_source', 'feed');
  return rawUrl.toString();
}

export function buildFeedItemGuid(entry: FeedEntry): string {
  return new URL(entry.slug, SITE_URL).toString();
}

export function buildFeedItemContent(
  htmlExcerpt: string,
  itemUrl: string,
): string {
  const content = `
    ${htmlExcerpt}<br />
    <a href="${itemUrl}">Read the full post here...</a>
  `;
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: false as unknown as sanitizeHtml.IOptions['allowedAttributes'],
  });
}

export function buildFeedItemAuthor(entry: FeedEntry): string {
  return entry.author?.name ?? SITE_TITLE;
}
