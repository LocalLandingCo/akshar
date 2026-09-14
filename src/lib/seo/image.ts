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
 * preview as *that post*" (spec.md §9). A cover's `.src` is already an
 * Astro-processed build output path (base-aware), unlike the site default —
 * it goes straight to `absoluteUrl`, no `withBase`.
 */
export function postShareImage(cover?: CoverImage): ShareImage | undefined {
  if (cover) {
    const { src } = cover.src as ImageMetadata;
    return { url: absoluteUrl(src), alt: cover.alt };
  }
  return siteShareImage();
}
