# Tab-to-Work — Product Requirements Document

**Version:** 0.1  
**Date:** 2026-06-26  
**Status:** Draft  
**Author:** Terence La  

---

## 1. Executive Summary

Tab-to-Work is a **goal-aware tab intelligence layer** for Chromium browsers. It goes beyond OneTab and Tab Space (URL bookmarking) by capturing page content, summarizing tabs, classifying sessions against the user's active goals, enabling chat over saved browsing context, and eventually running agents that extract and act on that context.

**One-liner:** Save your tabs. Know what's in them. Organize by what you're working on. Chat with your research. Let an agent finish the boring parts.

**Primary user:** Knowledge workers with 20–100+ tabs who context-switch between projects (travel planning, client work, research, procurement) and lose information when they close tabs.

**Platform:** Chromium extension (Chrome, Arc, Brave, Edge) + web app + API backend. Safari is out of scope for v1.

---

## 2. Problem Statement

### What exists today

| Tool | What it does | What's missing |
|------|--------------|----------------|
| OneTab / Tab Space | Saves URL + title + favicon as a session | No content, no summary, no goals, no chat |
| Browser bookmarks | Permanent URL storage | No session concept, no AI |
| Dia / Comet | Chat with open tabs, some automation | No custom goal ontology, cloud-heavy, not extensible |
| MindShelf / Contexa (extensions) | Classify, summarize, export open tabs | No persistent goals profile, no agent layer |

### User pain (validated)

1. **Tab hoarding is a symptom.** Users keep tabs open because closing them feels like losing work. Current savers only defer the problem to an unreadable URL list.

2. **No semantic memory.** "I had three hotel tabs open Tuesday" is unanswerable after closing unless the user manually notes it.

3. **Goals are implicit.** Tabs for "Japan trip" and "ZRH AI strategy" sit in the same window. No tool ranks or routes tabs by what the user is actually trying to accomplish this week.

4. **Research is not actionable.** Saved sessions are graveyards. Users don't return to them because re-opening 15 URLs is worse than starting over.

5. **Automation gap.** Even when content is saved, nothing extracts prices, compares options, or drafts outputs from that research.

---

## 3. Vision

> The browser should remember what you were working on, not just where you were browsing.

Tab-to-Work is the **context layer between browsing and work**. It turns ephemeral tab sessions into structured, searchable, goal-tagged knowledge that users can chat with and agents can act on.

### Product principles

1. **Content over URLs.** Every saved tab includes extracted text and an AI summary. URLs alone are insufficient.
2. **Goals drive organization.** Classification uses the user's active goals, not generic buckets like "Shopping."
3. **Close with confidence.** One click: extract, summarize, classify, save, close. The user should feel safe closing 40 tabs.
4. **Chat is the retrieval UI.** Natural language beats scrolling through saved link lists.
5. **Privacy is architecture.** Swiss/EU users need clear data boundaries. Local-first options where possible. No silent exfiltration of page content.
6. **Agents are Phase 2, not Phase 0.** Capture and understand must work before autonomy.

---

## 4. Target Users

### Primary persona: The Context Switcher

- Consultant, founder, or enterprise lead juggling 3–5 active workstreams
- 30–80 open tabs across projects
- Uses Chrome or Arc on macOS
- Already uses ChatGPT/Claude but copy-pastes between tabs manually
- Cares about GDPR/nDSG if using at work

### Secondary persona: The Research Hoarder

- Deep research sessions (travel, purchases, competitive analysis)
- Wants to compare options across sessions days later
- Would pay for "extract all prices from my hotel research"

### Anti-persona (v1)

- Safari-only users (no WebExtension parity)
- Users who want a full browser replacement (use Dia/Comet instead)
- Teams needing real-time collaboration on tab sessions (v2+)

---

## 5. Core Features

### Phase 1 — Capture & Understand (MVP, weeks 1–3)

#### F1.1 Save Session
- **Trigger:** Extension toolbar button or keyboard shortcut (`Cmd+Shift+S`)
- **Behavior:**
  1. Enumerate all tabs in current window (or all windows — user setting)
  2. Content script per tab: extract readable text (Defuddle/readability approach)
  3. Skip failed extractions; save URL + title as fallback
  4. Batch send to processing pipeline
  5. Optionally close saved tabs (default: ask)

