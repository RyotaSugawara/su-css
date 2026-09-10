/**
 * Geometry for the SuCSS brand mark.
 *
 * Everything is drawn from two primitives:
 *
 *   - the wordmark, outlined from Poppins so the SVGs carry no font dependency
 *   - the plate, a shallow disc seen from just above its rim: a hairline
 *     ellipse for the top face, and a crescent below it for the wall
 *
 * All coordinates are in "mark units", where the wordmark is exactly 100 units
 * tall and its bounding box starts at the origin. Callers scale the finished
 * group into whatever canvas they need.
 */

/** The palette from the brand sheet, plus the two shades the plate is lit with. */
export const PALETTE = {
  brand: '#7C5CFF',
  brandLight: '#9179FF',
  brandDeep: '#6242E0',
  lavender: '#EDE8FF',
  mist: '#F8F6FF',
  canvas: '#FBFAFE', // the cover ground: mist, lightened so the pattern can sit on it
  white: '#FFFFFF',
  ink: '#171326',
  inkSoft: '#3B3552',
};

const round = (n) => Math.round(n * 100) / 100;

/**
 * Serialises an opentype path, applying a scale and an offset on the way out.
 *
 * opentype.js 2.0.0 ships a `toPathData` that emits `NaN` for some quadratic
 * segments, so the path data is written here instead of being taken from the
 * library.
 */
function toPathData(path, {scale = 1, dx = 0, dy = 0} = {}) {
  const x = (v) => round(v * scale + dx);
  const y = (v) => round(v * scale + dy);
  const out = [];
  for (const c of path.commands) {
    switch (c.type) {
      case 'M':
        out.push(`M${x(c.x)} ${y(c.y)}`);
        break;
      case 'L':
        out.push(`L${x(c.x)} ${y(c.y)}`);
        break;
      case 'Q':
        out.push(`Q${x(c.x1)} ${y(c.y1)} ${x(c.x)} ${y(c.y)}`);
        break;
      case 'C':
        out.push(`C${x(c.x1)} ${y(c.y1)} ${x(c.x2)} ${y(c.y2)} ${x(c.x)} ${y(c.y)}`);
        break;
      case 'Z':
        out.push('Z');
        break;
      default:
        throw new Error(`unsupported path command: ${c.type}`);
    }
  }
  return out.join('');
}

/**
 * Lays text out glyph by glyph so tracking can be applied, then normalises the
 * result to a 100-unit-tall path whose bounding box starts at the origin.
 */
export function outlineText(opentype, font, text, {tracking = 0} = {}) {
  const glyphs = font.stringToGlyphs(text);
  const path = new opentype.Path();
  let pen = 0;
  glyphs.forEach((glyph, i) => {
    if (i > 0) pen += font.getKerningValue(glyphs[i - 1], glyph) / font.unitsPerEm;
    path.extend(glyph.getPath(pen * 1000, 0, 1000));
    pen += glyph.advanceWidth / font.unitsPerEm + tracking;
  });

  const box = path.getBoundingBox();
  const scale = 100 / (box.y2 - box.y1);
  return {
    d: toPathData(path, {scale, dx: -box.x1 * scale, dy: -box.y1 * scale}),
    width: round((box.x2 - box.x1) * scale),
    height: 100,
  };
}

/**
 * The disc the wordmark rests on.
 *
 * `thickness` is how far the bottom of the wall sits below the top face, so
 * the wall reads as a band that is widest at the front and vanishes at the
 * left and right tips — the silhouette a coin has when you look at it from
 * slightly above. The rim is stroked over the whole ellipse, which leaves a
 * hairline across the back and merges into the wall at the front.
 */
export function plate({cx, cy, rx, ry, thickness, rim, tilt = 0, fill, rimFill, shadow = null}) {
  const r = round;
  const wall = [
    `M${r(cx - rx)} ${r(cy)}`,
    `A${r(rx)} ${r(ry)} 0 0 0 ${r(cx + rx)} ${r(cy)}`,
    `L${r(cx + rx)} ${r(cy + thickness)}`,
    `A${r(rx)} ${r(ry)} 0 0 1 ${r(cx - rx)} ${r(cy + thickness)}`,
    'Z',
  ].join('');

  const parts = [];
  if (shadow) {
    parts.push(
      `<ellipse cx="${r(cx)}" cy="${r(shadow.cy)}" rx="${r(shadow.rx)}" ry="${r(shadow.ry)}" ` +
        `fill="${shadow.fill}" opacity="${shadow.opacity}" filter="url(#${shadow.blurId})"/>`,
    );
  }
  parts.push(`<path d="${wall}" fill="${fill}"/>`);
  parts.push(
    `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}" ` +
      `fill="none" stroke="${rimFill}" stroke-width="${r(rim)}"/>`,
  );

  const body = parts.join('');
  return tilt ? `<g transform="rotate(${tilt} ${r(cx)} ${r(cy)})">${body}</g>` : body;
}

