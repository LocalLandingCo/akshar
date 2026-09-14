import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  MIN_CONTRAST_BODY_TEXT,
  MIN_CONTRAST_LARGE_TEXT,
} from '../lib/a11y/contrast';
import { parseTokensCss } from '../lib/a11y/parse-tokens';
import { listPresetIds } from '../lib/theme/presets';

// spec.md §10: "Every preset passes the same accessibility bar. Contrast
// is checked in CI for both light and dark. A writer cannot pick an
// inaccessible site." Runs against every file in src/presets/, not a
// hardcoded list, so a new preset is covered automatically.

const REQUIRED_TOKENS = [
  'color-bg',
  'color-surface',
  'color-text',
  'color-muted',
  'color-border',
  'color-primary',
  'color-on-primary',
  'color-accent',
  'color-on-accent',
  'color-link',
  'color-link-visited',
];

function assertPaletteAccessible(tokens: Record<string, string>) {
  for (const key of REQUIRED_TOKENS) {
    expect(tokens[key], `missing --${key}`).toBeDefined();
  }
  expect(contrastRatio(tokens['color-text'], tokens['color-bg'])).toBeGreaterThanOrEqual(
    MIN_CONTRAST_BODY_TEXT,
  );
  expect(contrastRatio(tokens['color-muted'], tokens['color-bg'])).toBeGreaterThanOrEqual(
    MIN_CONTRAST_BODY_TEXT,
  );
  expect(contrastRatio(tokens['color-muted'], tokens['color-surface'])).toBeGreaterThanOrEqual(
    MIN_CONTRAST_BODY_TEXT,
  );
  expect(contrastRatio(tokens['color-link'], tokens['color-bg'])).toBeGreaterThanOrEqual(
    MIN_CONTRAST_BODY_TEXT,
  );
  expect(contrastRatio(tokens['color-link-visited'], tokens['color-bg'])).toBeGreaterThanOrEqual(
    MIN_CONTRAST_BODY_TEXT,
  );
  expect(contrastRatio(tokens['color-on-primary'], tokens['color-primary'])).toBeGreaterThanOrEqual(
    MIN_CONTRAST_BODY_TEXT,
  );
  expect(contrastRatio(tokens['color-on-accent'], tokens['color-accent'])).toBeGreaterThanOrEqual(
    MIN_CONTRAST_BODY_TEXT,
  );
  expect(contrastRatio(tokens['color-border'], tokens['color-bg'])).toBeGreaterThanOrEqual(
    MIN_CONTRAST_LARGE_TEXT,
  );
  expect(contrastRatio(tokens['color-border'], tokens['color-surface'])).toBeGreaterThanOrEqual(
    MIN_CONTRAST_LARGE_TEXT,
  );
}

const presetIds = listPresetIds();

describe('preset set', () => {
  it('is genuinely distinct, not six shades of grey (spec.md §7)', () => {
    // Coarse structural check — real distinctness is judged by hand, but a
    // preset set where every file has the same font-body or the same
    // color-scheme value has clearly regressed toward "one preset, six names".
    const fontBodies = new Set<string>();
    for (const id of presetIds) {
      const css = readFileSync(new URL(`./${id}.css`, import.meta.url), 'utf-8');
      fontBodies.add(css.includes('--font-body: var(--font-serif)') ? 'serif' : 'sans');
    }
    expect(fontBodies.size, 'expected both serif- and sans-bodied presets').toBeGreaterThan(1);
  });

  it('includes at least one dark-default preset', () => {
    const hasDarkDefault = presetIds.some((id) => {
      const css = readFileSync(new URL(`./${id}.css`, import.meta.url), 'utf-8');
      return /color-scheme:\s*dark\s*;/.test(css) && !css.includes('prefers-color-scheme: dark');
    });
    expect(hasDarkDefault).toBe(true);
  });

  it('includes at least one Devanagari-tuned preset (spec.md §7)', () => {
    const hasDevanagariPreset = presetIds.some((id) => {
      const css = readFileSync(new URL(`./${id}.css`, import.meta.url), 'utf-8');
      return css.includes('Noto Serif Devanagari') || css.includes('Noto Sans Devanagari');
    });
    expect(hasDevanagariPreset).toBe(true);
  });
});

describe.each(presetIds)('preset "%s"', (id) => {
  const css = readFileSync(new URL(`./${id}.css`, import.meta.url), 'utf-8');
  const { light, dark } = parseTokensCss(css);

  it('default palette passes the accessibility bar', () => {
    assertPaletteAccessible(light);
  });

  // Not every preset overrides prefers-color-scheme: dark — a dark-default
  // preset (spec.md §7's "light-default/dark-default" axis) may have no
  // separate dark block at all, since its one palette already is dark.
  if (Object.keys(dark).length > 0) {
    it('dark-mode override passes the accessibility bar', () => {
      assertPaletteAccessible(dark);
    });
  }
});
