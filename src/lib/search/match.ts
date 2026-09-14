import type { SearchEntry } from './index';

// Client-side matching (spec.md §17, ADR-8): simple field-weighted
// substring matching, no stemming or fuzzy logic — proportionate to a
// corpus of a few hundred documents. NFC normalization before comparison
// is the one genuinely load-bearing rule: the same visible character can
// arrive precomposed or as base + combining mark depending on whether it
// came from a CMS, a phone keyboard, or a paste, and an unnormalized
// comparison silently fails for a visually identical query.

export interface SearchResult {
  entry: SearchEntry;
  score: number;
}

const WEIGHTS = { title: 3, tags: 2, excerpt: 1 };

function normalize(text: string): string {
  return text.normalize('NFC').toLowerCase();
}

export function searchEntries(entries: SearchEntry[], rawQuery: string): SearchResult[] {
  const query = normalize(rawQuery).trim();
  if (!query) return [];

  const results: SearchResult[] = [];
  for (const entry of entries) {
    let score = 0;
    if (normalize(entry.title).includes(query)) score += WEIGHTS.title;
    if (entry.tags.some((tag) => normalize(tag).includes(query))) score += WEIGHTS.tags;
    if (normalize(entry.excerpt).includes(query)) score += WEIGHTS.excerpt;
    if (score > 0) results.push({ entry, score });
  }

  return results.sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date));
}
