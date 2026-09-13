import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { generatePageId, generatePostId } from './lib/content/id';

// Content model per spec.md §4. Astro content collections + Zod give us
// ADR-10 for free: a malformed post fails the build with a clear message
// instead of shipping a broken page.

const postSchema = z
  .object({
    title: z.string().min(1),
    date: z.coerce.date(),
    /** Overrides the filename-derived slug (spec.md §4). Section is always derived from the folder. */
    slug: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).default([]),
    /** Falls back to a derived summary of the body (src/lib/content/posts.ts). */
    excerpt: z.string().optional(),
    /** Path to an image in the repo. Becomes an optimized `image()` field in the image-pipeline phase. */
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    /** Excluded from production builds; previewable locally and in the editor. */
    draft: z.boolean().default(false),
    /** SEO/share description override; falls back to excerpt. */
    description: z.string().optional(),
  })
  .check((ctx) => {
    // Accessibility is enforced, not suggested (spec.md §4, §10).
    if (ctx.value.cover && !ctx.value.coverAlt) {
      ctx.issues.push({
        code: 'custom',
        message: 'coverAlt is required whenever cover is set.',
        path: ['coverAlt'],
        input: ctx.value.coverAlt,
      });
    }
  });

const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
});

const posts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './content/posts',
    generateId: generatePostId,
  }),
  schema: postSchema,
});

const pages = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './content/pages',
    generateId: generatePageId,
  }),
  schema: pageSchema,
});

export const collections = { posts, pages };
