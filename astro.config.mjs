// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import siteConfig from './site.config.ts';

// The site URL and base path have exactly one definition — site.config.ts —
// and everything else (canonical URLs, OG tags, sitemap, feed, nav hrefs,
// the CMS config) derives from it. tech-stack.md ADR-9 names the opposite
// as the single largest source of coupling in the reference project.
export default defineConfig({
  site: siteConfig.url,
  base: siteConfig.base || undefined,
  trailingSlash: 'always',
  integrations: [
    // Drafts are excluded for free — they never have a route in a
    // production build (see isVisible/getStaticPaths). Search is a utility
    // page, not content, so it's filtered out here and noindex'd in its head.
    sitemap({
      filter: (page) => !page.includes('/search/'),
    }),
  ],
});
