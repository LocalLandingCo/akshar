import { describe, expect, it } from 'vitest';
import { generatePageId, generatePostId, parsePostId } from './id';

describe('generatePostId', () => {
  it('derives section from the folder and slug from the filename', () => {
    expect(generatePostId({ entry: 'essays/my-first-post.md', data: {} })).toBe(
      'essays/my-first-post',
    );
  });

  it('honors a slug override without losing the folder-derived section', () => {
    expect(generatePostId({ entry: 'essays/old-name.md', data: { slug: 'new-stable-slug' } })).toBe(
      'essays/new-stable-slug',
    );
  });

  it('ignores a blank slug override and falls back to the filename', () => {
    expect(generatePostId({ entry: 'essays/my-post.md', data: { slug: '   ' } })).toBe(
      'essays/my-post',
    );
  });

  it('NFC-normalizes the slug', () => {
    // "े" as a combining mark (base + combining vowel sign) vs. its precomposed form.
    const decomposed = 'entry-े'; // combining vowel sign E
    const id = generatePostId({ entry: `essays/${decomposed}.md`, data: {} });
    expect(id).toBe(`essays/${decomposed}`.normalize('NFC'));
  });

  it('rejects a post with no section folder', () => {
    expect(() => generatePostId({ entry: 'my-post.md', data: {} })).toThrow(/section folder/);
  });

  it('rejects a post nested more than one folder deep', () => {
    expect(() => generatePostId({ entry: 'essays/2024/my-post.md', data: {} })).toThrow(
      /nested too deep/,
    );
  });
});

describe('generatePageId', () => {
  it('uses the filename as the id', () => {
    expect(generatePageId({ entry: 'about.md', data: {} })).toBe('about');
  });

  it('honors a slug override', () => {
    expect(generatePageId({ entry: 'about.md', data: { slug: 'about-me' } })).toBe('about-me');
  });

  it('rejects a page nested in a subfolder', () => {
    expect(() => generatePageId({ entry: 'legal/about.md', data: {} })).toThrow(/subfolder/);
  });
});

describe('parsePostId', () => {
  it('splits an id back into section and slug', () => {
    expect(parsePostId('essays/my-first-post')).toEqual({
      section: 'essays',
      slug: 'my-first-post',
    });
  });

  it('keeps the slug intact when it itself contains a slash', () => {
    // Not a case the generators produce today, but the split must stay
    // "first slash only" if a nested-slug feature ever appears.
    expect(parsePostId('essays/a/b')).toEqual({ section: 'essays', slug: 'a/b' });
  });
});
