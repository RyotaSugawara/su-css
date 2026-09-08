/**
 * Fails if package.json's version is already on the registry.
 *
 * `npm stage publish` rejects a duplicate version server-side — even with
 * --dry-run — but only after the whole tarball has been built and uploaded,
 * and the message ("You cannot publish over the previously published
 * versions") does not say what to do about it. This runs first and says it.
 */
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {name, version} = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

const url = `https://registry.npmjs.org/${name.replace('/', '%2f')}/${version}`;
const response = await fetch(url, {headers: {accept: 'application/json'}});

if (response.status === 404) {
  console.log(`${name}@${version} is not on the registry yet.`);
  process.exit(0);
}

if (response.ok) {
  console.error(
    `${name}@${version} is already published. Bump the version with ` +
      '`npm version <patch|minor|major>` before releasing.',
  );
  process.exit(1);
}

// Anything else (rate limit, outage) is not evidence either way — let the
// publish itself be the judge rather than blocking a release on a flaky probe.
console.warn(`Could not check the registry (HTTP ${response.status}); continuing.`);
