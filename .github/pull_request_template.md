<!--
  The PR title becomes the squashed commit message and drives the next release.
  It must start with a Conventional Commits type — CI checks this.

    feat: ...   new element/selector support, new custom property   (minor)
    fix: ...    a defect, a contrast correction, an incompatibility (patch)
    feat!: ...  unchanged HTML now renders differently              (breaking)
    docs: chore: ci: refactor: test: build: style: revert:          (no release)
-->

## What and why

<!-- What changes, and what problem it solves. -->

## Verification

<!-- What you ran, and what it showed. `npm run lint && npm run test` at minimum. -->

## Checklist

- [ ] No class selectors or new custom attributes in `src/lib/sucss.css`
- [ ] New colors are custom properties, declared in the light, dark and `[data-theme]` blocks alike
- [ ] `npm run lint && npm run test` pass locally
- [ ] Breaking visual change is marked with `!` in the title and explained above
- [ ] Used a CSS feature newer than the current build target? Raised it in `scripts/build-lib.mjs` and updated the README
