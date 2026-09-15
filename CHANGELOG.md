# Changelog

## [0.5.0](https://github.com/RyotaSugawara/su-css/compare/v0.4.0...v0.5.0) (2026-09-15)


### ⚠ BREAKING CHANGES

* a table that already carries `aria-sort="ascending"` or `aria-sort="descending"` on a header cell now renders with a direction marker it did not have before, and that header's column is about 1em wider.
* a document that already carries `aria-invalid="true"` on a field renders differently - the field is now drawn as an error. So does a `role="alert"` element inside a form, which now reads as the error message. `aria-invalid="false"` and a bare `required` are unaffected.
* a page whose landmarks are written as roles on <div> now gets the panel, header, nav, main and footer decoration it did not get before.
* dim what cannot be operated, from aria-disabled and inert ([#59](https://github.com/RyotaSugawara/su-css/issues/59))
* a document containing `<div role="group">` around buttons renders differently without any change to its HTML.

### Features

* accept landmark roles wherever the matching element is styled ([#62](https://github.com/RyotaSugawara/su-css/issues/62)) ([3885a97](https://github.com/RyotaSugawara/su-css/commit/3885a97bbb92a1274bd7189a38cb83c520245d4e))
* dim what cannot be operated, from aria-disabled and inert ([#59](https://github.com/RyotaSugawara/su-css/issues/59)) ([ff0e790](https://github.com/RyotaSugawara/su-css/commit/ff0e790e18c7891d4b3323e3578628c55567507c)), closes [#49](https://github.com/RyotaSugawara/su-css/issues/49)
* lay out a group of buttons from role="group" ([#56](https://github.com/RyotaSugawara/su-css/issues/56)) ([670dd0b](https://github.com/RyotaSugawara/su-css/commit/670dd0b0ec4efb6ad4bb0f1b8794ac6193dcc1dc))
* mark an invalid field from aria-invalid ([#60](https://github.com/RyotaSugawara/su-css/issues/60)) ([50eef3d](https://github.com/RyotaSugawara/su-css/commit/50eef3dfbbf9bac1b50953fdd8a7833fb6d7a9e6))
* mark the sorted column from aria-sort ([#61](https://github.com/RyotaSugawara/su-css/issues/61)) ([cf422a0](https://github.com/RyotaSugawara/su-css/commit/cf422a09be20425ec98fedbb03990fe8fd9e486d))


### Documentation

* restate the advertised size from one measurement ([#63](https://github.com/RyotaSugawara/su-css/issues/63)) ([556f588](https://github.com/RyotaSugawara/su-css/commit/556f588a3dc8c53b92b12ee3f9ff812cffabecdf))

## [0.4.0](https://github.com/RyotaSugawara/su-css/compare/v0.3.0...v0.4.0) (2026-09-11)


### ⚠ BREAKING CHANGES

* keep a table readable on a narrow viewport ([#41](https://github.com/RyotaSugawara/su-css/issues/41))

### Bug Fixes

* keep a table readable on a narrow viewport ([#41](https://github.com/RyotaSugawara/su-css/issues/41)) ([f86df4c](https://github.com/RyotaSugawara/su-css/commit/f86df4c0d6690cfaeebf88f69c0904e5b9601853))

## [0.3.0](https://github.com/RyotaSugawara/su-css/compare/v0.2.0...v0.3.0) (2026-09-10)


### ⚠ BREAKING CHANGES

* cap embedded media at the container width ([#34](https://github.com/RyotaSugawara/su-css/issues/34))

### Bug Fixes

* cap embedded media at the container width ([#34](https://github.com/RyotaSugawara/su-css/issues/34)) ([8489e86](https://github.com/RyotaSugawara/su-css/commit/8489e862386dce77233bdb9d8a7b7a08bc70575f))
* keep a header tab row left-aligned ([#38](https://github.com/RyotaSugawara/su-css/issues/38)) ([82d86cb](https://github.com/RyotaSugawara/su-css/commit/82d86cb380673464f7fab36d398ce9bf7dfbb958))

## [0.2.0](https://github.com/RyotaSugawara/su-css/compare/v0.1.0...v0.2.0) (2026-09-09)


### ⚠ BREAKING CHANGES

* unchanged HTML renders differently - surfaces are more transparent, corners are rounder, and buttons and other controls are now capsule-shaped. Themes that set --glass-bg or --radius directly should be rechecked; --glass-brightness, --glass-tint, --glass-rim, --glass-inset, --glass-bg-hover, --radius-pill, --ease-liquid and --transition-liquid are new.

### Features

* replace the frosted glass material with liquid glass ([#25](https://github.com/RyotaSugawara/su-css/issues/25)) ([bef6ecd](https://github.com/RyotaSugawara/su-css/commit/bef6ecd49f2545eaa0350e21f18f4d027d046358))
