import { remark } from 'remark';
import stripMarkdown from 'strip-markdown';
import { rewriteImage } from '../plugins/remark-rewrite-images.mjs';

const excerptProcessor = remark().use(stripMarkdown);

export interface ContentImage {
  image?: string;
  thumbnail?: string;
  credit?: string;
  altText?: string;
}

export interface ContentAuthor {
  name: string;
}

export interface ContentBody {
  excerpt?: string;
  html?: string;
}

export interface ContentModel {
  contentId: string;
  title: string;
  slug: string;
  url: string;
  type: string;
  date: Date;
  author?: ContentAuthor;
  topics: TopicRef[];
  image: ContentImage;
  link?: string;
  content?: ContentBody;
}

export interface TopicRef {
  topicId: string;
  topic: string;
  slug: string;
}

interface CollectionEntry {
  data: {
    id: string;
    title: string;
    date: Date;
    type: string;
    tags: string[];
    author?: string;
    image?: string;
    image_cropped?: string;
    thumbnail?: string;
    image_credit?: string;
    alt_text?: string;
    link?: string;
  };
  body?: string;
}

export function generateExcerpt(markdown: string, length = 140): string {
  // Use remark + strip-markdown to properly parse and extract plain text.
  // This handles all markdown syntax, embedded HTML (iframes, style blocks, etc.),
  // code blocks, and other content that regex-based stripping misses.
  const plain = String(excerptProcessor.processSync(markdown))
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= length) return plain;

  // Prune at word boundary, like Gatsby does
  const truncated = plain.slice(0, length);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

export function resolveContent(entry: CollectionEntry, topics: TopicRef[]): ContentModel {
  const { data } = entry;
  const contentId = data.id;
  const slug = `/content/${contentId}`;
  const title = data.title || '';
  const date = new Date(data.date);
  const type = data.type || 'article';
  const link = data.link;

  let url: string = slug;
  if (type === 'content-placeholder' && link) {
    url = link;
  }

  const image: ContentImage = {};
  if (data.image) {
    image.image = rewriteImage(data.image_cropped || data.image);
    image.thumbnail = rewriteImage(data.thumbnail || data.image);
    if (data.image_credit) image.credit = data.image_credit;
    if (data.alt_text) image.altText = data.alt_text;
  }

  const content: ContentModel = {
    contentId,
    slug,
    url,
    title,
    type,
    date,
    image,
    topics,
  };

  if (data.author) {
    content.author = { name: data.author };
  }

  if (link) {
    content.link = link;
  }

  if (entry.body) {
    content.content = {
      excerpt: generateExcerpt(entry.body),
    };
  }

  return content;
}
