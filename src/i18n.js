/**
 * The page's translation layer.
 *
 * English is the markup: every translatable node carries its English text in
 * the HTML and a `data-i18n` key next to it, so the source of the page reads
 * as a plain document and crawlers get real content. Other languages arrive
 * from a dictionary and replace that content in place.
 *
 * Attributes use one attribute per target: `data-i18n-placeholder`,
 * `-title`, `-value`, `-alt`, `-label` and `-content`.
 */

import {ja} from './locales/ja.js';

const DICTIONARIES = {ja};
const FALLBACK = 'en';
const STORAGE_KEY = 'sucss-lang';

/* Which `data-i18n-*` attribute writes which attribute. */
const ATTRIBUTE_KEYS = {
  placeholder: 'placeholder',
  title: 'title',
  value: 'value',
  alt: 'alt',
  label: 'label',
  content: 'content',
};

/* A translation is a small run of inline markup, not a document. Anything
   outside this list is dropped to its text, so a dictionary can never
   introduce a script, a style or an event handler. */
const ALLOWED_TAGS = new Set([
  'A',
  'ABBR',
  'B',
  'BR',
  'CITE',
  'CODE',
  'DFN',
  'EM',
  'I',
  'KBD',
  'Q',
  'S',
  'SAMP',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'U',
  'VAR',
]);

const ALLOWED_ATTRIBUTES = {A: ['href'], ABBR: ['title']};

/** English content, captured from the markup before anything replaces it. */
const english = new Map();
let currentLang = FALLBACK;

function isSafeHref(value) {
  return value.startsWith('#') || value.startsWith('./') || value.startsWith('https://');
}

/**
 * Turn a translation string into nodes, keeping only the inline markup above.
 * Built by hand rather than assigned to innerHTML, so nothing in a dictionary
 * is ever parsed as live markup by the document itself.
 */
function toFragment(html) {
  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const fragment = document.createDocumentFragment();

  const copy = (source, target) => {
    for (const node of source.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        target.append(node.textContent);
        continue;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      if (!ALLOWED_TAGS.has(node.tagName)) {
        // Keep the words, drop the element.
        copy(node, target);
        continue;
      }

      const element = document.createElement(node.tagName.toLowerCase());
      for (const name of ALLOWED_ATTRIBUTES[node.tagName] ?? []) {
        const value = node.getAttribute(name);
        if (value === null) continue;
        if (name === 'href' && !isSafeHref(value)) continue;
        element.setAttribute(name, value);
      }

      copy(node, element);
      target.append(element);
    }
  };

  copy(parsed.body, fragment);
  return fragment;
}

function elements() {
  const selector = ['[data-i18n]', ...Object.keys(ATTRIBUTE_KEYS).map((k) => `[data-i18n-${k}]`)];
  return document.querySelectorAll(selector.join(','));
}

/** Remember what the markup says, so switching back to English is a lookup. */
function captureEnglish() {
  for (const element of elements()) {
    const record = {attributes: {}};

    if (element.dataset.i18n !== undefined) {
      record.content = element.innerHTML;
    }

    for (const [suffix, attribute] of Object.entries(ATTRIBUTE_KEYS)) {
      const key = element.dataset[`i18n${suffix[0].toUpperCase()}${suffix.slice(1)}`];
      if (key !== undefined) {
        record.attributes[attribute] = element.getAttribute(attribute) ?? '';
      }
    }

    english.set(element, record);
  }
}

function apply(lang) {
  const dictionary = DICTIONARIES[lang] ?? {};

  for (const element of elements()) {
    const original = english.get(element);
    if (!original) continue;

    const contentKey = element.dataset.i18n;
    if (contentKey !== undefined) {
      const translated = dictionary[contentKey];
      element.replaceChildren(toFragment(translated ?? original.content));
    }

    for (const [suffix, attribute] of Object.entries(ATTRIBUTE_KEYS)) {
      const key = element.dataset[`i18n${suffix[0].toUpperCase()}${suffix.slice(1)}`];
      if (key === undefined) continue;
      element.setAttribute(attribute, dictionary[key] ?? original.attributes[attribute]);
    }
  }

  document.documentElement.lang = lang;

  for (const button of document.querySelectorAll('[data-lang-set]')) {
    button.setAttribute('aria-current', String(button.dataset.langSet === lang));
  }

  currentLang = lang;
  document.dispatchEvent(new CustomEvent('sucss:languagechange', {detail: {lang}}));
}

function supported(lang) {
  return lang === FALLBACK || Object.hasOwn(DICTIONARIES, lang);
}

/** ?lang= wins, then a saved choice, then what the browser asks for. */
function preferredLanguage() {
  const requested = new URLSearchParams(location.search).get('lang');
  if (requested && supported(requested)) return requested;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && supported(saved)) return saved;
  } catch {
    /* Storage can be blocked. */
  }

  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = String(tag).split('-')[0];
    if (supported(base)) return base;
  }

  return FALLBACK;
}

export function setLanguage(lang) {
  if (!supported(lang)) return;

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* Storage can be blocked; the switch still works for this page view. */
  }

  apply(lang);
}

export function currentLanguage() {
  return currentLang;
}

/** Look a key up in the active language, for strings JavaScript builds. */
export function t(key, fallback) {
  return DICTIONARIES[currentLang]?.[key] ?? fallback;
}

export function initI18n() {
  captureEnglish();
  apply(preferredLanguage());

  for (const button of document.querySelectorAll('[data-lang-set]')) {
    button.addEventListener('click', () => setLanguage(button.dataset.langSet));
  }
}
