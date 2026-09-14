import { distFileExists } from './dist';

/** Every `href="..."` value in an HTML string, in document order (attribute-value only, no dedup). */
export function extractHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const pattern = /href="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

/** Site-relative, on-origin hrefs only — not mailto:, not external http(s), not bare fragments. */
export function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

/** Resolves a site-relative href (as generated with trailingSlash: "always") to the dist/ file it should be. */
export function resolvesInDist(href: string): boolean {
  const withoutFragment = href.split('#')[0].split('?')[0];
  if (withoutFragment === '') return true; // "/#fragment"-only case, already handled by split
  const path = withoutFragment.endsWith('/') ? `${withoutFragment}index.html` : withoutFragment;
  return distFileExists(path);
}
