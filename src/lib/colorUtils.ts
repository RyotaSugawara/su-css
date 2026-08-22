/**
 * Color Utilities for WCAG Contrast Calculation & Color Space Conversions
 */

// Helper to convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4))
  ];
}

// Helper to convert Hex to RGB
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Calculate relative luminance for WCAG contrast
export function getLuminance([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate contrast ratio between two RGB colors
export function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Determine WCAG compliance level
export function getWcagLevel(ratio: number) {
  if (ratio >= 7.0) {
    return { level: 'AAA', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'パス (AAA 超高視認性)' };
  } else if (ratio >= 4.5) {
    return { level: 'AA', badge: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'パス (AA 標準)' };
  } else if (ratio >= 3.0) {
    return { level: 'AA Large', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: '大型テキストのみ (3:1)' };
  } else {
    return { level: 'Fail', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30', label: '不合格 (< 3:1)' };
  }
}
