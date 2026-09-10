/**
 * The customizer page.
 *
 * Each control names a CSS custom property in `data-var`. Moving one sets that
 * property on `:root`, which restyles this page — the same stylesheet the
 * settings are for — and rewrites the `:root` block you can copy out. Choices
 * are kept in localStorage so they follow you to the rest of the site; the
 * inline script in the page head applies them before first paint.
 */

import {strings} from './site.js';

const root = document.documentElement;
const TOKENS_KEY = 'sucss-tokens';

const form = document.querySelector('#controls');
const output = document.querySelector('#output code');
const controls = [...document.querySelectorAll('[data-var]')];

/** The value each control starts at, which is also the framework's default. */
const defaults = new Map(
  controls.map((control) => [control, control.getAttribute('value') ?? control.value]),
);

function unitOf(control) {
  return control.dataset.unit ?? '';
}

function displayValue(control) {
  return `${control.value}${unitOf(control)}`;
}

function readStored() {
  try {
    const stored = JSON.parse(localStorage.getItem(TOKENS_KEY) || '{}');
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    return {};
  }
}

function store(tokens) {
  try {
    if (Object.keys(tokens).length === 0) {
      localStorage.removeItem(TOKENS_KEY);
    } else {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    }
  } catch {
    /* Storage can be blocked; the page still restyles for this view. */
  }
}

/** Only what differs from the defaults is worth writing down. */
function changedTokens() {
  const tokens = {};

  for (const control of controls) {
    if (control.value === defaults.get(control)) continue;
    tokens[control.dataset.var] = displayValue(control);
  }

  return tokens;
}

function render() {
  const tokens = changedTokens();
  const entries = Object.entries(tokens);

  if (entries.length === 0) {
    output.textContent = strings.emptyOutput;
    return;
  }

  const body = entries.map(([name, value]) => `  ${name}: ${value};`).join('\n');
  output.textContent = `:root {\n${body}\n}`;
}

function applyControl(control) {
  const name = control.dataset.var;

  if (control.value === defaults.get(control)) {
    root.style.removeProperty(name);
  } else {
    root.style.setProperty(name, displayValue(control));
  }

  const readout = document.querySelector(`#out-${CSS.escape(control.id)}`);
  if (readout) readout.textContent = displayValue(control);
}

function applyAll() {
  for (const control of controls) applyControl(control);
  render();
}

/* Restore the stored settings into the controls. The properties themselves are
   already on :root, applied by the page head before first paint. */
const stored = readStored();
for (const control of controls) {
  const value = stored[control.dataset.var];
  if (value === undefined) continue;

  const unit = unitOf(control);
  control.value = unit && value.endsWith(unit) ? value.slice(0, -unit.length) : value;
}
applyAll();

for (const control of controls) {
  control.addEventListener('input', () => {
    applyControl(control);
    render();
    store(changedTokens());
  });
}

form?.addEventListener('reset', () => {
  // The reset lands after this event, so read the defaults rather than the
  // controls' current values.
  for (const control of controls) {
    control.value = defaults.get(control);
  }

  applyAll();
  store({});
});
