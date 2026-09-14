// Presets are theme-agnostic by construction (spec.md §7) — they set
// tokens the contract defines, so they live at src/presets/, independent
// of any one theme, and keep working against a theme #2 written later.
//
// Loaded with Vite's import.meta.glob rather than plain `fs.readFileSync`:
// a path built from `import.meta.url` resolves correctly in dev, but
// Astro's prerender step relocates SSR modules into dist/.prerender/ at
// build time, so a relative filesystem path computed the same way breaks
// in production. import.meta.glob is resolved and inlined by Vite at
// build time, so it survives that relocation.
const presetModules = import.meta.glob('../../presets/*.css', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const presetsById: Record<string, string> = {};
for (const [path, css] of Object.entries(presetModules)) {
  const id = path.replace(/^.*\//, '').replace(/\.css$/, '');
  presetsById[id] = css;
}

export function listPresetIds(): string[] {
  return Object.keys(presetsById).sort();
}

/** The raw CSS for one preset. Throws with the valid id list — ADR-10's philosophy applied to config. */
export function loadPresetCss(presetId: string): string {
  const css = presetsById[presetId];
  if (!css) {
    throw new Error(
      `Unknown theme.preset "${presetId}" in site.config.ts. Available presets: ${listPresetIds().join(', ')}.`,
    );
  }
  return css;
}
