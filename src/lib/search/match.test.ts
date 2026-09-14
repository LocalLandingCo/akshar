import { describe, expect, it } from 'vitest';
import type { SearchEntry } from './index';
import { searchEntries } from './match';

function entry(overrides: Partial<SearchEntry>): SearchEntry {
  return {
    title: 'Untitled',
    excerpt: '',
    tags: [],
    section: 'posts',
    sectionLabel: 'Posts',
    date: '2026-01-01T00:00:00.000Z',
    href: '/posts/untitled/',
    ...overrides,
  };
}

describe('searchEntries', () => {
  it('returns nothing for an empty or whitespace-only query', () => {
    const entries = [entry({ title: 'A Quiet Hour' })];
    expect(searchEntries(entries, '')).toEqual([]);
    expect(searchEntries(entries, '   ')).toEqual([]);
  });

  it('matches case-insensitively on title', () => {
    const entries = [entry({ title: 'A Quiet Hour' })];
    expect(searchEntries(entries, 'quiet')).toHaveLength(1);
  });

  it('matches on tags and excerpt too', () => {
    const entries = [
      entry({ title: 'One', tags: ['morning'] }),
      entry({ title: 'Two', excerpt: 'a poem about mornings' }),
      entry({ title: 'Three' }),
    ];
    const results = searchEntries(entries, 'morning');
    expect(results.map((r) => r.entry.title).sort()).toEqual(['One', 'Two']);
  });

  it('ranks a title match above an excerpt-only match', () => {
    const entries = [
      entry({ title: 'Ordinary Post', excerpt: 'mentions rain in passing' }),
      entry({ title: 'Rain', excerpt: 'a short piece' }),
    ];
    const results = searchEntries(entries, 'rain');
    expect(results[0].entry.title).toBe('Rain');
  });

  it('NFC-normalizes before comparing, so precomposed and decomposed forms match', () => {
    // "े" (U+0947) as a standalone combining mark vs. base + mark forming the same glyph.
    const precomposed = 'पाऊस'; // already NFC in source
    const decomposed = precomposed.normalize('NFD');
    const entries = [entry({ title: precomposed })];
    expect(searchEntries(entries, decomposed)).toHaveLength(1);
  });

  it('excludes entries with no match', () => {
    const entries = [entry({ title: 'A Quiet Hour' })];
    expect(searchEntries(entries, 'xyzzy')).toEqual([]);
  });
});
