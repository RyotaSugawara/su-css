/**
 * Renders the translated copies of the demo site.
 *
 * The English pages in the repository root are the source: every translatable
 * node carries its English text plus a `data-i18n` key, and every translatable
 * attribute a `data-i18n-<attribute>` key. This script swaps that content for a
 * dictionary's, rewrites the relative paths for the extra directory level, and
 * writes the result to `ja/`.
 *
 * The output is committed, so the site needs no build step to serve it and the
 * files can be hand-edited if this script ever goes away. `npm run test` fails
 * when the committed copies drift from what this produces.
 *
 *   node scripts/build-i18n-pages.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

import {ja} from '../src/locales/ja.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = 'https://ryotasugawara.github.io/su-css/';

/** Elements that never have a closing tag, so they only carry attributes. */
const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'img', 'input', 'link', 'meta']);

export const LOCALES = {ja};

export const PAGES = [
  {source: 'index.html', output: 'ja/index.html', enUrl: SITE, jaUrl: `${SITE}ja/`},
  {
    source: 'customize.html',
    output: 'ja/customize.html',
    enUrl: `${SITE}customize.html`,
    jaUrl: `${SITE}ja/customize.html`,
  },
];

/** Where each language's switch link points, from each page. */
const LANGUAGE_LINKS = {
  'index.html': {en: '../', ja: './'},
  'customize.html': {en: '../customize.html', ja: './customize.html'},
};

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

/**
 * Replace the content and attributes marked with `data-i18n` keys, then drop
 * the keys: a translated page is plain HTML with nothing left to interpret.
 */
function translate(html, dictionary) {
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
      const translation = dictionary[key];
      if (translation === undefined) continue;

      const pattern = new RegExp(`(\\s${attribute}=")[^"]*(")`);
      openTag = openTag.replace(pattern, `$1${escapeAttribute(translation)}$2`);
    }

    // The keys have done their work; they are not part of the output.
    openTag = openTag.replace(/\s*data-i18n(?:-[a-z]+)?="[^"]*"/g, '');

    const contentKey = /data-i18n="([^"]*)"/.exec(out.slice(start, openEnd))?.[1];
    const translation = contentKey === undefined ? undefined : dictionary[contentKey];

    if (translation !== undefined && !VOID_ELEMENTS.has(tag)) {
      const closeStart = endOfElement(out, tag, openEnd);
      out = out.slice(0, start) + openTag + translation + out.slice(closeStart);
    } else {
      out = out.slice(0, start) + openTag + out.slice(openEnd);
    }

    cursor = start + openTag.length;
  }

  return out;
}

/** One directory down, so the shared files sit one level up. */
function relocate(html, page) {
  const links = LANGUAGE_LINKS[page.source];

  return html
    .replaceAll('="./src/', '="../src/')
    .replaceAll('="./assets/', '="../assets/')
    .replace(/(<a href=")[^"]*("[^>]*data-lang-link="en")([^>]*)>/, `$1${links.en}$2$3>`)
    .replace(/(<a href=")[^"]*("[^>]*data-lang-link="ja")([^>]*)>/, `$1${links.ja}$2$3>`)
    .replace(/(data-lang-link="en")\s+aria-current="true"/, '$1')
    .replace(/(data-lang-link="ja")/, '$1 aria-current="true"')
    .replace(`<link rel="canonical" href="${page.enUrl}"`, `<link rel="canonical" href="${page.jaUrl}"`)
    .replace(`<meta property="og:url" content="${page.enUrl}"`, `<meta property="og:url" content="${page.jaUrl}"`);
}

export function renderPage(page, locale) {
  const source = fs.readFileSync(path.join(ROOT, page.source), 'utf8');
  const translated = relocate(translate(source, LOCALES[locale]), page);

  return translated.replace(
    '<!doctype html>\n',
    `<!doctype html>\n<!-- Generated from ${page.source} by scripts/build-i18n-pages.mjs. Edit that page and src/locales/${locale}.js, then run \`npm run build:pages\`. -->\n`,
  ).replace('<html lang="en">', `<html lang="${locale}">`);
}

function main() {
  for (const page of PAGES) {
    const rendered = renderPage(page, 'ja');
    const target = path.join(ROOT, page.output);

    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, rendered);
    console.log(`${page.output} ← ${page.source}`);
  }
}

if (process.argv[1] === import.meta.filename) {
  main();
}
