import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {specimens} from '../../scripts/review-specimens.mjs';

const root = path.resolve(__dirname, '../..');
const css = readFileSync(path.join(root, 'src/lib/sucss.css'), 'utf8');

describe('the review bench specimens', () => {
  it('describes every case fully', () => {
    for (const specimen of specimens) {
      expect(specimen.id, 'an id is the page anchor').toMatch(/^[a-z][a-z0-9-]*$/);
      expect(specimen.title.trim(), `${specimen.id} needs a title`).not.toBe('');
      expect(specimen.note.trim(), `${specimen.id} needs a note`).not.toBe('');
      expect(specimen.html.trim(), `${specimen.id} needs markup`).not.toBe('');
    }
  });

  it('gives every case its own anchor', () => {
    const ids = specimens.map((specimen) => specimen.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('stays class-free, like the markup it is meant to demonstrate', () => {
    for (const specimen of specimens) {
      expect(specimen.html, `${specimen.id} must not carry a class`).not.toMatch(/\sclass=/);
    }
  });

  it('covers every ARIA state the stylesheet styles', () => {
    // A rule nothing demonstrates is a rule the next change cannot be reviewed
    // against, so the two lists are kept in step here rather than by memory.
    const markup = specimens.map((specimen) => specimen.html).join('\n');
    const states = [
      'aria-pressed',
      'aria-current',
      'aria-invalid',
      'aria-disabled',
      'aria-sort',
      'aria-orientation',
      'role="group"',
      'role="toolbar"',
      'role="alert"',
      'role="note"',
      'inert',
    ];

    for (const state of states) {
      expect(css, `${state} is expected to be styled`).toContain(state);
      expect(markup, `${state} has no specimen to review it on`).toContain(state);
    }
  });
});
