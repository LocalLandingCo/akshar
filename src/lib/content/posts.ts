import type { CollectionEntry } from 'astro:content';
import { parsePostId } from './id';

export type Post = CollectionEntry<'posts'>;

export function getSection(post: Post): string {
  return parsePostId(post.id).section;
}

export function getSlug(post: Post): string {
  return parsePostId(post.id).slug;
}

/** A post never ships to production while `draft: true` (spec.md §4). */
export function isPublished(post: Post): boolean {
  return !post.data.draft;
}

const MARKDOWN_STRIP_PATTERNS: Array<[RegExp, string]> = [
  [/^---\n[\s\S]*?\n---\n/, ''], // stray frontmatter, defensive
  [/```[\s\S]*?```/g, ' '], // fenced code blocks
  [/`([^`]+)`/g, '$1'], // inline code
  [/!\[([^\]]*)]\([^)]*\)/g, '$1'], // images -> alt text
  [/\[([^\]]+)]\([^)]*\)/g, '$1'], // links -> label
  [/^#{1,6}\s+/gm, ''], // heading markers
  [/^>\s?/gm, ''], // blockquote markers
  [/[*_~]/g, ''], // remaining emphasis/strikethrough markers
];

/**
 * A plain-text summary of the body, for the excerpt fallback (spec.md §4)
 * and the search index (spec.md §17). Deliberately simple — this is a
 * fallback, not a rendering pipeline.
 */
export function deriveExcerpt(body: string, maxLength = 200): string {
  let text = body;
  for (const [pattern, replacement] of MARKDOWN_STRIP_PATTERNS) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const cut = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `${cut}…`;
}

/** The excerpt shown in listings and used as the SEO description fallback. */
export function getExcerpt(post: Post): string {
  return post.data.excerpt ?? deriveExcerpt(post.body ?? '');
}

/** The SEO/share description: explicit override, else the excerpt. */
export function getDescription(post: Post): string {
  return post.data.description ?? getExcerpt(post);
}
