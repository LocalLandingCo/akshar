import { z } from 'zod';

// The single source of truth for everything spec.md §8 says must be a config
// change, never a core edit: identity, language, sections, navigation, theme,
// and feature toggles. `site.config.ts` at the repo root is validated against
// this at build time — a malformed config fails loudly (ADR-10's philosophy
// applied to config, not just content).

const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

const authorSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  links: z.array(linkSchema).default([]),
});

const sectionSchema = z.object({
  /** URL segment and content/posts/ folder name. */
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'section id must be lowercase letters, digits, and hyphens only'),
  label: z.string().min(1),
  description: z.string().optional(),
});

const navItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const featuresFields = {
  search: z.boolean().default(true),
  archive: z.boolean().default(true),
  rss: z.boolean().default(true),
  /** Full post HTML in the feed, not just a summary (spec.md §9). */
  rssFullContent: z.boolean().default(false),
  readingTime: z.boolean().default(true),
};
const featuresObject = z.object(featuresFields);
// The container's own default (used when `features` is omitted entirely) is
// derived by parsing `{}` through the field-level defaults above, so the
// "on by default" values live in exactly one place.
const featuresSchema = featuresObject.default(featuresObject.parse({}));

const analyticsSchema = z
  .object({
    /** A single privacy-respecting, cookieless script tag. Off by default (spec.md §16). */
    enabled: z.literal(true),
    src: z.string().min(1),
    /** Extra attributes the script tag needs — e.g. `data-website-id` for some providers. */
    attributes: z.record(z.string(), z.string()).default({}),
  })
  .optional();

const themeSchema = z.object({
  name: z.string().min(1).default('default'),
  preset: z.string().min(1),
  /** Individual token overrides on top of the chosen preset (spec.md §7 — "the personality"). */
  tokens: z.record(z.string(), z.string()).default({}),
});

/** Reserved top-level URL segments — a section id or page slug colliding with
 * one of these would shadow or be shadowed by a core route (spec.md §7: the
 * core owns what routes exist). Checked here for sections; pages are
 * checked at content-load time since page slugs aren't known to this schema. */
export const RESERVED_SLUGS = ['tags', 'archive', 'search'] as const;

export const siteConfigSchema = z
  .object({
    /** Absolute site URL, no trailing slash. Everything derives from this (ADR-9). */
    url: z.url().refine((v) => !v.endsWith('/'), 'url must not have a trailing slash'),
    /** Sub-path deployment, e.g. "/my-site". Root-served ("") is the default assumption (§13). */
    base: z
      .string()
      .default('')
      .refine((v) => v === '' || (v.startsWith('/') && !v.endsWith('/')), {
        message: 'base must be empty or start with "/" and not end with "/"',
      }),
    title: z.string().min(1),
    tagline: z.string().optional(),
    description: z.string().min(1),
    /** Default share image (site-relative path under public/), used when a post has no cover (spec.md §9). */
    ogImage: z.string().optional(),
    /** BCP-47 language tag — drives <html lang> (spec.md §9, a correctness requirement). */
    language: z.string().min(1),
    dir: z.enum(['ltr', 'rtl']).default('ltr'),
    author: authorSchema,
    /** Default: a single "posts" section — a writer who never thinks about sections gets one flat blog. */
    sections: z
      .array(sectionSchema)
      .min(1)
      .default([{ id: 'posts', label: 'Writing' }]),
    /** Explicit nav overrides the derived Home + sections + pages order. */
    navigation: z.array(navItemSchema).optional(),
    theme: themeSchema,
    features: featuresSchema,
    analytics: analyticsSchema,
  })
  .superRefine((config, ctx) => {
    const ids = new Set<string>();
    for (const [i, section] of config.sections.entries()) {
      if (ids.has(section.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate section id "${section.id}"`,
          path: ['sections', i, 'id'],
        });
      }
      ids.add(section.id);
      if ((RESERVED_SLUGS as readonly string[]).includes(section.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `section id "${section.id}" collides with a reserved core route (${RESERVED_SLUGS.join(', ')})`,
          path: ['sections', i, 'id'],
        });
      }
    }
  });

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type Section = z.infer<typeof sectionSchema>;

/**
 * Validates a site config object and returns it typed. Called from
 * `site.config.ts` itself, so a malformed config fails at build/dev-server
 * start with a clear message — never silently, per ADR-10's philosophy
 * extended to configuration.
 */
export function defineSiteConfig(config: z.input<typeof siteConfigSchema>): SiteConfig {
  const result = siteConfigSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`site.config.ts is invalid:\n${issues}`);
  }
  return result.data;
}
