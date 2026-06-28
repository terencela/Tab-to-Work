import { api, uid } from "./api.js";
import {
  buildGoalBreakdown,
  buildSessionSummary,
  buildSessionTitle,
  classifyTab,
} from "./goals.js";
import { getGoals, getSettings, saveSession } from "./storage.js";
import { isSavableUrl } from "./urls.js";

const EXTRACT_CONCURRENCY = 4;

/**
 * @param {import('./types.js').Goal[]} goals
 */
async function extractTab(tab, goals) {
  /** @type {import('./types.js').TabCapture} */
  const capture = {
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

  if (tab.id === undefined) {
    capture.excerpt = capture.url;
    return capture;
  }

  try {
    const results = await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/content/extract-content.js"],
    });
    const result = results?.[0]?.result;
    if (result && typeof result === "object") {
      capture.excerpt = String(result.excerpt ?? "");
      capture.wordCount = Number(result.wordCount ?? 0);
      if (result.title) capture.title = String(result.title);
    } else {
      capture.excerpt = capture.url;
    }
  } catch {
    capture.excerpt = capture.url;
  }

  const match = classifyTab(capture, goals);
  capture.goalId = match.goalId ?? undefined;
  capture.goalName = match.goalName ?? undefined;
  capture.goalConfidence = match.confidence;
  return capture;
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * @returns {Promise<{ session: import('./types.js').Session, closed: number }>}
 */
export async function saveCurrentSession({ closeTabs } = {}) {
  const [settings, goals] = await Promise.all([getSettings(), getGoals()]);
  const shouldClose = closeTabs ?? settings.closeAfterSave;

  const query = settings.allWindows ? {} : { currentWindow: true };
  const rawTabs = await api.tabs.query({ ...query, discarded: false });
  const tabs = rawTabs.filter((t) => t.url && isSavableUrl(t.url));

  if (!tabs.length) {
    throw new Error("No savable tabs found. Open some web pages first.");
  }

  const captures = await mapWithConcurrency(tabs, EXTRACT_CONCURRENCY, (tab) =>
    extractTab(tab, goals),
  );

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

export async function countSavableTabs(windowId) {
  const query = windowId !== undefined ? { windowId, discarded: false } : { currentWindow: true, discarded: false };
  const tabs = await api.tabs.query(query);
  return tabs.filter((t) => isSavableUrl(t.url ?? "")).length;
}

export async function updateBadge() {
  try {
    const count = await countSavableTabs();
    const text = count > 99 ? "99+" : count > 0 ? String(count) : "";
    await api.action.setBadgeText({ text });
    await api.action.setBadgeBackgroundColor({ color: "#00ff88" });
    if (api.action.setBadgeTextColor) {
      await api.action.setBadgeTextColor({ color: "#090909" });
    }
  } catch (err) {
    console.warn("[Tab to Work] badge update failed", err);
  }
}
