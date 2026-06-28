import { api } from "./api.js";
import { DEFAULT_GOALS, DEFAULT_SETTINGS } from "./types.js";

const KEYS = {
  sessions: "ttw_sessions",
  goals: "ttw_goals",
  settings: "ttw_settings",
};

async function read(key, fallback) {
  const data = await api.storage.local.get(key);
  return data[key] ?? fallback;
}

async function write(key, value) {
  await api.storage.local.set({ [key]: value });
}

export async function getGoals() {
  const goals = await read(KEYS.goals, null);
  if (!goals?.length) {
    await write(KEYS.goals, DEFAULT_GOALS);
    return [...DEFAULT_GOALS];
  }
  return goals;
}

export async function saveGoals(goals) {
  await write(KEYS.goals, goals);
}

export async function getSettings() {
  const settings = await read(KEYS.settings, null);
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(settings) {
  const current = await getSettings();
  await write(KEYS.settings, { ...current, ...settings });
}

export async function getSessions() {
  return (await read(KEYS.sessions, [])) ?? [];
}

export async function saveSession(session) {
  const sessions = await getSessions();
  sessions.unshift(session);
  await write(KEYS.sessions, sessions.slice(0, 100));
  return session;
}

export async function deleteSession(id) {
  const sessions = (await getSessions()).filter((s) => s.id !== id);
  await write(KEYS.sessions, sessions);
}

export async function updateSession(session) {
  const sessions = await getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  await write(KEYS.sessions, sessions);
}
