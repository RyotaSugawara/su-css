import { describe, expect, it } from 'vitest';
import { getContrastRatio, getLuminance, getWcagLevel, hexToRgb, hslToRgb } from '../../src/lib/colorUtils';

describe('hexToRgb', () => {
  it('parses 6-digit hex colors', () => {
    expect(hexToRgb('#111827')).toEqual([17, 24, 39]);
  });

  it('parses 3-digit shorthand hex colors', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });

  it('parses hex colors without a leading #', () => {
    expect(hexToRgb('000000')).toEqual([0, 0, 0]);
  });
});

describe('hslToRgb', () => {
  it('converts pure black and white', () => {
    expect(hslToRgb(0, 0, 0)).toEqual([0, 0, 0]);
    expect(hslToRgb(0, 0, 100)).toEqual([255, 255, 255]);
  });

  it('converts a known hue/saturation/lightness to RGB', () => {
    // hsl(158, 90%, 36%) is SuCSS's light-mode --color-primary.
    expect(hslToRgb(158, 90, 36)).toEqual([9, 174, 114]);
  });
});

describe('getLuminance', () => {
  it('returns 0 for black and 1 for white', () => {
    expect(getLuminance([0, 0, 0])).toBe(0);
    expect(getLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
});

describe('getContrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    expect(getContrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
  });

  it('returns 1:1 for identical colors', () => {
    expect(getContrastRatio([100, 100, 100], [100, 100, 100])).toBeCloseTo(1, 5);
  });

  it('is symmetric regardless of argument order', () => {
    const a: [number, number, number] = [17, 24, 39];
    const b: [number, number, number] = [247, 249, 250];
    expect(getContrastRatio(a, b)).toBeCloseTo(getContrastRatio(b, a), 10);
  });
});

describe('getWcagLevel', () => {
  it('classifies ratios per WCAG 2.1 thresholds', () => {
    expect(getWcagLevel(8).level).toBe('AAA');
    expect(getWcagLevel(7).level).toBe('AAA');
    expect(getWcagLevel(5).level).toBe('AA');
    expect(getWcagLevel(4.5).level).toBe('AA');
    expect(getWcagLevel(3.5).level).toBe('AA Large');
    expect(getWcagLevel(3).level).toBe('AA Large');
    expect(getWcagLevel(2).level).toBe('Fail');
  });
});
