// Custom id generation for the content collections (src/content.config.ts).
//
// Deliberately not Astro's default: the default folds a `slug` frontmatter
// override into the *entire* entry id, which would lose the folder-derived
// section for any post that overrides its slug. Section and slug are
// independent per spec.md §4 ("folder → section", "filename → slug,
// overridable"), so they're derived independently here too.
//
// `entry` is always a posix-style relative path from Astro's glob loader —
// never split a raw filesystem path on "/" (tech-stack.md §3), but this is
// already normalized, so splitting it is safe.

interface GenerateIdOptions {
  entry: string;
  data: Record<string, unknown>;
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^./]+$/, '');
}

/** NFC-normalizes so visually identical slugs from different input sources compare equal. */
function normalizeSlug(raw: string): string {
  return raw.normalize('NFC');
}

function slugOverride(data: Record<string, unknown>): string | undefined {
  const { slug } = data;
  return typeof slug === 'string' && slug.trim() ? slug.trim() : undefined;
}

/**
 * Posts live at `content/posts/<section>/<file>.md` — exactly one folder
 * level deep. Returns an id of the form `<section>/<slug>`.
 */
export function generatePostId({ entry, data }: GenerateIdOptions): string {
  const parts = entry.split('/');
  const filename = parts.pop();
  if (!filename || parts.length !== 1) {
    throw new Error(
      `content/posts/${entry}: every post must live in exactly one section folder, ` +
        `e.g. content/posts/essays/my-post.md — got a path ${parts.length === 0 ? 'with no section folder' : 'nested too deep'}.`,
    );
  }
  const [section] = parts;
  const slug = normalizeSlug(slugOverride(data) ?? stripExtension(filename));
  return `${section}/${slug}`;
}

/** Pages live flat at `content/pages/<file>.md`. Returns the slug as the id. */
export function generatePageId({ entry, data }: GenerateIdOptions): string {
  if (entry.includes('/')) {
    throw new Error(
      `content/pages/${entry}: pages must be a file directly inside content/pages/, not a subfolder.`,
    );
  }
  return normalizeSlug(slugOverride(data) ?? stripExtension(entry));
}

/** Splits a post id (`"<section>/<slug>"`) back into its parts. */
export function parsePostId(id: string): { section: string; slug: string } {
  const i = id.indexOf('/');
  return { section: id.slice(0, i), slug: id.slice(i + 1) };
}
