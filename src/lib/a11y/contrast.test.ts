import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHexColor } from './contrast';

describe('parseHexColor', () => {
  it('parses a 6-digit hex color', () => {
    expect(parseHexColor('#1a4fd6')).toEqual({ r: 0x1a, g: 0x4f, b: 0xd6 });
  });

  it('parses a 3-digit shorthand hex color', () => {
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('rejects a non-hex value', () => {
    expect(() => parseHexColor('hsl(0 0% 100%)')).toThrow();
  });
});

describe('contrastRatio', () => {
  it('is 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('is 1:1 for identical colors', () => {
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
  });

  it('is order-independent', () => {
    expect(contrastRatio('#1a1a1a', '#ffffff')).toBeCloseTo(
      contrastRatio('#ffffff', '#1a1a1a'),
      10,
    );
  });

  it('matches the well-known #767676-on-white WCAG example (~4.5:1)', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });
});
