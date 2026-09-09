# Security Policy

SuCSS is a single stylesheet maintained by one person in his spare time. This
document says where to send a security report and what the project already does
to keep the published package trustworthy.

## Reporting a vulnerability

**Use GitHub's private vulnerability reporting**, on this repository's
[Security tab](https://github.com/RyotaSugawara/su-css/security/advisories/new).
It opens a private thread visible only to you and the maintainer.

Please don't open a public issue for a security problem. Pull requests are
limited to collaborators, so a patch cannot be sent that way either — describe
the fix in the private report and it will be applied from there.

Include what you have: the affected version, the HTML or CSS that reproduces it,
and what an attacker gets out of it. A report that lets the problem be
reproduced is worth far more than one that only names it.

Expect an acknowledgement within about a week. This is a side project, not a
staffed one, so please don't read silence as dismissal — send a nudge.

## Supported versions

Only the latest published version receives fixes. SuCSS is on `0.x`, so there
are no maintenance branches for older releases; a fix ships as a new version.

## What's in scope

The stylesheet's own attack surface is small — it ships no JavaScript and makes
no network requests. The reports that matter most here are about the supply
chain and the release pipeline:

- Anything that could put code into `@ryo9ra/su-css` on npm without the
  maintainer's approval.
- A flaw in the GitHub Actions workflows that would leak a token, escalate
  permissions, or let someone else trigger a release.
- CSS that causes a security-relevant failure in a consuming page — for example
  a rule that hides or covers content in a way an attacker can use.

The demo application under `src/` is not published to npm and is not part of the
distributed package, but reports about it are still welcome.

## What this project already does

These are the guarantees the release setup is built around, so a report that
defeats one of them is especially valuable:

- **CI cannot publish on its own.** Releases are staged with `npm stage publish`
  and only become installable after the maintainer approves them with a 2FA
  challenge. The npm trusted publisher is deliberately limited to
  `npm stage publish` so there is no route around that gate.
- **No long-lived npm token.** Publishing authenticates through OIDC trusted
  publishing alone — there is no token fallback in the workflow and no
  publish credential stored in the repository, so there is nothing to leak.
- **Every GitHub Action is pinned to a commit SHA**, so a moved tag cannot
  change what runs.
- **Workflows request the least privilege they need**, defaulting to
  `contents: read` and escalating only in the jobs that require it.
- **Dependabot** opens grouped npm and Actions updates weekly.

## Verifying what you install

The published package contains only the two generated CSS files, the README and
the license — no build scripts, no dependencies. You can confirm what a release
contains before installing it:

```bash
npm view @ryo9ra/su-css@latest dist.integrity
npm pack @ryo9ra/su-css@latest --dry-run
```

Releases published from a public repository also carry npm provenance, which
links the tarball back to the workflow run that produced it.
