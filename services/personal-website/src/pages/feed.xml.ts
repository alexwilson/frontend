import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { resolveContent } from '../lib/content';
import { resolveTopics } from '../lib/topics';
import {
  buildFeedItemUrl,
  buildFeedItemGuid,
  buildFeedItemContent,
  buildFeedItemAuthor,
} from '../lib/feed';

export async function GET(context: { site: URL }) {
  const allPosts = await getCollection('posts');

  const content = allPosts
    .map((entry) => {
      const topics = resolveTopics(entry.data.tags);
      return { ...resolveContent(entry, topics), entry };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return rss({
    title: "Alex Wilson's writing",
    description: 'Alex on engineering, products & everything in-between',
    site: context.site.toString(),
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
    },
    customData: `<atom:link rel="self" href="https://alexwilson.tech/feed.xml" type="application/rss+xml" />`,
    items: content.map((item) => {
      const itemUrl = buildFeedItemUrl(item);
      const guid = buildFeedItemGuid(item);
      const author = buildFeedItemAuthor(item);

      return {
        title: item.title,
        pubDate: item.date,
        link: itemUrl,
        description: item.title,
        author,
        customData: `<guid>${guid}</guid>`,
      };
    }),
  });
}
