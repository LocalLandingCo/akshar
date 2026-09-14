import { describe, expect, it } from 'vitest';
import { parseSubstackExport } from './substack';

const FIXTURE = 'tests/fixtures/import/substack/export.zip';

describe('parseSubstackExport', () => {
  const { records, drops } = parseSubstackExport(FIXTURE);

  it('extracts every post except the audio-only episode', () => {
    // 6 rows in posts.csv, minus the podcast episode with no written content.
    expect(records).toHaveLength(5);
    expect(records.every((r) => r.kind === 'post')).toBe(true);
  });

  it('never opens or surfaces anything from subscribers.csv', () => {
    const dump = JSON.stringify(records) + JSON.stringify(drops);
    expect(dump).not.toContain('reader.one@example-writer.substack.test');
    expect(dump).not.toContain('reader.two@example-writer.substack.test');
    expect(dump).not.toContain('reader.three@example-writer.substack.test');
  });

  it('derives a slug from the HTML filename, not the title', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.slug).toBe('on-owning-your-words');
  });

  it('marks is_published=false as a draft', () => {
    const post = records.find((r) => r.title === 'A Draft in Progress')!;
    expect(post.status).toBe('draft');
  });

  it('marks only_paid audience as paid, not published', () => {
    const post = records.find((r) => r.title === 'For Paying Subscribers Only')!;
    expect(post.status).toBe('paid');
  });

  it('marks an everyone-audience, published row as published', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.status).toBe('published');
  });

  it('preserves a Devanagari post, title and body', () => {
    const post = records.find((r) => r.title === 'पाऊस')!;
    expect(post.slug).toBe('paaus');
    expect(post.htmlBody).toContain('आभाळ आज जड झालं');
  });

  it('carries the subtitle across as the excerpt', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.excerpt).toBe('A platform can change its terms; a folder of files cannot.');
  });

  it('leaves excerpt undefined when the row has no subtitle', () => {
    const post = records.find((r) => r.title === 'A Draft in Progress')!;
    expect(post.excerpt).toBeUndefined();
  });

  it('has no per-post author field — authorName is always empty', () => {
    expect(records.every((r) => r.authorName === '')).toBe(true);
  });

  it('carries the original post URL across', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.originalUrl).toBe('https://example-writer.substack.test/p/on-owning-your-words');
  });

  it('parses the post date as a real UTC Date', () => {
    const post = records.find((r) => r.title === 'On Owning Your Words')!;
    expect(post.date.toISOString()).toBe('2024-03-10T14:30:00.000Z');
  });

  it('reports the audio-only podcast episode as a drop, not an empty post', () => {
    expect(records.find((r) => r.title === 'Episode 12: A Conversation')).toBeUndefined();
    expect(drops).toEqual([
      {
        postTitle: 'Episode 12: A Conversation',
        construct: 'an audio-only episode with no written content',
      },
    ]);
  });
});
