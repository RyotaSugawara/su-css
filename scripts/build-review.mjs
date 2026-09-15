/**
 * Builds the review bench: one self-contained HTML page that renders every
 * specimen in scripts/review-specimens.mjs against the current stylesheet.
 *
 * It exists because a classless framework cannot be reviewed from a diff. The
 * rules are written against elements, attributes and ARIA states, so what a
 * change does is only visible on real markup — and the demo site is too big to
 * scan on a phone. This page is small enough to read anywhere, and because
 * every specimen sits in its own document, one specimen cannot leak layout
 * into the next.
 *
 * Input : src/lib/sucss.css, scripts/review-specimens.mjs
 * Output: dist-review/index.html — open it directly, no server needed.
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {specimens} from './review-specimens.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'dist-review');
const outFile = path.join(outDir, 'index.html');

const css = await readFile(path.join(root, 'src/lib/sucss.css'), 'utf8');

/* The payload rides inside a <script type="application/json"> block, so the
   only characters that could end it early are `<` and the line separators
   JSON leaves raw. */
const embed = (value) =>
  JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll(' ', '\\u2028')
    .replaceAll(' ', '\\u2029');

const escapeHtml = (text) =>
  text.replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);

/* Each specimen runs in its own document, which may be treated as a foreign
   origin (it is, when the page is opened over file://). So the two things the
   bench needs from it — its height, and the theme it should paint in — travel
   by postMessage rather than by reaching into contentDocument.

   The height is measured from the content rather than from scrollHeight,
   because the framework gives `body` a `min-height` of 100vh: inside an iframe
   that makes the document as tall as the frame already is, so scrollHeight
   would only ever report back the height it was given. */
const agent = `
(function () {
  var measure = function () {
    var body = document.body;
    var style = getComputedStyle(body);
    var bottom = 0;
    Array.prototype.forEach.call(body.children, function (element) {
      if (element.tagName === 'SCRIPT') return;
      var margin = parseFloat(getComputedStyle(element).marginBottom) || 0;
      bottom = Math.max(bottom, element.getBoundingClientRect().bottom + scrollY + margin);
    });
    return Math.ceil(
      bottom +
        (parseFloat(style.paddingBottom) || 0) +
        (parseFloat(style.marginBottom) || 0),
    );
  };
  var send = function () {
    parent.postMessage({sucssHeight: measure()}, '*');
  };
  addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object' || !('theme' in data)) return;
    if (data.theme) document.documentElement.setAttribute('data-theme', data.theme);
    else document.documentElement.removeAttribute('data-theme');
    send();
  });
  addEventListener('load', send);
  if (window.ResizeObserver) {
    var observer = new ResizeObserver(send);
    Array.prototype.forEach.call(document.body.children, function (element) {
      observer.observe(element);
    });
  }
  if (document.fonts) document.fonts.ready.then(send);
  send();
})();
`.trim();

/* The framework lays `body` out as a column flex container, so anything placed
   directly in it stretches to the full width — a lone button would fill the
   frame, which is not how it looks on a real page. Each specimen therefore
   sits in a plain `div`, which the framework does not style, and which gives
   the specimen the breathing room a page's own layout would. */
const stage = 'body > [data-stage] { padding: 24px; }';

const page = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SuCSS レビュー台</title>
<style>
  :root {
    color-scheme: light dark;
    --ink: #121a1f;
    --ink-soft: #465a64;
    --paper: #eaeff2;
    --surface: #fff;
    --rule: #cfdae0;
    --accent: #0c6874;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --ink: #e6eef1;
      --ink-soft: #a9bec7;
      --paper: #0a1014;
      --surface: #131c21;
      --rule: #25343b;
      --accent: #57d2de;
    }
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    padding: env(safe-area-inset-top, 0) 16px calc(env(safe-area-inset-bottom, 0) + 48px);
    background: var(--paper);
    color: var(--ink);
    font: 15px/1.7 -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  main { max-width: 1040px; margin: 0 auto; }

  h1 { font-size: 1.25rem; margin: 1.5rem 0 0.25rem; }

  .meta { margin: 0 0 1rem; color: var(--ink-soft); font-size: 0.8125rem; }
  .meta code { font-size: inherit; }

  .bar {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin: 0 -16px 1.5rem;
    padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 10px;
    background: color-mix(in srgb, var(--paper) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--rule);
  }

  fieldset {
    display: flex;
    gap: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend { float: left; margin-inline-end: 8px; padding: 0; color: var(--ink-soft); font-size: 0.75rem; line-height: 2.2; }

  .bar button {
    padding: 4px 10px;
    border: 1px solid var(--rule);
    border-inline-width: 0 1px;
    background: var(--surface);
    color: var(--ink-soft);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .bar button:first-of-type { border-inline-start-width: 1px; border-radius: 6px 0 0 6px; }
  .bar button:last-of-type { border-radius: 0 6px 6px 0; }
  .bar button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--paper); }
  .bar button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  nav ol { margin: 0 0 2rem; padding-inline-start: 1.4em; columns: 2; column-gap: 24px; font-size: 0.875rem; }
  nav a { color: var(--accent); }

  section { margin: 0 0 2.5rem; }
  section h2 { margin: 0 0 0.2rem; font-size: 0.9375rem; }
  section h2 a { color: inherit; text-decoration: none; }
  section h2 a:hover { text-decoration: underline; }
  section p { margin: 0 0 0.6rem; color: var(--ink-soft); font-size: 0.8125rem; }

  .frame {
    max-width: var(--stage, none);
    border: 1px solid var(--rule);
    border-radius: 10px;
    overflow: hidden;
    background: var(--surface);
    transition: max-width 0.2s;
  }

  iframe { display: block; width: 100%; height: 160px; border: 0; }

  details.markup { margin-top: 0.5rem; }
  details.markup summary { color: var(--ink-soft); font-size: 0.8125rem; cursor: pointer; }
  details.markup pre {
    overflow-x: auto;
    margin: 0.5rem 0 0;
    padding: 12px;
    border-radius: 8px;
    background: var(--surface);
    border: 1px solid var(--rule);
    font-size: 0.75rem;
    line-height: 1.6;
  }

  @media (max-width: 560px) {
    nav ol { columns: 1; }
  }
