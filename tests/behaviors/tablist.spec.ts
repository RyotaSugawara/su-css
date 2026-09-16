import {expect, test} from '@playwright/test';

/**
 * The real [role="tablist"] on the demo site's own elements page: Overview,
 * Details, History, each controlling its own [role="tabpanel"]. Testing
 * against that markup rather than a bespoke fixture means a change to the
 * demo page that breaks this contract fails here too.
 */
const tablist = (page: import('@playwright/test').Page) => page.getByRole('tablist', {name: 'Sections'});

test.beforeEach(async ({page}) => {
  await page.goto('/');
});

test('starts with exactly one tab selected and in the tab order: the one already marked', async ({page}) => {
  const bar = tablist(page);
  const overview = bar.getByRole('tab', {name: 'Overview'});
  const details = bar.getByRole('tab', {name: 'Details'});
  const history = bar.getByRole('tab', {name: 'History'});

  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await expect(overview).toHaveAttribute('tabindex', '0');
  await expect(details).toHaveAttribute('aria-selected', 'false');
  await expect(details).toHaveAttribute('tabindex', '-1');
  await expect(history).toHaveAttribute('tabindex', '-1');

  await expect(page.locator('#demo-panel-overview')).toBeVisible();
  await expect(page.locator('#demo-panel-details')).toBeHidden();
});

test('an arrow key moves focus AND the selection AND the panel together', async ({page}) => {
  const bar = tablist(page);
  const overview = bar.getByRole('tab', {name: 'Overview'});
  const details = bar.getByRole('tab', {name: 'Details'});
  const history = bar.getByRole('tab', {name: 'History'});

  await overview.focus();
  await page.keyboard.press('ArrowRight');

  // Automatic activation (WAI-ARIA APG): landing on Details selects it and
  // swaps the panel immediately - no Enter or Space needed, unlike a toolbar
  // command.
  await expect(details).toBeFocused();
  await expect(details).toHaveAttribute('aria-selected', 'true');
  await expect(details).toHaveAttribute('tabindex', '0');
  await expect(overview).toHaveAttribute('aria-selected', 'false');
  await expect(overview).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#demo-panel-details')).toBeVisible();
  await expect(page.locator('#demo-panel-overview')).toBeHidden();

  // Wraps back to the start rather than doing nothing at the end.
  await page.keyboard.press('ArrowRight');
  await expect(history).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(overview).toBeFocused();
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#demo-panel-overview')).toBeVisible();

  await page.keyboard.press('ArrowLeft');
  await expect(history).toBeFocused();
  await expect(history).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#demo-panel-history')).toBeVisible();
});

test('Home and End jump to the first and last tab, selecting as they go', async ({page}) => {
  const bar = tablist(page);
  const overview = bar.getByRole('tab', {name: 'Overview'});
  const history = bar.getByRole('tab', {name: 'History'});

  await overview.focus();
  await page.keyboard.press('End');
  await expect(history).toBeFocused();
  await expect(history).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#demo-panel-history')).toBeVisible();

  await page.keyboard.press('Home');
  await expect(overview).toBeFocused();
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#demo-panel-overview')).toBeVisible();
});

test('Tab leaves the tab list in one step, entering and exiting like a single stop', async ({page}) => {
  const bar = tablist(page);
  const overview = bar.getByRole('tab', {name: 'Overview'});

  await overview.focus();
  await page.keyboard.press('Tab');
  await expect(overview).not.toBeFocused();

  const stillInside = await bar.evaluate(
    (el, activeSelector) => el.contains(document.activeElement) && document.activeElement?.matches(activeSelector),
    '[role="tab"]',
  );
  expect(stillInside).toBe(false);
});

test('a mouse click selects the clicked tab and swaps its panel', async ({page}) => {
  const bar = tablist(page);
  const overview = bar.getByRole('tab', {name: 'Overview'});
  const history = bar.getByRole('tab', {name: 'History'});

  await history.click();
  await expect(history).toHaveAttribute('aria-selected', 'true');
  await expect(history).toHaveAttribute('tabindex', '0');
  await expect(overview).toHaveAttribute('aria-selected', 'false');
  await expect(overview).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#demo-panel-history')).toBeVisible();
  await expect(page.locator('#demo-panel-overview')).toBeHidden();
});

test('a synthetic click - carrying none of the browser\'s own click-focus - still selects the tab', async ({page}) => {
  // Same isolation as toolbar.spec.ts's own synthetic-click test: a bare
  // dispatchEvent('click') triggers no engine's native focus-on-click default
  // action, so this exercises only tablist.js's own click listener - the
  // same path a real Safari tap takes, where the browser never focuses the
  // tab on its own.
  const bar = tablist(page);
  const overview = bar.getByRole('tab', {name: 'Overview'});
  const history = bar.getByRole('tab', {name: 'History'});

  await history.evaluate((el) => el.dispatchEvent(new MouseEvent('click', {bubbles: true})));
  await expect(history).toBeFocused();
  await expect(history).toHaveAttribute('aria-selected', 'true');
  await expect(overview).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('#demo-panel-history')).toBeVisible();
});
