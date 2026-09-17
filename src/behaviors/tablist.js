/**
 * Tabs with automatic activation for role="tablist".
 *
 * A toolbar's roving tabindex only ever moves focus - pressing a command is a
 * separate act. A tab list is different: WAI-ARIA APG's "automatic
 * activation" pattern says whatever tab focus lands on - by arrow key, by
 * click, even by a script's own .focus() call - becomes the selected one
 * immediately, panel swap included, no Enter or Space needed. That single
 * rule is why this file mirrors toolbar.js's shape (keydown moves focus,
 * focusin is where the state actually changes, click is Safari's workaround
 * for the one platform that does not focus a button on its own) but cannot
 * share its code: toolbar.js's focusin handler only ever touches tabIndex,
 * and here it also has to move the selection and swap the panel.
 */

const TAB_SELECTOR = '[role="tab"]';

function isFocusable(element) {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-disabled') === 'true') return false;
  if (element.hidden) return false;
  return true;
}

function tabs(tablist) {
  return Array.from(tablist.querySelectorAll(TAB_SELECTOR)).filter(isFocusable);
}

function panelFor(tab) {
  const id = tab.getAttribute('aria-controls');
  return id ? document.getElementById(id) : null;
}

/** Selects `chosen` and deselects every other tab in `list`, panel included. */
function select(list, chosen) {
  for (const tab of list) {
    const isChosen = tab === chosen;
    tab.setAttribute('aria-selected', String(isChosen));
    tab.tabIndex = isChosen ? 0 : -1;
    const panel = panelFor(tab);
    if (panel) panel.hidden = !isChosen;
  }
}

function initTablist(tablist) {
  if (tablist.dataset.sucssTablist) return;
  tablist.dataset.sucssTablist = 'true';

  const list = tabs(tablist);
  if (list.length === 0) return;

  // An already-selected tab (author-chosen, or restored from elsewhere)
  // outranks source order the same way toolbar.js prefers aria-pressed.
  const chosen = list.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? list[0];
  select(list, chosen);

  const vertical = tablist.getAttribute('aria-orientation') === 'vertical';
  const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
  const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';

  tablist.addEventListener('keydown', (event) => {
    const current = tabs(tablist);
    const from = current.indexOf(document.activeElement);
    if (from === -1) return;

    let to;
    if (event.key === nextKey) to = (from + 1) % current.length;
    else if (event.key === prevKey) to = (from - 1 + current.length) % current.length;
    else if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = current.length - 1;
    else return;

    // Only ever handled inside the tab list, and only for the keys above -
    // every other key (Tab included) is left to do whatever it already does.
    event.preventDefault();
    current[to].focus();
  });

  // Whatever gets focus becomes the selected tab - its panel included - so
  // the keyboard, the pointer and the visible panel never disagree.
  tablist.addEventListener('focusin', (event) => {
    const target = event.target.closest(TAB_SELECTOR);
    const current = tabs(tablist);
    if (!target || !current.includes(target)) return;
    select(current, target);
  });

  // Safari does not focus a <button> on click - macOS Safari only does it
  // once "Full Keyboard Access" is turned on, and iOS Safari never does, tap
  // included (see toolbar.js for the fuller note) - so the focusin handler
  // above never runs there on its own. Chromium and Firefox already focus a
  // clicked button and would fire this a second, harmless time.
  tablist.addEventListener('click', (event) => {
    const target = event.target.closest(TAB_SELECTOR);
    if (!target || !tabs(tablist).includes(target)) return;
    if (document.activeElement !== target) target.focus();
  });
}

/** Wires every role="tablist" under root (root included) that has not already been wired. */
export function enhanceTablists(root = document) {
  const here = typeof root.matches === 'function' && root.matches('[role="tablist"]') ? [root] : [];
  for (const tablist of [...here, ...root.querySelectorAll('[role="tablist"]')]) {
    initTablist(tablist);
  }
}
