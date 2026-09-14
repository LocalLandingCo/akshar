import { suggestSectionsSnippet } from './sections';
import type { ImportSummary } from './types';

// spec.md §18, "The import report": a plain-language Markdown file for a
// helper who'll explain it to a writer, plus a separate URL-map CSV.
// Written outside content/ by the caller — this module only builds text.

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

export function buildReportMarkdown(summary: ImportSummary, allCategories: string[]): string {
  const lines: string[] = [];

  lines.push('# Import report', '');
  lines.push(
    'This file is for you and whoever set up this site — it never gets deployed. It explains what came across, what needs a look, and what to do next.',
    '',
  );

  lines.push('## Counts', '');
  lines.push(`- Posts imported: ${summary.postsImported}`);
  lines.push(`- Pages imported: ${summary.pagesImported}`);
  lines.push(`- Images imported: ${summary.imagesImported}`);
  if (summary.skipped.length > 0) {
    lines.push(`- Skipped: ${summary.skipped.length}`);
    for (const [reason, count] of countBy(summary.skipped, (s) => s.reason)) {
      lines.push(`  - ${reason}: ${count}`);
    }
  }
  lines.push('');

  lines.push('## Needs attention', '');
  const needsAttention =
    summary.imagesNeedingAttention.length +
    summary.slugCollisions.length +
    summary.draftsHeldBack.length;

  if (needsAttention === 0) {
    lines.push('Nothing — every post and image imported cleanly.', '');
  } else {
    if (summary.imagesNeedingAttention.length > 0) {
      lines.push('**Images:**', '');
      for (const image of summary.imagesNeedingAttention) {
        const reason = image.reason === 'no-alt-text' ? 'missing alt text' : 'download failed';
        lines.push(`- "${image.postTitle}" — ${reason}: ${image.url}`);
      }
      lines.push('');
    }
    if (summary.slugCollisions.length > 0) {
      lines.push('**Slug collisions:**', '');
      for (const collision of summary.slugCollisions) {
        lines.push(
          `- "${collision.postTitle}" — "${collision.originalSlug}" was already taken, used "${collision.resolvedSlug}" instead.`,
        );
      }
      lines.push('');
    }
    if (summary.draftsHeldBack.length > 0) {
      lines.push('**Held back (not public):**', '');
      for (const held of summary.draftsHeldBack) {
        lines.push(`- "${held.title}" — ${held.status}`);
      }
      lines.push('');
    }
  }

  lines.push('## Per-post changes', '');
  if (summary.drops.length === 0) {
    lines.push('Nothing was dropped — every post converted cleanly.', '');
  } else {
    const byPost = new Map<string, string[]>();
    for (const drop of summary.drops) {
      const list = byPost.get(drop.postTitle) ?? [];
      list.push(drop.construct);
      byPost.set(drop.postTitle, list);
    }
    for (const [title, constructs] of byPost) {
      lines.push(`- "${title}": removed ${constructs.join(', ')}.`);
    }
    lines.push('');
  }

  lines.push('## Suggested sections', '');
  const snippet = suggestSectionsSnippet(allCategories);
  if (snippet) {
    lines.push('Paste into `site.config.ts` if you want these as sections instead of tags:', '');
    lines.push('```ts', snippet, '```', '');
  } else {
    lines.push('No categories were found in the export.', '');
  }

  lines.push('## URL map', '');
  lines.push(
    `See the accompanying \`.csv\` file for the full old-URL → new-path mapping (${summary.urlMap.length} entries) — useful for setting up redirects on your old platform or your new host. Applying it is a manual step.`,
    '',
  );

  return lines.join('\n');
}

export function buildUrlMapCsv(summary: ImportSummary): string {
  const rows = ['oldUrl,newPath'];
  for (const entry of summary.urlMap) {
    rows.push(`${csvEscape(entry.oldUrl)},${csvEscape(entry.newPath)}`);
  }
  return rows.join('\n') + '\n';
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function emptySummary(): ImportSummary {
  return {
    postsImported: 0,
    pagesImported: 0,
    imagesImported: 0,
    skipped: [],
    draftsHeldBack: [],
    imagesNeedingAttention: [],
    drops: [],
    slugCollisions: [],
    urlMap: [],
  };
}
