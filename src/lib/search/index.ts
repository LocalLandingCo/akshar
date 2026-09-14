import type { PostSummary } from '../theme/contract';

// Build-time JSON index (spec.md §17): title, excerpt, tags, section, date,
// slug — never full bodies, which is what keeps the index a few KB and the
// zero-JS reading budget intact (it's fetched only on /search).

export interface SearchEntry {
  title: string;
  excerpt: string;
  tags: string[];
  section: string;
  sectionLabel: string;
  date: string;
  href: string;
}

export function toSearchEntry(post: PostSummary): SearchEntry {
  return {
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags.map((tag) => tag.name),
    section: post.section.id,
    sectionLabel: post.section.label,
    date: post.date.toISOString(),
    href: post.href,
  };
}
