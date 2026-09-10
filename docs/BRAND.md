# SuCSS brand kit

The mark is the word **su** resting on a purple disc — the plate. The plate is
the same lens the framework's surfaces are made of, seen edge-on, and it is
drawn in one move: an ellipse with a second, smaller ellipse subtracted from
it, the inner one raised. The hole is lifted clear of the outer edge at the
back, so the ring does not close — the back is knocked out completely, leaving
a crescent that tapers to a point at either end and thickens into a band across
the front, with the wordmark sitting in the opening. A soft lavender shadow
sits underneath.

The subtraction is solved rather than masked: the two crossing points are
computed and the boundary traced through them, so every plate is a single
closed path with the hole genuinely gone — no mask, no even-odd, and no
surprises in a vector editor.

The SVGs in [`assets/brand/`](../assets/brand) are the source of the whole kit;
the PNGs beside them are exports for the places that cannot take an SVG. The
letterforms are outlined into paths, so every file renders identically whether
or not Montserrat is installed, and nothing here needs a build step.

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
| `mark.svg`, `mark-inverse.svg` | Placing the mark on artwork of your own. The demo site's header and footer use `mark.svg`. |
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

`public/` holds what the demo site serves, referenced from
[`index.html`](../index.html).

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

## Editing the artwork

There is no generator to run. Open the SVG you want in a vector editor, change
it, and save — the files are plain paths with no masks, no clipping and no
even-odd compound shapes, so what you see in the editor is what ships.

Two things are worth knowing before you move a point:

- **The plate is one closed path.** An outer ellipse with a raised inner one
  subtracted, already resolved into two arcs. Editing the arcs directly is
  fine; there is no boolean operation left to preserve.
- **The type is outlines, not text.** Retyping means setting the words again in
  Montserrat — ExtraBold for the mark and the wordmark, Medium for the tagline
  — and converting to outlines. Montserrat is licensed under the SIL Open Font
  License 1.1, which the outlines carry with them.

When an SVG changes, re-export the PNGs that depend on it so the two stay in
step:

| PNG | Exported from | At |
| --- | --- | --- |
| `assets/brand/cover.png` | `cover.svg` | 1600×400 |
| `assets/brand/social-preview.png` | `social-preview.svg` | 1280×640 |
| `assets/brand/icon-512.png` | `icon.svg` | 512×512 |
| `assets/brand/icon-inverse-512.png` | `icon-inverse.svg` | 512×512 |
| `public/og-image.png` | `og.svg` | 1200×630 |
| `public/favicon-96.png` | `icon-small.svg` | 96×96 |
| `public/apple-touch-icon.png` | `icon-small.svg`, square corners | 180×180 |
| `public/favicon.svg` | copy of `icon-small.svg` | — |
