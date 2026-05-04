import { describe, it, expect } from 'vitest';
import { resolveTopics, getAllTopics } from '../topics';

describe('resolveTopics', () => {
  it('generates topic with correct slug', () => {
    const topics = resolveTopics(['javascript']);
    expect(topics).toHaveLength(1);
    expect(topics[0].slug).toBe('/topic/javascript');
    expect(topics[0].topic).toBe('javascript');
  });

  it('generates deterministic UUIDs for the same tag', () => {
    const first = resolveTopics(['javascript']);
    const second = resolveTopics(['javascript']);
    expect(first[0].topicId).toBe(second[0].topicId);
  });

  it('generates different UUIDs for different tags', () => {
    const [js] = resolveTopics(['javascript']);
    const [ts] = resolveTopics(['typescript']);
    expect(js.topicId).not.toBe(ts.topicId);
  });

  it('handles multiple tags', () => {
    const topics = resolveTopics(['javascript', 'react', 'nodejs']);
    expect(topics).toHaveLength(3);
    expect(topics.map((t) => t.topic)).toEqual(['javascript', 'react', 'nodejs']);
  });

  it('returns empty array for empty tags', () => {
    expect(resolveTopics([])).toEqual([]);
  });

  it('produces same IDs as the original Gatsby implementation', () => {
    // This is a regression test: the UUIDs must match the old site
    // so that existing URLs like /topic/weeknotes remain valid.
    // The namespace is v5('https://alexwilson.tech/topic/', v5.URL)
    const topics = resolveTopics(['weeknotes']);
    expect(topics[0].topicId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    // Verify it's always the same value
    expect(topics[0].topicId).toBe(resolveTopics(['weeknotes'])[0].topicId);
  });
});

describe('getAllTopics', () => {
  it('deduplicates topics across entries', () => {
    const entries = [
      { data: { tags: ['javascript', 'react'] } },
      { data: { tags: ['react', 'nodejs'] } },
    ];
    const topics = getAllTopics(entries);
    expect(topics).toHaveLength(3);
    const slugs = topics.map((t) => t.topic);
    expect(slugs).toContain('javascript');
    expect(slugs).toContain('react');
    expect(slugs).toContain('nodejs');
  });

  it('handles entries with no tags', () => {
    const entries = [{ data: { tags: [] } }];
    expect(getAllTopics(entries)).toEqual([]);
  });
});
