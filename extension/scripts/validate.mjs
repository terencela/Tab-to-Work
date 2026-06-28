#!/usr/bin/env node
/**
 * Static validation — run before loading unpacked in Chrome.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let errors = 0;

function fail(msg) {
  console.error("✗", msg);
  errors += 1;
}

function ok(msg) {
  console.log("✓", msg);
}

const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));

const requiredFiles = [
  manifest.background.service_worker,
  manifest.action.default_popup,
  manifest.options_ui.page,
  ...Object.values(manifest.icons),
  ...(manifest.action.default_icon ? Object.values(manifest.action.default_icon) : []),
  "src/content/extract-content.js",
  "src/lib/api.js",
  "src/lib/storage.js",
  "src/lib/session.js",
  "src/lib/goals.js",
  "src/lib/urls.js",
  "src/lib/messages.js",
  "src/popup/popup.js",
  "src/options/options.js",
];

for (const rel of requiredFiles) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) fail(`Missing: ${rel}`);
  else ok(rel);
}

if (!manifest.permissions?.includes("scripting")) fail("Missing scripting permission");
if (!manifest.host_permissions?.length) fail("Missing host_permissions");

if (errors) {
  console.error(`\n${errors} error(s)`);
  process.exit(1);
}

console.log("\nExtension package looks valid. Load extension/ in chrome://extensions");
