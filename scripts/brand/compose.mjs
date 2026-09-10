/**
 * Composes the brand kit's SVG documents out of the primitives in geometry.mjs.
 *
 * Every document is self-contained: the letterforms are outlined, so nothing
 * here depends on a font being installed wherever the SVG ends up.
 */

import {PALETTE, buildMark, plate, plateMetrics} from './geometry.mjs';

const round = (n) => Math.round(n * 100) / 100;

/**
 * The tagline runs a hair wider than the wordmark, is centred on the plate
 * rather than on the wordmark, and hangs off whatever sits above it. The
 * ratios are measured off the sheet's cover.
 */
const TAGLINE = {widthRatio: 1.033, gapUnderPlate: 59, gapUnderWordmark: 42};

/** Colour sets. The ghost set carries alpha so it can wash over any backdrop. */
export const THEMES = {
  light: {
    background: PALETTE.white,
    word: 'url(#word-gradient)',
    plate: 'url(#plate-gradient)',
    shadow: PALETTE.brand,
    tagline: PALETTE.brand,
  },
  inverse: {
    background: PALETTE.brand,
    word: PALETTE.white,
    plate: PALETTE.white,
    shadow: PALETTE.white,
    tagline: PALETTE.white,
  },
  mono: {
    background: PALETTE.white,
    word: PALETTE.ink,
    plate: PALETTE.ink,
    shadow: PALETTE.ink,
    tagline: PALETTE.inkSoft,
  },
  monoInverse: {
    background: PALETTE.ink,
    word: PALETTE.white,
    plate: PALETTE.white,
    shadow: PALETTE.white,
    tagline: PALETTE.white,
  },
  ghost: {
    background: 'none',
    word: `${PALETTE.brand}38`,
    plate: `${PALETTE.brand}16`,
    shadow: PALETTE.brand,
    tagline: `${PALETTE.brand}38`,
  },
};

function gradients() {
  return [
    `<linearGradient id="word-gradient" x1="0" y1="0" x2="0.35" y2="1">`,
    `<stop offset="0" stop-color="${PALETTE.brandLight}"/>`,
    `<stop offset="1" stop-color="${PALETTE.brand}"/>`,
    `</linearGradient>`,
    `<linearGradient id="plate-gradient" x1="0.85" y1="0" x2="0.15" y2="1">`,
    `<stop offset="0" stop-color="${PALETTE.brandLight}"/>`,
    `<stop offset="0.45" stop-color="${PALETTE.brand}"/>`,
    `<stop offset="1" stop-color="${PALETTE.brandDeep}"/>`,
    `</linearGradient>`,
  ].join('');
}

function blurFilter(id, stdDeviation) {
  // A generous region: the default -10%/120% box clips a blur this soft.
  return (
    `<filter id="${id}" x="-70%" y="-200%" width="240%" height="500%" ` +
    `color-interpolation-filters="sRGB">` +
    `<feGaussianBlur stdDeviation="${round(stdDeviation)}"/></filter>`
  );
}

