import { render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { RSSFeedItem } from '@astrojs/rss';
import siteConfig from '../../site.config';
import { getDescription, getSection, getSlug, type Post } from './content/posts';
import { postHref } from './urls';

// RSS 2.0 (spec.md §9). Summary feed by default; full-content is a config
// option (`features.rssFullContent`) because the HTML is already being
// rendered here — unlike a hand-rolled feed generator with no render path
// of its own. Full content needs Astro's experimental container API to turn
// a post's rendered `Content` component into an HTML string outside a page
// request; this is Astro's own documented way to do that for a feed.
export async function buildFeedItems(posts: Post[]): Promise<RSSFeedItem[]> {
  const container = siteConfig.features.rssFullContent ? await AstroContainer.create() : null;

  const items: RSSFeedItem[] = [];
  for (const post of posts) {
    let content: string | undefined;
    if (container) {
      const { Content } = await render(post);
      content = await container.renderToString(Content);
    }
    items.push({
      title: post.data.title,
      description: getDescription(post),
      pubDate: post.data.date,
      link: postHref(getSection(post), getSlug(post)),
      categories: post.data.tags,
      content,
    });
  }
  return items;
}

export const feedBase = {
  title: siteConfig.title,
  description: siteConfig.description,
  site: siteConfig.url,
};
