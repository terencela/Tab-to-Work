/** @typedef {import('./types.js').Goal} Goal */
/** @typedef {import('./types.js').TabCapture} TabCapture */
/** @typedef {import('./types.js').Session} Session */
/** @typedef {import('./types.js').Settings} Settings */

export const api = globalThis.chrome ?? globalThis.browser;

export function uid() {
  return crypto.randomUUID();
}
