import { describe, it, expect } from 'vitest';
import { resolveContent, generateExcerpt } from '../content';
import type { TopicRef } from '../content';

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: 'test-post',
      title: 'Test Post',
      date: new Date('2024-01-15'),
      type: 'article' as const,
      tags: ['javascript'],
      ...overrides,
    },
  };
}

const sampleTopics: TopicRef[] = [
  { topicId: 'uuid-js', topic: 'javascript', slug: '/topic/javascript' },
];

describe('resolveContent', () => {
  it('generates correct slug from contentId', () => {
    const result = resolveContent(makeEntry({ id: 'my-article' }), []);
    expect(result.slug).toBe('/content/my-article');
  });

  it('sets url to slug for articles', () => {
    const result = resolveContent(makeEntry(), sampleTopics);
    expect(result.url).toBe('/content/test-post');
  });

  it('sets url to link for content-placeholder type', () => {
    const result = resolveContent(
      makeEntry({ type: 'content-placeholder', link: 'https://example.com/external' }),
      [],
    );
    expect(result.url).toBe('https://example.com/external');
    expect(result.slug).toBe('/content/test-post');
  });

  it('preserves slug even when url differs for content-placeholder', () => {
    const result = resolveContent(
      makeEntry({ type: 'content-placeholder', link: 'https://example.com' }),
      [],
    );
    expect(result.slug).toBe('/content/test-post');
    expect(result.url).toBe('https://example.com');
  });

  it('falls back to slug as url when content-placeholder has no link', () => {
    const result = resolveContent(
      makeEntry({ type: 'content-placeholder' }),
      [],
    );
    expect(result.url).toBe('/content/test-post');
  });

  it('sets empty title when title is missing', () => {
    const result = resolveContent(makeEntry({ title: undefined }), []);
    expect(result.title).toBe('');
  });

  it('attaches topics to content model', () => {
    const result = resolveContent(makeEntry(), sampleTopics);
    expect(result.topics).toEqual(sampleTopics);
  });

  it('creates author when author field is present', () => {
    const result = resolveContent(makeEntry({ author: 'Alex Wilson' }), []);
    expect(result.author).toEqual({ name: 'Alex Wilson' });
  });

  it('omits author when not present', () => {
    const result = resolveContent(makeEntry(), []);
    expect(result.author).toBeUndefined();
  });

  it('resolves image fields with image_cropped taking priority', () => {
    const result = resolveContent(
      makeEntry({
        image: '/pictures/original.jpg',
        image_cropped: '/pictures/cropped.jpg',
        thumbnail: '/pictures/thumb.jpg',
        image_credit: 'Photo by Test',
        alt_text: 'Test image',
      }),
      [],
    );
    expect(result.image.image).toBe('https://media.alexwilson.tech/cropped.jpg');
    expect(result.image.thumbnail).toBe('https://media.alexwilson.tech/thumb.jpg');
    expect(result.image.credit).toBe('Photo by Test');
    expect(result.image.altText).toBe('Test image');
  });

  it('falls back to image when image_cropped is not present', () => {
    const result = resolveContent(
      makeEntry({ image: '/pictures/photo.jpg' }),
      [],
    );
    expect(result.image.image).toBe('https://media.alexwilson.tech/photo.jpg');
    expect(result.image.thumbnail).toBe('https://media.alexwilson.tech/photo.jpg');
  });

  it('returns empty image object when no image field', () => {
    const result = resolveContent(makeEntry(), []);
    expect(result.image).toEqual({});
  });

  it('preserves link field on content model', () => {
    const result = resolveContent(
      makeEntry({ link: 'https://example.com' }),
      [],
    );
    expect(result.link).toBe('https://example.com');
  });

  it('parses date correctly', () => {
    const result = resolveContent(makeEntry({ date: new Date('2024-06-15') }), []);
    expect(result.date.toISOString()).toBe('2024-06-15T00:00:00.000Z');
  });
});

describe('generateExcerpt', () => {
  it('returns plain text from markdown', () => {
    const md = '# Hello\n\nThis is a **bold** paragraph with a [link](http://example.com).';
    const result = generateExcerpt(md);
    expect(result).not.toContain('#');
    expect(result).not.toContain('**');
    expect(result).not.toContain('[');
    expect(result).toContain('bold');
    expect(result).toContain('link');
  });

  it('truncates at word boundary with ellipsis', () => {
    const md = 'word '.repeat(50); // 250 chars
    const result = generateExcerpt(md);
    expect(result.length).toBeLessThanOrEqual(141); // 140 + ellipsis char
    expect(result.endsWith('…')).toBe(true);
    expect(result.endsWith(' …')).toBe(false);
  });

  it('does not truncate short content', () => {
    const md = 'Short text.';
    const result = generateExcerpt(md);
    expect(result).toBe('Short text.');
    expect(result).not.toContain('…');
  });

  it('strips code blocks', () => {
    const md = 'Before code.\n\n```js\nconst x = 1;\n```\n\nAfter code.';
    const result = generateExcerpt(md);
    expect(result).not.toContain('const');
    expect(result).toContain('Before code.');
    expect(result).toContain('After code.');
  });

  it('strips HTML tags', () => {
    const md = 'Text with <em>HTML</em> inside.';
    const result = generateExcerpt(md);
    expect(result).not.toContain('<em>');
    expect(result).toContain('HTML');
  });

  it('strips image markup but keeps alt text', () => {
    const md = 'Before ![alt text](image.png) after.';
    const result = generateExcerpt(md);
    expect(result).not.toContain('image.png');
    expect(result).not.toContain('![');
    expect(result).toContain('Before');
    expect(result).toContain('alt text');
    expect(result).toContain('after.');
  });

  it('respects custom length parameter', () => {
    const md = 'word '.repeat(50);
    const result = generateExcerpt(md, 50);
    expect(result.length).toBeLessThanOrEqual(51);
  });

  it('strips embedded HTML blocks like iframes and style tags', () => {
    const md = `<style>.embed { position: relative; }</style>
<div class='embed-container'>
<iframe src="https://youtube.com/embed/abc" frameborder="0"></iframe>
</div>

Originally presented as a lightning talk.`;
    const result = generateExcerpt(md);
    expect(result).not.toContain('iframe');
    expect(result).not.toContain('style');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('Originally presented as a lightning talk.');
  });
});
