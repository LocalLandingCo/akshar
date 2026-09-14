import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import type { SiteConfig } from '../site-config.schema';
import { generateDecapConfig } from './decap';
import { generatePagesCmsConfig } from './pages-cms';

function fakeSiteConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    url: 'https://example.test',
    base: '',
    title: 'Test Site',
    description: 'A test site.',
    language: 'en',
    dir: 'ltr',
    author: { name: 'Test Author', links: [] },
    sections: [{ id: 'essays', label: 'Essays' }],
    theme: { name: 'default', preset: 'kagad', tokens: {} },
    features: { search: true, archive: true, rss: true, rssFullContent: false, readingTime: true },
    ...overrides,
  } as SiteConfig;
}

describe('generatePagesCmsConfig', () => {
  it('produces valid YAML with the expected top-level shape', () => {
    const parsed = parse(generatePagesCmsConfig(fakeSiteConfig()));
    expect(parsed.media).toEqual({ input: 'public/images', output: '/images' });
    expect(parsed.content).toHaveLength(2); // posts-essays, pages
    expect(parsed.content[0].type).toBe('collection');
    expect(parsed.content[0].format).toBe('yaml-frontmatter');
  });

  it('marks title and body required, slug and excerpt optional', () => {
    const parsed = parse(generatePagesCmsConfig(fakeSiteConfig()));
    const fields = parsed.content[0].fields;
    const byName = Object.fromEntries(fields.map((f: { name: string }) => [f.name, f]));
    expect(byName.title.required).toBe(true);
    expect(byName.body.required).toBe(true);
    expect(byName.slug.required).toBeUndefined();
  });

  it('marks tags as a list field', () => {
    const parsed = parse(generatePagesCmsConfig(fakeSiteConfig()));
    const fields = parsed.content[0].fields;
    const tags = fields.find((f: { name: string }) => f.name === 'tags');
    expect(tags.list).toBe(true);
  });
});

describe('generateDecapConfig', () => {
  it('produces valid YAML with local_backend enabled', () => {
    const parsed = parse(generateDecapConfig(fakeSiteConfig()));
    expect(parsed.local_backend).toBe(true);
    expect(parsed.collections).toHaveLength(2);
  });

  it('uses the configured repository when set', () => {
    const parsed = parse(generateDecapConfig(fakeSiteConfig({ repository: 'acme/blog' })));
    expect(parsed.backend.repo).toBe('acme/blog');
  });

  it('falls back to a clearly-marked placeholder repo, with a warning comment, when unset', () => {
    const output = generateDecapConfig(fakeSiteConfig());
    const parsed = parse(output);
    expect(parsed.backend.repo).toBe('OWNER/REPO');
    expect(output).toContain('NOTE: site.config.ts has no `repository` set');
  });

  it('omits body from fields — Decap treats it as implicit for frontmatter format', () => {
    const parsed = parse(generateDecapConfig(fakeSiteConfig()));
    const names = parsed.collections[0].fields.map((f: { name: string }) => f.name);
    expect(names).not.toContain('body');
  });
});
