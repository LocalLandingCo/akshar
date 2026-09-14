import type { CollectionEntry } from 'astro:content';
import siteConfig from '../../../site.config';
import { getNavigation } from '../navigation';
import { rssHref as buildRssHref } from '../urls';
import type { SiteMeta, UIStrings } from './contract';

/** Assembles the SiteMeta every layout receives, from site.config.ts + the theme's strings. */
export function buildSiteMeta(
  pages: CollectionEntry<'pages'>[],
  strings: UIStrings,
  currentPath?: string,
): SiteMeta {
  return {
    title: siteConfig.title,
    tagline: siteConfig.tagline,
    description: siteConfig.description,
    language: siteConfig.language,
    dir: siteConfig.dir,
    author: siteConfig.author,
    nav: getNavigation(pages, strings, currentPath),
    features: {
      search: siteConfig.features.search,
      archive: siteConfig.features.archive,
      rss: siteConfig.features.rss,
      readingTime: siteConfig.features.readingTime,
    },
    rssHref: siteConfig.features.rss ? buildRssHref() : undefined,
  };
}
