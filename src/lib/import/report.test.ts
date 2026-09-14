import { describe, expect, it } from 'vitest';
import { buildReportMarkdown, buildUrlMapCsv, emptySummary } from './report';

describe('buildReportMarkdown', () => {
  it('reports a clean import with nothing needing attention', () => {
    const summary = emptySummary();
    summary.postsImported = 3;
    const markdown = buildReportMarkdown(summary, ['Essays']);
    expect(markdown).toContain('Posts imported: 3');
    expect(markdown).toContain('Nothing — every post and image imported cleanly.');
  });

  it('lists images needing attention with their reason', () => {
    const summary = emptySummary();
    summary.imagesNeedingAttention.push({
      postTitle: 'On Owning Your Words',
      url: 'https://example.test/cover.jpg',
      reason: 'no-alt-text',
    });
    const markdown = buildReportMarkdown(summary, []);
    expect(markdown).toContain('missing alt text');
    expect(markdown).toContain('https://example.test/cover.jpg');
  });

  it('groups dropped constructs by post', () => {
    const summary = emptySummary();
    summary.drops.push(
      { postTitle: 'A Post', construct: 'a <script> tag' },
      { postTitle: 'A Post', construct: 'a tracking pixel' },
    );
    const markdown = buildReportMarkdown(summary, []);
    expect(markdown).toContain('"A Post": removed a <script> tag, a tracking pixel.');
  });

  it('includes a ready-to-paste sections snippet derived from every category', () => {
    const markdown = buildReportMarkdown(emptySummary(), ['Essays', 'Poems']);
    expect(markdown).toContain("{ id: 'essays', label: 'Essays' }");
    expect(markdown).toContain("{ id: 'poems', label: 'Poems' }");
  });

  it('never includes a subscriber email — the report only ever sees post-level data', () => {
    const summary = emptySummary();
    summary.postsImported = 5;
    const markdown = buildReportMarkdown(summary, ['Essays']);
    expect(markdown).not.toMatch(/[\w.]+@[\w.]+/);
  });
});

describe('buildUrlMapCsv', () => {
  it('produces a header row plus one row per URL', () => {
    const summary = emptySummary();
    summary.urlMap.push({ oldUrl: 'https://old.test/a/', newPath: '/essays/a/' });
    const csv = buildUrlMapCsv(summary);
    expect(csv).toBe('oldUrl,newPath\nhttps://old.test/a/,/essays/a/\n');
  });

  it('quotes a value containing a comma', () => {
    const summary = emptySummary();
    summary.urlMap.push({ oldUrl: 'https://old.test/a,b/', newPath: '/essays/a/' });
    const csv = buildUrlMapCsv(summary);
    expect(csv).toContain('"https://old.test/a,b/"');
  });
});
