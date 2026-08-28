import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { readSucssCss } from '../utils/parseCssTokens';

const css = readSucssCss();
const root = postcss.parse(css);

function hasRuleMatching(selectorPattern: RegExp, declPattern?: { prop: RegExp; value?: RegExp }): boolean {
  let found = false;
  root.walkRules((rule) => {
    if (found || !selectorPattern.test(rule.selector)) return;
    if (!declPattern) {
      found = true;
      return;
    }
    rule.walkDecls(declPattern.prop, (decl) => {
      if (!declPattern.value || declPattern.value.test(decl.value)) {
        found = true;
      }
    });
  });
  return found;
}

describe('reduced motion support', () => {
  it('disables animations and transitions under prefers-reduced-motion: reduce', () => {
    let matched = false;
    root.walkAtRules('media', (atRule) => {
      if (!/prefers-reduced-motion:\s*reduce/.test(atRule.params)) return;
      atRule.walkDecls(/^(animation|transition)-duration$/, () => {
        matched = true;
      });
    });
    expect(matched).toBe(true);
  });
});

describe('focus-visible affordance', () => {
  const interactiveSelectors = [
    /(^|,)\s*a:focus-visible/,
    /button:focus-visible/,
    /input:focus-visible/,
    /select:focus-visible/,
    /textarea:focus-visible/,
    /summary:focus-visible/,
  ];

  it.each(interactiveSelectors)('defines a :focus-visible rule matching %s', (pattern) => {
    expect(hasRuleMatching(pattern, { prop: /^(box-shadow|outline)$/ })).toBe(true);
  });

  it('never removes outline without providing a replacement focus indicator', () => {
    root.walkRules(/:focus-visible/, (rule) => {
      const props = new Set<string>();
      rule.walkDecls((decl) => {
        props.add(decl.prop);
      });
      if (props.has('outline')) {
        expect(props.has('box-shadow') || props.has('border-color')).toBe(true);
      }
    });
  });
});

describe('touch target sizing', () => {
  it('defines a --touch-target custom property', () => {
    let found = false;
    root.walkDecls('--touch-target', () => {
      found = true;
    });
    expect(found).toBe(true);
  });

  it('applies --touch-target as min-height on buttons and text inputs', () => {
    expect(hasRuleMatching(/^button/, { prop: /^min-height$/, value: /var\(--touch-target\)/ })).toBe(true);
    expect(hasRuleMatching(/input\[type="text"\]/, { prop: /^min-height$/, value: /var\(--touch-target\)/ })).toBe(
      true,
    );
  });
});

describe('color scheme declaration', () => {
  it('declares color-scheme: light dark on the document root so native controls adapt', () => {
    expect(hasRuleMatching(/^html$/, { prop: /^color-scheme$/, value: /light\s+dark/ })).toBe(true);
  });
});
