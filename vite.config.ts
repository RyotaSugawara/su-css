import path from 'node:path';
import {defineConfig} from 'vite';

export default defineConfig(({command}) => {
  return {
    // GitHub Pages serves this project from https://<user>.github.io/su-css/,
    // so production assets must be referenced under the /su-css/ subpath.
    base: command === 'build' ? '/su-css/' : '/',
    build: {
      rollupOptions: {
        // The site is hand-written pages, not one entry with a router: two in
        // English, and the translated copies generated into ja/.
        input: {
          index: path.resolve(import.meta.dirname, 'index.html'),
          customize: path.resolve(import.meta.dirname, 'customize.html'),
          'ja/index': path.resolve(import.meta.dirname, 'ja/index.html'),
          'ja/customize': path.resolve(import.meta.dirname, 'ja/customize.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
