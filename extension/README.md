# Tab to Work — Browser Extension

One-click tab save with **content extraction** and **goal-based classification**. Chrome and Safari from the same codebase (Manifest V3).

## Features (v0.1)

- Save all tabs in the current window (or all windows)
- Extract readable text per tab, not just URLs
- Auto-classify tabs against your active goals
- Session history with summaries and goal breakdown
- Badge shows open tab count
- Keyboard shortcut: `⌘⇧S` (Mac) / `Ctrl+Shift+S`

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `extension/` folder
4. Pin **Tab to Work** to the toolbar

## Load in Safari (macOS)

Requires Xcode 14+ and Safari 16.4+.

```bash
cd extension
./scripts/build-safari.sh
```

Open the generated Xcode project in `safari/Tab to Work/`, select the **Tab to Work** scheme, then **Product → Run**. Enable the extension in **Safari → Settings → Extensions**.

To reload after code changes, rebuild or run the script again.

## Project layout

```
extension/
├── manifest.json          # MV3 — Chrome + Safari Web Extension
├── icons/
├── src/
│   ├── background.js      # Service worker, save orchestration
│   ├── content/           # Per-tab text extraction
│   ├── lib/               # Storage, goals, session logic
│   ├── popup/             # One-click save UI
│   └── options/           # Sessions, goals, settings
└── safari/                # Generated macOS wrapper (gitignored)
```

## Privacy

- All data stored locally in `chrome.storage.local` / `browser.storage.local`
- Page content is extracted on save only, never sent to a server in v0.1
- API summarization and chat (Phase 1.6) will be opt-in when backend ships

## Roadmap

- [ ] API-backed summarization per tab
- [ ] Side panel chat (RAG over sessions)
- [ ] Review screen before close (drag tabs between goals)
- [ ] Agent extraction (Phase 2)
