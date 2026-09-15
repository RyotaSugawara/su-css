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
      'aria-busy',
      'aria-expanded',
      'popover',
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

describe('the review bench height-tracking agent', () => {
  const build = readFileSync(path.join(root, 'scripts/build-review.mjs'), 'utf8');

  it('re-measures on toggle, not only through ResizeObserver on body children', () => {
    // A [popover] or <dialog> is position: fixed, so opening one never
    // changes any ancestor's own box - not the body, and not the stage div
    // that wraps every specimen. ResizeObserver watching those ancestors
    // alone cannot see it open. Confirmed the hard way: the bench never
    // grew to fit an opened popover, which then rendered clipped by its own
    // iframe with no way to reach whatever of it fell outside.
    expect(build).toMatch(/addEventListener\(['"]toggle['"],\s*send\)/);
  });

  it('measures an open popover or dialog from its own content, not its clipped position', () => {
    expect(build).toContain('popover]:popover-open');
    expect(build).toMatch(/offsetHeight/);
  });
});

describe('the disclosure specimen', () => {
  it('reserves enough height that an open popover cannot cover its own button', () => {
    // [popover] centers on its whole viewport - the review bench's, here,
    // not the page's. A specimen too short leaves no room between a button
    // near the top and a panel centered below it, and the panel ends up
    // sitting on the button that opened it - which was also the only way to
    // close it again.
    const disclosure = specimens.find((specimen) => specimen.id === 'disclosure');
    expect(disclosure?.html).toMatch(/min-height/);
  });
});
