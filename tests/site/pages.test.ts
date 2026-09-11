import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES, PAGES, TARGETS, readLocale, renderPage } from '../../scripts/build-pages.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');

/** Keys under this prefix belong to the page's script, not its markup. */
const RUNTIME_PREFIX = 'ui.';

function readTemplate(name: string): string {
  return fs.readFileSync(path.join(ROOT, name), 'utf8');
}

function keysIn(html: string): string[] {
  return [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map((match) => match[1]);
}

const templateKeys = new Set(PAGES.flatMap((page) => keysIn(readTemplate(page.template))));

describe('the rendered pages', () => {
  it.each(TARGETS)('$output carries no class attribute', (target) => {
    // The pages claim to be classless in their own copy. Keep them honest.
    expect(renderPage(target)).not.toMatch(/\sclass=/);
  });

  it.each(TARGETS)('$output has no keys left in it', (target) => {
    // A rendered page is plain HTML: the keys did their work at build time.
    expect(renderPage(target)).not.toMatch(/data-i18n/);
  });

  it.each(TARGETS)('$output has no tokens left in it', (target) => {
    expect(renderPage(target)).not.toMatch(/\{\{|\}\}/);
  });

  it.each(TARGETS)('$output declares its language and its own canonical URL', (target) => {
    const html = renderPage(target);

    expect(html).toContain(`<html lang="${target.locale}">`);
    expect(html).toContain(`<link rel="canonical" href="${target.url}" />`);
  });
});

describe('the dictionaries', () => {
  it.each(LOCALES)('%s has text for every key the templates use', (locale) => {
    const dictionary = readLocale(locale);
    const missing = [...templateKeys].filter((key) => !Object.hasOwn(dictionary, key));

    expect(missing).toEqual([]);
  });

  it.each(LOCALES)('%s has nothing left over from markup that changed', (locale) => {
    const orphans = Object.keys(readLocale(locale)).filter(
      (key) => !templateKeys.has(key) && !key.startsWith(RUNTIME_PREFIX),
    );

    expect(orphans).toEqual([]);
  });

  it('all describe the same keys, in the same order', () => {
    const [reference, ...others] = LOCALES.map((locale) => Object.keys(readLocale(locale)));

    for (const keys of others) {
      expect(keys).toEqual(reference);
    }
  });
});
