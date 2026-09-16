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

describe('a tablist', () => {
  it('marks the selected tab with more than a colour, the same as aria-pressed', () => {
    // WCAG 1.4.1, the same reasoning the segmented-control test above uses:
    // aria-selected="true" has to carry a fill, not just a hue shift.
    let paintsABackground = false;

    root.walkRules(/\[role="tab"\]\[aria-selected="true"\]/, (rule) => {
      if (rule.selector.includes(':hover')) return;
      rule.walkDecls(/^background(-image|-color)?$/, (decl) => {
        if (decl.value !== 'transparent' && decl.value !== 'none') paintsABackground = true;
      });
    });

    expect(paintsABackground).toBe(true);
  });

  it('stacks vertically under aria-orientation="vertical", like a toolbar', () => {
    let stacksVertically = false;

    root.walkRules('[role="tablist"][aria-orientation="vertical"]', (rule) => {
      rule.walkDecls('flex-direction', (decl) => {
        if (decl.value === 'column') stacksVertically = true;
      });
    });

    expect(stacksVertically).toBe(true);
  });

  it('gives the panel a focus ring, since an author makes it a tab stop of its own', () => {
    let ringsOnFocus = false;

    root.walkRules('[role="tabpanel"]:focus-visible', (rule) => {
      rule.walkDecls('box-shadow', (decl) => {
        if (decl.value !== 'none') ringsOnFocus = true;
      });
    });

    expect(ringsOnFocus).toBe(true);
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
  const groupScoped = /\[role="(group|toolbar|tablist)"\]/;

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

describe('a control that is unavailable but still reachable', () => {
  const ariaDisabled = /\[aria-disabled="true"\]/;

  /** Every rule whose selector list has a part matching `[aria-disabled="true"]`. */
  function ariaDisabledRules(): { selector: string; declarations: Map<string, string> }[] {
    const rules: { selector: string; declarations: Map<string, string> }[] = [];

    root.walkRules((rule) => {
      const selector = rule.selector.replaceAll(/\s+/g, ' ');
      if (!ariaDisabled.test(selector)) return;

      const declarations = new Map<string, string>();
      rule.walkDecls((decl) => {
        declarations.set(decl.prop, decl.value.trim());
      });
      rules.push({ selector, declarations });
    });

    return rules;
  }

  it('never has the pointer swallowed by the stylesheet', () => {
    // This is the whole point of `aria-disabled` over `disabled`: the control
    // stays focusable, reachable and announceable, so an assistive technology
    // user can find out *why* it is unavailable. `pointer-events: none` takes
    // that back, and no author can restore it from their own CSS. Stopping the
    // click belongs in the handler, not here.
    const offenders = ariaDisabledRules()
      .filter((rule) => rule.declarations.get('pointer-events') === 'none')
      .map((rule) => rule.selector);

    expect(offenders).toEqual([]);
  });

  it('leaves the focus ring to the rule that draws it', () => {
    // box-shadow is the ring, and flattening an ARIA-disabled button means
    // setting it to none. A rule that does so while the control is focused
    // erases the one affordance a keyboard user has on a control that - unlike
    // a `disabled` one - they can still land on.
    const offenders = ariaDisabledRules()
      .filter((rule) => rule.declarations.get('box-shadow') === 'none')
      .filter((rule) => !/:not\(:where\([^)]*:focus-visible/.test(rule.selector))
      .map((rule) => rule.selector);

    expect(offenders).toEqual([]);
  });

  it('fades at the same strength as a natively disabled control', () => {
    // Two ways of saying "unavailable" that do not look alike read as two
    // different states.
    let nativeOpacity: string | undefined;
    root.walkRules(/^button:disabled/, (rule) => {
      rule.walkDecls('opacity', (decl) => {
        nativeOpacity ??= decl.value.trim();
      });
    });

    const ariaOpacity = ariaDisabledRules().find((rule) => rule.selector === '[aria-disabled="true"]')
      ?.declarations.get('opacity');

    expect(nativeOpacity).toBeDefined();
    expect(ariaOpacity).toBe(nativeOpacity);
  });
});

describe('an inert subtree', () => {
  it('is drawn as unavailable, since the browser only behaves as if it were', () => {
    // `inert` takes its subtree out of focus and hit testing but changes
    // nothing on screen, so without this the page offers controls that quietly
    // do nothing.
    expect(hasRuleMatching(/^\[inert\]$/, { prop: /^opacity$/, value: /^0?\.\d+$/ })).toBe(true);
  });

  it('does not fade twice where one unavailable region nests in another', () => {
    // Opacity multiplies down the tree: 0.55 inside 0.55 is 0.30, which takes
    // the text below the contrast the rest of the stylesheet is checked at.
    expect(
      hasRuleMatching(/\[inert\][^,]*\s\S*:is\([^)]*\[inert\]/, { prop: /^opacity$/, value: /^1$/ }),
    ).toBe(true);
  });
});

describe('landmark roles', () => {
  // The framework's promise is that plain semantic HTML renders correctly, but
  // a landmark is just as validly expressed as a role on a <div> - a CMS's
  // output, or a page SuCSS was dropped onto. Each element below and the role
  // it implies have to reach the same rules.
  const landmarks: [element: string, role: string][] = [
    ['header', 'banner'],
    ['nav', 'navigation'],
    ['main', 'main'],
    ['footer', 'contentinfo'],
    ['aside', 'complementary'],
    ['section', 'region'],
    ['search', 'search'],
  ];

  /** Every rule's selector list, split and normalised, in source order. */
  const selectorLists = (() => {
    const lists: string[][] = [];
    root.walkRules((rule) => {
      lists.push(splitSelectorList(rule.selector.replaceAll(/\s+/g, ' ')));
    });
    return lists;
  })();

  /** True when `selector` names `element` as a type selector of its own. */
  function mentions(selector: string, element: string): boolean {
    return new RegExp(String.raw`(^|[\s(,>+~])${element}($|[\s),>+~:[])`).test(selector);
  }

  it.each(landmarks)('styles <%s> and role="%s" from the same rules', (element, role) => {
    const paired = selectorLists.filter(
      (list) =>
        list.some((selector) => mentions(selector, element)) &&
        list.some((selector) => selector.includes(`[role="${role}"]`)),
    );

    expect(paired.length).toBeGreaterThan(0);
  });

  it.each(landmarks)('never styles a bare <%s> without also taking role="%s"', (element, role) => {
    // A rule whose subject is the element itself - `header`, not `header nav` -
    // is decoration the role has to inherit, or the two diverge.
    const orphans = selectorLists
      .filter((list) => list.includes(element))
      .filter((list) => !list.some((selector) => selector.includes(`[role="${role}"]`)))
      .map((list) => list.join(', '));

    expect(orphans).toEqual([]);
  });

  it('gives <search> a display of its own', () => {
    // <search> is newer than the browsers the build targets, and an unknown
    // element is `display: inline`. Without this the landmark's contents run
    // together on anything older.
    const declared = selectorLists.some((list, index) => {
      if (!list.includes('search')) return false;
      let found = false;
      let seen = -1;
      root.walkRules((rule) => {
        seen += 1;
        if (seen !== index) return;
        rule.walkDecls('display', () => {
          found = true;
        });
      });
      return found;
    });

    expect(declared).toBe(true);
  });

  it('leaves the panel rule light enough for the grid override to win', () => {
    // The roles are added as their own selectors rather than folded into an
    // `:is()`: wrapping the list would lift `article` and `section` to
    // attribute weight, and the grid layout further down - which is only a
    // type selector and a `:has()` - would silently lose to it.
    const panel = selectorLists.find((list) => list.includes('article') && list.includes('section'));
    expect(panel).toBeDefined();

    const grid = selectorLists.find((list) => list.includes('section:has(> article + article)'));
    expect(grid).toBeDefined();

    const heaviestPlainPanel = panel!
      .filter((selector) => !selector.includes('[role='))
      .map((selector) => specificity(selector))
      .reduce((heaviest, one) => (isAtLeast(one, heaviest) ? one : heaviest), [0, 0, 0] as [number, number, number]);

    expect(isAtLeast(specificity('section:has(> article + article)'), heaviestPlainPanel)).toBe(true);
    expect(isAtLeast(heaviestPlainPanel, specificity('section:has(> article + article)'))).toBe(false);
  });
});

describe('a field the author marked invalid', () => {
  const INVALID = /\[aria-invalid="true"\]/;

  /** Every rule that marks an invalid field, with the box-shadow it draws. */
  const markedRules: { selector: string; specificity: [number, number, number]; order: number }[] = [];
  let seen = 0;

  root.walkRules((rule) => {
    seen += 1;
    const selector = rule.selector.replaceAll(/\s+/g, ' ');
    if (!INVALID.test(selector)) return;

    for (const single of splitSelectorList(selector)) {
      if (!INVALID.test(single)) continue;
      rule.walkDecls('box-shadow', () => {
        markedRules.push({ selector: single, specificity: specificity(single), order: seen });
      });
    }
  });

  it('marks the field with more than a colour', () => {
    // WCAG 1.4.1: a border that only changes hue is invisible to a reader who
    // cannot separate this red from the theme's own border colour, so the
    // marked field carries a second, inset line as well.
    expect(markedRules.length).toBeGreaterThan(0);
    expect(markedRules.some((rule) => !rule.selector.includes(':focus-visible'))).toBe(true);
  });

  it('keeps the focus ring it would otherwise paint over', () => {
    // The plain marked-field rule sets box-shadow and sits after the focus
    // ring's own rule, so without a ring rule of its own the one affordance a
    // keyboard user has would vanish the moment a field is marked.
    const rings = markedRules.filter((rule) => rule.selector.includes(':focus-visible'));
    expect(rings.length).toBeGreaterThan(0);

    const losers = markedRules
      .filter((rule) => !rule.selector.includes(':focus-visible'))
      .filter((rule) => rings.every((ring) => !isAtLeast(ring.specificity, rule.specificity)))
      .map((rule) => `${rule.selector} (${rule.specificity.join(',')})`);

    expect(losers).toEqual([]);
  });

  it('never settles for the bare [aria-invalid] attribute', () => {
    // `aria-invalid="false"` is a valid — and common — way of saying the field
    // is fine. A selector that only tests for the attribute's presence paints
    // every one of those red.
    const sloppy: string[] = [];
    root.walkRules((rule) => {
      for (const single of splitSelectorList(rule.selector.replaceAll(/\s+/g, ' '))) {
        if (/\[aria-invalid(\]|[~|^$*]?=(?!"true"))/.test(single)) sloppy.push(single);
      }
    });
    expect(sloppy).toEqual([]);
  });

  it('never uses :invalid or :user-invalid, so an untouched required field stays quiet', () => {
    // `<input required>` matches `:invalid` from the moment the page loads: a
    // form built on it opens painted red before anyone has typed a character.
    const offenders: string[] = [];
    root.walkRules((rule) => {
      if (/:(user-)?invalid\b/.test(rule.selector)) offenders.push(rule.selector);
    });
    expect(offenders).toEqual([]);
  });

  it('draws the error text from a role the message declares itself', () => {
    // CSS cannot follow the aria-describedby / aria-errormessage reference that
    // ties a message to its field, so the message has to carry `role="alert"`.
    expect(hasRuleMatching(/\[role="alert"\]/, { prop: /^color$/, value: /var\(--color-danger\)/ })).toBe(true);
  });
});

describe('the sorted column of a table', () => {
  /**
   * Declarations of `prop` on the rules whose selector list contains `selector`
   * verbatim, in source order. Matching the whole compound keeps
   * `th[aria-sort="ascending"]` from being answered by a rule that only names
   * `th[aria-sort="ascending"]::after`, which is the distinction every
   * assertion below rests on.
   */
  function declarationsOn(selector: string, prop: string): string[] {
    const values: string[] = [];
    root.walkRules((rule) => {
      const selectors = rule.selector.split(',').map((one) => one.replaceAll(/\s+/g, ' ').trim());
      if (!selectors.includes(selector)) return;
      rule.walkDecls(prop, (decl) => {
        values.push(decl.value.trim());
      });
    });
    return values;
  }

  /** The border widths a rule leaves on `::after` for `aria-sort` of `value`. */
  function markerBorders(value: string): Record<string, string> {
    const sides: Record<string, string> = {};
    for (const side of ['top', 'bottom', 'inline']) {
      const [declared] = declarationsOn(`th[aria-sort="${value}"]::after`, `border-${side}`);
      if (declared !== undefined) sides[side] = declared;
    }
    return sides;
  }

  it('draws a marker on the header cell that carries the direction', () => {
    for (const value of ['ascending', 'descending']) {
      expect(declarationsOn(`th[aria-sort="${value}"]::after`, 'content')).not.toEqual([]);
    }
  });

  // A column that is sorted the other way must not be a recolouring of the
  // same mark: someone who cannot tell the two colours apart would be left
  // with no way to read the direction off the table at all.
  it('points the marker a different way for each direction, not a different colour', () => {
    const ascending = markerBorders('ascending');
    const descending = markerBorders('descending');

    // The triangle is a border on one edge of a zero-sized box, so the edge
    // that carries it is the direction the marker points.
    expect(Object.keys(ascending)).toContain('bottom');
    expect(Object.keys(ascending)).not.toContain('top');
    expect(Object.keys(descending)).toContain('top');
    expect(Object.keys(descending)).not.toContain('bottom');
  });

  it('takes the marker’s colour from a token rather than naming one', () => {
    for (const value of ['ascending', 'descending']) {
      const borders = Object.values(markerBorders(value));
      expect(borders.length).toBeGreaterThan(0);
      for (const border of borders) {
        expect(border).toMatch(/transparent|var\(--[\w-]+\)/);
      }
    }
  });

  it('leaves an unsorted column and one with no attribute as they were', () => {
    // `none` is the default, and `other` means sorted by something this
    // stylesheet cannot draw a direction for. Neither may grow a marker, and
    // neither may a bare `th` — a selector that matches `[aria-sort]` as a
    // whole would give all three one.
    const marked: string[] = [];
    root.walkRules((rule) => {
      let draws = false;
      rule.walkDecls('content', () => {
        draws = true;
      });
      if (!draws) return;
      for (const single of splitSelectorList(rule.selector.replaceAll(/\s+/g, ' '))) {
        if (!/\bth\b/.test(single)) continue;
        if (/\[aria-sort="(ascending|descending)"\]/.test(single)) continue;
        marked.push(single);
      }
    });
    expect(marked).toEqual([]);
  });

  it('keeps the marker from being stranded on its own line', () => {
    // The gap before the marker is a margin, not whitespace in `content`: a
    // space there is a break opportunity, and a header that wraps on a narrow
    // screen would drop the triangle onto a line by itself.
    for (const value of ['ascending', 'descending']) {
      const selector = `th[aria-sort="${value}"]::after`;
      for (const content of declarationsOn(selector, 'content')) {
        expect(content).not.toMatch(/\s/);
      }
    }
    const gaps = [
      ...declarationsOn('th[aria-sort="ascending"]::after', 'margin-inline-start'),
      ...declarationsOn('th[aria-sort="descending"]::after', 'margin-inline-start'),
    ];
    expect(gaps.length).toBeGreaterThan(0);
  });
});

describe('called-out messages', () => {
  /** The selectors of the rule that paints a standalone alert or note. */
  function calloutSelectors(): string[] {
    const found: string[] = [];
    root.walkRules((rule) => {
      const selector = rule.selector.replaceAll(/\s+/g, ' ');
      if (selector.includes('[role="alert"]') && !selector.startsWith('form ')) {
        found.push(selector);
      }
    });
    return found;
  }

  it('never turns a field error into a panel', () => {
    // The forms section draws a field's error as a line of text beside its
    // input, and declares only what it changes. A face, a radius or block
    // padding set by the standalone rule would leak straight through it, so the
    // standalone rule has to exclude a form rather than rely on being outranked.
    const selectors = calloutSelectors();

    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector, `${selector} would also match a field's error`).toContain(':not(form *)');
    }
  });

  it('keeps a status a badge and a message a block', () => {
    // A status is a word or two and stays inline; alert and note carry a
    // sentence, so they take the blockquote's shape instead.
    expect(hasRuleMatching(/\[role="status"\]/, { prop: /^display$/, value: /inline-flex/ })).toBe(true);
    expect(hasRuleMatching(/\[role="alert"\]:not\(form \*\)/, { prop: /^display$/, value: /^block$/ })).toBe(true);
  });
});

describe('work in progress', () => {
  /** Every rule whose selector mentions aria-busy, flattened for matching. */
  function busyRules(): { selector: string; declarations: Map<string, string> }[] {
    const rules: { selector: string; declarations: Map<string, string> }[] = [];
    root.walkRules((rule) => {
      const selector = rule.selector.replaceAll(/\s+/g, ' ');
      if (!selector.includes('aria-busy')) return;
      const declarations = new Map<string, string>();
      rule.walkDecls((decl) => {
        declarations.set(decl.prop, decl.value);
      });
      rules.push({ selector, declarations });
    });
    return rules;
  }

  it('reads the attribute exactly, so aria-busy="false" stays quiet', () => {
    // `aria-busy="false"` is how an author says the loading finished, and it is
    // left on the element far more often than it is removed.
    const rules = busyRules();

    expect(rules.length).toBeGreaterThan(0);
    for (const { selector } of rules) {
      expect(selector, `${selector} would match aria-busy="false"`).toMatch(/\[aria-busy="true"\]/);
      expect(selector, `${selector} matches the attribute regardless of value`).not.toMatch(
        /\[aria-busy\]/,
      );
    }
  });

  it('gives a busy button an indicator before its label', () => {
    const indicator = busyRules().find(({ selector }) =>
      /^button\[aria-busy="true"\]::before$/.test(selector),
    );

    expect(indicator).toBeDefined();
    expect(indicator?.declarations.get('animation')).toMatch(/sucss-spin/);
  });

  it('leaves the indicator visible when the movement is taken away', () => {
    // The reduced-motion block above runs every animation to its end instantly.
    // That is fine while the only thing animated is the indicator's rotation —
    // a stopped ring is still a ring. Animate its opacity or its size and the
    // same block would erase it, taking the state with it.
    const properties: string[] = [];
    root.walkAtRules('keyframes', (atRule) => {
      if (atRule.params !== 'sucss-spin') return;
      atRule.walkDecls((decl) => {
        properties.push(decl.prop);
      });
    });

    expect(properties.length).toBeGreaterThan(0);
    expect([...new Set(properties)]).toEqual(['transform']);
  });

  it('does not disable what it marks', () => {
    // `aria-busy` says the content is unsettled, not that the control is out.
    // Swallowing the pointer, or borrowing the unavailable section's fade,
    // would say the second thing — and the fade would drop the region's own
    // text, which is still text someone may be reading, below AA.
    for (const { selector, declarations } of busyRules()) {
      if (selector.endsWith('::after') || selector.endsWith('::before')) continue;
      expect(declarations.get('pointer-events'), `${selector} swallows the pointer`).not.toBe(
        'none',
      );
      expect(declarations.has('opacity'), `${selector} fades what it marks`).toBe(false);
    }
  });

  it('draws the indicator in the colour it inherits, not a new token', () => {
    const indicators = busyRules().filter(({ selector }) => /::(before|after)$/.test(selector));

    expect(indicators.length).toBeGreaterThan(0);
    for (const { selector, declarations } of indicators) {
      expect(declarations.get('border'), `${selector} should inherit its colour`).toMatch(
        /currentcolor/,
      );
    }
  });
});

describe('disclosure buttons and popovers', () => {
  /** Every rule whose selector mentions aria-expanded, flattened for matching. */
  function expandedRules(): { selector: string; declarations: Map<string, string> }[] {
    const rules: { selector: string; declarations: Map<string, string> }[] = [];
    root.walkRules((rule) => {
      const selector = rule.selector.replaceAll(/\s+/g, ' ');
      if (!selector.includes('aria-expanded')) return;
      const declarations = new Map<string, string>();
      rule.walkDecls((decl) => {
        declarations.set(decl.prop, decl.value);
      });
      rules.push({ selector, declarations });
    });
    return rules;
  }

  it('marks a disclosure button, not any element that can carry the state', () => {
    const rules = expandedRules();

    expect(rules.length).toBeGreaterThan(0);
    for (const { selector } of rules) {
      expect(selector, `${selector} should be scoped to button`).toMatch(/^button\[aria-expanded/);
    }
  });

  it('rotates the marker rather than swapping its shape', () => {
    const marker = expandedRules().find(({ selector }) => selector === 'button[aria-expanded]::after');
    const rotated = expandedRules().find(
      ({ selector }) => selector === 'button[aria-expanded="true"]::after',
    );

    expect(marker).toBeDefined();
    expect(marker?.declarations.get('transition')).toMatch(/transform/);
    expect(rotated?.declarations.get('transform')).toMatch(/rotate\(180deg\)/);
  });

  it('draws the marker in the colour it inherits, not a new token', () => {
    const marker = expandedRules().find(({ selector }) => selector === 'button[aria-expanded]::after');

    expect(marker?.declarations.get('border-block-start'), 'should inherit its colour').toMatch(
      /currentcolor/,
    );
  });

  it('shares the dialog surface with [popover] instead of repeating it', () => {
    let found = false;
    root.walkRules((rule) => {
      if (found) return;
      const selectors = rule.selector.split(',').map((selector) => selector.trim());
      if (selectors.includes('dialog') && selectors.includes('[popover]')) {
        found = true;
      }
    });
    expect(found).toBe(true);
  });

  it('never reaches for :popover-open', () => {
    // Styling stays on a plain attribute selector: [popover] is already
    // display: none while closed, so nothing here needs the pseudo-class, and
    // reaching for it would raise the declared browser target for nothing.
    let found = false;
    root.walkRules((rule) => {
      if (rule.selector.includes(':popover-open')) found = true;
    });
    expect(found).toBe(false);
  });

  it("restates margin: auto on [popover], because the file's own reset would otherwise zero it", () => {
    // The universal reset (\`*, *::before, *::after { margin: 0 }\`) is author
    // origin, so it beats the UA stylesheet's own \`margin: auto\` on [popover]
    // at any specificity - including \`*\`. Without restating it, a popover
    // opens pinned to the inset: 0 corner instead of centered, sitting over
    // whatever else was there. Confirmed the hard way: the panel covered its
    // own invoking button and nothing could close it.
    let found = false;
    root.walkRules((rule) => {
      if (found) return;
      const selectors = rule.selector.split(',').map((selector) => selector.trim());
      if (!selectors.includes('[popover]')) return;
      rule.walkDecls('margin', (decl) => {
        if (decl.value.trim() === 'auto') found = true;
      });
    });
    expect(found).toBe(true);
  });

  it('lets a dialog claim the viewport without doing the same to a popover', () => {
    function widthOn(selector: string): string[] {
      const found: string[] = [];
      root.walkRules((rule) => {
        if (!rule.selector.split(',').map((s) => s.trim()).includes(selector)) return;
        rule.walkDecls('width', (decl) => {
          found.push(decl.value);
        });
      });
      return found;
    }

    expect(widthOn('[popover]').length).toBe(0);
    expect(widthOn('dialog').length).toBeGreaterThan(0);
  });
});
