import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isVisible, sortByDateDesc } from '../lib/content/posts';
import { buildFeedItems, feedBase } from '../lib/rss';

export const GET: APIRoute = async () => {
  const posts = sortByDateDesc((await getCollection('posts')).filter(isVisible));
  return rss({ ...feedBase, items: await buildFeedItems(posts) });
};
