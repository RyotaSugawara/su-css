/**
 * Keeps the version banner inside src/lib/sucss.css in sync with package.json.
 *
 *   node scripts/sync-version.mjs           # rewrite the CSS header
 *   node scripts/sync-version.mjs --check   # fail if it is out of date (CI)
 *
 * `npm version` runs this automatically through the `version` lifecycle script,
 * so the bumped CSS header is part of the version commit.
 */
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssFile = path.join(root, 'src/lib/sucss.css');
const checkOnly = process.argv.includes('--check');

const {version} = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const css = await readFile(cssFile, 'utf8');

const pattern = /^(\s\*\sSuCSS\sv)\d+\.\d+\.\d+/m;
if (!pattern.test(css)) {
  console.error(`Could not find the "SuCSS vX.Y.Z" banner in ${path.relative(root, cssFile)}.`);
  process.exit(1);
}

const updated = css.replace(pattern, `$1${version}`);
if (updated === css) {
  console.log(`src/lib/sucss.css is already at v${version}.`);
  process.exit(0);
}

if (checkOnly) {
  console.error(
    `src/lib/sucss.css banner does not match package.json (v${version}). ` +
      'Run `npm run sync:version` and commit the result.',
  );
  process.exit(1);
}

await writeFile(cssFile, updated);
console.log(`Updated src/lib/sucss.css banner to v${version}.`);
