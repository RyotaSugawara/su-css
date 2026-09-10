# SuCSS brand kit

The mark is the word **su** resting on a purple disc — the plate. The plate is
the same lens the framework's surfaces are made of, seen edge-on, and it is
drawn in one move: an ellipse with a second, smaller ellipse subtracted from
it, the inner one raised. That single offset is what gives the disc its whole
character — the ring closes to a hairline across the back, where the two edges
nearly meet, and opens into a thick band across the front. A soft lavender
shadow sits underneath.

Everything in [`assets/brand/`](../assets/brand) is generated from one source of
truth, [`scripts/build-brand-assets.mjs`](../scripts/build-brand-assets.mjs).
The letterforms are outlined, so the SVGs render identically whether or not
Montserrat is installed.

## Files

### Icons — square, for avatars, app tiles and favicons

| File | Use it for |
| --- | --- |
| `icon.svg`, `icon-512.png` | The default. Purple mark on a white tile. |
| `icon-inverse.svg`, `icon-inverse-512.png` | White mark on a purple tile, for dark or busy backgrounds. |
| `icon-mono.svg` | One-colour black, for print, stamps and stencils. |
| `icon-small.svg` | 16–48 px. The inverse tile, no shadow — see [Small sizes](#small-sizes). |
| `icon-small-light.svg` | The same simplification on a white tile, where a purple tile would clash. |

### Marks — the disc and letters with no tile behind them

| File | Use it for |
| --- | --- |
| `mark.svg`, `mark-inverse.svg` | Placing the mark on artwork of your own. |
| `plate.svg` | The plate alone, as a divider or a spot illustration. |

### Logos — the wordmark lockups

| File | Use it for |
| --- | --- |
| `logo.svg` | The default lockup: wordmark, plate and tagline. |
| `logo-inverse.svg` | The same in white, for dark backgrounds. |
| `logo-mono.svg` | One-colour. |
| `logo-wordmark.svg` | Wordmark and tagline, no plate, for tight horizontal space. |

### Artwork

| File | Size | Use it for |
| --- | --- | --- |
| `cover.png`, `cover.svg` | 1600×400 | The README banner. |
| `og.svg` | 1200×630 | Source for the site's OG image. |
| `social-preview.png` | 1280×640 | GitHub's repository social preview — see [Social preview](#social-preview). |
| `pattern.svg` | tiles | The scattered-plate texture, on its own. |

### Site icons

`public/` holds what the demo site serves; they are written by the same script
and referenced from [`index.html`](../index.html).

| File | Referenced as |
| --- | --- |
| `favicon.svg` | `<link rel="icon" type="image/svg+xml">` |
| `favicon-96.png` | `<link rel="icon" sizes="96x96">`, for browsers without SVG icon support |
| `apple-touch-icon.png` | `<link rel="apple-touch-icon">`, 180×180, square because iOS masks the corners itself |
| `og-image.png` | `og:image`, as an absolute URL — crawlers do not resolve relative ones |

## Colour

| Token | Hex | Where it goes |
| --- | --- | --- |
| Brand purple | `#7C5CFF` | The wordmark, the plate, the tagline. |
| Lavender | `#EDE8FF` | Tints and quiet fills. |
| Mist | `#F8F6FF` | The ground the mark sits on. |
| Ink | `#171326` | The monochrome mark; the dark-mode theme colour. |

The plate is lit rather than flat: it runs from `#9179FF` at the top right to
`#6242E0` at the bottom left, with brand purple as the midpoint. The scattered
marks in the pattern are the same purple at low alpha, never a separate tint —
that is what keeps the texture reading as one colour.

## Using the mark

**Clear space.** Keep a margin of at least half the wordmark's height on every
side. Nothing else belongs inside it.

**Small sizes.** Below about 48 px the drop shadow stops carrying, and the
white tile disappears against a light browser chrome. Use `icon-small.svg`,
which drops the shadow and inverts to a purple tile so the mark holds its
shape down to 16 px.

**Don't:** recolour the mark outside the palette, stretch it, rotate it, put the
default white-tile icon on a light background, add an outline or a second
shadow, or set the wordmark in a font other than the outlined one supplied here.

## Social preview

GitHub's repository social preview cannot be set from a file in the repository;
it is uploaded by hand. In **Settings → General → Social preview**, choose *Edit
→ Upload an image* and give it
[`assets/brand/social-preview.png`](../assets/brand/social-preview.png)
(1280×640).

## Regenerating

The SVGs and PNGs are committed, so this only needs to run when the brand itself
changes. The script has three dependencies the project does not otherwise need,
so install them without writing them to `package.json`:

```bash
npm install --no-save opentype.js playwright @expo-google-fonts/montserrat
node scripts/build-brand-assets.mjs
```

- `opentype.js` outlines the Montserrat letterforms into paths.
- `@expo-google-fonts/montserrat` ships the Montserrat TTFs — ExtraBold for the
  mark and the wordmark, Medium for the tagline. Montserrat is licensed under
  the SIL Open Font License 1.1; the outlines it contributes carry that licence
  with them.
- `playwright` drives headless Chromium to rasterise the PNGs that GitHub, npm
  and the OG crawlers need, none of which accept SVG. If Chromium is already on
  the machine at `/opt/pw-browsers/chromium`, the script uses it and skips
  Playwright's own download.

The proportions of the mark — how wide the plate is against the wordmark, how
flat it sits, how big its hole is and how far that hole is raised — are the
constants in [`scripts/brand/geometry.mjs`](../scripts/brand/geometry.mjs).
They are not eyeballed: each one is solved against the brand sheet by fitting
the two ellipses to the mark's contour, which lands within about a pixel, and
the tracking of each string is solved so its width-to-height ratio matches the
sheet's. Change a constant there and every icon, logo and cover follows.
