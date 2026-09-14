import AdmZip from 'adm-zip';
import { parse as parseCsv } from 'csv-parse/sync';
import type { ImportStatus, NormalizedRecord, ReportedDrop } from '../types';

// Substack export (spec.md §18, Phase I-3 checklist): a .zip of posts.csv
// (the index) + posts/<id>.<slug>.html (each body) + subscribers.csv,
// which this adapter never opens — see substack.test.ts's guard test for
// the enforced version of that promise, not just the omission below.

interface SubstackRow {
  post_id: string;
  post_date: string;
  title: string;
  subtitle: string;
  type: string;
  audience: string;
  is_published: string;
  post_url: string;
}

export interface SubstackAdapterResult {
  records: NormalizedRecord[];
  drops: ReportedDrop[];
}

function statusFor(row: SubstackRow): ImportStatus {
  if (row.is_published !== 'true') return 'draft';
  if (row.audience === 'only_paid' || row.audience === 'founding') return 'paid';
  return 'published';
}

/** Just enough to tell "no real writing here" from "has a body" — not a conversion step. */
function plainTextOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The HTML filename's slug segment: "2001.on-owning-your-words.html" -> "on-owning-your-words". */
function slugFromFilename(filename: string): string {
  return filename.replace(/^\d+\./, '').replace(/\.html?$/, '');
}

export function parseSubstackExport(exportPath: string): SubstackAdapterResult {
  const zip = new AdmZip(exportPath);
  const records: NormalizedRecord[] = [];
  const drops: ReportedDrop[] = [];

  const postsCsvEntry = zip.getEntry('posts.csv');
  if (!postsCsvEntry) return { records, drops };
  const rows = parseCsv(postsCsvEntry.getData().toString('utf-8'), {
    columns: true,
  }) as SubstackRow[];

  const htmlByPostId = new Map<string, { filename: string; content: string }>();
  for (const entry of zip.getEntries()) {
    if (!entry.entryName.startsWith('posts/') || !entry.entryName.endsWith('.html')) continue;
    const filename = entry.entryName.slice('posts/'.length);
    const postId = filename.split('.')[0];
    htmlByPostId.set(postId, { filename, content: entry.getData().toString('utf-8') });
  }

  for (const row of rows) {
    const html = htmlByPostId.get(row.post_id);
    const htmlBody = html?.content ?? '';

    // Audio/podcast episodes with no real written content aren't
    // representable as a post (spec.md §18, Phase I-3 checklist) —
    // reported and skipped, not guessed at or imported as an empty page.
    if (row.type === 'podcast' && !plainTextOf(htmlBody)) {
      drops.push({
        postTitle: row.title,
        construct: 'an audio-only episode with no written content',
      });
      continue;
    }

    const slug = html ? slugFromFilename(html.filename) : row.title;
    const date = row.post_date ? new Date(`${row.post_date.replace(' ', 'T')}Z`) : new Date(0);

    records.push({
      kind: 'post',
      title: row.title,
      date,
      slug,
      htmlBody,
      categories: [],
      tags: [],
      excerpt: row.subtitle || undefined,
      status: statusFor(row),
      authorName: '', // Substack's export has no per-post author field — single-author, spec.md §18
      originalUrl: row.post_url ?? '',
    });
  }

  return { records, drops };
}
