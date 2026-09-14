import siteConfig from '../../../site.config';
import type { CoverImage } from '../theme/contract';
import { absoluteUrl, withBase } from '../urls';

export interface ShareImage {
  url: string;
  alt: string;
}

/** The site-wide default share image, if configured (spec.md §9). */
export function siteShareImage(): ShareImage | undefined {
  return siteConfig.ogImage
    ? { url: absoluteUrl(withBase(siteConfig.ogImage)), alt: siteConfig.title }
    : undefined;
}

/** A post's cover if it has one, else the site default — "a shared link must preview as *that post*" (spec.md §9). */
export function postShareImage(cover?: CoverImage): ShareImage | undefined {
  if (cover) return { url: absoluteUrl(withBase(cover.src)), alt: cover.alt };
  return siteShareImage();
}
