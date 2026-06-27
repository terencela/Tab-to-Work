# Decisions

## 2026-06-26 — Product direction

**Decision:** Build Tab-to-Work as a Chromium extension + goals-aware backend. Do not fork Tab Space.

**Why:** Tab Space saves URLs only. The product gap is content extraction, goal-based classification, RAG chat, and optional agent execution. Tab Space repo does not include the native Safari extension source.

**Alternatives rejected:**
- Fork Tab Space — wrong foundation, no extension source
- Build full AI browser — competes with Aside/Meteor/BrowserOS; slower to ship
- Use Dia/Comet only — no custom goals, no Swiss on-prem path, not extensible

**Agent layer (Phase 2):** Browser Use (YC W25, MIT) as primary candidate.
