// The import contract (spec.md §18, Phase I-0). Every source adapter
// (WordPress, Blogger, Substack, and later Medium/Ghost) emits records in
// this one shape — the pipeline that turns a record into a real Akshar
// post/page (Phase I-1) is written once, against this, not once per
// source. docs/import.md is the human-readable description of this file;
// this file is authoritative if they ever disagree.

export type ImportKind = 'post' | 'page';

/**
 * What became of this item on the source platform. Anything other than
 * 'published' becomes `draft: true` on import — the writer decides what
 * goes public, never the importer (spec.md §18).
 */
export type ImportStatus = 'published' | 'draft' | 'private' | 'scheduled' | 'paid';

export interface ImportImage {
  /** The source URL, possibly on the old platform's own host. */
  url: string;
  /** Alt text or a caption, if the source provides one. Never invented (spec.md §18, §10). */
  alt?: string;
}

/**
 * The normalized intermediate record. A source adapter's only job is
 * producing these from a platform's export file — it never writes to
 * content/ itself, and never talks to the network except to fetch an
 * image URL this record names.
 */
export interface NormalizedRecord {
  kind: ImportKind;
  title: string;
  /** Always a real Date — timezone-aware parsing happens in the adapter, not downstream. */
  date: Date;
  /**
   * The source's own slug (from its URL or a dedicated field), percent-
   * decoded and NFC-normalized, but not otherwise modified — preserved so
   * old links stay recognizable (spec.md §18). Never empty: an adapter
   * that can't find one derives it from the title, the same way a
   * developer-writer's filename would.
   */
  slug: string;
  /** Raw HTML, not yet converted — the pipeline (Phase I-1) does that once, for every source. */
  htmlBody: string;
  /** Source categories — become tags by default, or map to a section (see docs/import.md). */
  categories: string[];
  /** Source tags, distinct from categories on platforms that have both (WordPress). */
  tags: string[];
  excerpt?: string;
  /** Only one — the platform's own "featured image" concept, not every image in the body. */
  featuredImage?: ImportImage;
  status: ImportStatus;
  /** Display name only — used for --author filtering, never written to output (spec.md §18, personal data). */
  authorName: string;
  /** The post's original URL on the source platform — feeds the URL-map CSV, never written to frontmatter. */
  originalUrl: string;
}

/** What the CLI accepts — see docs/import.md for the full behavior of each flag. */
export interface ImportOptions {
  source: 'wordpress' | 'blogger' | 'substack';
  exportPath: string;
  dryRun: boolean;
  overwrite: boolean;
  /** Only this author's records are imported; everyone else's are skipped and reported. */
  author?: string;
  /** Path to a JSON file mapping a source category name to a declared section id. */
  sectionMapPath?: string;
}

export type SkipReason =
  'wrong-author' | 'unsupported-content' | 'comment-ignored' | 'subscriber-data-ignored';

export interface ReportedImage {
  postTitle: string;
  url: string;
  reason: 'no-alt-text' | 'download-failed';
}

export interface ReportedDrop {
  postTitle: string;
  /** What was removed, in one phrase: "a <script> tag", "an <iframe> embed", "a WordPress [gallery] shortcode". */
  construct: string;
}

export interface SlugCollision {
  postTitle: string;
  originalSlug: string;
  resolvedSlug: string;
}

/** Everything the report (docs/import.md's "report format") is built from. */
export interface ImportSummary {
  postsImported: number;
  pagesImported: number;
  imagesImported: number;
  skipped: Array<{ title: string; reason: SkipReason }>;
  draftsHeldBack: Array<{ title: string; status: ImportStatus }>;
  imagesNeedingAttention: ReportedImage[];
  drops: ReportedDrop[];
  slugCollisions: SlugCollision[];
  /** Suggested sections aren't tracked here — src/lib/import/report.ts derives them fresh
   * from every category seen across the run (`suggestSectionsSnippet`), passed in separately. */
  urlMap: Array<{ oldUrl: string; newPath: string }>;
}