/**
 * Proportions measured off the brand sheet, pixel by pixel.
 *
 * `icon` is the tight lockup: a wide plate whose tips show either side of the
 * wordmark and whose top face hides behind the letters. `lockup` is the same
 * disc seen from a shallower angle, so it flattens into an underline and
 * clears the wordmark entirely — note that the wall does not flatten with it,
 * which is why `wallRatio` is so much larger there.
 */
export const PROPORTIONS = {
  icon: {
    plateWidthRatio: 1.83, // plate width ÷ wordmark width
    flatness: 0.25, // ry ÷ rx
    wallRatio: 0.36, // wall thickness ÷ ry
    rimRatio: 0.17, // rim stroke ÷ ry
    centerOffset: 0, // plate cx offset, as a fraction of the wordmark width
    plateDrop: 0.12, // plate centre below the wordmark bottom, ÷ wordmark height
    tilt: -2.5,
    shadow: {gap: 0.23, scaleX: 0.8, scaleY: 0.39, opacity: 0.3, blur: 0.16},
  },
  lockup: {
    plateWidthRatio: 1.186,
    flatness: 0.05,
    wallRatio: 1.7,
    rimRatio: 0.2,
    centerOffset: 0,
    plateDrop: 0.21, // the swoosh tucks straight under the wordmark
    tilt: -1.2,
    shadow: {gap: 1.6, scaleX: 0.86, scaleY: 1.8, opacity: 0.26, blur: 0.7},
  },
};

/** Resolves a set of proportions against a wordmark into concrete coordinates. */
export function plateMetrics(word, variant) {
  const p = PROPORTIONS[variant];
  const rx = (word.width * p.plateWidthRatio) / 2;
  const ry = rx * p.flatness;
  const thickness = ry * p.wallRatio;
  const rim = ry * p.rimRatio;
  const cx = word.width / 2 + word.width * p.centerOffset;
  const cy = 100 + 100 * p.plateDrop;
  const shadow = {
    cy: cy + thickness + ry + ry * p.shadow.gap,
    rx: rx * p.shadow.scaleX,
    ry: ry * p.shadow.scaleY,
    opacity: p.shadow.opacity,
    blur: ry * p.shadow.blur,
  };
  return {
    ...p,
    rx,
    ry,
    thickness,
    rim,
    cx,
    cy,
    shadow,
    // The tilt swings the tips down by rx·sin(tilt); allow for it when sizing
    // a canvas so nothing clips.
    swing: Math.abs(Math.sin((p.tilt * Math.PI) / 180)) * rx,
    bottom: cy + thickness + ry + rim / 2,
    shadowBottom: shadow.cy + shadow.ry + shadow.blur * 2.5,
  };
}

/**
 * Composes a wordmark and its plate, and reports the bounding box of the result.
 *
 * `rimScale` and `wallScale` fatten the disc for sizes where a hairline would
 * simply disappear — a 16 px favicon, mostly.
 */
export function buildMark({word, variant, ids, colors, withShadow = true, rimScale = 1, wallScale = 1}) {
  const m = plateMetrics(word, variant);
  const thickness = m.thickness * wallScale;
  const rim = m.rim * rimScale;

  const body =
    plate({
      cx: m.cx,
      cy: m.cy,
      rx: m.rx,
      ry: m.ry,
      thickness,
      rim,
      tilt: m.tilt,
      fill: colors.plate,
      rimFill: colors.rim,
      shadow: withShadow ? {...m.shadow, fill: colors.shadow, blurId: ids.blur} : null,
    }) + `<path d="${word.d}" fill="${colors.word}"/>`;

  const left = Math.min(0, m.cx - m.rx - rim / 2);
  const right = Math.max(word.width, m.cx + m.rx + rim / 2);
  const ink = m.cy + thickness + m.ry + rim / 2 + m.swing;
  const bottom = withShadow ? Math.max(ink, m.shadowBottom) : ink;

  return {
    body,
    box: {x: left, y: 0, width: right - left, height: Math.max(100, bottom)},
    blurStdDeviation: round(m.shadow.blur),
  };
}
