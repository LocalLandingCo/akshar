import type { ImageMetadata } from 'astro';
import siteConfig from '../../../site.config';
import type { CoverImage } from '../theme/contract';
import { absoluteUrl, withBase } from '../urls';

export interface ShareImage {
  url: string;
  alt: string;
}

/** The site-wide default share image, if configured (spec.md §9). Author-typed as a plain
 * public/ path (not processed by astro:assets), so it needs the base path prefixed by hand. */
export function siteShareImage(): ShareImage | undefined {
  return siteConfig.ogImage
    ? { url: absoluteUrl(withBase(siteConfig.ogImage)), alt: siteConfig.title }
    : undefined;
}

/**
 * A post's cover if it has one, else the site default — "a shared link must
 * preview as *that post*" (spec.md §9). Two forms (content.config.ts): a
 * processed astro:assets object, whose `.src` is already a base-aware build
 * output path (straight to `absoluteUrl`); or a plain CMS-uploaded
 * public-relative path, which needs `withBase` first — same as the site
 * default.
 */
export function postShareImage(cover?: CoverImage): ShareImage | undefined {
  if (cover) {
    const url =
      typeof cover.src === 'string'
        ? absoluteUrl(withBase(cover.src))
        : absoluteUrl((cover.src as ImageMetadata).src);
    return { url, alt: cover.alt };
  }
  return siteShareImage();
}
