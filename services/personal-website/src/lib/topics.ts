import { v5 } from 'uuid';

export interface Topic {
  topicId: string;
  topic: string;
  slug: string;
}

const NAMESPACE = v5('https://alexwilson.tech/topic/', v5.URL);

export function resolveTopics(tags: string[]): Topic[] {
  return tags.filter((tag) => tag.trim() !== '').map((tag) => ({
    topicId: v5(tag, NAMESPACE),
    slug: `/topic/${tag}`,
    topic: tag,
  }));
}

export function getAllTopics(entries: Array<{ data: { tags: string[] } }>): Topic[] {
  const seen = new Set<string>();
  const topics: Topic[] = [];
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      if (!seen.has(tag)) {
        seen.add(tag);
        topics.push(...resolveTopics([tag]));
      }
    }
  }
  return topics;
}
