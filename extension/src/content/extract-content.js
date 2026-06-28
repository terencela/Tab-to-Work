/**
 * Injected via scripting.executeScript — return value is read by the extension.
 */
function extractPageContent() {
  function textOf(el) {
    if (!el) return "";
    return (el.innerText ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  const candidates = [
    document.querySelector("article"),
    document.querySelector("main"),
    document.querySelector('[role="main"]'),
    document.getElementById("content"),
    document.body,
  ].filter(Boolean);

  let best = document.body;
  let bestLen = 0;
  for (const el of candidates) {
    const len = textOf(el).length;
    if (len > bestLen) {
      bestLen = len;
      best = el;
    }
  }

  const excerpt = textOf(best).slice(0, 1200);
  const words = excerpt.split(/\s+/).filter(Boolean);

  return {
    title: document.title || "",
    excerpt,
    wordCount: words.length,
  };
}

extractPageContent();
