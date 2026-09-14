import type { APIRoute } from 'astro';
import { absoluteUrl, withBase } from '../lib/urls';

// Generated, not a static file in public/ — the sitemap URL derives from the
// same single site.config.ts definition as everything else (spec.md §9).
export const GET: APIRoute = () => {
  const sitemapUrl = absoluteUrl(withBase('sitemap-index.xml'));
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
