import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGES, renderPage } from '../../scripts/build-i18n-pages.mjs';
import { ja } from '../../src/locales/ja.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SOURCES = PAGES.map((page) => page.source);
const ALL_PAGES = [...SOURCES, ...PAGES.map((page) => page.output)];

function read(name: string): string {
  return fs.readFileSync(path.join(ROOT, name), 'utf8');
}

function keysIn(html: string): string[] {
  return [...html.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)].map((match) => match[1]);
}

describe('the demo pages', () => {
  it.each(ALL_PAGES)('%s carries no class attribute', (name) => {
    // The pages claim to be classless in their own copy. Keep them honest.
    expect(read(name)).not.toMatch(/\sclass=/);
  });

  it.each(SOURCES)('%s has a translation for every key it uses', (name) => {
    const missing = keysIn(read(name)).filter((key) => !Object.hasOwn(ja, key));
    expect(missing).toEqual([]);
  });

  it('has no translations left over from markup that changed', () => {
    const used = new Set(SOURCES.flatMap((name) => keysIn(read(name))));
    const orphans = Object.keys(ja).filter((key) => !used.has(key));

    expect(orphans).toEqual([]);
  });

  it.each(PAGES)('$output is up to date with $source', (page) => {
    // The translated pages are committed so the site needs no build step to
    // serve them. Regenerate `npm run build:pages` when this fails.
    expect(read(page.output)).toBe(renderPage(page, 'ja'));
  });

  it.each(PAGES)('$output has no untranslated keys left in it', (page) => {
    // A translated page is plain HTML: the keys did their work at build time.
    expect(read(page.output)).not.toMatch(/data-i18n/);
  });
});
