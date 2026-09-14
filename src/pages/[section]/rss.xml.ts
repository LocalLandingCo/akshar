import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import siteConfig from '../../../site.config';
import { getSection, isVisible, sortByDateDesc } from '../../lib/content/posts';
import { buildFeedItems, feedBase } from '../../lib/rss';

export function getStaticPaths() {
  return siteConfig.sections.map((section) => ({ params: { section: section.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const sectionId = params.section;
  const sectionConfig = siteConfig.sections.find((s) => s.id === sectionId)!;
  const posts = sortByDateDesc(
    (await getCollection('posts')).filter(
      (post) => isVisible(post) && getSection(post) === sectionId,
    ),
  );
  return rss({
    ...feedBase,
    title: `${sectionConfig.label} · ${siteConfig.title}`,
    items: await buildFeedItems(posts),
  });
};
