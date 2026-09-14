import { join } from 'node:path';
import { stringify } from 'yaml';
import { cleanAndConvert } from './html-to-markdown';
import type { ImageDownloadResult } from './images';
import { relativeImageRef } from './images';
import { resolveSection } from './sections';
import { normalizeSlug, resolveSlugCollision } from './slug';
import type { ImportSummary, NormalizedRecord } from './types';

export interface BuildContext {
  /** Absolute path to content/. */
  contentDir: string;
  defaultSectionId: string;
  sectionMap?: Record<string, string>;
  /** Section id -> slugs already used, seeded from existing files and updated as records are processed. */
  usedSlugs: Map<string, Set<string>>;
  downloadImage: (
    url: string,
    targetDir: string,
    preferredBaseName: string,
  ) => Promise<ImageDownloadResult>;
  summary: ImportSummary;
}

export interface BuiltFile {
  /** Absolute path this file should be written to. */
  path: string;
  content: string;
}

/**
 * Turns one record into a ready-to-write file (frontmatter + Markdown
 * body), updating `ctx.summary` and `ctx.usedSlugs` along the way.
 * Returns `null` when the record is filtered out entirely (wrong author)
 * — everything else, including a held-back draft, still gets written
 * (spec.md §18: drafts stay drafts, they aren't skipped).
 */
export async function buildPost(
  record: NormalizedRecord,
  ctx: BuildContext,
  authorFilter?: string,
): Promise<BuiltFile | null> {
  if (authorFilter && record.authorName !== authorFilter) {
    ctx.summary.skipped.push({ title: record.title, reason: 'wrong-author' });
    return null;
  }

  const isPost = record.kind === 'post';
  const baseSlug = normalizeSlug(record.slug || record.title);

  const sectionResult = isPost
    ? resolveSection(record.categories, ctx.sectionMap, ctx.defaultSectionId)
    : { sectionId: '', remainingCategories: record.categories };

  const slugKey = isPost ? sectionResult.sectionId : '__pages__';
  const usedInScope = ctx.usedSlugs.get(slugKey) ?? new Set<string>();
  const slug = resolveSlugCollision(baseSlug, usedInScope);
  if (slug !== baseSlug) {
    ctx.summary.slugCollisions.push({
      postTitle: record.title,
      originalSlug: baseSlug,
      resolvedSlug: slug,
    });
  }
  usedInScope.add(slug);
  ctx.usedSlugs.set(slugKey, usedInScope);

  const relativeDir = isPost ? join('posts', sectionResult.sectionId) : 'pages';
  const postDir = join(ctx.contentDir, relativeDir);

  const { markdown, drops, imagesNeedingAttention } = await cleanAndConvert(record.htmlBody, {
    postTitle: record.title,
    postDir,
    imageBaseName: slug,
    downloadImage: ctx.downloadImage,
  });
  ctx.summary.drops.push(...drops);
  ctx.summary.imagesNeedingAttention.push(...imagesNeedingAttention);

  const frontmatter: Record<string, unknown> = {
    title: record.title,
    ...(isPost ? { date: record.date.toISOString().slice(0, 10) } : {}),
  };

  if (isPost) {
    const tags = [
      ...new Set(
        [...sectionResult.remainingCategories, ...record.tags].map((t) => t.normalize('NFC')),
      ),
    ];
    if (tags.length > 0) frontmatter.tags = tags;
  }

  if (record.excerpt) frontmatter.excerpt = record.excerpt;

  if (record.featuredImage) {
    const result = await ctx.downloadImage(record.featuredImage.url, postDir, `${slug}-cover`);
    if (result.ok && result.path) {
      if (record.featuredImage.alt) {
        frontmatter.cover = relativeImageRef(postDir, result.path);
        frontmatter.coverAlt = record.featuredImage.alt;
        ctx.summary.imagesImported += 1;
      } else {
        // Still imported — the file is saved, just not wired up as `cover`
        // (spec.md §18: "the image is still imported"; §10: accessibility
        // is enforced, alt text is never invented).
        ctx.summary.imagesNeedingAttention.push({
          postTitle: record.title,
          url: record.featuredImage.url,
          reason: 'no-alt-text',
        });
        ctx.summary.imagesImported += 1;
      }
    } else {
      ctx.summary.imagesNeedingAttention.push({
        postTitle: record.title,
        url: record.featuredImage.url,
        reason: 'download-failed',
      });
    }
  }

  if (isPost && record.status !== 'published') {
    frontmatter.draft = true;
    ctx.summary.draftsHeldBack.push({ title: record.title, status: record.status });
  }

  ctx.summary.urlMap.push({
    oldUrl: record.originalUrl,
    newPath: isPost ? `/${sectionResult.sectionId}/${slug}/` : `/${slug}/`,
  });

  if (isPost) {
    ctx.summary.postsImported += 1;
  } else {
    ctx.summary.pagesImported += 1;
  }

  const frontmatterYaml = stringify(frontmatter).trimEnd();
  const content = `---\n${frontmatterYaml}\n---\n\n${markdown}\n`;

  return { path: join(postDir, `${slug}.md`), content };
}
