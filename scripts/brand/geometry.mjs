/**
 * Geometry for the SuCSS brand mark.
 *
 * Everything is drawn from two primitives:
 *
 *   - the wordmark, outlined from Montserrat so the SVGs carry no font
 *     dependency
 *   - the plate, an ellipse with a second, smaller ellipse subtracted from it,
 *     the inner one raised
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
 * It is not a cylinder: it is one ellipse with a second, smaller ellipse
 * subtracted from it, the inner one raised. The hole is lifted far enough to
 * clear the outer edge at the back, so the ring does not close — it breaks
 * open across the top and tapers to a horn at either end, leaving a thick band
 * across the front. The outer ellipse is fitted against the brand sheet and
 * lands within about a pixel; how far the hole is raised is a design choice,
 * set by `backOpening`.
 *
 * Drawn as one path with `evenodd`, so the inner ellipse punches the hole.
 */
export function plate({
  cx,
  cy,
  rx,
  ry,
  innerScaleX,
  innerScaleY,
  innerRise,
  tilt = 0,
  fill,
  shadow = null,
}) {
  const r = round;
  const rise = ry * innerRise;
  const rxi = rx * innerScaleX;
  const ryi = ry * innerScaleY;

  const parts = [];
  if (shadow) {
    parts.push(
      `<ellipse cx="${r(cx)}" cy="${r(shadow.cy)}" rx="${r(shadow.rx)}" ry="${r(shadow.ry)}" ` +
        `fill="${shadow.fill}" opacity="${shadow.opacity}" filter="url(#${shadow.blurId})"/>`,
    );
  }
  parts.push(`<path d="${crescent({cx, cy, rx, ry, rxi, ryi, rise})}" fill="${fill}" fill-rule="evenodd"/>`);

  const body = parts.join('');
  return tilt ? `<g transform="rotate(${tilt} ${r(cx)} ${r(cy)})">${body}</g>` : body;
}

/**
 * The outline of the outer ellipse minus the raised inner one, as a single
 * closed path.
 *
 * Two subpaths under `fill-rule="evenodd"` would be wrong: even-odd is a
 * symmetric difference, so the moment the raised hole clears the outer edge the
 * part that pokes out gets *filled* — leaving exactly the hairline across the
 * back that this shape must not have. So the two crossing points are solved for
 * instead, and the boundary is traced through them: the outer edge round the
 * bottom, then the inner edge back. The result is one shape with the hole
 * genuinely gone, which also survives a trip through a vector editor.
 *
 * When the hole does not clear the outer edge there are no crossings and the
 * ring is closed; that case falls back to a two-subpath annulus, where even-odd
 * is correct.
 */
function crescent({cx, cy, rx, ry, rxi, ryi, rise}) {
  const r = round;
  const ellipse = (x, y, ax, ay) =>
    `M${r(x - ax)} ${r(y)}` +
    `A${r(ax)} ${r(ay)} 0 1 0 ${r(x + ax)} ${r(y)}` +
    `A${r(ax)} ${r(ay)} 0 1 0 ${r(x - ax)} ${r(y)}Z`;

  // Both ellipses share a vertical axis, so substituting one into the other
  // leaves a quadratic in t, the crossing's offset from the outer centre.
  const A = (rx * rx) / (ry * ry);
  const B = (rxi * rxi) / (ryi * ryi);
  const qa = A - B;
  const qb = -2 * B * rise;
  const qc = rxi * rxi - B * rise * rise - rx * rx;
  const disc = qb * qb - 4 * qa * qc;

  let t = null;
  if (Math.abs(qa) > 1e-9 && disc > 0) {
    const root = Math.sqrt(disc);
    t = [(-qb + root) / (2 * qa), (-qb - root) / (2 * qa)]
      .filter((v) => Math.abs(v) <= ry + 1e-9 && Math.abs(v + rise) <= ryi + 1e-9)
      .sort((p, q) => p - q)[0];
  }
  if (t === undefined || t === null) {
    return ellipse(cx, cy, rx, ry) + ellipse(cx, cy - rise, rxi, ryi);
  }

  const half = rx * Math.sqrt(Math.max(0, 1 - (t * t) / (ry * ry)));
  const y = cy + t;
  // Both arcs run round the bottom: the outer one right-to-left is the long way
  // when the crossings sit above its centre, and likewise for the inner one.
  const outerLarge = t < 0 ? 1 : 0;
  const innerLarge = t + rise < 0 ? 1 : 0;
  return (
    `M${r(cx - half)} ${r(y)}` +
    `A${r(rx)} ${r(ry)} 0 ${outerLarge} 0 ${r(cx + half)} ${r(y)}` +
    `A${r(rxi)} ${r(ryi)} 0 ${innerLarge} 1 ${r(cx - half)} ${r(y)}Z`
  );
}

