import { api, uid } from "./api.js";
import {
  buildGoalBreakdown,
  buildSessionSummary,
  buildSessionTitle,
  classifyTab,
} from "./goals.js";
import { getGoals, getSettings, saveSession } from "./storage.js";

const SKIP_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "edge://",
  "about:",
  "devtools://",
  "safari-extension://",
  "safari-web-extension://",
];

function isSavableUrl(url) {
  if (!url) return false;
  return !SKIP_PREFIXES.some((p) => url.startsWith(p));
}

/**
 * @param {import('./types.js').Goal[]} goals
 */
async function extractTab(tab, goals) {
  /** @type {import('./types.js').TabCapture} */
  let capture = {
    tabId: tab.id ?? 0,
    url: tab.url ?? "",
    title: tab.title ?? "Untitled",
    favIconUrl: tab.favIconUrl,
    excerpt: "",
    wordCount: 0,
  };

  if (!isSavableUrl(capture.url)) {
    capture.excerpt = "System page — URL saved only.";
    return capture;
  }

  try {
    const [{ result }] = await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/content/extract-content.js"],
    });
    if (result) {
      capture.excerpt = result.excerpt ?? "";
      capture.wordCount = result.wordCount ?? 0;
      if (result.title) capture.title = result.title;
    }
  } catch {
    capture.excerpt = tab.url;
  }

  const match = classifyTab(capture, goals);
  capture.goalId = match.goalId ?? undefined;
  capture.goalName = match.goalName ?? undefined;
  capture.goalConfidence = match.confidence;
  return capture;
}

/**
 * @returns {Promise<{ session: import('./types.js').Session, closed: number }>}
 */
export async function saveCurrentSession({ closeTabs } = {}) {
  const [settings, goals] = await Promise.all([getSettings(), getGoals()]);
  const shouldClose = closeTabs ?? settings.closeAfterSave;

  const query = settings.allWindows ? { currentWindow: false } : { currentWindow: true };
  const rawTabs = await api.tabs.query(query);
  const tabs = rawTabs.filter((t) => t.url && isSavableUrl(t.url) && !t.discarded);

  if (!tabs.length) {
    throw new Error("No savable tabs in this window.");
  }

  const captures = [];
  for (const tab of tabs) {
    captures.push(await extractTab(tab, goals));
  }

  const session = {
    id: uid(),
    title: buildSessionTitle(captures, goals),
    createdAt: new Date().toISOString(),
    tabs: captures,
    summary: buildSessionSummary(captures),
    goalBreakdown: buildGoalBreakdown(captures),
  };

  await saveSession(session);

  let closed = 0;
  if (shouldClose) {
    const ids = tabs.map((t) => t.id).filter((id) => id !== undefined);
    if (ids.length) {
      await api.tabs.remove(ids);
      closed = ids.length;
    }
  }

  return { session, closed };
}

export async function updateBadge() {
  const tabs = await api.tabs.query({ currentWindow: true, discarded: false });
  const count = tabs.filter((t) => isSavableUrl(t.url ?? "")).length;
  const text = count > 99 ? "99+" : count > 0 ? String(count) : "";
  await api.action.setBadgeText({ text });
  await api.action.setBadgeBackgroundColor({ color: "#00ff88" });
  await api.action.setBadgeTextColor({ color: "#090909" });
}
