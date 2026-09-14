import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { BuiltFile } from './build-post';

export interface WriteOptions {
  dryRun: boolean;
  overwrite: boolean;
}

export interface WriteOutcome {
  written: boolean;
  skippedExisting: boolean;
  path: string;
}

/**
 * Writes one built file, respecting --dry-run and --overwrite (spec.md
 * §18: "Existing files are skipped unless --overwrite is passed. --dry-run
 * writes only the report.") Never deletes anything, and only ever creates
 * files under the given file's own path — the caller is responsible for
 * making sure that's inside content/.
 */
export function writeFile(file: BuiltFile, options: WriteOptions): WriteOutcome {
  const alreadyExists = existsSync(file.path);
  if (alreadyExists && !options.overwrite) {
    return { written: false, skippedExisting: true, path: file.path };
  }
  if (!options.dryRun) {
    mkdirSync(join(file.path, '..'), { recursive: true });
    writeFileSync(file.path, file.content, 'utf-8');
  }
  return { written: !options.dryRun, skippedExisting: false, path: file.path };
}

/**
 * Seeds the collision-detection state from whatever's already on disk —
 * re-running an import must see its own previous output (and any
 * hand-written posts) as already-taken slugs, not just what this run has
 * produced so far.
 */
export function seedUsedSlugs(contentDir: string, sections: string[]): Map<string, Set<string>> {
  const used = new Map<string, Set<string>>();

  for (const sectionId of sections) {
    const dir = join(contentDir, 'posts', sectionId);
    used.set(sectionId, slugsInDir(dir));
  }
  used.set('__pages__', slugsInDir(join(contentDir, 'pages')));

  return used;
}

function slugsInDir(dir: string): Set<string> {
  if (!existsSync(dir)) return new Set();
  return new Set(
    readdirSync(dir)
      .filter((name) => extname(name) === '.md')
      .map((name) => name.slice(0, -3)),
  );
}
