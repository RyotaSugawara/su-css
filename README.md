# SuCSS

[![CI](https://github.com/RyotaSugawara/su-css/actions/workflows/ci.yml/badge.svg)](https://github.com/RyotaSugawara/su-css/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@ryo9ra/su-css.svg)](https://www.npmjs.com/package/@ryo9ra/su-css)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A classless CSS framework. Write plain semantic HTML — no class names, no custom
attributes — and get a frosted-glass design with dark mode and accessibility
built in.

**Demo: https://ryotasugawara.github.io/su-css/**

> *Su* (素) is Japanese for "plain" or "unadorned" — SuCSS styles plain HTML.

## Features

- **No class names.** Styling comes from the elements themselves: `<header>`,
  `<main>`, `<article>`, `<button>`, `<dialog>`, `<table>`, and friends.
- **Dark mode included.** Follows `prefers-color-scheme`, and can be forced with
  `data-theme="light"` or `data-theme="dark"`.
- **Accessible by default.** WCAG AA/AAA contrast, visible `:focus-visible`
  rings, adequate touch targets, and `prefers-reduced-motion` /
  `prefers-reduced-transparency` support.
- **Small and dependency-free.** One CSS file, ~4 KB gzipped. No JavaScript, no
  build step.
- **Themeable.** Every color, radius, and shadow is a CSS custom property.

## Install

```bash
npm install @ryo9ra/su-css
```

| Import specifier | File | Size |
| --- | --- | --- |
| `@ryo9ra/su-css` | `dist-lib/sucss.css` | 29 KB (6 KB gzipped) |
| `@ryo9ra/su-css/sucss.min.css` | `dist-lib/sucss.min.css` | 22 KB (4.3 KB gzipped) |

From a bundler (Vite, webpack, Next.js, …):

```js
import '@ryo9ra/su-css/sucss.min.css';
```

Or straight from a CDN, with no install at all:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ryo9ra/su-css/dist-lib/sucss.min.css">
```

> That URL always serves the newest release. While SuCSS is on `0.x`, minor
> releases may still change how things look, so pin an exact version in
> production by appending it to the package name —
> `@ryo9ra/su-css@1.2.3/dist-lib/sucss.min.css`.

## Usage

Link the stylesheet and write ordinary HTML. That is the whole API.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ryo9ra/su-css/dist-lib/sucss.min.css">
</head>
<body>
  <header>
    <nav>
      <strong>My Site</strong>
      <a href="#about">About</a>
    </nav>
  </header>

  <main>
    <article>
      <h1>Hello!</h1>
      <p>This page does not contain a single class name.</p>
      <button type="submit">Send</button>
      <button type="reset">Reset</button>
    </article>
  </main>
</body>
</html>
```

Interactive elements work natively too: `<dialog>` for modals,
`<details>`/`<summary>` for accordions, and
`<input type="checkbox" role="switch">` for toggles.

## Theming

Override custom properties on `:root`. Shifting `--hue` recolors the whole page,
including the background gradient.

```css
:root {
  --hue: 210;          /* 0-360 */
  --sat: 80%;
  --radius: 12px;
  --glass-blur: 24px;
}
```

Dark mode follows the operating system by default. To control it yourself, set
`data-theme` on `<html>`:

```html
<html lang="en" data-theme="dark">
```

## Browser support

Modern evergreen browsers: Chrome/Edge 111+, Safari 16.4+, Firefox 128+.
Browsers without `backdrop-filter` fall back to solid surfaces.

## Development

This repository also contains the demo app — a showcase, a live playground, a
theme customizer, and a contrast checker.

```bash
npm install
npm run dev      # start the dev server
npm run build    # build the demo site
npm run lint     # TypeScript + Stylelint
npm run test     # unit, contrast, and CSS structure tests
```

The framework itself is a single hand-written file: [`src/lib/sucss.css`](src/lib/sucss.css).
`npm run build:lib` generates the distributable CSS, and `npm run release:dry-run`
shows exactly what would be published.

Versioning is automated. Land [Conventional Commits](https://www.conventionalcommits.org/)
on `main` (`feat:`, `fix:`, `feat!:`) and release-please keeps a release PR open
with the next version and changelog; merging it cuts the release. Releases then
go through npm's staging queue, where a maintainer approves them with a 2FA
challenge before they become installable.

The test suite parses `src/lib/sucss.css` directly: `tests/css/contrast.test.ts`
checks every token pair against WCAG AA in both themes, and
`tests/css/structure.test.ts` asserts the accessibility features promised above
are actually present.

Release process: [docs/RELEASING.md](docs/RELEASING.md).

## License

[MIT](LICENSE)
