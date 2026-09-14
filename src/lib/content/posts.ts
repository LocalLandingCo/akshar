import type { CollectionEntry } from 'astro:content';
import siteConfig from '../../../site.config';
import type { PostSummary } from '../theme/contract';
import { postHref, sectionHref, tagHref } from '../urls';
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

/**
 * A draft stays previewable locally and in the editor, and is excluded only
 * from an actual production build (spec.md §4) — `import.meta.env.PROD` is
 * true for `astro build`, false for `astro dev`. Use this (not
 * `isPublished` alone) everywhere a set of posts is enumerated: listings
 * and `getStaticPaths` alike, so a draft's page genuinely isn't built.
 */
export function isVisible(post: Post): boolean {
  return isPublished(post) || !import.meta.env.PROD;
}

export function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Every distinct tag across a set of posts, alphabetically. */
export function getAllTags(posts: Post[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.data.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
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

const WORDS_PER_MINUTE = 200;

/**
 * Approximate reading time by word count. Whitespace-delimited word
 * counting is correct for the MVP's primary scripts (Latin, Devanagari);
 * it undercounts for scripts without spaces between words (CJK), which is
 * a known limitation rather than a silent wrong answer.
 */
export function getReadingTimeMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Resolves a post entry into the plain data a theme layout is allowed to consume. */
export function toPostSummary(post: Post): PostSummary {
  const { section, slug } = parsePostId(post.id);
  const sectionConfig = siteConfig.sections.find((s) => s.id === section);
  const cover = post.data.cover;

  return {
    href: postHref(section, slug),
    title: post.data.title,
    date: post.data.date,
    excerpt: getExcerpt(post),
    section: { id: section, label: sectionConfig?.label ?? section, href: sectionHref(section) },
    tags: post.data.tags.map((tag) => ({ name: tag, href: tagHref(tag) })),
    cover: cover
      ? { src: cover, alt: post.data.coverAlt ?? '', width: cover.width, height: cover.height }
      : undefined,
    readingTimeMinutes: siteConfig.features.readingTime
      ? getReadingTimeMinutes(post.body ?? '')
      : undefined,
  };
}
