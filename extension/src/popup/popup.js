import { api } from "../lib/api.js";
import { getGoals, getSessions, getSettings, saveSettings } from "../lib/storage.js";
import { sendMessage } from "../lib/messages.js";

const tabCountEl = document.getElementById("tab-count");
const goalCountEl = document.getElementById("goal-count");
const saveBtn = document.getElementById("save-btn");
const closeAfterEl = document.getElementById("close-after");
const statusEl = document.getElementById("status");
const sessionListEl = document.getElementById("session-list");
const optionsLink = document.getElementById("options-link");

optionsLink.href = api.runtime.getURL("src/options/options.html");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
      .map(([name, n]) => `<span class="pill">${escapeHtml(name)} ${n}</span>`)
      .join("");
    li.innerHTML = `
      <strong>${escapeHtml(session.title)}</strong>
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

  const res = await sendMessage({ type: "GET_TAB_COUNT" });
  tabCountEl.textContent = res?.count !== undefined ? String(res.count) : "—";
}

closeAfterEl.addEventListener("change", async () => {
  await saveSettings({ closeAfterSave: closeAfterEl.checked });
});

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  setStatus("Extracting tabs…");
  try {
    const res = await sendMessage({
      type: "SAVE_SESSION",
      closeTabs: closeAfterEl.checked,
    });
    if (!res) {
      throw new Error("Extension background did not respond. Reload the extension and try again.");
    }
    if (!res.ok) throw new Error(res.error ?? "Save failed");
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
