// WCAG 2.1 contrast ratio (spec.md §10) — pure math, no DOM, so the default
// theme's tokens can be checked in CI rather than eyeballed (tech-stack.md
// ADR-11: "token contrast checks" is explicitly a unit-test example).

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function parseHexColor(hex: string): RGB {
  const clean = hex.trim().replace(/^#/, '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`not a hex color: "${hex}"`);
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function channelLuminance(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance per WCAG's definition. */
export function relativeLuminance({ r, g, b }: RGB): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** Contrast ratio between two colors, always ≥ 1. */
export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(parseHexColor(a));
  const l2 = relativeLuminance(parseHexColor(b));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** spec.md §10: ≥4.5:1 for body text, ≥3:1 for large text and UI boundaries. */
export const MIN_CONTRAST_BODY_TEXT = 4.5;
export const MIN_CONTRAST_LARGE_TEXT = 3;
