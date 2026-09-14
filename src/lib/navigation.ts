import type { CollectionEntry } from 'astro:content';
import siteConfig from '../../site.config';
import type { NavItem, UIStrings } from './theme/contract';
import { archiveHref, homeHref, pageHref, searchHref, sectionHref } from './urls';

// Derived by default: Home, one entry per section, each page, plus
// search/archive where enabled (spec.md §4 "Navigation"). An explicit
// `navigation` list in site.config.ts overrides this entirely.
//
// Wording ("Home", "Archive", "Search") comes from the theme's UI strings,
// never hardcoded here — this module only decides *which links exist and
// where they point*, never what they're called.
export function getNavigation(
  pages: CollectionEntry<'pages'>[],
  strings: Pick<UIStrings, 'nav'>,
  currentPath?: string,
): NavItem[] {
  const items: NavItem[] = siteConfig.navigation
    ? [...siteConfig.navigation]
    : [
        { label: strings.nav.homeLabel, href: homeHref() },
        ...siteConfig.sections.map((section) => ({
          label: section.label,
          href: sectionHref(section.id),
        })),
        ...pages.map((page) => ({ label: page.data.title, href: pageHref(page.id) })),
        ...(siteConfig.features.archive
          ? [{ label: strings.nav.archiveLabel, href: archiveHref() }]
          : []),
        ...(siteConfig.features.search
          ? [{ label: strings.nav.searchLabel, href: searchHref() }]
          : []),
      ];

  if (!currentPath) return items;
  return items.map((item) => ({ ...item, current: item.href === currentPath }));
}