#### F1.2 Tab Summarization
- Per-tab summary: 2–3 sentences, key entities, page type (article, product, tool, docs)
- Session-level summary: executive brief across all tabs
- Stored with source URL and timestamp

#### F1.3 Goals Profile
- User maintains a list of goals: name, description, optional date range, active/inactive flag
- Examples: `Japan trip Mar 2026`, `Agency pipeline`, `ZRH procurement deck`
- Active goals (max 5) are injected into classification prompt
- Quick-switch: mark one goal as "primary" for new saves

#### F1.4 Goal-Based Classification
- Each tab assigned: primary goal, confidence score, optional secondary goal
- Session ranked: tabs grouped by goal, duplicates flagged
- User can override classification in review UI before closing

#### F1.5 Session History
- List of saved sessions: title (auto-generated), date, tab count, goal breakdown
- Drill into session: tab cards with summary, favicon, goal tag
- Search sessions by keyword

#### F1.6 Chat Over Sessions (RAG)
- Side panel or web app chat
- Scope: single session, all sessions, or filtered by goal
- Answers cite source tabs with click-to-open links
- Example queries:
  - "What hotels did I look at last week?"
  - "Compare the three flight options from Tuesday"
  - "Summarize everything under Japan trip"

---

### Phase 2 — Act (weeks 4–6)

#### F2.1 Structured Extraction
- User prompt: "Extract all hotel names, prices, and dates from this session"
- Output: table (CSV/Markdown) with citations
- No browser automation yet — works on saved content

#### F2.2 Agent Tasks (revisit URLs)
- User approves agent run on a saved session
- Agent revisits URLs with user's browser session (cookies)
- Tasks: price check, form pre-fill, data scrape, compare across pages
- Human-in-the-loop for payments, posts, messages
- Powered by Browser Use or similar (BYOK or hosted)

#### F2.3 Export
- Markdown bundle per session
- Obsidian vault export (YAML frontmatter)
- Apple Notes (via optional backend bridge)

---

### Phase 3 — Proactive (weeks 7–10)

#### F3.1 Goal Suggestions
- "You have 12 tabs that look like Japan trip — save and classify?"
- Nudge when tab count exceeds threshold per goal

#### F3.2 Cross-Session Synthesis
- "Across all travel sessions, here are your top 3 hotel candidates"
- Goal-level dashboard

#### F3.3 Scheduled Re-check
- Agent revisits saved product/travel URLs on schedule
- Alert when price changes or availability shifts

---

## 6. User Flows

### Flow A: End-of-day tab dump

```
User has 47 tabs open
  → Clicks "Save & Close"
  → Progress: extracting 47 tabs... summarizing... classifying...
  → Review screen: 47 tabs grouped under 3 goals
      Japan trip (18) | Agency pipeline (12) | Uncategorized (17)
  → User confirms or drags tabs between goals
  → Tabs close. Session saved.
  → Next day: "What was I researching for Japan?" → chat answer with citations
```

### Flow B: Mid-project capture

```
User sets primary goal: "ZRH procurement deck"
  → Browses for 2 hours, opens 15 vendor tabs
  → Shortcut save (no close)
  → Session auto-titled "Vendor comparison — ZRH procurement"
  → Later: "List all vendors with pricing from today's session"
```

### Flow C: Agent extraction

```
User opens saved travel session from 3 days ago
  → Clicks "Extract data"
  → Prompt: "Pull hotel name, price per night, neighborhood, cancellation policy"
  → Agent runs on saved content (no revisit) OR revisits live URLs (user approves)
  → Table output → export to CSV or paste into doc
```

---

