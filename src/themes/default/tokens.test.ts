import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  MIN_CONTRAST_BODY_TEXT,
  MIN_CONTRAST_LARGE_TEXT,
} from '../../lib/a11y/contrast';
import { parseTokensCss } from '../../lib/a11y/parse-tokens';

// spec.md §10: "Theme tokens are contrast-checked in CI — the default
// theme cannot regress silently." This is that check, for both color
// schemes tokens.css defines (light default, dark via prefers-color-scheme).

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf-8');
const { light, dark } = parseTokensCss(css);

describe.each([
  ['light', light],
  ['dark', dark],
])('%s tokens', (_name, tokens) => {
  it('defines every color role this test checks', () => {
    for (const key of [
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
    ]) {
      expect(tokens[key], `missing --${key}`).toBeDefined();
    }
  });

  it('body text meets 4.5:1 against the page background', () => {
    expect(contrastRatio(tokens['color-text'], tokens['color-bg'])).toBeGreaterThanOrEqual(
      MIN_CONTRAST_BODY_TEXT,
    );
  });

  it('muted text meets 4.5:1 against both the background and the surface', () => {
    expect(contrastRatio(tokens['color-muted'], tokens['color-bg'])).toBeGreaterThanOrEqual(
      MIN_CONTRAST_BODY_TEXT,
    );
    expect(contrastRatio(tokens['color-muted'], tokens['color-surface'])).toBeGreaterThanOrEqual(
      MIN_CONTRAST_BODY_TEXT,
    );
  });

  it('links meet 4.5:1 against the background, visited or not', () => {
    expect(contrastRatio(tokens['color-link'], tokens['color-bg'])).toBeGreaterThanOrEqual(
      MIN_CONTRAST_BODY_TEXT,
    );
    expect(contrastRatio(tokens['color-link-visited'], tokens['color-bg'])).toBeGreaterThanOrEqual(
      MIN_CONTRAST_BODY_TEXT,
    );
  });

  it('button/skip-link text meets 4.5:1 against its own background', () => {
    expect(
      contrastRatio(tokens['color-on-primary'], tokens['color-primary']),
    ).toBeGreaterThanOrEqual(MIN_CONTRAST_BODY_TEXT);
    expect(contrastRatio(tokens['color-on-accent'], tokens['color-accent'])).toBeGreaterThanOrEqual(
      MIN_CONTRAST_BODY_TEXT,
    );
  });

  it('the border/UI-boundary color meets 3:1 against background and surface', () => {
    expect(contrastRatio(tokens['color-border'], tokens['color-bg'])).toBeGreaterThanOrEqual(
      MIN_CONTRAST_LARGE_TEXT,
    );
    expect(contrastRatio(tokens['color-border'], tokens['color-surface'])).toBeGreaterThanOrEqual(
      MIN_CONTRAST_LARGE_TEXT,
    );
  });
});
