import siteConfig from '../../site.config';

// The one place a URL gets constructed. Nothing else in this codebase —
// core or theme — builds a path by hand (spec.md §7, theme-contract rule 2;
// spec.md §8's anti-pattern list is exactly this done wrong).

/** Astro's configured base path, always with a trailing slash (e.g. "/" or "/my-site/"). */
const BASE = import.meta.env.BASE_URL;

function join(...segments: string[]): string {
  const path = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return path ? `${BASE}${path}/` : BASE;
}

export function homeHref(): string {
  return BASE;
}

export function pageHref(slug: string): string {
  return join(slug);
}

export function sectionHref(sectionId: string): string {
  return join(sectionId);
}

export function postHref(sectionId: string, slug: string): string {
  return join(sectionId, slug);
}

export function tagHref(tag: string): string {
  return join('tags', tag);
}

export function archiveHref(): string {
  return join('archive');
}

export function searchHref(): string {
  return join('search');
}

/** Section feeds live at `/<section>/rss.xml`; the site feed at `/rss.xml`. */
export function rssHref(sectionId?: string): string {
  return sectionId ? `${sectionHref(sectionId)}rss.xml` : `${BASE}rss.xml`;
}

/** Turns a site-relative href (already base-prefixed) into an absolute URL. */
export function absoluteUrl(href: string): string {
  return new URL(href, siteConfig.url).toString();
}
