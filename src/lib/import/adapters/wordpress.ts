import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
import type { ImportStatus, NormalizedRecord, ReportedDrop } from '../types';
import { asArray, cdata } from '../xml';

// WordPress WXR (spec.md §18, Phase I-2 checklist). Verified against a
// real parsed fixture (tests/fixtures/import/wordpress/export.xml) before
// writing this — WXR wraps almost every field in CDATA, which
// fast-xml-parser represents as { '#cdata': value }, not a plain string;
// `cdata()` (src/lib/import/xml.ts) is what makes every field access
// below correct instead of accidentally reading "[object Object]".

const STATUS_MAP: Record<string, ImportStatus> = {
  publish: 'published',
  draft: 'draft',
  pending: 'draft',
  private: 'private',
  future: 'scheduled',
};

export interface Attachment {
  url: string;
  alt?: string;
}

export interface WordPressAdapterResult {
  records: NormalizedRecord[];
  drops: ReportedDrop[];
}

function createParser() {
  return new XMLParser({
    ignoreAttributes: false,
    cdataPropName: '#cdata',
    isArray: (name) =>
      ['item', 'category', 'wp:comment', 'wp:postmeta', 'wp:author'].includes(name),
  });
}

/** WordPress's block editor wraps every block in an HTML comment — not content, never shown to a reader. */
export function stripBlockEditorComments(html: string): string {
  return html.replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '');
}

/**
 * [embed], [caption], and [gallery] are WordPress-specific text
 * shortcodes, not HTML — turndown never sees them as anything but plain
 * text unless handled here first. [embed] and [caption] always convert
 * cleanly; a [gallery] image id that isn't in the attachments map is
 * reported and skipped, not guessed.
 */
export function resolveShortcodes(
  html: string,
  attachments: Map<string, Attachment>,
  postTitle: string,
  drops: ReportedDrop[],
): string {
  let result = html.replace(
    /\[embed\]([^[]+)\[\/embed\]/g,
    (_match, url: string) => `<p><a href="${url.trim()}">${url.trim()}</a></p>`,
  );

  result = result.replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/g, (_match, inner: string) => {
    const imgMatch = inner.match(/<img[^>]*>/);
    const img = imgMatch ? imgMatch[0] : '';
    const captionText = inner.replace(/<img[^>]*>/, '').trim();
    return captionText ? `${img}<p><em>${captionText}</em></p>` : img;
  });

  result = result.replace(/\[gallery\s+ids=["']([\d,\s]+)["']\s*\]/g, (_match, idsRaw: string) => {
    const ids = idsRaw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    const tags: string[] = [];
    for (const id of ids) {
      const attachment = attachments.get(id);
      if (attachment) {
        tags.push(`<img src="${attachment.url}" alt="${attachment.alt ?? ''}" />`);
      } else {
        drops.push({
          postTitle,
          construct: `a [gallery] image (attachment id ${id}) that could not be resolved`,
        });
      }
    }
    return tags.join('\n');
  });

  return result;
}

export function parseWordPressExport(exportPath: string): WordPressAdapterResult {
  const xml = readFileSync(exportPath, 'utf-8');
  const doc = createParser().parse(xml);
  const items = asArray<Record<string, unknown>>(doc.rss.channel.item);
  const authorsRaw = asArray<Record<string, unknown>>(doc.rss.channel['wp:author']);

  const authorNameByLogin = new Map<string, string>();
  for (const author of authorsRaw) {
    authorNameByLogin.set(
      cdata(author['wp:author_login']),
      cdata(author['wp:author_display_name']),
    );
  }

  const attachments = new Map<string, Attachment>();
  for (const item of items) {
    if (cdata(item['wp:post_type']) !== 'attachment') continue;
    const postId = String(item['wp:post_id']);
    const url = cdata(item['wp:attachment_url']);
    if (!url) continue;
    const meta = asArray<Record<string, unknown>>(item['wp:postmeta']);
    const altMeta = meta.find((m) => cdata(m['wp:meta_key']) === '_wp_attachment_image_alt');
    const alt = altMeta ? cdata(altMeta['wp:meta_value']) : '';
    attachments.set(postId, { url, alt: alt || undefined });
  }

  const drops: ReportedDrop[] = [];
  const records: NormalizedRecord[] = [];

  for (const item of items) {
    const postType = cdata(item['wp:post_type']);
    if (postType !== 'post' && postType !== 'page') continue; // attachments, nav_menu_item, etc. — ignored

    const title = String(item.title ?? '');
    const dateGmt = cdata(item['wp:post_date_gmt']);
    const date = dateGmt ? new Date(`${dateGmt.replace(' ', 'T')}Z`) : new Date(0);

    const categoryNodes = asArray<Record<string, unknown>>(item.category);
    const categories = categoryNodes
      .filter((c) => c['@_domain'] === 'category')
      .map((c) => cdata(c));
    const tags = categoryNodes.filter((c) => c['@_domain'] === 'post_tag').map((c) => cdata(c));

    const meta = asArray<Record<string, unknown>>(item['wp:postmeta']);
    const thumbnailMeta = meta.find((m) => cdata(m['wp:meta_key']) === '_thumbnail_id');
    const thumbnailId = thumbnailMeta ? cdata(thumbnailMeta['wp:meta_value']) : undefined;
    const featuredImage = thumbnailId ? attachments.get(thumbnailId) : undefined;

    const rawHtml = cdata(item['content:encoded']);
    const htmlBody = resolveShortcodes(
      stripBlockEditorComments(rawHtml),
      attachments,
      title,
      drops,
    );

    const login = cdata(item['dc:creator']);

    records.push({
      kind: postType === 'post' ? 'post' : 'page',
      title,
      date,
      slug: cdata(item['wp:post_name']),
      htmlBody,
      categories,
      tags,
      excerpt: cdata(item['excerpt:encoded']) || undefined,
      featuredImage,
      status: STATUS_MAP[cdata(item['wp:status'])] ?? 'draft',
      authorName: authorNameByLogin.get(login) ?? login,
      originalUrl: String(item.link ?? ''),
    });
    // wp:comment entries nested inside this item are never read past this
    // point — comments are a mission non-goal (spec.md §18, "Personal data").
  }

  return { records, drops };
}
