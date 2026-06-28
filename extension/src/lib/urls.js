const SKIP_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "edge://",
  "about:",
  "devtools://",
  "safari-extension://",
  "safari-web-extension://",
  "brave://",
  "vivaldi://",
];

export function isSavableUrl(url) {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("blob:")) {
    return false;
  }
  return !SKIP_PREFIXES.some((p) => lower.startsWith(p));
}
