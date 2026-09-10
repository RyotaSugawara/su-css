/**
 * Regenerates the SuCSS brand kit in assets/brand/ and the site icons in
 * public/.
 *
 * The SVGs are the source of truth and are committed, so this only needs to
 * run when the brand itself changes. It has two dependencies that the project
 * does not otherwise need, which is why they are installed on demand rather
 * than carried in package.json:
 *
 *   npm install --no-save opentype.js playwright @expo-google-fonts/montserrat
 *   node scripts/build-brand-assets.mjs
 *
 * opentype.js outlines the Montserrat letterforms so the SVGs carry no font
 * dependency; Chromium (via Playwright) rasterises the PNGs that GitHub, npm
 * and the OG crawlers need, none of which accept SVG.
 */

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

import {outlineText, PALETTE} from './brand/geometry.mjs';
import {coverSvg, iconSvg, lockupSvg, markSvg, patternSvg, plateSvg} from './brand/compose.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAND_DIR = path.join(ROOT, 'assets', 'brand');
const PUBLIC_DIR = path.join(ROOT, 'public');

// Tracking, in ems, solved so each string's width-to-height ratio matches the
// sheet's: 1.914 for the mark, 5.443 for the wordmark, 13.76 for the tagline.
// Display type this heavy is always set tight; the mark is tightest of all,
// with the s and the u very nearly touching.
const MARK_TRACKING = -0.0883;
const WORDMARK_TRACKING = -0.0474;
const TAGLINE_TRACKING = -0.004;

const require = createRequire(import.meta.url);

function need(name) {
  try {
    return require(name);
  } catch {
    console.error(
      `\nMissing "${name}". This script is not part of the normal build; install its\n` +
        `dependencies first:\n\n` +
        `  npm install --no-save opentype.js playwright @expo-google-fonts/montserrat\n`,
    );
    process.exit(1);
  }
}

function loadFont(opentype, weightDir, file) {
  const ttf = require.resolve(`@expo-google-fonts/montserrat/${weightDir}/${file}`);
  const buffer = fs.readFileSync(ttf);
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

function write(dir, name, contents) {
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, name), contents);
  const size = Buffer.byteLength(contents);
  console.log(`  ${path.relative(ROOT, path.join(dir, name)).padEnd(40)} ${(size / 1024).toFixed(1)} KB`);
}

/** Rasterises an SVG string at an exact pixel size using headless Chromium. */
async function rasterise(page, svg, {width, height}) {
  await page.setViewportSize({width: Math.round(width), height: Math.round(height)});
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:${width}px;height:${height}px}</style>` +
      svg,
  );
  return page.screenshot({omitBackground: true});
}

function chromiumPath() {
  // The sandboxes this repo is developed in ship a pinned Chromium that will
  // not match whatever build Playwright was installed against.
  const preinstalled = '/opt/pw-browsers/chromium';
  return fs.existsSync(preinstalled) ? preinstalled : undefined;
}

async function main() {
  const opentype = need('opentype.js');
  const extraBold = loadFont(opentype, '800ExtraBold', 'Montserrat_800ExtraBold.ttf');
  const medium = loadFont(opentype, '500Medium', 'Montserrat_500Medium.ttf');

  const word = outlineText(opentype, extraBold, 'su', {tracking: MARK_TRACKING});
  const wordmark = outlineText(opentype, extraBold, 'su-css', {tracking: WORDMARK_TRACKING});
  const tagline = outlineText(opentype, medium, 'Just HTML, already styled.', {tracking: TAGLINE_TRACKING});

  console.log('\nSVG');
  const svgs = {
    'icon.svg': iconSvg({word, theme: 'light'}),
    'icon-inverse.svg': iconSvg({word, theme: 'inverse'}),
    'icon-mono.svg': iconSvg({word, theme: 'mono'}),
    // Small sizes get the inverse tile: a white plate on brand purple is the
    // only version of the mark that still reads at 16 px, on a light or a dark
    // tab strip. The drop shadow goes, because none of it survives down there.
    'icon-small.svg': iconSvg({word, theme: 'inverse', coverage: 0.84, withShadow: false, ringBoost: 1, corner: 0.19}),
    'icon-small-light.svg': iconSvg({word, theme: 'light', coverage: 0.84, withShadow: false, ringBoost: 1, corner: 0.19}),
    'mark.svg': markSvg({word, theme: 'light'}),
    'mark-inverse.svg': markSvg({word, theme: 'inverse'}),
    'logo.svg': lockupSvg({wordmark, tagline, theme: 'light'}),
    'logo-inverse.svg': lockupSvg({wordmark, tagline, theme: 'inverse'}),
    'logo-mono.svg': lockupSvg({wordmark, tagline, theme: 'mono'}),
    'logo-wordmark.svg': lockupSvg({wordmark, tagline, theme: 'light', parts: {plate: false}}),
    'plate.svg': plateSvg({word, theme: 'light', variant: 'disc'}),
    'pattern.svg': patternSvg({word}),
    'cover.svg': coverSvg({wordmark, tagline, word, width: 1600, height: 400, coverage: 0.3, tileSize: 620}),
    'og.svg': coverSvg({wordmark, tagline, word, width: 1200, height: 630, coverage: 0.42, tileSize: 520}),
    'social-preview.svg': coverSvg({wordmark, tagline, word, width: 1280, height: 640, coverage: 0.42, tileSize: 560}),
  };
  for (const [name, contents] of Object.entries(svgs)) write(BRAND_DIR, name, contents);

  // favicon.svg is the small-size icon: fewer details, a heavier rim, and no
  // drop shadow, because none of it survives at 16 px.
  write(PUBLIC_DIR, 'favicon.svg', svgs['icon-small.svg']);

  const playwright = need('playwright');
  const browser = await playwright.chromium.launch({
    executablePath: chromiumPath(),
    args: ['--no-sandbox', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage({deviceScaleFactor: 1});

  console.log('\nPNG');
  const pngs = [
    [PUBLIC_DIR, 'favicon-96.png', svgs['icon-small.svg'], 96, 96],
    [
      PUBLIC_DIR,
      'apple-touch-icon.png',
      // iOS masks the corners itself and never shows transparency, so this one
      // is drawn square and full-bleed.
      iconSvg({word, theme: 'inverse', coverage: 0.72, corner: 0}),
      180,
      180,
    ],
    [PUBLIC_DIR, 'og-image.png', svgs['og.svg'], 1200, 630],
    [BRAND_DIR, 'icon-512.png', svgs['icon.svg'], 512, 512],
    [BRAND_DIR, 'icon-inverse-512.png', svgs['icon-inverse.svg'], 512, 512],
    [BRAND_DIR, 'cover.png', svgs['cover.svg'], 1600, 400],
    [BRAND_DIR, 'social-preview.png', svgs['social-preview.svg'], 1280, 640],
  ];
  for (const [dir, name, svg, width, height] of pngs) {
    write(dir, name, await rasterise(page, svg, {width, height}));
  }

  await browser.close();
  console.log(`\nBrand purple ${PALETTE.brand} · lavender ${PALETTE.lavender} · mist ${PALETTE.mist}\n`);
}

await main();
