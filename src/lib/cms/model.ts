import type { SiteConfig } from '../site-config.schema';

// The content model, described once, generically — Pages CMS's .pages.yml
// and the Decap/Sveltia config.yml are two YAML renderings of the same
// declarations (ADR-5: "two YAML declarations of the same content model —
// one generator, ~100 lines"). Neither renderer reads content.config.ts
// directly; this file is the thing that's kept in sync with it by hand,
// since Zod schemas and CMS field lists aren't automatically convertible.

export type CmsFieldType = 'string' | 'text' | 'markdown' | 'date' | 'boolean' | 'image' | 'tags';

export interface CmsField {
  name: string;
  label: string;
  type: CmsFieldType;
  required?: boolean;
  /** Shown as helper text in the editor. */
  description?: string;
}

export interface CmsCollection {
  /** Unique, stable id — not shown to the writer. */
  name: string;
  label: string;
  /** Content folder this collection reads/writes. */
  path: string;
  fields: CmsField[];
}

// Mirrors content.config.ts's postSchema. `body` is the one field every
// Markdown+frontmatter CMS treats specially (the file content below the
// frontmatter, not a frontmatter key) — both renderers know to handle it.
const postFields: CmsField[] = [
  { name: 'title', label: 'Title', type: 'string', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  {
    name: 'slug',
    label: 'Slug',
    type: 'string',
    description: 'Overrides the URL. Leave blank to derive it from the title.',
  },
  { name: 'tags', label: 'Tags', type: 'tags' },
  {
    name: 'excerpt',
    label: 'Excerpt',
    type: 'text',
    description: 'Shown in listings. Leave blank to derive one from the body.',
  },
  { name: 'cover', label: 'Cover image', type: 'image' },
  {
    name: 'coverAlt',
    label: 'Cover alt text',
    type: 'string',
    description: 'Required if a cover image is set.',
  },
  {
    name: 'draft',
    label: 'Draft',
    type: 'boolean',
    description: "Keeps this post off the live site until it's unchecked.",
  },
  {
    name: 'description',
    label: 'SEO description',
    type: 'text',
    description: 'Overrides the excerpt for search engines and share previews.',
  },
  { name: 'body', label: 'Body', type: 'markdown', required: true },
];

const pageFields: CmsField[] = [
  { name: 'title', label: 'Title', type: 'string', required: true },
  { name: 'slug', label: 'Slug', type: 'string' },
  { name: 'description', label: 'SEO description', type: 'text' },
  { name: 'body', label: 'Body', type: 'markdown', required: true },
];

/** One collection per configured section, plus one for pages — mirrors content.config.ts's two loaders. */
export function buildCmsCollections(siteConfig: SiteConfig): CmsCollection[] {
  const postCollections = siteConfig.sections.map((section): CmsCollection => ({
    name: `posts-${section.id}`,
    label: section.label,
    path: `content/posts/${section.id}`,
    fields: postFields,
  }));

  return [
    ...postCollections,
    { name: 'pages', label: 'Pages', path: 'content/pages', fields: pageFields },
  ];
}