## 7. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Chromium Extension (Manifest V3)                       │
│  ├── background/service worker (orchestration)            │
│  ├── content scripts (DOM extraction per tab)           │
│  ├── side panel (chat + session review)                 │
│  └── popup (quick save, goal switcher)                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│  API (Next.js / Node)                                   │
│  ├── /sessions — CRUD saved sessions                    │
│  ├── /goals — goals profile                             │
│  ├── /process — summarize + classify batch              │
│  ├── /chat — RAG over sessions (streaming)              │
│  └── /agent — task execution (Phase 2)                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Data Layer                                             │
│  ├── PostgreSQL (Supabase) — sessions, tabs, goals      │
│  ├── pgvector — embeddings for RAG                      │
│  └── Object storage — raw extracted text (optional)     │
└─────────────────────────────────────────────────────────┘

Phase 2 Agent:
  Extension or API → Browser Use (OSS) / Playwright
  → revisits URLs with user session cookies
  → structured output back to session
```

### Key technical decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Browser target | Chromium MV3 | Content scripts, side panel, largest reach. Safari WebExtensions are painful. |
| Extraction | Defuddle or Mozilla Readability | Battle-tested clean text from DOM |
| LLM | Claude API (primary), optional local via Chrome Built-in AI | Quality for summarize/classify; local path for privacy mode |
| Auth | Clerk | Existing stack, fast |
| Database | Supabase + pgvector | Existing stack, RAG-ready |
| Agent runtime | Browser Use (MIT, YC W25) | OSS, BYOK, session persistence |
| Reference implementations | MindShelf, Contexa | Proven extension patterns for classify + chat |

### Privacy modes (v1.1)

| Mode | Where LLM runs | Where data lives |
|------|----------------|------------------|
| Cloud (default) | Claude API via backend | Supabase EU region |
| Local | Chrome Built-in AI (Gemini Nano) | IndexedDB only, no sync |
| Hybrid | Summarize local, chat cloud | User chooses per session |

---

## 8. Competitive Landscape

### YC companies to watch

#### Tier 1 — Direct competitors (consumer AI browsers)

| Company | Batch | Why watch | Relevance to Tab-to-Work |
|---------|-------|-----------|------------------------|
| **Aside** | F25 | Local-first AI browser, browsing history as memory, agent does real work across logged-in sites, approval gates for sensitive actions | Closest to full vision. Competes on "browser replacement." Study their memory model and approval UX. |
| **Meteor** | S25 | Forked Chromium, agentic browser, chat with any page, Gmail/Calendar integrations, claims #1 WebVoyager | Aggressive on autonomy. Watch task execution UX. |
| **BrowserOS** | S24 | Open-source agentic browser, privacy-first, BYOK, local LLMs, MCP support | Best reference for privacy-first architecture. Potential integration partner or OSS fork base. |

#### Tier 2 — Build on these (agent infrastructure)

| Company | Batch | Why watch | Relevance to Tab-to-Work |
|---------|-------|-----------|------------------------|
| **Browser Use** | W25 | 50k+ GitHub stars, MIT OSS, cloud API $30/mo, persistent sessions, powers Manus | **Primary agent layer candidate for Phase 2.** |
| **StableBrowse** | S26 | Semantic web layer for agents, knowledge graphs per site, 98% task success claim | If agent reliability becomes the bottleneck at enterprise scale. |
| **Kura AI** | S24 | SOTA browser agents (87% WebVoyager), planner/executor/critic architecture | API option if Browser Use fails on complex tasks. |
| **Smooth** | F24 | Fast/cheap browser agent API, 5x speed claim | Cost-sensitive agent runs. |
| **Hyperbrowser** | S21 | Browser infra at scale, HyperAgent (Playwright + AI), MCP server | Production agent hosting if self-hosting is too heavy. |

#### Tier 3 — Not YC, still watch

| Company | Notes |
|---------|-------|
| **Dia** (Browser Company) | Best "chat with tabs" UX today. Project-based grouping. Not goal-aware. |
| **Comet** (Perplexity) | Most agentic consumer browser. Cross-tab memory. Expensive, cloud-only. |
| **Strawberry** (Stockholm, GC/EQT) | Agentic browser, credit-based, strong on lead gen / research automation. |
| **Fellou** | "First agentic browser," Eko automation engine, 1M+ users. Heavy on desktop + web automation. |

### Tab-to-Work differentiation

| Dimension | AI browsers (Dia, Comet, Aside) | Tab-to-Work |
|-----------|--------------------------------|-------------|
| Deployment | Replace your browser | Extension on existing browser |
| Goal ontology | Generic projects or none | User-defined active goals |
| Works with Arc/Chrome | No (mostly) | Yes |
| Swiss on-prem path | Unlikely | Extension + self-hosted API |
| Tab saver replacement | Partial | Full (save + close + intelligence) |
| Build vs buy | Buy | Build (your moat is goals + data) |

---

## 9. Non-Goals (v1)

- Safari extension
- Full browser replacement
- Real-time multi-user collaboration
- Mobile app
- Replacing Notion/Obsidian (export to them, don't compete)
- Autonomous actions without user approval
- Training custom models

---

## 10. Success Metrics

### MVP (Phase 1)

| Metric | Target |
|--------|--------|
| Save session success rate | >95% of tabs extracted |
| Classification accuracy (user override rate) | <20% tabs manually recategorized |
| Time to save 30 tabs | <30 seconds |
| Chat answer usefulness (self-reported) | >4/5 |
| Weekly active saves per user | >3 |

### Phase 2

| Metric | Target |
|--------|--------|
| Agent task completion rate | >70% |
| Extraction accuracy (structured data) | >85% field-level |
| Return visit to saved session within 7 days | >40% of sessions |

---

## 11. Milestones

| Week | Deliverable |
|------|-------------|
| 1 | Extension scaffold: tab enumeration, content extraction, popup UI |
| 2 | Goals profile CRUD, batch summarize + classify API |
| 3 | Save & close flow, session history, side panel chat (RAG) |
| 4 | Review UI (drag tabs between goals), duplicate detection |
| 5 | Structured extraction from saved sessions |
| 6 | Agent integration (Browser Use), revisit-with-approval flow |
| 7 | Export (Markdown, Obsidian), privacy mode (local) |
| 8 | Polish, landing page, beta with 10 users |

---

## 12. Privacy & Compliance

### Requirements (Swiss/EU context)

- **Data minimization:** Store summaries + chunks, not full page HTML unless user opts in
- **Region:** Supabase EU (Frankfurt or Zurich if available)
- **Retention:** User-configurable session TTL (default: 90 days)
- **Deletion:** Hard delete session + embeddings on user request
- **LLM processing:** Claude API with zero-retention where available; document sub-processors
- **Enterprise path:** Self-hosted API + bring-your-own-key (no data leaves customer infra)
- **Sensitive pages:** Auto-detect banking/health URLs; skip extraction or warn (configurable blocklist)

### What we do NOT do

- Sell browsing data
- Train models on user content
- Share sessions across users without explicit consent

---

## 13. Open Questions

| # | Question | Options | Decision needed by |
|---|----------|---------|-------------------|
| 1 | Extension-only MVP vs extension + web app from day 1? | Side panel only vs full web dashboard | Week 1 |
| 2 | Auth required for MVP or local-only first? | Clerk from start vs IndexedDB local mode | Week 1 |
| 3 | Which agent runtime for Phase 2? | Browser Use OSS vs Smooth API vs self-hosted Playwright | Week 4 |
| 4 | Pricing model? | Free tier + Pro ($12/mo) vs one-time purchase | Before beta |
| 5 | Name: Tab-to-Work or rebrand? | Keep working title vs consumer name | Before landing page |

---

## 14. Appendix

### Reference repos (open source patterns)

- [MindShelf](https://github.com/pdajoy/mindshelf) — classify, summarize, chat, export
- [Contexa](https://github.com/balamuruganmariappan/contexa) — on-device session brief
- [TabWhisperer](https://github.com/MoussaabBadla/TabWhisperer) — Chrome Built-in AI categorization
- [Rewind Extension](https://github.com/vinyasv/rewind-extension) — local RAG over browsing history
- [Browser Use](https://github.com/browser-use/browser-use) — agent runtime (MIT)

### Tab Space (what NOT to fork)

[Tab-Space repo](https://github.com/yuanzhoucq/Tab-Space) contains only the Vue web admin and landing page. No Safari extension source. Solves URL bookmarking only.

---

*Next step: Technical spec for Phase 1 extension scaffold (see `docs/TECH-SPEC.md` — TBD).*
