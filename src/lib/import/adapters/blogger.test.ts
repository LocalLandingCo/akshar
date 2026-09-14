import { describe, expect, it, vi } from 'vitest';
import { parseBloggerExport, toFullSizeUrl, withFullSizeImages } from './blogger';

const FIXTURE = 'tests/fixtures/import/blogger/export.xml';

describe('parseBloggerExport', () => {
  const records = parseBloggerExport(FIXTURE);

  it('extracts exactly the post and page entries, never the comment entry', () => {
    // 4 posts + 1 page = 5. The comment entry (kind#comment) must be excluded.
    expect(records).toHaveLength(5);
    expect(records.every((r) => r.kind === 'post' || r.kind === 'page')).toBe(true);
  });

  it('never surfaces the comment content or the commenter email anywhere', () => {
    const dump = JSON.stringify(records);
    expect(dump).not.toContain('Lovely piece');
    expect(dump).not.toContain('reader@example-writer.blogspot.test');
  });

  it('derives a slug from the alternate link URL', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.slug).toBe('on-owning-your-words');
  });

  it('puts Blogger labels into categories (tags stay empty — resolved downstream)', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.categories).toEqual(['Essays', 'ownership']);
    expect(post.tags).toEqual([]);
  });

  it('marks app:control/app:draft=yes as a draft, everything else as published', () => {
    expect(records.find((r) => r.title === 'On Owning Your Words')!.status).toBe('published');
    expect(records.find((r) => r.title === 'A Draft in Progress')!.status).toBe('draft');
  });

  it('derives a proper slug from the title for a draft with no permalink yet', () => {
    // A draft can have no <link rel="alternate"> at all — falling back to
    // the raw title would produce "A Draft in Progress" verbatim (spaces,
    // capitals) as a filename.
    const draft = records.find((r) => r.title === 'A Draft in Progress')!;
    expect(draft.slug).toBe('a-draft-in-progress');
  });

  it('parses the author name directly from the entry', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.authorName).toBe('Jane Writer');
  });

  it('parses a page entry (kind#page) as kind "page"', () => {
    const page = records.find((r) => r.title === 'About')!;
    expect(page.kind).toBe('page');
    expect(page.slug).toBe('about');
  });

  it('preserves a Devanagari post, including its label', () => {
    const post = records.find((r) => r.title === 'पाऊस')!;
    expect(post.categories).toContain('मराठी');
    expect(post.htmlBody).toContain('आभाळ आज जड झालं');
  });

  it('parses the published timestamp (with its timezone offset) correctly', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.date.toISOString()).toBe('2024-03-10T22:30:00.000Z'); // 14:30 -08:00
  });
});

describe('toFullSizeUrl', () => {
  it('rewrites a Blogger size segment to /s0/ (full size)', () => {
    expect(toFullSizeUrl('https://blogger.googleusercontent.com/img/a/s320/photo.jpg')).toBe(
      'https://blogger.googleusercontent.com/img/a/s0/photo.jpg',
    );
  });

  it('leaves a URL with no size segment unchanged', () => {
    const url = 'https://example.test/img/cover.jpg';
    expect(toFullSizeUrl(url)).toBe(url);
  });
});

describe('withFullSizeImages', () => {
  it('rewrites the URL before calling the wrapped downloader', async () => {
    const inner = vi.fn(async () => ({ ok: true, path: '/tmp/x.jpg' }));
    const wrapped = withFullSizeImages(inner);
    await wrapped('https://blogger.googleusercontent.com/img/a/s320/photo.jpg', '/tmp', 'x');
    expect(inner).toHaveBeenCalledWith(
      'https://blogger.googleusercontent.com/img/a/s0/photo.jpg',
      '/tmp',
      'x',
    );
  });
});
