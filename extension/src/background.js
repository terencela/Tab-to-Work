import { api } from "./lib/api.js";
import { countSavableTabs, saveCurrentSession, updateBadge } from "./lib/session.js";

api.runtime.onInstalled.addListener(async () => {
  await updateBadge();
});

api.tabs.onCreated.addListener(() => updateBadge());
api.tabs.onRemoved.addListener(() => updateBadge());
api.tabs.onUpdated.addListener((_, info) => {
  if (info.status === "complete" || info.url) updateBadge();
});
api.windows.onFocusChanged.addListener(() => updateBadge());

api.commands.onCommand.addListener(async (command) => {
  if (command === "save-session") {
    try {
      const result = await saveCurrentSession();
      await updateBadge();
      api.action.setBadgeText({ text: "✓" });
      setTimeout(updateBadge, 1500);
      console.log("[Tab to Work] saved", result.session.id, result.session.tabs.length, "tabs");
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
      .catch((err) => sendResponse({ ok: false, error: err?.message ?? "Save failed" }));
    return true;
  }
  if (message?.type === "GET_TAB_COUNT") {
    countSavableTabs()
      .then((count) => sendResponse({ ok: true, count }))
      .catch(() => sendResponse({ ok: true, count: 0 }));
    return true;
  }
  if (message?.type === "PING") {
    sendResponse({ ok: true, version: api.runtime.getManifest().version });
    return false;
  }
  return false;
});

updateBadge();
