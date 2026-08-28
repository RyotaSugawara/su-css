import { describe, expect, it } from 'vitest';
import { getContrastRatio } from '../../src/lib/colorUtils';
import { extractTokens, readSucssCss, resolveColor, type TokenMap } from '../utils/parseCssTokens';

/**
 * README and AccessibilityChecker both advertise WCAG AA (4.5:1) / AAA (7:1)
 * contrast for SuCSS's design tokens. These tests resolve the actual custom
 * property values out of sucss.css (rather than hardcoding RGB numbers) so a
 * future palette tweak that regresses contrast fails CI instead of shipping.
 */

const AA_NORMAL_TEXT = 4.5;

const css = readSucssCss();
const rootTokens = extractTokens(css, ':root');
const hue = parseFloat(rootTokens['--hue']);
const sat = parseFloat(rootTokens['--sat']);
const vars = { hue, sat };

function themeTokens(selector: string): TokenMap {
  // Theme selectors only override a subset of --root tokens; merge over the
  // :root defaults so unset keys (e.g. --hue/--sat) still resolve.
  return { ...rootTokens, ...extractTokens(css, selector) };
}

function rgb(tokens: TokenMap, name: string): [number, number, number] {
  return resolveColor(tokens[name], vars);
}

describe.each([
  ['light (:root)', themeTokens(':root')],
  ['light ([data-theme="light"])', themeTokens('[data-theme="light"]')],
  ['dark (prefers-color-scheme)', themeTokens(':root:not([data-theme="light"])')],
  ['dark ([data-theme="dark"])', themeTokens('[data-theme="dark"]')],
])('%s theme contrast', (_label, tokens) => {
  it('body text meets AA against the page and surface backgrounds', () => {
    expect(getContrastRatio(rgb(tokens, '--text-main'), rgb(tokens, '--bg-body'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
    expect(getContrastRatio(rgb(tokens, '--text-main'), rgb(tokens, '--bg-surface'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });

  it('muted text meets AA against the page and surface backgrounds', () => {
    expect(getContrastRatio(rgb(tokens, '--text-muted'), rgb(tokens, '--bg-body'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
    expect(getContrastRatio(rgb(tokens, '--text-muted'), rgb(tokens, '--bg-surface'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });

  it('primary button text meets AA against the primary button background', () => {
    expect(getContrastRatio(rgb(tokens, '--color-primary-text'), rgb(tokens, '--color-primary'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });

  it('link color (--color-primary as text) meets AA against the page and surface backgrounds', () => {
    expect(getContrastRatio(rgb(tokens, '--color-primary'), rgb(tokens, '--bg-body'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
    expect(getContrastRatio(rgb(tokens, '--color-primary'), rgb(tokens, '--bg-surface'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });
});

describe('theme parity', () => {
  // :root is the base default block (a superset of every token, including
  // theme-invariant ones like --hue/--sat) rather than a per-theme override,
  // so it's excluded here and covered separately by the contrast tests above.
  const themeSelectors: Record<string, string> = {
    'light ([data-theme="light"])': '[data-theme="light"]',
    'dark (prefers-color-scheme)': ':root:not([data-theme="light"])',
    'dark ([data-theme="dark"])': '[data-theme="dark"]',
  };

  it('every theme override block defines the same set of tokens (no missing/typo\'d variables)', () => {
    // Not every :root token is theme-dependent (e.g. --color-success is
    // intentionally invariant), so compare the override blocks against each
    // other rather than against the full :root token list.
    const overrideBlocks = Object.entries(themeSelectors).map(
      ([label, selector]) => [label, extractTokens(css, selector)] as const,
    );
    const overriddenNames = new Set(overrideBlocks.flatMap(([, tokens]) => Object.keys(tokens)));

    for (const [label, tokens] of overrideBlocks) {
      for (const name of overriddenNames) {
        expect(tokens, `${label} is missing ${name}`).toHaveProperty(name);
      }
    }
  });
});
