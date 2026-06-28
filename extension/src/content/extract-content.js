/**
 * Runs in page context via scripting.executeScript.
 * Returns readable excerpt for classification and future summarization.
 */
(function extractPageContent() {
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "NAV", "FOOTER", "HEADER"]);

  function textOf(el) {
    return (el?.innerText ?? el?.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  const root =
    document.querySelector("article") ??
    document.querySelector("main") ??
    document.querySelector('[role="main"]') ??
    document.body;

  let excerpt = "";
  if (root) {
    const parts = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode;
    while (node) {
      if (!SKIP.has(node.nodeName)) {
        const t = textOf(node);
        if (t.length > 40) parts.push(t);
      }
      node = walker.nextNode();
    }
    excerpt = parts.slice(0, 6).join(" ").slice(0, 1200);
  }

  if (!excerpt) excerpt = textOf(root).slice(0, 1200);

  const words = excerpt.split(/\s+/).filter(Boolean);
  return {
    title: document.title,
    excerpt,
    wordCount: words.length,
  };
})();
