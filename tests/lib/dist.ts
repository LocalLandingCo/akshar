// Shared helpers for the build-output assertions (ADR-11 layer 2). These
// tests run against an already-built `dist/` — they never invoke the build
// themselves, so `npm run test:build-output` always follows `npm run build`.
import { gzipSync } from 'node:zlib';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST_DIR = fileURLToPath(new URL('../../dist', import.meta.url));

export function distExists(): boolean {
  return existsSync(DIST_DIR);
}

/** Every generated HTML file's path, relative to dist/, posix-style. */
export function listHtmlFiles(): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.html')) {
        out.push(full.slice(DIST_DIR.length).split('\\').join('/'));
      }
    }
  }
  walk(DIST_DIR);
  // /admin/ is a third-party CMS shell copied verbatim from public/admin/
  // (spec.md §6) — not an Astro-generated page, exempt from every
  // reader-facing assertion here (SEO tags, weight budgets, link-checking).
  return out.filter((file) => !file.startsWith('/admin/'));
}

export function readDist(relativePath: string): string {
  return readFileSync(join(DIST_DIR, relativePath), 'utf-8');
}

export function distFileExists(relativePath: string): boolean {
  return existsSync(join(DIST_DIR, relativePath));
}

/** Compressed size in bytes — the unit every budget in spec.md §11 is stated in. */
export function gzipSize(content: string): number {
  return gzipSync(Buffer.from(content, 'utf-8')).length;
}

export function fileSize(relativePath: string): number {
  return statSync(join(DIST_DIR, relativePath)).size;
}