function doc({width, height, defs = '', body, title}) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="0 0 ${round(width)} ${round(height)}" width="${round(width)}" height="${round(height)}" ` +
    `role="img" aria-label="${title}">` +
    `<title>${title}</title>` +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    `</svg>\n`
  );
}

/**
 * Places a mark inside a canvas so that it covers `coverage` of the width and
 * sits on the optical centre — nudged up, because the drop shadow adds weight
 * at the bottom that the eye does not read as part of the mark.
 */
function place(mark, {width, height, coverage, opticalLift = 0.02}) {
  const scale = (width * coverage) / mark.box.width;
  const x = (width - mark.box.width * scale) / 2 - mark.box.x * scale;
  const y = (height - mark.box.height * scale) / 2 - height * opticalLift;
  return `<g transform="translate(${round(x)} ${round(y)}) scale(${round(scale)})">${mark.body}</g>`;
}

export function iconSvg({
  word,
  theme,
  size = 512,
  coverage = 0.663,
  withShadow = true,
  ringBoost = 1,
  corner = 0.21,
}) {
  const colors = THEMES[theme];
  const mark = buildMark({word, variant: 'icon', ids: {blur: 'plate-shadow'}, colors, withShadow, ringBoost});

  const defs =
    (theme === 'light' ? gradients() : '') +
    (withShadow ? blurFilter('plate-shadow', mark.blurStdDeviation) : '');

  const body =
    `<rect width="${size}" height="${size}" rx="${round(size * corner)}" fill="${colors.background}"/>` +
    place(mark, {width: size, height: size, coverage});

  return doc({width: size, height: size, defs, body, title: 'SuCSS'});
}

/** The bare mark, no tile behind it. */
export function markSvg({word, theme, padding = 0.04}) {
  const colors = THEMES[theme];
  const mark = buildMark({word, variant: 'icon', ids: {blur: 'plate-shadow'}, colors});
  const pad = mark.box.width * padding;
  const defs = (theme === 'light' ? gradients() : '') + blurFilter('plate-shadow', mark.blurStdDeviation);
  return doc({
    width: mark.box.width + pad * 2,
    height: mark.box.height + pad * 2,
    defs,
    body: `<g transform="translate(${round(pad - mark.box.x)} ${round(pad)})">${mark.body}</g>`,
    title: 'SuCSS',
  });
}

/**
 * Builds the horizontal lockup as a positioned group plus its extents, so the
 * same geometry backs the standalone logo files and the cover artwork.
 *
 * `parts` selects which of the three elements are drawn, which is what
 * separates the full lockup from the text-only variant and the bare plate.
 */
export function lockupGroup({wordmark, tagline, colors, parts = {}}) {
  const {plate: withPlate = true, wordmark: withWordmark = true, tagline: withTagline = true} = parts;
  const m = plateMetrics(wordmark, 'lockup');
  const layers = [];
  // `bottom` tracks the drawn extent; `inkBottom` ignores the soft shadow, so
  // the tagline hangs off the plate itself rather than off the blur.
  let bottom = withWordmark ? 100 : 0;
  let inkBottom = bottom;

  if (withPlate) {
    layers.push(
      plate({
        cx: m.cx,
        cy: m.cy,
        rx: m.rx,
        ry: m.ry,
        innerScaleX: m.innerScaleX,
        innerScaleY: m.innerScaleY,
        innerRise: m.innerRise,
        tilt: m.tilt,
        fill: colors.plate,
        shadow: {...m.shadow, fill: colors.shadow, blurId: 'plate-shadow'},
      }),
    );
    inkBottom = m.bottom + m.swing;
    bottom = Math.max(inkBottom, m.shadowBottom);
  }

  if (withWordmark) layers.push(`<path d="${wordmark.d}" fill="${colors.word}"/>`);

  const taglineWidth = wordmark.width * TAGLINE.widthRatio;
  const taglineScale = taglineWidth / tagline.width;
  // Centred on the plate, which itself sits a touch off the wordmark's centre.
  const taglineLeft = (withPlate ? m.cx : wordmark.width / 2) - taglineWidth / 2;

  if (withTagline) {
    const top = inkBottom + (withPlate ? TAGLINE.gapUnderPlate : TAGLINE.gapUnderWordmark);
    layers.push(
      `<g transform="translate(${round(taglineLeft)} ${round(top)}) scale(${round(taglineScale)})">` +
        `<path d="${tagline.d}" fill="${colors.tagline}"/></g>`,
    );
    bottom = Math.max(bottom, top + 100 * taglineScale);
  }

  const edges = [];
  if (withWordmark) edges.push([0, wordmark.width]);
  if (withPlate) edges.push([m.cx - m.rx, m.cx + m.rx]);
  if (withTagline) edges.push([taglineLeft, taglineLeft + taglineWidth]);
  const left = Math.min(...edges.map(([a]) => a));
  const right = Math.max(...edges.map(([, b]) => b));

  return {
    body: layers.join(''),
    box: {x: left, y: 0, width: right - left, height: bottom},
    blurStdDeviation: round(m.shadow.blur),
    hasPlate: withPlate,
  };
}

export function lockupSvg({wordmark, tagline, theme, parts, padding = 24}) {
  const colors = THEMES[theme];
  const group = lockupGroup({wordmark, tagline, colors, parts});
  const defs =
    (theme === 'light' ? gradients() : '') +
    (group.hasPlate ? blurFilter('plate-shadow', group.blurStdDeviation) : '');
  return doc({
    width: group.box.width + padding * 2,
    height: group.box.height + padding * 2,
    defs,
    body: `<g transform="translate(${round(padding - group.box.x)} ${round(padding)})">${group.body}</g>`,
    title: 'SuCSS — Just HTML, already styled.',
  });
}

/** Positions are fractions of the tile, so the scatter survives any tile size. */
export const PATTERN_MARKS = [
  {x: 0.13, y: 0.14, scale: 0.23, rotate: -12},
  {x: 0.57, y: 0.34, scale: 0.17, rotate: 9},
  {x: 0.92, y: 0.09, scale: 0.2, rotate: -21},
  {x: 0.31, y: 0.71, scale: 0.19, rotate: 16},
  {x: 0.78, y: 0.85, scale: 0.24, rotate: -6},
  {x: -0.03, y: 0.52, scale: 0.15, rotate: 23},
];

/** The plate on its own. Defaults to the icon's disc, seen from a steeper angle. */
export function plateSvg({word, theme, variant = 'icon', padding = 0.05}) {
  const colors = THEMES[theme];
  const m = plateMetrics(word, variant);
  const body = plate({
    cx: m.cx,
    cy: m.cy,
    rx: m.rx,
    ry: m.ry,
    innerScaleX: m.innerScaleX,
    innerScaleY: m.innerScaleY,
    innerRise: m.innerRise,
    tilt: m.tilt,
    fill: colors.plate,
    shadow: {...m.shadow, fill: colors.shadow, blurId: 'plate-shadow'},
  });
  const left = m.cx - m.rx;
  const top = m.top - m.swing;
  const width = m.rx * 2;
  const height = Math.max(m.bottom + m.swing, m.shadowBottom) - top;
  const pad = width * padding;
  return doc({
    width: width + pad * 2,
    height: height + pad * 2,
    defs: (theme === 'light' ? gradients() : '') + blurFilter('plate-shadow', m.shadow.blur),
    body: `<g transform="translate(${round(pad - left)} ${round(pad - top)})">${body}</g>`,
    title: 'SuCSS plate',
  });
}

/**
 * Scatters marks across a tile, repeating each one at every wrapping offset so
 * the tile is seamless even where a mark runs off an edge.
 */
export function patternTile({word, tile = {width: 560, height: 460}, marks = PATTERN_MARKS}) {
  const mark = buildMark({word, variant: 'icon', ids: {blur: 'pattern-shadow'}, colors: THEMES.ghost});
  const unit = 1 / mark.box.width;

  const uses = [];
  for (const m of marks) {
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        const x = m.x * tile.width + dx * tile.width;
        const y = m.y * tile.height + dy * tile.height;
        const reach = m.scale * tile.width * 0.6;
        if (x < -reach || x > tile.width + reach || y < -reach || y > tile.height + reach) continue;
        const s = round(m.scale * tile.width * unit);
        uses.push(
          `<use xlink:href="#su-mark" href="#su-mark" transform="translate(${round(x)} ${round(y)}) ` +
            `rotate(${m.rotate}) scale(${s}) ` +
            `translate(${round(-mark.box.width / 2 - mark.box.x)} ${round(-mark.box.height / 2)})"/>`,
        );
      }
    }
  }

  return {
    defs:
      blurFilter('pattern-shadow', mark.blurStdDeviation) +
      `<g id="su-mark">${mark.body}</g>` +
      `<clipPath id="pattern-clip"><rect width="${tile.width}" height="${tile.height}"/></clipPath>` +
      `<pattern id="su-pattern" width="${tile.width}" height="${tile.height}" patternUnits="userSpaceOnUse">` +
      `<g clip-path="url(#pattern-clip)">${uses.join('')}</g></pattern>`,
  };
}

