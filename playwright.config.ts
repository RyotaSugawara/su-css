import {defineConfig} from '@playwright/test';

/**
 * Exercises the behavior scripts against the actual built demo site,
 * because keyboard focus is not something a DOM emulator (vitest/jsdom) can
 * be trusted to reproduce faithfully - see the reasoning in #55.
 *
 * `webServer` builds the site once and serves the real dist/ output, so
 * these tests run against exactly what a visitor - or `npm run build:lib`'s
 * own consumer, since the demo site imports the package's own behaviors.js
 * the same way an outside project would - actually gets.
 */
export default defineConfig({
  testDir: 'tests/behaviors',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'dot' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/su-css/',
    trace: 'on-first-retry',
  },
  // Rebuilding here as well as in CI's own separate Build step is a few
  // hundred milliseconds wasted, not a real cost, and it is what keeps
  // `npm run test:behaviors` runnable on its own, without a build step run
  // by hand first.
  webServer: {
    command: 'npm run build && node scripts/serve-dist.mjs 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        // Set only in sandboxes that ship a pre-installed Chromium under a
        // path Playwright's own headless-shell lookup does not know about;
        // a normal `npx playwright install` environment (CI included)
        // leaves this unset and resolves its browser the usual way.
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
          ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}
          : {},
      },
    },
  ],
});
