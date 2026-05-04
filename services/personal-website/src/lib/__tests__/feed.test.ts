import { describe, it, expect } from 'vitest';
import {
  buildFeedItemUrl,
  buildFeedItemGuid,
  buildFeedItemContent,
  buildFeedItemAuthor,
} from '../feed';
import type { FeedEntry } from '../feed';

function makeFeedEntry(overrides: Partial<FeedEntry> = {}): FeedEntry {
  return {
    title: 'Test Article',
    slug: '/content/test-article',
    url: '/content/test-article',
    date: new Date('2024-01-15'),
    ...overrides,
  };
}

describe('buildFeedItemUrl', () => {
  it('appends utm_source=feed to relative URLs', () => {
    const entry = makeFeedEntry({ url: '/content/test-article' });
    const result = buildFeedItemUrl(entry);
    expect(result).toBe(
      'https://alexwilson.tech/content/test-article?utm_source=feed',
    );
  });

  it('appends utm_source=feed to absolute URLs', () => {
    const entry = makeFeedEntry({ url: 'https://example.com/external' });
    const result = buildFeedItemUrl(entry);
    expect(result).toBe('https://example.com/external?utm_source=feed');
  });

  it('falls back to slug when url is falsy', () => {
    const entry = makeFeedEntry({ url: '', slug: '/content/fallback' });
    const result = buildFeedItemUrl(entry);
    expect(result).toBe(
      'https://alexwilson.tech/content/fallback?utm_source=feed',
    );
  });
});

describe('buildFeedItemGuid', () => {
  it('constructs guid from slug and site URL', () => {
    const entry = makeFeedEntry({ slug: '/content/test-article' });
    expect(buildFeedItemGuid(entry)).toBe(
      'https://alexwilson.tech/content/test-article',
    );
  });

  it('always uses slug, not url, for guid', () => {
    const entry = makeFeedEntry({
      slug: '/content/test-article',
      url: 'https://example.com/external',
    });
    expect(buildFeedItemGuid(entry)).toBe(
      'https://alexwilson.tech/content/test-article',
    );
  });
});

describe('buildFeedItemContent', () => {
  it('wraps content with read-more link', () => {
    const result = buildFeedItemContent(
      '<p>Some preview text</p>',
      'https://alexwilson.tech/content/test?utm_source=feed',
    );
    expect(result).toContain('Some preview text');
    expect(result).toContain('Read the full post here...');
    expect(result).toContain(
      'href="https://alexwilson.tech/content/test?utm_source=feed"',
    );
  });

  it('sanitizes HTML but allows img tags', () => {
    const result = buildFeedItemContent(
      '<img src="test.jpg" /><script>alert("xss")</script>',
      'https://example.com',
    );
    expect(result).toContain('<img');
    expect(result).not.toContain('<script>');
  });
});

describe('buildFeedItemAuthor', () => {
  it('returns author name when present', () => {
    const entry = makeFeedEntry({ author: { name: 'Alex Wilson' } });
    expect(buildFeedItemAuthor(entry)).toBe('Alex Wilson');
  });

  it('falls back to site title when no author', () => {
    const entry = makeFeedEntry();
    expect(buildFeedItemAuthor(entry)).toBe('Alex Wilson');
  });
});
