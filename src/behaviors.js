/**
 * Import this for its side effect: it scans the document once, on import,
 * and wires up whatever it finds. For explicit control - re-running after
 * DOM you added yourself, scoping the scan to one subtree - import enhance
 * from './behaviors/enhance.js' instead and call it yourself; that entry has
 * no side effect of its own; and a bundler can drop this one when it sees
 * nothing imports it, per this package's own sideEffects declaration.
 */
import {enhance} from './behaviors/enhance.js';

enhance(document);
