import { describe, expect, it } from 'vitest';
import { deriveExcerpt, getReadingTimeMinutes } from './posts';

describe('deriveExcerpt', () => {
  it('returns short text unchanged', () => {
    expect(deriveExcerpt('A short poem.')).toBe('A short poem.');
  });

  it('strips markdown formatting', () => {
    const body = 'A line with **bold**, *italic*, `code`, and a [link](https://example.com).';
    expect(deriveExcerpt(body)).toBe('A line with bold, italic, code, and a link.');
  });

  it('replaces images with their alt text', () => {
    expect(deriveExcerpt('See ![a cat](cat.jpg) here.')).toBe('See a cat here.');
  });

  it('strips fenced code blocks entirely', () => {
    expect(deriveExcerpt('Before\n```js\nconst x = 1;\n```\nAfter')).toBe('Before After');
  });

  it('truncates at a word boundary and adds an ellipsis', () => {
    const body = 'word '.repeat(60).trim();
    const result = deriveExcerpt(body, 20);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
    expect(result.slice(0, -1).endsWith(' ')).toBe(false); // no dangling space before the ellipsis
  });

  it('collapses repeated whitespace', () => {
    expect(deriveExcerpt('Line one.\n\n\nLine   two.')).toBe('Line one. Line two.');
  });
});

describe('getReadingTimeMinutes', () => {
  it('rounds to the nearest minute at 200 words/minute', () => {
    expect(getReadingTimeMinutes('word '.repeat(400))).toBe(2);
  });

  it('never returns less than one minute for a non-empty body', () => {
    expect(getReadingTimeMinutes('a few words')).toBe(1);
  });

  it('treats an empty body as one minute, not zero', () => {
    expect(getReadingTimeMinutes('')).toBe(1);
  });
});
