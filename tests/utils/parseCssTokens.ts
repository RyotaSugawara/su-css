import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import { hexToRgb, hslToRgb } from '../../src/lib/colorUtils';

export const SUCSS_PATH = path.resolve(import.meta.dirname, '../../src/lib/sucss.css');

export type TokenMap = Record<string, string>;

/**
 * Extracts every `--custom-property: value;` declaration found directly inside
 * a rule whose selector matches `selector`, in source order (later declarations
 * win, matching CSS cascade behaviour for repeated blocks like the dark-mode
 * media query and the explicit [data-theme="dark"] rule).
 */
export function extractTokens(css: string, selector: string): TokenMap {
  const root = postcss.parse(css);
  const tokens: TokenMap = {};

  root.walkRules(selector, (rule) => {
    rule.walkDecls(/^--/, (decl) => {
      tokens[decl.prop] = decl.value;
    });
  });

  return tokens;
}

export function readSucssCss(): string {
  return fs.readFileSync(SUCSS_PATH, 'utf-8');
}

/**
 * Resolves a token value (a hex color, or an hsl()/hsl(var(--hue) var(--sat) L%)
 * expression referencing --hue/--sat) into an [r, g, b] triple, matching the
 * subset of color syntax actually used by sucss.css's design tokens.
 */
export function resolveColor(value: string, vars: { hue: number; sat: number }): [number, number, number] {
  const trimmed = value.trim();

  if (trimmed.startsWith('#')) {
    return hexToRgb(trimmed);
  }

  const hslMatch = trimmed.match(/^hsl\((.+)\)$/i);
  if (hslMatch) {
    const parts = hslMatch[1].split(/[\s,]+/).filter(Boolean);
    const resolvePart = (part: string, fallback: number): number => {
      if (part === 'var(--hue)') return vars.hue;
      if (part === 'var(--sat)') return vars.sat;
      const num = parseFloat(part);
      return Number.isNaN(num) ? fallback : num;
    };
    const h = resolvePart(parts[0], 0);
    const s = resolvePart(parts[1], 0);
    const l = resolvePart(parts[2], 0);
    return hslToRgb(h, s, l);
  }

  throw new Error(`resolveColor: unsupported color value "${value}"`);
}
