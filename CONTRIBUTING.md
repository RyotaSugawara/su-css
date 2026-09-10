# Contributing to SuCSS

SuCSS is one hand-written stylesheet, `src/lib/sucss.css`, plus a two-page demo
site that exercises it. Everything below is about keeping that stylesheet honest and
getting changes released without surprises.

## The rule that matters most

**The pull request title becomes the commit message, and the commit message
decides the next version.**

Pull requests are squash-merged, so the PR title is the only thing that lands on
`main` — the individual commits inside the branch are discarded. release-please
reads those subjects and nothing else.

```
feat: add a styled <progress> element     → next release is a minor
fix: raise the contrast of muted text     → next release is a patch
Add a styled progress element             → never released at all
```

Titles are validated in CI. Use one of these types:

| Type | Use for | Release effect while on `0.x` |
| --- | --- | --- |
| `feat:` | new element or selector support, new custom property | minor |
| `fix:` | a defect, a contrast correction, a browser incompatibility | patch |
| `perf:` | making the stylesheet smaller or cheaper to render | patch |
| `a11y:` | accessibility improvements that aren't strictly defects | patch |
| `feat!:` | changes how existing HTML looks; removes or renames a property | minor (major once 1.0.0 ships) |
| `docs:` `build:` `chore:` `ci:` `refactor:` `test:` `style:` `revert:` | everything else | no release |

A scope is optional and lowercase: `fix(forms): ...`.

Mark a breaking change with `!` before the colon, and say what breaks in the PR
body. For a classless framework, "breaking" means an unchanged HTML document
renders differently — that bar is lower than it looks, so err toward `!`.

## What the stylesheet must always be true to

These are the framework's promises. Several are enforced by tests; the rest are
on you.

**No class names, no invented attributes.** `src/lib/sucss.css` contains zero
class selectors and must keep it that way. Style elements, native attributes
(`[type]`, `[open]`, `[disabled]`) and ARIA (`[role="switch"]`,
`[aria-current]`). The single custom attribute in the whole framework is
`data-theme`, and it is not getting a sibling.

**Every color is a token.** Colors belong in the custom properties at the top of
the file, never inline in a rule. A rule that needs a color it cannot name is a
sign the token set is missing something.

**Both themes define the same tokens.** Light, dark and the forced
`[data-theme]` blocks must declare an identical set of custom properties.
`tests/css/contrast.test.ts` fails on any token that exists in one block and not
the others — that check exists because a typo'd variable name degrades silently
in one theme only.

**Contrast stays at WCAG AA in both themes.** Body text, muted text, links and
button labels are all checked against the surfaces they sit on. Run the tests
before assuming a new color is fine.

**Accessibility affordances stay put.** `tests/css/structure.test.ts` asserts
that animations respect `prefers-reduced-motion`, that no rule removes an
outline without providing a replacement focus indicator, that `--touch-target`
is applied as `min-height` on buttons and text inputs, and that the root
declares `color-scheme: light dark`. Don't work around these — they are the
reasons the README's claims are true.

**Browser support is a declared number, not a vibe.** The build targets
Chrome/Edge 111+, Safari 16.4+, Firefox 128+ (`scripts/build-lib.mjs`). If you
use a feature newer than that, raise the target there and update the README's
browser support section in the same PR.

## Working on it

```bash
npm install
npm run dev       # demo site at :3000
npm run lint      # tsc --noEmit + stylelint
npm run test      # unit, contrast and structure tests
npm run build     # demo site
npm run build:lib # dist-lib/sucss.css and dist-lib/sucss.min.css
npm run build:pages # re-render the site's pages from templates and strings
```

**No page is edited directly.** `index.html`, `customize.html` and everything
under `ja/` is rendered from `src/pages/*.html` — the structure, with a
`data-i18n` key wherever text goes — and `src/locales/<language>.json`, which
holds the text. Every string on the site is in those JSON files, including the
handful the pages' script writes (the `ui.` keys), which ship with each page.

After changing a template or a string, run `npm run build:pages` and commit the
re-rendered pages. Tests fail if they are stale, if a key has no text in some
language, if a language has text no key claims, or if the languages describe
different key sets.

Adding a language means a new `src/locales/<language>.json` and an entry in
`scripts/build-pages.mjs` saying where its pages go.

Run `npm run lint && npm run test` before opening a PR; CI runs the same checks
plus `npm pack --dry-run` to catch anything that would break the published
tarball.

Branch off `main`, and let CI go green before asking for a merge. Dependabot
opens grouped npm and GitHub Actions updates weekly; merge them once CI passes.

## Releasing

The full procedure is in [docs/RELEASING.md](docs/RELEASING.md). Three
invariants are worth repeating here, because breaking them is expensive:

**The version lives in `package.json` and nowhere else.** The banner in
`dist-lib/` is stamped at build time. Never hand-edit a version into the
stylesheet or the README — there is nothing to keep in sync, and adding
something to sync is a regression.

**A version number is used once, ever.** Staged and published versions share one
namespace on npm. If a release needs redoing, `npm stage reject` it first, then
move to a new number.

**Publishing keeps its human gate.** CI only stages a release; a maintainer
approves it on npm with 2FA before anyone can install it. The trusted publisher
configurations must stay limited to `npm stage publish` — enabling `npm publish`
would give CI a route around that gate, which is the whole point of the setup.
