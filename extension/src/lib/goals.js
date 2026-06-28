/**
 * Lightweight keyword classifier until API summarization ships.
 * @param {import('./types.js').TabCapture} tab
 * @param {import('./types.js').Goal[]} goals
 */
export function classifyTab(tab, goals) {
  const active = goals.filter((g) => g.active);
  if (!active.length) return { goalId: null, goalName: null, confidence: 0 };

  const haystack = `${tab.title} ${tab.url} ${tab.excerpt}`.toLowerCase();
  let best = { goalId: null, goalName: null, confidence: 0 };

  for (const goal of active) {
    const terms = `${goal.name} ${goal.description}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2);
    if (!terms.length) continue;

    let hits = 0;
    for (const term of terms) {
      if (haystack.includes(term)) hits += 1;
    }
    const confidence = hits / terms.length;
    if (confidence > best.confidence) {
      best = { goalId: goal.id, goalName: goal.name, confidence };
    }
  }

  if (best.confidence < 0.08) {
    return { goalId: null, goalName: "Uncategorized", confidence: 0 };
  }
  return best;
}

/**
 * @param {import('./types.js').TabCapture[]} tabs
 */
export function buildGoalBreakdown(tabs) {
  /** @type {Record<string, number>} */
  const breakdown = {};
  for (const tab of tabs) {
    const key = tab.goalName ?? "Uncategorized";
    breakdown[key] = (breakdown[key] ?? 0) + 1;
  }
  return breakdown;
}

/**
 * @param {import('./types.js').TabCapture[]} tabs
 * @param {import('./types.js').Goal[]} goals
 */
export function buildSessionTitle(tabs, goals) {
  const breakdown = buildGoalBreakdown(tabs);
  const top = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];
  const primary = goals.find((g) => g.primary)?.name;
  const label = top?.[0] && top[0] !== "Uncategorized" ? top[0] : primary ?? "Saved session";
  return `${label} — ${tabs.length} tabs`;
}

/**
 * @param {import('./types.js').TabCapture[]} tabs
 */
export function buildSessionSummary(tabs) {
  const withText = tabs.filter((t) => t.excerpt.length > 40);
  if (!withText.length) {
    return `Saved ${tabs.length} tabs. Content extraction pending on some pages.`;
  }
  const samples = withText.slice(0, 3).map((t) => t.title).join(", ");
  return `${tabs.length} tabs captured. Highlights: ${samples}${withText.length > 3 ? "…" : ""}.`;
}
