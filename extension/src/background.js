import { api } from "./lib/api.js";
import { saveCurrentSession, updateBadge } from "./lib/session.js";

api.runtime.onInstalled.addListener(async () => {
  await updateBadge();
});

api.tabs.onCreated.addListener(updateBadge);
api.tabs.onRemoved.addListener(updateBadge);
api.tabs.onUpdated.addListener((_, info) => {
  if (info.status === "complete" || info.url) updateBadge();
});
api.windows.onFocusChanged.addListener(updateBadge);

api.commands.onCommand.addListener(async (command) => {
  if (command === "save-session") {
    try {
      await saveCurrentSession();
      await updateBadge();
    } catch (err) {
      console.error("[Tab to Work] save failed", err);
    }
  }
});

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SAVE_SESSION") {
    saveCurrentSession({ closeTabs: message.closeTabs })
      .then(async (result) => {
        await updateBadge();
        sendResponse({ ok: true, ...result });
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (message?.type === "GET_TAB_COUNT") {
    api.tabs.query({ currentWindow: true, discarded: false }).then((tabs) => {
      const count = tabs.filter((t) => t.url && !t.url.startsWith("chrome://")).length;
      sendResponse({ count });
    });
    return true;
  }
  return false;
});

updateBadge();
