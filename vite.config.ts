import {defineConfig} from 'vite';

export default defineConfig(({command}) => {
  return {
    // GitHub Pages serves this project from https://<user>.github.io/su-css/,
    // so production assets must be referenced under the /su-css/ subpath.
    base: command === 'build' ? '/su-css/' : '/',
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
