import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Presets are theme-agnostic by construction (spec.md §7) — they set
// tokens the contract defines, so they live at src/presets/, independent
// of any one theme, and keep working against a theme #2 written later.
//
// Resolved against process.cwd() rather than import.meta.url: this module
// is reached from three different execution contexts — the Vite dev/build
// pipeline, Astro's bundled prerender step (which relocates SSR modules
// into dist/.prerender/chunks/, breaking any path built from the moved
// module's own URL), and plain `tsx` script execution (scripts/generate-
// cms-config.ts), which doesn't have Vite's import.meta.glob at all. The
// working directory is the one thing that stays the project root in all
// three — `astro build`, `astro dev`, and `npm run` scripts are always
// invoked from there.
const PRESETS_DIR = resolve(process.cwd(), 'src/presets');

export function listPresetIds(): string[] {
  return readdirSync(PRESETS_DIR)
    .filter((name) => name.endsWith('.css'))
    .map((name) => name.replace(/\.css$/, ''))
    .sort();
}

/** The raw CSS for one preset. Throws with the valid id list — ADR-10's philosophy applied to config. */
export function loadPresetCss(presetId: string): string {
  try {
    return readFileSync(resolve(PRESETS_DIR, `${presetId}.css`), 'utf-8');
  } catch {
    throw new Error(
      `Unknown theme.preset "${presetId}" in site.config.ts. Available presets: ${listPresetIds().join(', ')}.`,
    );
  }
}
