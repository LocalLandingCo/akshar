// The theme contract (spec.md §7): the core owns what pages exist, what data
// they get, and what URLs they have. The theme owns what they look like.
// A theme's layouts may consume ONLY these documented props — never read the
// filesystem, never parse content, never construct a URL by hand.
//
// This is a public, versioned promise (ADR-6). Changing a shape here is a
// breaking change for every theme.

export interface NavItem {
  label: string;
  href: string;
  /** True when this item represents the current page (for aria-current). */
  current?: boolean;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface SiteMeta {
  title: string;
  tagline?: string;
  description: string;
  language: string;
  dir: 'ltr' | 'rtl';
  author: {
    name: string;
    bio?: string;
    avatar?: string;
    links: LinkItem[];
  };
  nav: NavItem[];
  features: {
    search: boolean;
    archive: boolean;
    rss: boolean;
    readingTime: boolean;
  };
  rssHref?: string;
}

export interface TagRef {
  name: string;
  href: string;
}

export interface SectionRef {
  id: string;
  label: string;
  href: string;
}

export interface CoverImage {
  /**
   * Either an Astro-processed image reference (`astro:assets` — the
   * content schema's `image()` result) or a plain site-root-absolute
   * string path (what the hosted CMS's media uploads actually produce —
   * see content.config.ts). Typed `unknown` here to keep this contract
   * file free of Astro-internal asset types; a theme narrows it at the one
   * place it actually renders the cover, the same pattern used for
   * `Content` below. Only the processed form carries known dimensions.
   */
  src: unknown;
  alt: string;
  width?: number;
  height?: number;
}

/** What a post looks like in a list (home, section index, tag index, archive). */
export interface PostSummary {
  href: string;
  title: string;
  date: Date;
  excerpt: string;
  section: SectionRef;
  tags: TagRef[];
  cover?: CoverImage;
  readingTimeMinutes?: number;
}

/** What a single post page gets, in addition to everything in PostSummary. */
export interface PostFull extends PostSummary {
  /** The rendered body — an Astro component to render with `<Content />`. */
  Content: unknown;
  description: string;
  canonicalUrl: string;
}

export interface PageFull {
  href: string;
  title: string;
  description?: string;
  canonicalUrl: string;
  Content: unknown;
}

// -- UI strings -------------------------------------------------------------
// Every piece of interface text, as a table. Never hardcoded in a layout —
// that is what makes a non-English site possible without a fork (ADR-6).

export interface UIStrings {
  common: {
    noPostsYet: string;
  };
  nav: {
    homeLabel: string;
    archiveLabel: string;
    searchLabel: string;
    skipToContent: string;
  };
  post: {
    publishedOn: (date: string) => string;
    readingTime: (minutes: number) => string;
    tagsLabel: string;
  };
  section: {
    description: (label: string) => string;
  };
  archive: {
    title: string;
  };
  tag: {
    title: (tag: string) => string;
  };
  search: {
    title: string;
    inputLabel: string;
    placeholder: string;
    noJsMessage: string;
    noResults: string;
    prompt: string;
    /** Heading for the always-visible tag/archive browse section below the search box. */
    browseHeading: string;
  };
  notFound: {
    title: string;
    message: string;
    backHome: string;
  };
  footer: {
    rssLabel: string;
    builtWith: string;
  };
}
