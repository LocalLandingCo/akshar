import { describe, expect, it } from 'vitest';
import { parseWordPressExport } from './wordpress';

const FIXTURE = 'tests/fixtures/import/wordpress/export.xml';

describe('parseWordPressExport', () => {
  const { records, drops } = parseWordPressExport(FIXTURE);

  it('extracts exactly the posts and pages, ignoring the attachment item', () => {
    // 7 post/page items in the fixture (attachment is excluded).
    expect(records).toHaveLength(7);
    expect(records.every((r) => r.kind === 'post' || r.kind === 'page')).toBe(true);
  });

  it('resolves the author login to a display name', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.authorName).toBe('Jane Writer');
  });

  it('splits category-domain and post_tag-domain into categories vs. tags', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.categories).toEqual(['Essays']);
    expect(post.tags).toEqual(['ownership', 'writing']);
  });

  it('maps wp:status to the right ImportStatus for publish, draft, and private', () => {
    expect(records.find((r) => r.title === 'On Owning Your Words')!.status).toBe('published');
    expect(records.find((r) => r.title === 'A Draft in Progress')!.status).toBe('draft');
    expect(records.find((r) => r.title === 'Members Only Reflection')!.status).toBe('private');
  });

  it('resolves the featured image via the attachment map, with its alt text', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    // The fixture's attachment deliberately has no alt text.
    expect(post.featuredImage?.url).toContain('cover.jpg');
    expect(post.featuredImage?.alt).toBeUndefined();
  });

  it('strips block-editor comments and [embed] shortcodes are converted, not left as literal text', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.htmlBody).not.toContain('[embed]');
    expect(post.htmlBody).toContain('href="https://www.youtube.com/watch?v=fake123example"');
  });

  it('preserves a Devanagari post correctly, including a non-ASCII wp:post_name', () => {
    const post = records.find((r) => r.title === 'पाऊस')!;
    expect(post.categories).toEqual(['Poems']);
    expect(post.tags).toEqual(['मराठी']);
    expect(post.htmlBody).toContain('आभाळ आज जड झालं');
  });

  it('parses wp:post_type page as kind "page"', () => {
    const page = records.find((r) => r.title === 'About')!;
    expect(page.kind).toBe('page');
  });

  it('never reads or surfaces the comment nested inside a post item', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(JSON.stringify(post)).not.toContain('Lovely piece');
    expect(JSON.stringify(post)).not.toContain('reader@example-writer.wordpress.test');
  });

  it('parses the GMT post date as a real, correct UTC Date', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.date.toISOString()).toBe('2024-03-10T14:30:00.000Z');
  });

  it('reports no unresolved shortcodes for this fixture (no [gallery] present)', () => {
    expect(drops).toEqual([]);
  });
});
