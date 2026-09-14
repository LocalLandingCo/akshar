// Shared across both XML-based adapters (WordPress WXR, Blogger Atom).
// fast-xml-parser wraps a CDATA-only element as { '#cdata': value } rather
// than a plain string — WXR wraps almost every field in CDATA, so every
// adapter needs this. Verified against the real parsed shape of both
// fixtures before writing either adapter (not guessed).

export function cdata(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object' && '#cdata' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)['#cdata'] ?? '');
  }
  if (typeof value === 'object' && '#text' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)['#text'] ?? '');
  }
  return String(value);
}

/** Always returns an array, whether the parser gave zero, one, or many. */
export function asArray<T>(value: unknown): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? (value as T[]) : [value as T];
}
