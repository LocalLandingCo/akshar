import { readFileSync } from 'node:fs';
import AdmZip from 'adm-zip';
import { parse as parseCsv } from 'csv-parse/sync';
import { XMLParser } from 'fast-xml-parser';
import { describe, expect, it } from 'vitest';

// Phase I-0's exit criterion is "fixtures committed" — this proves they're
// not just well-formed but actually readable by the tools ADR-13 picked,
// before Phase I-1 builds a real adapter against them. Fixture paths are
// relative to the project root (Vitest's default cwd).

const FIXTURES = 'tests/fixtures/import';

describe('WordPress WXR fixture', () => {
  const xml = readFileSync(`${FIXTURES}/wordpress/export.xml`, 'utf-8');
  const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: '#cdata' });
  const doc = parser.parse(xml);
  const items: unknown[] = doc.rss.channel.item;

  it('parses with fast-xml-parser and has every expected item', () => {
    expect(Array.isArray(items)).toBe(true);
    // 7 posts/pages + 1 attachment = 8 <item> elements.
    expect(items).toHaveLength(8);
  });

  it('includes a Devanagari post', () => {
    const titles = items.map((item) => (item as { title: string }).title);
    expect(titles).toContain('पाऊस');
  });

  it('includes a comment on the first post, nested (not a sibling item)', () => {
    const post = items[0] as { 'wp:comment': { 'wp:comment_content': unknown } };
    expect(post['wp:comment']).toBeDefined();
  });
});

describe('Blogger Atom fixture', () => {
  const xml = readFileSync(`${FIXTURES}/blogger/export.xml`, 'utf-8');
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const entries: unknown[] = doc.feed.entry;

  it('parses with fast-xml-parser and has every expected entry', () => {
    expect(Array.isArray(entries)).toBe(true);
    // 4 posts + 1 comment + 1 page = 6 <entry> elements.
    expect(entries).toHaveLength(6);
  });

  it('includes a Devanagari post', () => {
    const titles = entries.map((entry) => (entry as { title: unknown }).title);
    expect(titles).toContainEqual({ '#text': 'पाऊस', '@_type': 'text' });
  });

  it('marks the draft via app:control/app:draft', () => {
    const draft = entries.find(
      (entry) => (entry as { title: { '#text': string } }).title['#text'] === 'A Draft in Progress',
    ) as { 'app:control': { 'app:draft': string } };
    expect(draft['app:control']['app:draft']).toBe('yes');
  });
});

describe('Substack export fixture', () => {
  const zip = new AdmZip(`${FIXTURES}/substack/export.zip`);

  it('contains posts.csv, subscribers.csv, and one HTML file per post', () => {
    const names = zip.getEntries().map((entry) => entry.entryName);
    expect(names).toContain('posts.csv');
    expect(names).toContain('subscribers.csv');
    expect(
      names.filter((name) => name.startsWith('posts/') && name.endsWith('.html')),
    ).toHaveLength(5);
  });

  it('posts.csv parses with csv-parse and has every expected row', () => {
    const csv = zip.getEntry('posts.csv')!.getData().toString('utf-8');
    const rows = parseCsv(csv, { columns: true }) as Array<Record<string, string>>;
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.title)).toContain('पाऊस');
  });

  it('flags exactly one paid post and one unpublished draft', () => {
    const csv = zip.getEntry('posts.csv')!.getData().toString('utf-8');
    const rows = parseCsv(csv, { columns: true }) as Array<Record<string, string>>;
    expect(rows.filter((r) => r.audience === 'only_paid')).toHaveLength(1);
    expect(rows.filter((r) => r.is_published === 'false')).toHaveLength(1);
  });

  it('subscribers.csv is present but this test never reads its rows', () => {
    // The point being tested is restraint, not content — the adapter
    // (Phase I-3) must never parse this file at all. This test only
    // confirms the fixture *has* one, so the "never opened" guarantee
    // has something real to hold against.
    const entry = zip.getEntry('subscribers.csv');
    expect(entry).toBeTruthy();
    expect(entry!.header.size).toBeGreaterThan(0);
  });
});
