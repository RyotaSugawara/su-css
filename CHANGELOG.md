# Changelog

## [0.2.0](https://github.com/RyotaSugawara/su-css/compare/v0.1.0...v0.2.0) (2026-09-09)


### ⚠ BREAKING CHANGES

* unchanged HTML renders differently - surfaces are more transparent, corners are rounder, and buttons and other controls are now capsule-shaped. Themes that set --glass-bg or --radius directly should be rechecked; --glass-brightness, --glass-tint, --glass-rim, --glass-inset, --glass-bg-hover, --radius-pill, --ease-liquid and --transition-liquid are new.

### Features

* replace the frosted glass material with liquid glass ([#25](https://github.com/RyotaSugawara/su-css/issues/25)) ([bef6ecd](https://github.com/RyotaSugawara/su-css/commit/bef6ecd49f2545eaa0350e21f18f4d027d046358))
