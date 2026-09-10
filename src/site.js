/**
 * The demo site's only JavaScript: the theme switch, the copy buttons, the
 * dialog demo, and the current-section marker in the nav.
 *
 * SuCSS itself ships no JavaScript. Everything here belongs to the page.
 *
 * The pages themselves are translated at build time, so nothing here needs to
 * be — apart from the handful of strings this file puts on screen, which are
 * picked by the document's own language.
 */

const root = document.documentElement;
const THEME_KEY = 'sucss-theme';

const MESSAGES = {
  en: {copied: 'Copied', copyFailed: 'Could not copy'},
  ja: {copied: 'コピーしました', copyFailed: 'コピーできませんでした'},
};

const messages = MESSAGES[root.lang] ?? MESSAGES.en;

/* -- Theme switch --------------------------------------------------------
   'auto' means "no data-theme attribute", which is how the stylesheet falls
   back to prefers-color-scheme. */

const themeButtons = document.querySelectorAll('[data-theme-set]');

function applyTheme(mode) {
  if (mode === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }

  try {
    if (mode === 'auto') {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, mode);
    }
  } catch {
    /* Storage can be blocked. The switch still works for this page view. */
  }

  for (const button of themeButtons) {
    button.setAttribute('aria-current', String(button.dataset.themeSet === mode));
  }
}

let storedTheme = null;
try {
  storedTheme = localStorage.getItem(THEME_KEY);
} catch {
  /* See above. */
}
applyTheme(storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'auto');

for (const button of themeButtons) {
  button.addEventListener('click', () => applyTheme(button.dataset.themeSet));
}

/* -- Copy buttons -------------------------------------------------------- */

for (const button of document.querySelectorAll('[data-copy]')) {
  const status = button.parentElement?.querySelector('[data-copy-status]');
  let clearStatus;

  const say = (message) => {
    if (!status) return;
    status.textContent = message;
    clearTimeout(clearStatus);
    clearStatus = setTimeout(() => {
      status.textContent = '';
    }, 2000);
  };

  button.addEventListener('click', async () => {
    const source = document.querySelector(button.dataset.copy);
    if (!source) return;

    try {
      await navigator.clipboard.writeText(source.textContent.trim());
      say(messages.copied);
    } catch {
      say(messages.copyFailed);
    }
  });
}

/* -- Dialog demo --------------------------------------------------------- */

for (const button of document.querySelectorAll('[data-dialog]')) {
  button.addEventListener('click', () => {
    document.querySelector(button.dataset.dialog)?.showModal();
  });
}

/* -- Current section in the nav ------------------------------------------
   SuCSS styles nav links through aria-current, so marking the section in
   view is both the page's wayfinding and a demo of that rule. */

const links = [...document.querySelectorAll('header nav a[href^="#"]')];
const sections = links
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if (sections.length > 0 && 'IntersectionObserver' in window) {
  const visible = new Set();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
        } else {
          visible.delete(entry.target);
        }
      }

      // The topmost section in the band is the one the reader is on.
      const current = sections.find((section) => visible.has(section));

      for (const link of links) {
        if (current && link.getAttribute('href') === `#${current.id}`) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      }
    },
    // A band across the upper third of the viewport, so the marker changes
    // when a section reaches reading position rather than when it appears.
    {rootMargin: '-15% 0px -70% 0px'},
  );

  for (const section of sections) {
    observer.observe(section);
  }
}
