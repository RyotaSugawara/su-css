/**
 * Roving tabindex for role="toolbar".
 *
 * A toolbar is one stop in the tab order: Tab moves past the whole bar, and
 * the arrow keys move the focus among the commands inside it. That is
 * standard keyboard behaviour for a toolbar (WAI-ARIA APG), and it is what
 * README asks an author to write themselves if this script is not loaded.
 * This is that script - reading the same `[role="toolbar"]` the stylesheet
 * already draws, nothing more.
 *
 * A nested composite (the segmented control README's own toolbar demo nests
 * inside itself, a `role="group"` of buttons with `aria-pressed`) is not
 * treated specially: every focusable command in the toolbar, at any depth,
 * is one flat stop. That is a simplification, not a claim that it is always
 * the right behaviour for a nested widget - see the note this ships with.
 */

const ITEM_SELECTOR = 'button, a[href], input[type="button"], input[type="submit"], input[type="reset"]';

function isFocusable(element) {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-disabled') === 'true') return false;
  if (element.hidden) return false;
  return true;
}

function items(toolbar) {
  return Array.from(toolbar.querySelectorAll(ITEM_SELECTOR)).filter(isFocusable);
}

function moveFocus(current, to) {
  for (const element of current) element.tabIndex = -1;
  current[to].tabIndex = 0;
  current[to].focus();
}

function initToolbar(toolbar) {
  if (toolbar.dataset.sucssToolbar) return;
  toolbar.dataset.sucssToolbar = 'true';

  const list = items(toolbar);
  if (list.length === 0) return;

  // Exactly one item starts in the tab order. An item already marked as the
  // chosen one - aria-pressed="true", or aria-current - is a more useful
  // landing spot than the first command in source order, the same reasoning
  // the stylesheet's own selection state uses.
  const chosen = list.find(
    (element) => element.getAttribute('aria-pressed') === 'true' || element.hasAttribute('aria-current'),
  );
  const start = chosen ?? list[0];
  for (const element of list) element.tabIndex = element === start ? 0 : -1;

  const vertical = toolbar.getAttribute('aria-orientation') === 'vertical';
  const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
  const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';

  toolbar.addEventListener('keydown', (event) => {
    const current = items(toolbar);
    const from = current.indexOf(document.activeElement);
    if (from === -1) return;

    let to;
    if (event.key === nextKey) to = (from + 1) % current.length;
    else if (event.key === prevKey) to = (from - 1 + current.length) % current.length;
    else if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = current.length - 1;
    else return;

    // Only ever handled inside the toolbar, and only for the keys above -
    // every other key (Tab included) is left to do whatever it already does.
    event.preventDefault();
    moveFocus(current, to);
  });

  // Whatever a click, or a script's own .focus() call, lands on becomes the
  // one item in the tab order, so the keyboard and the pointer never
  // disagree about which command Tab would return to.
  toolbar.addEventListener('focusin', (event) => {
    const current = items(toolbar);
    const at = current.indexOf(event.target);
    if (at === -1) return;
    for (const element of current) element.tabIndex = element === event.target ? 0 : -1;
  });
}

/** Wires every role="toolbar" under root (root included) that has not already been wired. */
export function enhanceToolbars(root = document) {
  const here = typeof root.matches === 'function' && root.matches('[role="toolbar"]') ? [root] : [];
  for (const toolbar of [...here, ...root.querySelectorAll('[role="toolbar"]')]) {
    initToolbar(toolbar);
  }
}
