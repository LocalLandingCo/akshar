import { describe, expect, it, vi } from 'vitest';
import { buildPost, type BuildContext } from './build-post';
import { emptySummary } from './report';
import type { NormalizedRecord } from './types';

function stubDownloader() {
  return vi.fn(async (_url: string, dir: string, baseName: string) => ({
    ok: true,
    path: `${dir}/${baseName}-abc123.jpg`,
  }));
}

function baseRecord(overrides: Partial<NormalizedRecord> = {}): NormalizedRecord {
  return {
    kind: 'post',
    title: 'On Owning Your Words',
    date: new Date('2024-03-10T14:30:00Z'),
    slug: 'on-owning-your-words',
    htmlBody: '<p>Every piece you publish on a platform is a negotiation.</p>',
    categories: ['Essays'],
    tags: ['ownership'],
    status: 'published',
    authorName: 'Jane Writer',
    originalUrl: 'https://example-writer.wordpress.test/2024/03/10/on-owning-your-words/',
    ...overrides,
  };
}

function baseContext(overrides: Partial<BuildContext> = {}): BuildContext {
  return {
    contentDir: '/repo/content',
    defaultSectionId: 'posts',
    sectionMap: { Essays: 'essays', Poems: 'poems' },
    usedSlugs: new Map(),
    downloadImage: stubDownloader(),
    summary: emptySummary(),
    ...overrides,
  };
}

describe('buildPost', () => {
  it('writes a post under content/posts/<mapped-section>/<slug>.md', async () => {
    const ctx = baseContext();
    const file = await buildPost(baseRecord(), ctx);
    expect(file!.path.replace(/\\/g, '/')).toBe(
      '/repo/content/posts/essays/on-owning-your-words.md',
    );
    expect(ctx.summary.postsImported).toBe(1);
  });

  it('produces valid, parseable YAML frontmatter', async () => {
    const file = await buildPost(baseRecord(), baseContext());
    expect(file!.content).toMatch(/^---\n/);
    expect(file!.content).toContain('title: On Owning Your Words');
    expect(file!.content).toContain('date: 2024-03-10');
    expect(file!.content).toContain('- ownership');
  });

  it('does not duplicate a mapped category as a tag', async () => {
    const file = await buildPost(baseRecord({ categories: ['Essays'], tags: [] }), baseContext());
    expect(file!.content).not.toContain('Essays');
  });

  it('keeps an unmapped category as a tag instead of a section', async () => {
    const ctx = baseContext();
    const file = await buildPost(baseRecord({ categories: ['Ramblings'], tags: [] }), ctx);
    expect(file!.path.replace(/\\/g, '/')).toContain('/posts/posts/'); // falls back to default section
    expect(file!.content).toContain('- Ramblings');
  });

  it('marks anything other than published as draft, and reports it held back', async () => {
    const ctx = baseContext();
    const file = await buildPost(baseRecord({ status: 'private', title: 'A Private One' }), ctx);
    expect(file!.content).toContain('draft: true');
    expect(ctx.summary.draftsHeldBack).toEqual([{ title: 'A Private One', status: 'private' }]);
  });

  it('leaves a published post without a draft field at all', async () => {
    const file = await buildPost(baseRecord(), baseContext());
    expect(file!.content).not.toContain('draft');
  });

  it('sets cover + coverAlt only when the featured image has alt text', async () => {
    const withAlt = await buildPost(
      baseRecord({
        featuredImage: { url: 'https://example.test/cover.jpg', alt: 'A cover photo' },
      }),
      baseContext(),
    );
    expect(withAlt!.content).toContain('cover:');
    expect(withAlt!.content).toContain('coverAlt: A cover photo');
  });

  it('imports the image but omits cover/coverAlt when there is no alt text, and flags it', async () => {
    const ctx = baseContext();
    const file = await buildPost(
      baseRecord({ featuredImage: { url: 'https://example.test/cover.jpg' } }),
      ctx,
    );
    expect(file!.content).not.toContain('cover:');
    expect(ctx.summary.imagesNeedingAttention).toContainEqual({
      postTitle: 'On Owning Your Words',
      url: 'https://example.test/cover.jpg',
      reason: 'no-alt-text',
    });
    expect(ctx.summary.imagesImported).toBe(1); // still counted as imported
  });

  it('resolves a slug collision with a numeric suffix and reports it', async () => {
    const ctx = baseContext();
    ctx.usedSlugs.set('essays', new Set(['on-owning-your-words']));
    const file = await buildPost(baseRecord(), ctx);
    expect(file!.path.replace(/\\/g, '/')).toContain('on-owning-your-words-2.md');
    expect(ctx.summary.slugCollisions).toEqual([
      {
        postTitle: 'On Owning Your Words',
        originalSlug: 'on-owning-your-words',
        resolvedSlug: 'on-owning-your-words-2',
      },
    ]);
  });

  it('skips (and reports) a record from the wrong author when --author is set', async () => {
    const ctx = baseContext();
    const file = await buildPost(baseRecord({ authorName: 'Guest Author' }), ctx, 'Jane Writer');
    expect(file).toBeNull();
    expect(ctx.summary.skipped).toEqual([
      { title: 'On Owning Your Words', reason: 'wrong-author' },
    ]);
  });

  it('imports a record from the right author when --author is set', async () => {
    const file = await buildPost(
      baseRecord({ authorName: 'Jane Writer' }),
      baseContext(),
      'Jane Writer',
    );
    expect(file).not.toBeNull();
  });

  it('writes a page under content/pages/, with no date and no draft handling', async () => {
    const file = await buildPost(
      baseRecord({ kind: 'page', title: 'About', slug: 'about', categories: [], tags: [] }),
      baseContext(),
    );
    expect(file!.path.replace(/\\/g, '/')).toBe('/repo/content/pages/about.md');
    expect(file!.content).not.toContain('date:');
  });

  it('preserves Devanagari title, tags, and body through the whole pipeline', async () => {
    const file = await buildPost(
      baseRecord({
        title: 'पाऊस',
        slug: 'पाऊस',
        categories: ['Poems'],
        tags: ['मराठी'],
        htmlBody: '<p>आभाळ आज जड झालं.</p>',
      }),
      baseContext(),
    );
    expect(file!.path.replace(/\\/g, '/')).toContain('पाऊस.md');
    expect(file!.content).toContain('title: पाऊस');
    expect(file!.content).toContain('मराठी');
    expect(file!.content).toContain('आभाळ आज जड झालं');
  });

  it('records an old-URL → new-path entry for every record, post or page', async () => {
    const ctx = baseContext();
    await buildPost(baseRecord(), ctx);
    expect(ctx.summary.urlMap).toEqual([
      {
        oldUrl: 'https://example-writer.wordpress.test/2024/03/10/on-owning-your-words/',
        newPath: '/essays/on-owning-your-words/',
      },
    ]);
  });
});
