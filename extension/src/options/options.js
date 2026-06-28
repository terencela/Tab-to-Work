import { uid } from "../lib/api.js";
import { deleteSession, getGoals, getSessions, getSettings, saveGoals, saveSettings } from "../lib/storage.js";

const panels = document.querySelectorAll(".panel");
const navButtons = document.querySelectorAll(".nav");
const sessionsRoot = document.getElementById("sessions-root");
const goalsRoot = document.getElementById("goals-root");
const addGoalBtn = document.getElementById("add-goal");
const settingAllWindows = document.getElementById("setting-all-windows");
const settingClose = document.getElementById("setting-close");

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`panel-${btn.dataset.panel}`).classList.add("active");
  });
});

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function renderSessions() {
  const sessions = await getSessions();
  if (!sessions.length) {
    sessionsRoot.innerHTML = '<p class="empty-state">No sessions saved yet. Use the toolbar popup to save tabs.</p>';
    return;
  }

  sessionsRoot.innerHTML = sessions
    .map((session) => {
      const tabs = session.tabs
        .map(
          (tab) => `
        <li class="tab-row">
          <img src="${tab.favIconUrl ?? "../../icons/icon16.png"}" alt="" onerror="this.style.opacity=0.3" />
          <div>
            <a href="${escapeHtml(tab.url)}" target="_blank" rel="noopener">${escapeHtml(tab.title)}</a>
            <div class="excerpt">${escapeHtml(tab.excerpt.slice(0, 180))}${tab.excerpt.length > 180 ? "…" : ""}</div>
          </div>
          <span class="pill">${escapeHtml(tab.goalName ?? "—")}</span>
        </li>`,
        )
        .join("");

      return `
      <article class="session-card" data-id="${session.id}">
        <header>
          <div>
            <h2>${escapeHtml(session.title)}</h2>
            <div class="meta">${session.tabs.length} tabs · ${new Date(session.createdAt).toLocaleString()}</div>
          </div>
          <button class="btn-danger delete-session" data-id="${session.id}" type="button">Delete</button>
        </header>
        <p class="summary">${escapeHtml(session.summary)}</p>
        <ul class="tab-list">${tabs}</ul>
      </article>`;
    })
    .join("");

  sessionsRoot.querySelectorAll(".delete-session").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await deleteSession(btn.dataset.id);
      await renderSessions();
    });
  });
}

async function renderGoals() {
  const goals = await getGoals();
  goalsRoot.innerHTML = goals
    .map(
      (goal, i) => `
    <div class="goal-card" data-index="${i}">
      <label>Name</label>
      <input class="goal-name" value="${escapeHtml(goal.name)}" />
      <label>Keywords (for auto-classify)</label>
      <textarea class="goal-desc">${escapeHtml(goal.description)}</textarea>
      <div class="goal-actions">
        <label><input class="goal-active" type="checkbox" ${goal.active ? "checked" : ""} /> Active</label>
        <label><input class="goal-primary" type="radio" name="primary" ${goal.primary ? "checked" : ""} /> Primary</label>
      </div>
    </div>`,
    )
    .join("");

  goalsRoot.querySelectorAll(".goal-card").forEach((card) => {
    const save = async () => {
      const goals = await getGoals();
      const i = Number(card.dataset.index);
      goals[i] = {
        ...goals[i],
        name: card.querySelector(".goal-name").value.trim() || goals[i].name,
        description: card.querySelector(".goal-desc").value.trim(),
        active: card.querySelector(".goal-active").checked,
        primary: card.querySelector(".goal-primary").checked,
      };
      if (goals[i].primary) {
        goals.forEach((g, j) => {
          if (j !== i) g.primary = false;
        });
      }
      await saveGoals(goals);
    };
    card.querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("change", save);
      el.addEventListener("blur", save);
    });
  });
}

addGoalBtn.addEventListener("click", async () => {
  const goals = await getGoals();
  goals.push({
    id: uid(),
    name: "New goal",
    description: "",
    active: true,
    primary: false,
  });
  await saveGoals(goals);
  await renderGoals();
});

async function loadSettings() {
  const settings = await getSettings();
  settingAllWindows.checked = settings.allWindows;
  settingClose.checked = settings.closeAfterSave;
}

settingAllWindows.addEventListener("change", () =>
  saveSettings({ allWindows: settingAllWindows.checked }),
);
settingClose.addEventListener("change", () =>
  saveSettings({ closeAfterSave: settingClose.checked }),
);

renderSessions();
renderGoals();
loadSettings();
