import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ja } from '../../src/locales/ja.js';

const PAGES = ['index.html', 'customize.html'];

function readPage(name: string): string {
  return fs.readFileSync(path.resolve(import.meta.dirname, '../..', name), 'utf8');
}

function keysIn(html: string): string[] {
  return [...html.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)].map((match) => match[1]);
}

describe('the demo pages', () => {
  it.each(PAGES)('%s carries no class attribute', (name) => {
    // The pages claim to be classless in their own copy. Keep them honest.
    expect(readPage(name)).not.toMatch(/\sclass=/);
  });

  it.each(PAGES)('%s has a translation for every key it uses', (name) => {
    const missing = keysIn(readPage(name)).filter((key) => !Object.hasOwn(ja, key));
    expect(missing).toEqual([]);
  });

  it('has no translations left over from markup that changed', () => {
    const used = new Set(PAGES.flatMap((name) => keysIn(readPage(name))));

    // Strings JavaScript builds are looked up by hand rather than from markup.
    const runtimeOnly = /^status\./;

    const orphans = Object.keys(ja).filter((key) => !used.has(key) && !runtimeOnly.test(key));
    expect(orphans).toEqual([]);
  });
});
