/**
 * Keeps the version stamped into the repository in sync with package.json:
 *
 *   - the `SuCSS vX.Y.Z` banner at the top of src/lib/sucss.css
 *   - the pinned CDN URLs in README.md (`@ryo9ra/su-css@X.Y.Z`)
 *
 *   node scripts/sync-version.mjs           # rewrite both
 *   node scripts/sync-version.mjs --check   # fail if either is out of date (CI)
 *
 * `npm version` runs this automatically through the `version` lifecycle script,
 * so the bumped files are part of the version commit.
 */
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const {name, version} = pkg;

const targets = [
  {
    file: 'src/lib/sucss.css',
    pattern: /^(\s\*\sSuCSS\sv)\d+\.\d+\.\d+/m,
    replacement: `$1${version}`,
    description: 'the "SuCSS vX.Y.Z" banner',
  },
  {
    file: 'README.md',
    pattern: new RegExp(`(${name.replace('/', '\\/')}@)\\d+\\.\\d+\\.\\d+`, 'g'),
    replacement: `$1${version}`,
    description: 'the pinned CDN URLs',
  },
];

let stale = false;

for (const {file, pattern, replacement, description} of targets) {
  const absolute = path.join(root, file);
  const content = await readFile(absolute, 'utf8');

  if (!pattern.test(content)) {
    console.error(`Could not find ${description} in ${file}.`);
    process.exit(1);
  }
  pattern.lastIndex = 0; // a /g regex keeps state between .test() calls

  const updated = content.replace(pattern, replacement);
  if (updated === content) {
    console.log(`${file} is already at v${version}.`);
    continue;
  }

  if (checkOnly) {
    console.error(`${file} does not match package.json (v${version}).`);
    stale = true;
    continue;
  }

  await writeFile(absolute, updated);
  console.log(`Updated ${description} in ${file} to v${version}.`);
}

if (stale) {
  console.error('Run `npm run sync:version` and commit the result.');
  process.exit(1);
}
