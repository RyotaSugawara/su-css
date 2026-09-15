/**
 * Builds the distributable artifacts for the `su-css` npm package.
 *
 * Input : src/lib/sucss.css (the framework itself, hand written)
 *         src/behaviors.js, src/behaviors/*.js (the optional behavior
 *         scripts, hand written, unbundled - see #55: no build step is
 *         needed to run them, so none is used to publish them either)
 * Output: dist-lib/sucss.css      — readable, with a version banner
 *         dist-lib/sucss.min.css  — minified via esbuild
 *         dist-lib/behaviors.js   — copied as-is, with the same banner
 *         dist-lib/behaviors/*.js — likewise, imported by the file above
 */
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {transform} from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcFile = path.join(root, 'src/lib/sucss.css');
const outDir = path.join(root, 'dist-lib');

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const source = await readFile(srcFile, 'utf8');

// `/*!` marks a legal comment, which esbuild preserves through minification.
const banner = `/*! SuCSS v${pkg.version} | MIT License | ${pkg.homepage} */\n`;

const {code: minified, warnings} = await transform(source, {
  loader: 'css',
  minify: true,
  // Match the browsers the framework targets (nesting, :has(), color-mix()).
  target: ['chrome111', 'edge111', 'firefox128', 'safari16.4'],
});

for (const warning of warnings) {
  console.warn(`esbuild: ${warning.text}`);
}

await rm(outDir, {recursive: true, force: true});
await mkdir(outDir, {recursive: true});
await writeFile(path.join(outDir, 'sucss.css'), banner + source);
await writeFile(path.join(outDir, 'sucss.min.css'), banner + minified);

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const report = (name, content) => {
  const raw = Buffer.from(content);
  console.log(`dist-lib/${name.padEnd(22)} ${kb(raw.byteLength)} (gzip ${kb(gzipSync(raw).byteLength)})`);
};

report('sucss.css', banner + source);
report('sucss.min.css', banner + minified);

const behaviorFiles = ['behaviors.js', 'behaviors/enhance.js', 'behaviors/toolbar.js'];
let behaviorsTotal = 0;
let behaviorsTotalGzip = 0;

for (const relPath of behaviorFiles) {
  const js = banner + (await readFile(path.join(root, 'src', relPath), 'utf8'));
  const outPath = path.join(outDir, relPath);
  await mkdir(path.dirname(outPath), {recursive: true});
  await writeFile(outPath, js);
  report(relPath, js);
  behaviorsTotal += Buffer.byteLength(js);
  behaviorsTotalGzip += gzipSync(Buffer.from(js)).byteLength;
}

console.log(`behaviors.js + its imports, combined: ${kb(behaviorsTotal)} (gzip ${kb(behaviorsTotalGzip)})`);
