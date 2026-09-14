import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isVisible, sortByDateDesc, toPostSummary } from '../lib/content/posts';
import { toSearchEntry } from '../lib/search';

export const GET: APIRoute = async () => {
  const posts = sortByDateDesc((await getCollection('posts')).filter(isVisible));
  const entries = posts.map(toPostSummary).map(toSearchEntry);
  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
