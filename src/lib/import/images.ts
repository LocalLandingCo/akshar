import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

// spec.md §18/§11: "Downloaded images are deduplicated by content hash...
// One image lives in one place." An adapter is responsible for choosing
// the largest available rendition's URL (platform-specific — WordPress
// and Substack both encode size in the URL, differently) before calling
// this; this module only fetches, hashes, and dedupes whatever URL it's
// given.

export interface ImageDownloadResult {
  ok: boolean;
  /** Absolute path on success. */
  path?: string;
  /** A human-readable reason on failure — goes straight into the report. */
  error?: string;
}

/**
 * A dedupe cache scoped to one import run: the same remote image
 * referenced by several posts is fetched once and every later reference
 * points at that first copy via a relative path, wherever the second
 * post's folder is.
 */
export function createImageDownloader() {
  const byHash = new Map<string, string>(); // content hash -> absolute path already written

  return async function downloadImage(
    url: string,
    targetDir: string,
    preferredBaseName: string,
  ): Promise<ImageDownloadResult> {
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      return { ok: false, error: `network error: ${(error as Error).message}` };
    }
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 10);

    const existing = byHash.get(hash);
    if (existing) {
      return { ok: true, path: existing };
    }

    mkdirSync(targetDir, { recursive: true });
    const ext = extname(new URL(url).pathname) || '.jpg';
    const path = join(targetDir, `${preferredBaseName}-${hash}${ext}`);
    // Idempotent re-runs: a previous run may have already written this
    // exact file (same hash, same preferred name) — importing the same
    // export twice must produce zero changes (spec.md §18, criterion 4).
    if (!existsSync(path)) {
      writeFileSync(path, buffer);
    }
    byHash.set(hash, path);
    return { ok: true, path };
  };
}

/** A relative reference from one post's directory to an already-downloaded image, for use in Markdown/frontmatter. */
export function relativeImageRef(fromDir: string, imageAbsolutePath: string): string {
  const rel = relative(fromDir, imageAbsolutePath).split('\\').join('/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}
