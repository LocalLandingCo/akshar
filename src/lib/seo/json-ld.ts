import type { PostFull, SiteMeta } from '../theme/contract';

// Generated, never authored (spec.md §9). Plain objects — SEOHead.astro
// serializes them into <script type="application/ld+json">.

export function websiteJsonLd(site: SiteMeta, siteUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.title,
    description: site.description,
    url: siteUrl,
  };
}

export function personJsonLd(site: SiteMeta, siteUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.author.name,
    description: site.author.bio,
    url: siteUrl,
    sameAs: site.author.links.map((link) => link.url),
  };
}

export function blogPostingJsonLd(
  post: PostFull,
  site: SiteMeta,
  imageUrl?: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date.toISOString(),
    url: post.canonicalUrl,
    mainEntityOfPage: post.canonicalUrl,
    image: imageUrl,
    author: {
      '@type': 'Person',
      name: site.author.name,
    },
  };
}