/**
 * Proportions fitted to the brand sheet.
 *
 * These are not eyeballed: `scripts/brand/README.md` describes the fit, which
 * maximises the pixel overlap between the rendered mark and the sheet by
 * coordinate descent, aligning the two by their ink bounding boxes so only
 * shape is ever being compared.
 *
 * `icon` is the tight lockup: a wide disc whose tips show either side of the
 * wordmark and whose top face hides behind the letters. `lockup` is the same
 * disc seen from a much shallower angle, so it flattens into an underline —
 * note that the wall does not flatten with it, which is why `wallRatio` is so
 * much larger there.
 */
export const PROPORTIONS = {
  icon: {
    plateWidthRatio: 1.84, // outer ellipse width ÷ wordmark width
    flatness: 0.3534, // ry ÷ rx
    innerScaleX: 0.8962, // the hole's width, as a fraction of the outer ellipse
    frontBand: 0.409, // thickness of the band across the front, ÷ ry
    backOpening: 0.06, // how far the hole clears the outer edge at the back, ÷ ry
    centerOffset: -0.01, // plate cx offset, as a fraction of the wordmark width
    plateDrop: 0.028, // plate centre below the wordmark bottom, ÷ 100
    tilt: 0,
    shadow: {gap: 0.23, scaleX: 0.8, scaleY: 0.39, opacity: 0.3, blur: 0.16},
  },
  // The sheet draws the plate on its own from a slightly steeper angle than
  // the icon's, with a deeper hole; it is its own asset, so it keeps its own
  // numbers rather than being forced to match.
  disc: {
    plateWidthRatio: 1.84,
    flatness: 0.2513,
    innerScaleX: 0.8838,
    frontBand: 0.4698,
    backOpening: 0.06,
    centerOffset: 0,
    plateDrop: 0.028,
    tilt: 0,
    shadow: {gap: 0.3, scaleX: 0.8, scaleY: 0.5, opacity: 0.3, blur: 0.2},
  },
  lockup: {
    plateWidthRatio: 1.177,
    flatness: 0.0934,
    innerScaleX: 0.915,
    frontBand: 0.4625,
    backOpening: 0.06,
    centerOffset: -0.002,
    plateDrop: 0.331,
    tilt: 0,
    shadow: {gap: 1.6, scaleX: 0.86, scaleY: 1.8, opacity: 0.26, blur: 0.7},
  },
};

/** Resolves a set of proportions against a wordmark into concrete coordinates. */
export function plateMetrics(word, variant, {ringBoost = 1} = {}) {
  const p = PROPORTIONS[variant];
  const rx = (word.width * p.plateWidthRatio) / 2;
  const ry = rx * p.flatness;
  // The two things a designer actually sets — how thick the front band is and
  // how far the ring breaks open at the back — fix where the hole sits and how
  // tall it is. Raising the hole thickens the front and opens the back by the
  // same amount, so solving the pair keeps them independent.
  const innerRise = (p.frontBand + p.backOpening) / 2;
  const innerScaleY = 1 - (p.frontBand - p.backOpening) / 2;
  const cx = word.width / 2 + word.width * p.centerOffset;
  const cy = 100 + 100 * p.plateDrop;
  const shadow = {
    cy: cy + ry + ry * p.shadow.gap,
    rx: rx * p.shadow.scaleX,
    ry: ry * p.shadow.scaleY,
    opacity: p.shadow.opacity,
    blur: ry * p.shadow.blur,
  };
  return {
    ...p,
    rx,
    ry,
    cx,
    cy,
    innerRise,
    // A boost shrinks the hole, which fattens the whole ring — the only way to
    // keep the disc legible once it is down at favicon sizes.
    innerScaleX: p.innerScaleX / ringBoost,
    innerScaleY: innerScaleY / ringBoost,
    shadow,
    // The tilt swings the tips down by rx·sin(tilt); allow for it when sizing
    // a canvas so nothing clips.
    swing: Math.abs(Math.sin((p.tilt * Math.PI) / 180)) * rx,
    top: cy - ry,
    bottom: cy + ry,
    shadowBottom: shadow.cy + shadow.ry + shadow.blur * 2.5,
  };
}

/**
 * Composes a wordmark and its plate, and reports the bounding box of the result.
 *
 * `ringBoost` fattens the disc for sizes where a hairline simply disappears —
 * a 16 px favicon, mostly.
 */
export function buildMark({word, variant, ids, colors, withShadow = true, ringBoost = 1}) {
  const m = plateMetrics(word, variant, {ringBoost});

  const body =
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
      shadow: withShadow ? {...m.shadow, fill: colors.shadow, blurId: ids.blur} : null,
    }) + `<path d="${word.d}" fill="${colors.word}"/>`;

  const left = Math.min(0, m.cx - m.rx);
  const right = Math.max(word.width, m.cx + m.rx);
  const ink = m.bottom + m.swing;
  const bottom = withShadow ? Math.max(ink, m.shadowBottom) : ink;

  return {
    body,
    box: {x: left, y: 0, width: right - left, height: Math.max(100, bottom)},
    blurStdDeviation: round(m.shadow.blur),
  };
}
