import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
import type { ImageDownloadResult } from '../images';
import type { NormalizedRecord } from '../types';
import { asArray } from '../xml';

// Blogger / Google Takeout Atom export (spec.md §18, Phase I-2 checklist).
// Verified against a real parsed fixture
// (tests/fixtures/import/blogger/export.xml) before writing this — every
// entry (post, page, *and comment*) sits in one flat <entry> list,
// distinguished only by a `kind` category; get that filter wrong and a
// comment becomes a "post".

const KIND_SCHEME = 'http://schemas.google.com/g/2005#kind';
const LABEL_SCHEME = 'http://www.blogger.com/atom/ns#';

function textOf(node: unknown): string {
  if (node === undefined || node === null) return '';
  if (typeof node === 'object' && '#text' in (node as Record<string, unknown>)) {
    return String((node as Record<string, unknown>)['#text'] ?? '');
  }
  return String(node);
}

function createParser() {
  return new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => ['entry', 'category', 'link'].includes(name),
  });
}

/** The last URL path segment, minus its extension — Blogger has no separate slug field, the permalink is the closest thing. */
function slugFromUrl(url: string): string {
  const path = new URL(url).pathname;
  const last = path.split('/').filter(Boolean).pop() ?? '';
  return last.replace(/\.html?$/, '');
}

/**
 * A draft has no permalink yet — a Blogger entry with `app:draft` can be
 * missing its `<link rel="alternate">` entirely. Falling back to the raw
 * title (spaces, capitals, punctuation) would produce an invalid-looking
 * filename; this mirrors how a title becomes a slug everywhere else a
 * writer doesn't supply one explicitly.
 */
function slugFromTitle(title: string): string {
  // \p{L}\p{N} keeps every letter/number as-is, accented or not — this
  // project doesn't force non-Latin (or accented-Latin) text into ASCII
  // anywhere else (a Devanagari filename is a first-class slug), so a
  // title-derived fallback shouldn't either. Only real punctuation and
  // whitespace become hyphens.
  return (
    title
      .toLowerCase()
      .trim()
      .normalize('NFC')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  );
}

export function parseBloggerExport(exportPath: string): NormalizedRecord[] {
  const xml = readFileSync(exportPath, 'utf-8');
  const doc = createParser().parse(xml);
  const entries = asArray<Record<string, unknown>>(doc.feed.entry);

  const records: NormalizedRecord[] = [];

  for (const entry of entries) {
    const categories = asArray<Record<string, unknown>>(entry.category);
    const kind = categories.find((c) => c['@_scheme'] === KIND_SCHEME)?.['@_term'];
    const isPostOrPage =
      typeof kind === 'string' && (kind.endsWith('#post') || kind.endsWith('#page'));
    if (!isPostOrPage) {
      continue; // comments, and anything else (templates, settings) — ignored
    }

    const links = asArray<Record<string, unknown>>(entry.link);
    const originalUrl = String(links.find((l) => l['@_rel'] === 'alternate')?.['@_href'] ?? '');

    const labels = categories
      .filter((c) => c['@_scheme'] === LABEL_SCHEME)
      .map((c) => String(c['@_term']));

    const control = entry['app:control'] as { 'app:draft'?: string } | undefined;
    const isDraft = control?.['app:draft'] === 'yes';

    const author = entry.author as { name?: string } | undefined;

    records.push({
      kind: kind.endsWith('#post') ? 'post' : 'page',
      title: textOf(entry.title),
      date: new Date(String(entry.published)),
      slug: originalUrl ? slugFromUrl(originalUrl) : slugFromTitle(textOf(entry.title)),
      htmlBody: textOf(entry.content),
      categories: labels,
      tags: [],
      status: isDraft ? 'draft' : 'published',
      authorName: author?.name ?? '',
      originalUrl,
      // Blogger has no distinct "featured image" concept in the export —
      // spec.md §18's Blogger checklist doesn't ask for one, only for
      // fetching full-size renditions of whatever images are in the body
      // (see downloadFullSizeBloggerImage below).
    });
  }

  return records;
}

const SIZE_SEGMENT = /\/s\d+(-[a-z])?\//;

/** Blogger's blogspot image URLs encode a thumbnail size in the path (/s320/…) — /s0/ is Blogger's "original size" convention. */
export function toFullSizeUrl(url: string): string {
  return SIZE_SEGMENT.test(url) ? url.replace(SIZE_SEGMENT, '/s0/') : url;
}

/** Wraps a downloader so every Blogger image is fetched at full size, not the thumbnail rendition the body HTML happens to reference. */
export function withFullSizeImages(
  downloadImage: (url: string, dir: string, name: string) => Promise<ImageDownloadResult>,
) {
  return (url: string, dir: string, name: string) => downloadImage(toFullSizeUrl(url), dir, name);
}
