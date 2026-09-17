/**
 * Scans root for every ARIA pattern this file has a behaviour for, and wires
 * it up. Safe to call more than once - already-wired elements are skipped -
 * and a no-op wherever the matching markup is not there. See the design in
 * https://github.com/RyotaSugawara/su-css/issues/55: this file is the
 * explicit, tree-shakeable half of it. `behaviors.js` is the other half,
 * calling this once for you on import.
 */
import {enhanceToolbars} from './toolbar.js';
import {enhanceTablists} from './tablist.js';

export function enhance(root = document) {
  enhanceToolbars(root);
  enhanceTablists(root);
}
