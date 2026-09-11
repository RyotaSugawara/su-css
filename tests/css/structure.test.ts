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

/**
 * True when some rule whose selector list contains `element` as a standalone
 * type selector declares `max-width`. Matching selector-list membership (rather
 * than a substring) keeps `object` from being satisfied by, say, `object-fit`
 * appearing in an unrelated selector.
 */
function declaresMaxWidth(element: string): boolean {
  let found = false;
  root.walkRules((rule) => {
    if (found) return;
    const selectors = rule.selector.split(',').map((selector) => selector.trim());
    if (!selectors.includes(element)) return;
    rule.walkDecls('max-width', () => {
      found = true;
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

describe('embedded media containment', () => {
  // README promises plain semantic HTML renders correctly with no author CSS.
  // An uncapped image or embed breaks that promise loudly: it pushes the whole
  // document into a horizontal scroll on narrow viewports.
  const mediaElements = ['img', 'picture', 'video', 'audio', 'canvas', 'svg', 'iframe', 'embed', 'object'];

  it.each(mediaElements)('caps %s at its container width', (element) => {
    expect(declaresMaxWidth(element)).toBe(true);
  });

  it('lets media with an intrinsic aspect ratio scale its height with that cap', () => {
    // Without `height: auto`, an <img width="864" height="486"> keeps its
    // attribute height while max-width shrinks the width, distorting it.
    expect(hasRuleMatching(/(^|,)\s*img/, { prop: /^height$/, value: /^auto$/ })).toBe(true);
  });
});

describe('table layout on narrow viewports', () => {
  // A table's columns can only be as narrow as their longest unbreakable word.
  // One package name or file path in a cell is enough to claim the width of a
  // phone screen, and the table pays for it by starving every other column:
  // rows grow several lines tall and the last column ends up off-screen behind
  // the figure's horizontal scroll.
  it('lets code in a cell break mid-token so columns can share the width', () => {
    expect(
      hasRuleMatching(/th,\s*td\)?\s*code/, { prop: /^overflow-wrap$/, value: /^anywhere$/ }),
    ).toBe(true);
  });

  it('aligns cells on their first line so a row that wraps still reads as one', () => {
    expect(
      hasRuleMatching(/^th,\s*td$/, { prop: /^vertical-align$/, value: /^baseline$/ }),
    ).toBe(true);
  });

  it('only lets a box lend as much gutter as it has padding', () => {
    // The figure around a table pays for its shadow with inline padding and
    // takes the same amount back out of `--bleed`. A box that advertises more
    // than its own inline padding sends that borrowed rem outside itself, and
    // the document grows a horizontal scroll.
    const offenders: string[] = [];
    root.walkRules((rule) => {
      let bleed: string | undefined;
      let inlinePadding: string | undefined;
      rule.walkDecls((decl) => {
        if (decl.prop === '--bleed') bleed = decl.value.trim();
        if (decl.prop === 'padding') {
          const parts = decl.value.trim().split(/\s+/);
          inlinePadding = parts[1] ?? parts[0];
        }
        if (decl.prop === 'padding-inline') inlinePadding = decl.value.trim().split(/\s+/)[0];
      });
      if (bleed === undefined) return;
      if (inlinePadding !== 'var(--bleed)' && inlinePadding !== bleed) {
        offenders.push(`${rule.selector} (--bleed: ${bleed}, inline padding: ${inlinePadding ?? 'none'})`);
      }
    });
    expect(offenders).toEqual([]);
  });

  it('leaves the scroll container room for the panel’s shadow', () => {
    // A scroll container clips at its padding box, so a figure with no inline
    // padding slices the table's shadow flat down both sides.
    let inlinePadding: string | undefined;
    root.walkRules(/^figure:has\(>\s*table\)$/, (rule) => {
      rule.walkDecls(/^padding(-inline)?$/, (decl) => {
        const parts = decl.value.split(/\s+/);
        inlinePadding = decl.prop === 'padding' ? parts[1] ?? parts[0] : parts[0];
      });
    });
    expect(inlinePadding).toBeDefined();
    expect(inlinePadding).not.toBe('0');
  });

  it('keeps the caption clear of the rounded corner that clips it', () => {
    // `table` paints the panel with `overflow: hidden`, and that clip follows
    // the corner radius. A caption flush with the table's edge loses the left
    // of its first letter to the curve.
    let inlinePadding: string | undefined;
    root.walkRules(/^caption$/, (rule) => {
      rule.walkDecls(/^padding(-inline)?$/, (decl) => {
        const parts = decl.value.split(/\s+/);
        inlinePadding = decl.prop === 'padding' ? parts[1] ?? parts[0] : parts[0];
      });
    });
    expect(inlinePadding).toBeDefined();
    expect(inlinePadding).not.toBe('0');
  });
});

describe('command groups', () => {
  /** The rule that lays out a `role="group"` whose members are commands. */
  function clusterSelector(): string | undefined {
    let found: string | undefined;
    root.walkRules((rule) => {
      const selector = rule.selector.replaceAll(/\s+/g, ' ');
      if (found || !selector.startsWith('[role="group"]:has(')) return;
      if (selector.includes(':not(')) found = selector;
    });
    return found;
  }

  it('gives a group of buttons its own spacing', () => {
    expect(hasRuleMatching(/^\[role="group"\]:has\(/, { prop: /^gap$/ })).toBe(true);
  });

  it('leaves a group of form fields alone', () => {
    // `role="group"` is also the standard stand-in for a <fieldset> around form
    // controls, and that use is the more common one. Laying it out in a row
    // collapses a stacked form into a single line, so the selector has to
    // disqualify a group holding anything a form would.
    const selector = clusterSelector();
    expect(selector).toBeDefined();

    const guard = selector!.slice(selector!.indexOf(':not('));

    for (const field of ['label', 'select', 'textarea', 'fieldset']) {
      expect(guard, `a group holding <${field}> must not be laid out`).toContain(field);
    }
    // A text input disqualifies the group; a button-shaped one does not.
    expect(guard).toMatch(/input:not\(/);
  });
});

describe('a group that carries a selected state', () => {
  it('marks the chosen member with more than a colour', () => {
    // WCAG 1.4.1: the selection has to survive a reader who cannot separate
    // this hue from the one beside it, so the fill carries the state too.
    let paintsABackground = false;

    root.walkRules(/\[aria-pressed="true"\]/, (rule) => {
      if (rule.selector.includes(':hover')) return;
      rule.walkDecls(/^background(-image|-color)?$/, (decl) => {
        if (decl.value !== 'transparent' && decl.value !== 'none') paintsABackground = true;
      });
    });

    expect(paintsABackground).toBe(true);
  });
});

describe('a toolbar', () => {
  it('quiets its commands without painting over a pressed one', () => {
    // The bar's own rule is a `:not()` more specific than the selected state,
    // so it would silently win and flatten every pressed button in a toolbar.
    // It has to stand aside for them instead.
    let quietRule: string | undefined;

    root.walkRules((rule) => {
      const selector = rule.selector.replaceAll(/\s+/g, ' ');
      if (quietRule || !selector.startsWith('[role="toolbar"] :is(button')) return;
      if (selector.includes(':hover')) return;
      quietRule = selector;
    });

    expect(quietRule).toBeDefined();
    expect(quietRule).toContain('[aria-pressed="true"]');
  });
});

/** Split a selector list on its own commas, ignoring those inside `:is(…)`. */
function splitSelectorList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < list.length; i += 1) {
    if (list[i] === '(' || list[i] === '[') depth += 1;
    if (list[i] === ')' || list[i] === ']') depth -= 1;
    if (list[i] === ',' && depth === 0) {
      parts.push(list.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(list.slice(start));

  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * Specificity of a selector, as [ids, classes-and-attributes, elements].
 *
 * Only the syntax this stylesheet uses is handled, which is enough to answer
 * the one question worth asking here: does the focus ring still win? `:where()`
 * contributes nothing, and `:is()` / `:not()` / `:has()` contribute the most
 * specific of their arguments.
 */
function specificity(selector: string): [number, number, number] {
  const total: [number, number, number] = [0, 0, 0];
  let index = 0;

  /** The index just past the `)` that closes the `(` at `from`. */
  function endOfArguments(from: number): number {
    let depth = 0;
    for (let i = from; i < selector.length; i += 1) {
      if (selector[i] === '(') depth += 1;
      if (selector[i] === ')') {
        depth -= 1;
        if (depth === 0) return i + 1;
      }
    }
    throw new Error(`Unclosed ( in ${selector}`);
  }

  /** The heaviest of a comma-separated selector list. */
  function heaviestOf(list: string): [number, number, number] {
    return splitSelectorList(list)
      .map((part) => specificity(part))
      .reduce((heaviest, one) => (isAtLeast(one, heaviest) ? one : heaviest), [0, 0, 0]);
  }

  while (index < selector.length) {
    const character = selector[index];

    if (character === '[') {
      index = selector.indexOf(']', index) + 1;
      total[1] += 1;
    } else if (character === '#' || character === '.') {
      const name = /^[\w-]+/.exec(selector.slice(index + 1))?.[0] ?? '';
      index += name.length + 1;
      total[character === '#' ? 0 : 1] += 1;
    } else if (character === ':') {
      const doubled = selector[index + 1] === ':';
      const from = index + (doubled ? 2 : 1);
      const name = (/^[\w-]+/.exec(selector.slice(from))?.[0] ?? '').toLowerCase();
      index = from + name.length;

      if (selector[index] === '(') {
        const close = endOfArguments(index);
        const argument = selector.slice(index + 1, close - 1);
        index = close;

        // `:where()` is the one that costs nothing, by design.
        if (name !== 'where') {
          const inner = ['is', 'not', 'has', 'matches'].includes(name)
            ? heaviestOf(argument)
            : ([0, 1, 0] as [number, number, number]);
          total[0] += inner[0];
          total[1] += inner[1];
          total[2] += inner[2];
        }
      } else {
        total[doubled ? 2 : 1] += 1;
      }
    } else if (/[\w-]/.test(character)) {
      const name = /^[\w-]+/.exec(selector.slice(index))![0];
      index += name.length;
      total[2] += 1;
    } else {
      index += 1;
    }
  }

  return total;
}

/** True when `one` would win the cascade against `other`, ties aside. */
function isAtLeast(one: [number, number, number], other: [number, number, number]): boolean {
  for (let i = 0; i < 3; i += 1) {
    if (one[i] !== other[i]) return one[i] > other[i];
  }
  return true;
}

describe('the focus ring inside a group or a toolbar', () => {
  // Every rule in that part of the stylesheet sets box-shadow, and box-shadow
  // is what draws the ring. A rule that outranks the ring does not look broken
  // in the file - it silently erases the one affordance a keyboard user has.
  const groupScoped = /\[role="(group|toolbar)"\]/;

  interface Rule {
    selector: string;
    specificity: [number, number, number];
    order: number;
  }

  const shadowRules: Rule[] = [];
  let order = 0;

  root.walkRules((rule) => {
    order += 1;
    const selector = rule.selector.replaceAll(/\s+/g, ' ');
    if (!groupScoped.test(selector)) return;

    for (const single of splitSelectorList(selector)) {
      if (!groupScoped.test(single)) continue;
      rule.walkDecls('box-shadow', () => {
        shadowRules.push({ selector: single, specificity: specificity(single), order });
      });
    }
  });

  const ringRules = shadowRules.filter((rule) => rule.selector.includes(':focus-visible'));

  it('is drawn by a rule of its own', () => {
    expect(ringRules.length).toBeGreaterThan(0);
  });

  it('outranks every rule that would paint over it', () => {
    const losers = shadowRules
      .filter((rule) => !rule.selector.includes(':focus-visible'))
      .filter((rule) =>
        ringRules.every(
          (ring) =>
            !isAtLeast(ring.specificity, rule.specificity) ||
            (ring.order < rule.order &&
              isAtLeast(rule.specificity, ring.specificity) &&
              isAtLeast(ring.specificity, rule.specificity)),
        ),
      )
      .map((rule) => `${rule.selector} (${rule.specificity.join(',')})`);

    expect(losers).toEqual([]);
  });
});
