/**
 * A minimal static file server for dist/, used only to run the Playwright
 * behavior tests against a real HTTP origin.
 *
 * Not vite preview: that dev server proved unreliable for serving ES module
 * scripts inside this project's own sandboxed CI-like environment (an
 * intermittent net::ERR_ABORTED on exactly the bundled <script type="module">
 * request, not reproducible against this file). A dependency-free static
 * server removes the variable; Node's http/fs modules are enough for it.
 */
import {createServer} from 'node:http';
import {createReadStream, existsSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

// Built pages reference their assets under /su-css/ (vite.config.js's own
// `base`, matching where GitHub Pages serves this project from), so that
// prefix is stripped here rather than nesting dist/ inside a matching
// directory on disk just to satisfy it.
const BASE = '/su-css/';

createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const relative = urlPath.startsWith(BASE) ? urlPath.slice(BASE.length) : urlPath.replace(/^\//, '');
  let filePath = path.join(root, relative);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!existsSync(filePath)) {
    res.writeHead(404).end('Not found');
    return;
  }

  res.writeHead(200, {'Content-Type': types[path.extname(filePath)] ?? 'application/octet-stream'});
  createReadStream(filePath).pipe(res);
}).listen(port, () => {
  console.log(`Serving dist/ at http://127.0.0.1:${port}/`);
});
