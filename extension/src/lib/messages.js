import { api } from "./api.js";

/**
 * Promise wrapper for chrome.runtime.sendMessage with lastError handling.
 * @template T
 * @param {object} message
 * @returns {Promise<T | null>}
 */
export function sendMessage(message) {
  return new Promise((resolve) => {
    try {
      api.runtime.sendMessage(message, (response) => {
        const err = api.runtime.lastError;
        if (err) {
          console.warn("[Tab to Work] message error:", err.message);
          resolve(null);
          return;
        }
        resolve(response ?? null);
      });
    } catch (err) {
      console.warn("[Tab to Work] sendMessage failed", err);
      resolve(null);
    }
  });
}
