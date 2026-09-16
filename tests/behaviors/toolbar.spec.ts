import {expect, test} from '@playwright/test';

/**
 * The real [role="toolbar"] on the demo site's own elements page (Bold,
 * Italic - nested inside its own role="group" - then a <hr>, then Link).
 * Testing against that markup rather than a bespoke fixture means a change
 * to the demo page that breaks this contract fails here too.
 */
const toolbar = (page: import('@playwright/test').Page) => page.getByRole('toolbar', {name: 'Formatting'});

test.beforeEach(async ({page}) => {
  await page.goto('/');
});

test('starts with exactly one item in the tab order: the one already pressed', async ({page}) => {
  const bar = toolbar(page);
  const bold = bar.getByRole('button', {name: 'Bold'});
  const italic = bar.getByRole('button', {name: 'Italic'});
  const link = bar.getByRole('button', {name: 'Link'});

  // Bold starts aria-pressed="true" in the markup, so it - not the first
  // command in source order, which happens to also be Bold here - is where
  // roving tabindex should park the one reachable stop.
  await expect(bold).toHaveAttribute('tabindex', '0');
  await expect(italic).toHaveAttribute('tabindex', '-1');
  await expect(link).toHaveAttribute('tabindex', '-1');
});

test('arrow keys move focus among every command, flat, wrapping at the ends', async ({page}) => {
  const bar = toolbar(page);
  const bold = bar.getByRole('button', {name: 'Bold'});
  const italic = bar.getByRole('button', {name: 'Italic'});
  const link = bar.getByRole('button', {name: 'Link'});

  await bold.focus();
  await expect(bold).toBeFocused();

  await page.keyboard.press('ArrowRight');
  await expect(italic).toBeFocused();
  await expect(italic).toHaveAttribute('tabindex', '0');
  await expect(bold).toHaveAttribute('tabindex', '-1');

  // The <hr> between Italic and Link is not a command - it is skipped, not a
  // stop of its own.
  await page.keyboard.press('ArrowRight');
  await expect(link).toBeFocused();

  // Wraps back to the start rather than doing nothing at the end.
  await page.keyboard.press('ArrowRight');
  await expect(bold).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await expect(link).toBeFocused();
});

test('Home and End jump to the first and last command', async ({page}) => {
  const bar = toolbar(page);
  const bold = bar.getByRole('button', {name: 'Bold'});
  const link = bar.getByRole('button', {name: 'Link'});

  await bold.focus();
  await page.keyboard.press('End');
  await expect(link).toBeFocused();

  await page.keyboard.press('Home');
  await expect(bold).toBeFocused();
});

test('Tab leaves the toolbar in one step, entering and exiting like a single stop', async ({page}) => {
  const bar = toolbar(page);
  const bold = bar.getByRole('button', {name: 'Bold'});

  await bold.focus();
  await page.keyboard.press('Tab');
  await expect(bold).not.toBeFocused();

  // Whatever comes right after the toolbar in the page's own tab order is
  // not, itself, part of this test's contract - only that focus actually
  // left the bar rather than landing on another command inside it.
  const stillInside = await bar.evaluate(
    (el, activeSelector) => el.contains(document.activeElement) && document.activeElement?.matches(activeSelector),
    'button, a[href]',
  );
  expect(stillInside).toBe(false);
});

test('a mouse click updates which item Tab would return to', async ({page}) => {
  const bar = toolbar(page);
  const bold = bar.getByRole('button', {name: 'Bold'});
  const link = bar.getByRole('button', {name: 'Link'});

  await link.click();
  await expect(link).toHaveAttribute('tabindex', '0');
  await expect(bold).toHaveAttribute('tabindex', '-1');
});

test('moving through the nested toggle-button group never traps focus, and never presses a button on its own', async ({
  page,
}) => {
  const bar = toolbar(page);
  const bold = bar.getByRole('button', {name: 'Bold'});
  const italic = bar.getByRole('button', {name: 'Italic'});
  const link = bar.getByRole('button', {name: 'Link'});

  // Bold and Italic are nested inside their own role="group" - one composite
  // this toolbar's own CSS already draws as a segmented control - but moving
  // the arrow key through it is exactly like moving through any other
  // command: it does not, on its own, toggle aria-pressed. That is what
  // makes flat traversal correct here rather than a shortcut: a toggle
  // button's own selection and its focus are independent, unlike a native
  // role="radiogroup" where arrowing through would change the selection too.
  await bold.focus();
  await page.keyboard.press('ArrowRight'); // into Italic, still inside the group
  await expect(italic).toBeFocused();
  await expect(bold).toHaveAttribute('aria-pressed', 'true'); // unchanged by the move
  await expect(italic).toHaveAttribute('aria-pressed', 'false'); // unchanged by the move

  // One more step carries focus straight out of the group and on to the
  // toolbar's next command - nothing about the group's own boundary holds
  // focus back.
  await page.keyboard.press('ArrowRight');
  await expect(link).toBeFocused();
});

test('a synthetic click - carrying none of the browser\'s own click-focus - still moves the tab stop', async ({
  page,
}) => {
  const bar = toolbar(page);
  const bold = bar.getByRole('button', {name: 'Bold'});
  const link = bar.getByRole('button', {name: 'Link'});

  // page.click() drives a real mousedown/mouseup, which Chromium already
  // focuses on its own - the same native behaviour Safari lacks, so it can't
  // tell this fix's own .focus() call apart from the browser's. Dispatching
  // a bare 'click' event through the DOM carries no such default action in
  // any engine, Chromium included: it exercises only the click listener
  // toolbar.js adds for Safari, the same path a real Safari tap takes.
  await link.evaluate((el) => el.dispatchEvent(new MouseEvent('click', {bubbles: true})));
  await expect(link).toBeFocused();
  await expect(link).toHaveAttribute('tabindex', '0');
  await expect(bold).toHaveAttribute('tabindex', '-1');
});
