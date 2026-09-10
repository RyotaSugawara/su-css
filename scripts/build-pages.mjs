/**
 * Renders the demo site's pages.
 *
 * The pages are a template plus a dictionary: `src/pages/*.html` holds the
 * structure with a `data-i18n` key wherever text goes, and `src/locales/*.json`
 * holds the text itself, one file per language. Every string on the site lives
 * in those JSON files — including the few the page's own script writes, which
 * travel with the page as a small inline JSON block.
 *
 * Rendering fills the keys, resolves the handful of per-page tokens (paths,
 * canonical URL, the language links), and strips the keys, so what ships is
 * plain HTML with nothing left to interpret. The rendered pages are build
 * output and git-ignored; `npm run dev` and `npm run build` run this first.
 *
 *   node scripts/build-pages.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = 'https://ryotasugawara.github.io/su-css/';

/** Elements that never have a closing tag, so they only carry attributes. */
const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'img', 'input', 'link', 'meta']);

/** Keys under this prefix are for the page's script, not its markup. */
const RUNTIME_PREFIX = 'ui.';

export const LOCALES = ['en', 'ja'];

export const PAGES = [
  {
    template: 'src/pages/index.html',
    variants: {
      en: {output: 'index.html', root: './', url: SITE, links: {en: './', ja: './ja/'}},
      ja: {output: 'ja/index.html', root: '../', url: `${SITE}ja/`, links: {en: '../', ja: './'}},
    },
  },
  {
    template: 'src/pages/customize.html',
    variants: {
      en: {
        output: 'customize.html',
        root: './',
        url: `${SITE}customize.html`,
        links: {en: './customize.html', ja: './ja/customize.html'},
      },
      ja: {
        output: 'ja/customize.html',
        root: '../',
        url: `${SITE}ja/customize.html`,
        links: {en: '../customize.html', ja: './customize.html'},
      },
    },
  },
];

/** Every page that gets written, flattened for callers that want a list. */
export const TARGETS = PAGES.flatMap((page) =>
  Object.entries(page.variants).map(([locale, variant]) => ({
    template: page.template,
    locale,
    ...variant,
  })),
);

export function readLocale(locale) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, `src/locales/${locale}.json`), 'utf8'));
}

function escapeAttribute(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}

/** The end of the opening tag that starts at `start`, quotes respected. */
function endOfOpenTag(html, start) {
  let quote = null;

  for (let i = start; i < html.length; i += 1) {
    const character = html[i];

    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return i + 1;
    }
  }

  throw new Error(`Unterminated tag at ${start}`);
}

/** The index of the `</tag>` that closes the element, nesting respected. */
function endOfElement(html, tag, from) {
  const pattern = new RegExp(`<(/?)${tag}\\b`, 'gi');
  pattern.lastIndex = from;

  let depth = 1;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    depth += match[1] === '/' ? -1 : 1;
    if (depth === 0) return match.index;
  }

  throw new Error(`Unclosed <${tag}> from ${from}`);
}

/** Fill every `data-i18n` key from the dictionary, then drop the keys. */
function fillText(html, dictionary, {template}) {
  let out = html;
  let cursor = 0;

  while (true) {
    const marker = out.indexOf('data-i18n', cursor);
    if (marker === -1) break;

    const start = out.lastIndexOf('<', marker);
    const openEnd = endOfOpenTag(out, start);
    const tag = /^<([a-zA-Z][\w-]*)/.exec(out.slice(start))[1].toLowerCase();

    let openTag = out.slice(start, openEnd);

    // Attributes first: data-i18n-placeholder="key" writes placeholder="…".
    for (const [, attribute, key] of openTag.matchAll(/data-i18n-([a-z]+)="([^"]*)"/g)) {
      const text = dictionary[key];
      if (text === undefined) throw new Error(`${template}: no text for ${key}`);

      const pattern = new RegExp(`(\\s${attribute}=")[^"]*(")`);
      if (!pattern.test(openTag)) throw new Error(`${template}: <${tag}> has no ${attribute}=""`);

      openTag = openTag.replace(pattern, `$1${escapeAttribute(text)}$2`);
    }

    // The keys have done their work; they are not part of the output.
    openTag = openTag.replace(/\s*data-i18n(?:-[a-z]+)?="[^"]*"/g, '');

    const contentKey = /data-i18n="([^"]*)"/.exec(out.slice(start, openEnd))?.[1];

    if (contentKey !== undefined && !VOID_ELEMENTS.has(tag)) {
      const text = dictionary[contentKey];
      if (text === undefined) throw new Error(`${template}: no text for ${contentKey}`);

      const closeStart = endOfElement(out, tag, openEnd);
      out = out.slice(0, start) + openTag + text + out.slice(closeStart);
    } else {
      out = out.slice(0, start) + openTag + out.slice(openEnd);
    }

    cursor = start + openTag.length;
  }

  return out;
}

/** The strings the page's own script writes, shipped alongside the page. */
function runtimeStrings(dictionary) {
  return Object.fromEntries(
    Object.entries(dictionary)
      .filter(([key]) => key.startsWith(RUNTIME_PREFIX))
      .map(([key, value]) => [key.slice(RUNTIME_PREFIX.length), value]),
  );
}

export function renderPage(target) {
  const dictionary = readLocale(target.locale);
  const template = fs.readFileSync(path.join(ROOT, target.template), 'utf8');

  const tokens = {
    lang: target.locale,
    root: target.root,
    canonical: target.url,
    ogUrl: target.url,
    enHref: target.links.en,
    jaHref: target.links.ja,
    enCurrent: target.locale === 'en' ? ' aria-current="true"' : '',
    jaCurrent: target.locale === 'ja' ? ' aria-current="true"' : '',
    strings: JSON.stringify(runtimeStrings(dictionary)),
  };

  const resolved = template.replaceAll(/\{\{(\w+)\}\}/g, (whole, name) => {
    if (!Object.hasOwn(tokens, name)) throw new Error(`${target.template}: unknown token ${whole}`);
    return tokens[name];
  });

  return fillText(resolved, dictionary, target);
}

function main() {
  for (const target of TARGETS) {
    const file = path.join(ROOT, target.output);

    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, renderPage(target));
    console.log(`${target.output} ← ${target.template} + src/locales/${target.locale}.json`);
  }
}

if (process.argv[1] === import.meta.filename) {
  main();
}