</style>
</head>
<body>
<main>
  <h1>SuCSS レビュー台</h1>
  <p class="meta"><code>src/lib/sucss.css</code> を直接読み込んだ ${specimens.length} 件の見本。
  生成 ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC / ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB</p>

  <div class="bar">
    <fieldset id="theme">
      <legend>配色</legend>
      <button type="button" value="" aria-pressed="true">システム</button>
      <button type="button" value="light" aria-pressed="false">ライト</button>
      <button type="button" value="dark" aria-pressed="false">ダーク</button>
    </fieldset>
    <fieldset id="stage">
      <legend>幅</legend>
      <button type="button" value="390px" aria-pressed="false">スマホ</button>
      <button type="button" value="768px" aria-pressed="false">タブレット</button>
      <button type="button" value="" aria-pressed="true">全幅</button>
    </fieldset>
  </div>

  <nav aria-label="見本の一覧">
    <ol>
${specimens.map((s) => `      <li><a href="#${s.id}">${escapeHtml(s.title)}</a></li>`).join('\n')}
    </ol>
  </nav>

${specimens
  .map(
    (s) => `  <section id="${s.id}">
    <h2><a href="#${s.id}">${escapeHtml(s.title)}</a></h2>
    <p>${escapeHtml(s.note)}</p>
    <div class="frame"><iframe title="${escapeHtml(s.title)}" data-specimen="${s.id}"></iframe></div>
    <details class="markup">
      <summary>HTML を見る</summary>
      <pre><code>${escapeHtml(s.html.trim())}</code></pre>
    </details>
  </section>`,
  )
  .join('\n\n')}
</main>

<script type="application/json" id="payload">${embed({
  css,
  agent,
  stage,
  specimens: specimens.map(({id, html}) => ({id, html})),
})}</script>
<script>
(function () {
  var payload = JSON.parse(document.getElementById('payload').textContent);
  var frames = [];
  var theme = '';

  payload.specimens.forEach(function (specimen) {
    var iframe = document.querySelector('iframe[data-specimen="' + specimen.id + '"]');
    if (!iframe) return;
    frames.push(iframe);
    iframe.srcdoc =
      '<!DOCTYPE html><html lang="ja"' + (theme ? ' data-theme="' + theme + '"' : '') + '>' +
      '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<style>' + payload.css + '</style><style>' + payload.stage + '</style></head><body>' +
      '<div data-stage>' + specimen.html + '</div>' +
      '<scr' + 'ipt>' + payload.agent + '</scr' + 'ipt></body></html>';
  });

  addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object' || typeof data.sucssHeight !== 'number') return;
    frames.forEach(function (iframe) {
      if (iframe.contentWindow === event.source) iframe.style.height = data.sucssHeight + 'px';
    });
  });

  var press = function (fieldset, value) {
    Array.prototype.forEach.call(fieldset.querySelectorAll('button'), function (button) {
      button.setAttribute('aria-pressed', String(button.value === value));
    });
  };

  document.getElementById('theme').addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    theme = button.value;
    press(this, theme);
    frames.forEach(function (iframe) {
      if (iframe.contentWindow) iframe.contentWindow.postMessage({theme: theme}, '*');
    });
  });

  document.getElementById('stage').addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    press(this, button.value);
    document.documentElement.style.setProperty('--stage', button.value || 'none');
  });
})();
</script>
</body>
</html>
`;

await mkdir(outDir, {recursive: true});
await writeFile(outFile, page);

console.log(
  `dist-review/index.html  ${(Buffer.byteLength(page) / 1024).toFixed(1)} KB  ` +
    `(${specimens.length} specimens)\n` +
    `file://${outFile}`,
);