export function patternSvg({word, width = 1120, height = 920}) {
  const tile = patternTile({word});
  return doc({
    width,
    height,
    defs: tile.defs,
    body:
      `<rect width="${width}" height="${height}" fill="${PALETTE.mist}"/>` +
      `<rect width="${width}" height="${height}" fill="url(#su-pattern)"/>`,
    title: 'SuCSS pattern',
  });
}

/**
 * The cover artwork, used for the README banner, the OG image and the GitHub
 * social preview. Only the canvas and the pattern scale change between them.
 */
export function coverSvg({
  wordmark,
  tagline,
  word,
  width,
  height,
  coverage = 0.42,
  heightCoverage = 0.5,
  tileSize = 560,
}) {
  const group = lockupGroup({wordmark, tagline, colors: THEMES.light});
  const scale = Math.min(
    (width * coverage) / group.box.width,
    (height * heightCoverage) / group.box.height,
  );
  const x = (width - group.box.width * scale) / 2 - group.box.x * scale;
  const y = (height - group.box.height * scale) / 2;

  const tile = patternTile({word, tile: {width: tileSize, height: round(tileSize * 0.82)}});

  // A wash of the background colour under the lockup, so the scattered marks
  // never crowd the wordmark.
  const clearing =
    `<radialGradient id="clearing" cx="0.5" cy="0.5" r="0.5">` +
    `<stop offset="0" stop-color="${PALETTE.canvas}" stop-opacity="0.97"/>` +
    `<stop offset="0.55" stop-color="${PALETTE.canvas}" stop-opacity="0.9"/>` +
    `<stop offset="1" stop-color="${PALETTE.canvas}" stop-opacity="0"/>` +
    `</radialGradient>`;

  return doc({
    width,
    height,
    defs: gradients() + blurFilter('plate-shadow', group.blurStdDeviation) + tile.defs + clearing,
    body:
      `<rect width="${width}" height="${height}" fill="${PALETTE.canvas}"/>` +
      `<rect width="${width}" height="${height}" fill="url(#su-pattern)"/>` +
      `<ellipse cx="${round(width / 2)}" cy="${round(height / 2)}" ` +
      `rx="${round(group.box.width * scale * 0.85)}" ry="${round(group.box.height * scale * 0.95)}" ` +
      `fill="url(#clearing)"/>` +
      `<g transform="translate(${round(x)} ${round(y)}) scale(${round(scale)})">${group.body}</g>`,
    title: 'SuCSS — Just HTML, already styled.',
  });
}
