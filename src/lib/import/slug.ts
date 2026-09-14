// spec.md §18: "Slugs are preserved from the source so URLs stay
// recognizable. Non-Latin slugs are percent-decoded and NFC-normalized,
// never stripped to empty; collisions get a numeric suffix and are
// reported." This is the whole of that rule, in one small module so every
// adapter (and the pipeline) shares exactly one implementation of it.

/** Percent-decodes (if it was encoded) and NFC-normalizes a slug. Never returns an empty string for non-empty input. */
export function normalizeSlug(raw: string): string {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Not valid percent-encoding (or already decoded) — use as given.
  }
  return decoded.normalize('NFC');
}

/** Appends a numeric suffix (-2, -3, ...) until the slug isn't already in `taken`. */
export function resolveSlugCollision(slug: string, taken: ReadonlySet<string>): string {
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}
