import { defineCollection } from 'astro:content';
import type { SchemaContext } from 'astro/content/config';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { generatePageId, generatePostId } from './lib/content/id';

// Content model per spec.md §4. Astro content collections + Zod give us
// ADR-10 for free: a malformed post fails the build with a clear message
// instead of shipping a broken page.

// A function so the schema gets Astro's `image()` helper (SchemaContext) —
// it validates a cover reference resolves to a real image file relative to
// the entry (a missing image fails the build, spec.md §4) and returns
// processed metadata (`astro:assets`) ready for `<Image>`/`<Picture>`.
const postSchema = ({ image }: SchemaContext) =>
  z
    .object({
      title: z.string().min(1),
      date: z.coerce.date(),
      /** Overrides the filename-derived slug (spec.md §4). Section is always derived from the folder. */
      slug: z.string().min(1).optional(),
      // NFC-normalized so two visually identical tags from different input
      // sources (CMS, phone keyboard, paste) group onto the same tag page —
      // the same load-bearing rule as search (spec.md §17).
      tags: z
        .array(
          z
            .string()
            .min(1)
            .transform((tag) => tag.normalize('NFC')),
        )
        .default([]),
      /** Falls back to a derived summary of the body (src/lib/content/posts.ts). */
      excerpt: z.string().optional(),
      // Two forms, both real: a relative path next to the post (spec.md §4
      // Media — "alongside content") goes through astro:assets and gets
      // fully optimized (avif/webp/responsive srcset — see src/lib/seo and
      // the theme's Picture usage). A site-root-absolute path ("/images/…")
      // is what the hosted CMS actually produces — Pages CMS's and Decap/
      // Sveltia's media systems write a public-servable URL, which by
      // construction can't be a content-relative file astro:assets can
      // process at build time. Both are accepted so a cover uploaded
      // through /admin doesn't fail the build; only the former gets the
      // optimized <Picture> treatment.
      // Order matters: a plain absolute path must be checked FIRST. Zod's
      // union tries members in array order and stops at the first success
      // — but image()'s validator doesn't fail soft on a path it can't
      // resolve as a relative file, it throws immediately. Putting the
      // string check first means it never gets that far for a "/…" value.
      cover: z.union([z.string().startsWith('/'), image()]).optional(),
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
