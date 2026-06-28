import { api } from "../lib/api.js";
import { getGoals, getSessions, getSettings, saveSettings } from "../lib/storage.js";

const tabCountEl = document.getElementById("tab-count");
const goalCountEl = document.getElementById("goal-count");
const saveBtn = document.getElementById("save-btn");
const closeAfterEl = document.getElementById("close-after");
const statusEl = document.getElementById("status");
const sessionListEl = document.getElementById("session-list");

function setStatus(text, isError = false) {
  statusEl.hidden = !text;
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderSessions(sessions) {
  sessionListEl.innerHTML = "";
  if (!sessions.length) {
    sessionListEl.innerHTML = '<li class="empty">No sessions yet. Hit save.</li>';
    return;
  }
  for (const session of sessions.slice(0, 4)) {
    const li = document.createElement("li");
    li.className = "session-item";
    const pills = Object.entries(session.goalBreakdown ?? {})
      .map(([name, n]) => `<span class="pill">${name} ${n}</span>`)
      .join("");
    li.innerHTML = `
      <strong>${session.title}</strong>
      <span>${session.tabs.length} tabs · ${formatDate(session.createdAt)}</span>
      <div class="goal-pills">${pills}</div>
    `;
    sessionListEl.appendChild(li);
  }
}

async function refresh() {
  const [settings, goals, sessions] = await Promise.all([
    getSettings(),
    getGoals(),
    getSessions(),
  ]);
  closeAfterEl.checked = settings.closeAfterSave;
  goalCountEl.textContent = String(goals.filter((g) => g.active).length);
  renderSessions(sessions);

  const res = await api.runtime.sendMessage({ type: "GET_TAB_COUNT" });
  tabCountEl.textContent = String(res?.count ?? 0);
}

closeAfterEl.addEventListener("change", async () => {
  await saveSettings({ closeAfterSave: closeAfterEl.checked });
});

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  setStatus("Extracting tabs…");
  try {
    const res = await api.runtime.sendMessage({
      type: "SAVE_SESSION",
      closeTabs: closeAfterEl.checked,
    });
    if (!res?.ok) throw new Error(res?.error ?? "Save failed");
    const closed = res.closed ? ` Closed ${res.closed} tabs.` : "";
    setStatus(`Saved ${res.session.tabs.length} tabs.${closed}`);
    await refresh();
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    saveBtn.disabled = false;
  }
});

refresh();
