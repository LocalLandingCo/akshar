import { describe, expect, it } from 'vitest';
import type { SiteConfig } from '../site-config.schema';
import { buildCmsCollections } from './model';

function fakeSiteConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    url: 'https://example.test',
    base: '',
    title: 'Test Site',
    description: 'A test site.',
    language: 'en',
    dir: 'ltr',
    author: { name: 'Test Author', links: [] },
    sections: [
      { id: 'essays', label: 'Essays' },
      { id: 'poems', label: 'Poems' },
    ],
    theme: { name: 'default', preset: 'kagad', tokens: {} },
    features: { search: true, archive: true, rss: true, rssFullContent: false, readingTime: true },
    ...overrides,
  } as SiteConfig;
}

describe('buildCmsCollections', () => {
  it('creates one collection per section, plus one for pages', () => {
    const collections = buildCmsCollections(fakeSiteConfig());
    expect(collections.map((c) => c.name)).toEqual(['posts-essays', 'posts-poems', 'pages']);
  });

  it('points each post collection at its section folder', () => {
    const [essays, poems] = buildCmsCollections(fakeSiteConfig());
    expect(essays.path).toBe('content/posts/essays');
    expect(poems.path).toBe('content/posts/poems');
  });

  it('uses the section label as the collection label', () => {
    const [essays] = buildCmsCollections(fakeSiteConfig());
    expect(essays.label).toBe('Essays');
  });

  it('gives every post collection the same field set, including body', () => {
    const [essays, poems] = buildCmsCollections(fakeSiteConfig());
    const names = essays.fields.map((f) => f.name);
    expect(names).toEqual(poems.fields.map((f) => f.name));
    expect(names).toContain('title');
    expect(names).toContain('cover');
    expect(names).toContain('coverAlt');
    expect(names).toContain('body');
  });

  it('reflects a single-section config with just one post collection', () => {
    const collections = buildCmsCollections(
      fakeSiteConfig({ sections: [{ id: 'posts', label: 'Writing' }] }),
    );
    expect(collections.map((c) => c.name)).toEqual(['posts-posts', 'pages']);
  });
});
