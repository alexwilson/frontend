import { describe, it, expect } from 'vitest';
import { findRelatedArticles } from '../related-articles';
import type { ContentModel } from '../content';

function makeArticle(
  id: string,
  topicNames: string[],
  overrides: Partial<ContentModel> = {},
): ContentModel {
  return {
    contentId: id,
    title: `Article ${id}`,
    slug: `/content/${id}`,
    url: `/content/${id}`,
    type: 'article',
    date: new Date('2024-01-01'),
    image: {},
    topics: topicNames.map((t) => ({
      topicId: t,
      topic: t,
      slug: `/topic/${t}`,
    })),
    ...overrides,
  };
}

describe('findRelatedArticles', () => {
  it('returns articles with matching topics', () => {
    const current = makeArticle('current', ['javascript', 'react']);
    const related = makeArticle('related', ['javascript', 'react']);
    const unrelated = makeArticle('unrelated', ['python']);

    const result = findRelatedArticles(current, [current, related, unrelated]);
    expect(result.map((a) => a.contentId)).toContain('related');
  });

  it('does not include the current article', () => {
    const current = makeArticle('current', ['javascript']);
    const other = makeArticle('other', ['javascript']);

    const result = findRelatedArticles(current, [current, other]);
    expect(result.map((a) => a.contentId)).not.toContain('current');
  });

  it('respects maxArticles limit', () => {
    const current = makeArticle('current', ['javascript']);
    const articles = [
      current,
      makeArticle('a', ['javascript']),
      makeArticle('b', ['javascript']),
      makeArticle('c', ['javascript']),
      makeArticle('d', ['javascript']),
    ];

    const result = findRelatedArticles(current, articles, 2);
    expect(result).toHaveLength(2);
  });

  it('defaults to max 3 articles', () => {
    const current = makeArticle('current', ['javascript']);
    const articles = [
      current,
      makeArticle('a', ['javascript']),
      makeArticle('b', ['javascript']),
      makeArticle('c', ['javascript']),
      makeArticle('d', ['javascript']),
    ];

    const result = findRelatedArticles(current, articles);
    expect(result).toHaveLength(3);
  });

  it('prefers articles with higher topic similarity', () => {
    const current = makeArticle('current', ['javascript', 'react', 'nodejs']);
    const highMatch = makeArticle('high', ['javascript', 'react', 'nodejs']);
    const lowMatch = makeArticle('low', ['javascript']);

    const result = findRelatedArticles(current, [current, lowMatch, highMatch]);
    expect(result[0].contentId).toBe('high');
  });

  it('deprioritizes weeknotes in non-weeknote context', () => {
    const current = makeArticle('current', ['javascript']);
    const weeknote = makeArticle('wn', ['weeknotes', 'javascript']);
    const regular = makeArticle('regular', ['javascript']);

    const result = findRelatedArticles(current, [current, weeknote, regular]);
    // Regular should appear before weeknote
    const regularIdx = result.findIndex((a) => a.contentId === 'regular');
    const weeknoteIdx = result.findIndex((a) => a.contentId === 'wn');
    if (weeknoteIdx >= 0) {
      expect(regularIdx).toBeLessThan(weeknoteIdx);
    }
  });

  it('includes previous weeknote when current is a weeknote', () => {
    const current = makeArticle('wn-2', ['weeknotes'], {
      date: new Date('2024-02-01'),
    });
    const previousWn = makeArticle('wn-1', ['weeknotes'], {
      date: new Date('2024-01-15'),
    });
    const unrelated = makeArticle('other', ['python']);

    const result = findRelatedArticles(current, [current, previousWn, unrelated]);
    expect(result[0].contentId).toBe('wn-1');
  });

  it('returns empty array when no related articles exist', () => {
    const current = makeArticle('current', ['unique-topic']);
    const result = findRelatedArticles(current, [current]);
    expect(result).toEqual([]);
  });

  it('still finds articles even with zero topic overlap at lowest granularity', () => {
    const current = makeArticle('current', ['javascript']);
    const noOverlap = makeArticle('other', ['python']);

    const result = findRelatedArticles(current, [current, noOverlap]);
    // At granularity 0, any article matches
    expect(result).toHaveLength(1);
    expect(result[0].contentId).toBe('other');
  });
});
