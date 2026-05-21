# Frontend — Progress Tracker

> **Project:** Two-Agent Research Assistant POC
> **Sprint:** 3 days · **Role:** Frontend Developer
> **Source of truth:** [`/README.md`](../README.md) · 

This file tracks the frontend slice of the POC. Each task below has concrete sub-tasks with checkboxes, and a *done when* line. Read top to bottom — F1 unblocks F2, F2 unblocks F3.

---

## Latest update — 2026-05-21 (evening)

**F2 in flight — AG-UI streaming pipeline wired end-to-end against a mock planner.**

Colleagues shipped the contracts and most of the backend on `main`:

- **I1 ✅** — `contracts/` merged: `agent_card.json`, `planner_request.py`, `state_delta.py`, `tools.py`, `README.md`
- **B1 ✅** — MCP Tool Server on `:8001` (`backend/mcp_server/main.py`) returning real-looking `web_search` results over MCP/SSE
- **B2 ✅** — Search Agent on `:8002` (`backend/search_agent/main.py`) with A2A Agent Card + JSON `/tasks` + AG-UI `/tasks/stream`
- **B3 ⏳** — Planner Agent (`:8000`) not yet committed. We built `app/api/mock-planner/route.ts` as a stand-in that emits the documented event sequence so F2 / F3 are testable today.

**Frontend slice for F2:**

- `lib/agui-types.ts` — TypeScript mirror of `contracts/{planner_request,state_delta,tools}.py`. Discriminated union `AnyAgentEvent` with per-type payloads.
- `lib/env.ts` — `AGENT_URL` resolved from `NEXT_PUBLIC_AGENT_URL`, default `/api/mock-planner`. Flip the env var to point at the real Planner once B3 lands.
- `hooks/use-agent-stream.ts` — POSTs the planner request body, parses `event: <type>\ndata: <json>` SSE frames, forwards typed events to a callback. Supports cancellation via `AbortController`.
- `app/api/mock-planner/route.ts` — Next.js Route Handler that emits the full event sequence from the README (RUN_STARTED → STEP_STARTED → STATE_DELTA(planner thinking…) → STEP_STARTED(A2A) → STATE_DELTA(search preparing) → TOOL_CALL_START → STATE_DELTA(search searching the web…) → TOOL_CALL_END → STATE_DELTA(search complete) → STEP_FINISHED → STATE_DELTA(planner writing answer…) → TEXT_MESSAGE_START → CONTENT × N → END → STATE_DELTA(idle) → RUN_FINISHED).
- `components/app-state.tsx` — context now exposes `sendMessage(text)` and `cancelRun()`. Consumes the event stream, updates `activeAgent`, `step`, `toolCalls`, `events`, and `messages` in real time. Buffers tool-call data and attaches it to the assistant bubble when `TEXT_MESSAGE_START` fires.

**UX polish (the ask-vs-show parts):**

- Page is now viewport-locked (`h-svh` + `overflow-hidden`) — no body scroll. Each panel owns its own internal scroll.
- Removed the floating CopilotKit mascot (`copilot-mascot.tsx` deleted).
- Composer simplified to match Claude / ChatGPT: icon-only ↑ send button, no `↵ send / ⇧↵ newline` hints (those are universal), no paperclip, no char counter. Focus uses a soft ring inside the composer card; the harsh browser outline is suppressed on text fields.
- New `ThinkingBubble` — shown between the user message and the first assistant token, with the live step ("thinking…", "searching the web…", "writing answer…") and animated dots. Matches the ChatGPT/Claude pattern.
- Empty conversation now shows a Sparkles icon, a short intro, and three suggested prompts pulled from `SUGGESTIONS`.
- Activity panel's status line under the agent-flow cards reads `planner · thinking…` / `search · searching the web…` instead of raw backend strings (mapped via `friendlyStep()`).
- Brand renamed (per inline edit) — header shows `● Mobiz · agent research console`.

**Verification:**

- `npx tsc --noEmit` → clean
- `npm run dev` → Turbopack ready in 928ms, `GET /` 200
- `POST /api/mock-planner` returns the expected `event: RUN_STARTED → data: {...}` SSE frames; type-checked deserialization in the hook
- Submit a question on the page → user bubble appears → thinking bubble shows "thinking…" → swaps to "searching the web…" with the tool-call card lighting up in the activity panel → assistant bubble streams in token-by-token with the search results card attached.

**Stack upgraded to current LTS (carried over from morning update).** README originally said "Next.js 14"; nothing in the project actually depended on 14 so we bumped to the current security-patched versions:

| Was | Now | Why |
|---|---|---|
| Next 14.2.35 | **Next 16.2.6** (Turbopack) | Patches 14 CVEs in 14.x (DoS, cache poisoning, SSRF, XSS chain) |
| React 18 | **React 19** | Default with Next 16 |
| ESLint 8 | **ESLint 9.17** | Required peer of `eslint-config-next@16` |
| `@copilotkit/* 1.5.20` | **`@copilotkit/* 1.10.6`** | Latest patch line |
| `lucide-react 0.468` | **`lucide-react 0.469`** | Tracking latest |

Added `overrides` block in `package.json` forcing `prismjs >= 1.30.0` and `postcss ^8.5.10` so the transitive vulns inside `@copilotkit/react-ui` and `next` get resolved without npm trying to *downgrade* CopilotKit to an ancient pre-1.0 release (which is what `npm audit fix --force` did and broke everything).

**Result:** `npm audit` → **`found 0 vulnerabilities`** · `npm run dev` boots in ~900ms on Turbopack · `GET /` 200 · `tsc --noEmit` passes.

---

## Earlier update — 2026-05-21 (morning)

**F1 ✅ shipped.** Console-style two-panel layout, light/dark toggle, mobile responsive (tabbed) with all README elements stubbed via mock data. Wiring to live AG-UI / Planner endpoint is F2's job.

**Stack upgraded to current LTS.** README originally said "Next.js 14"; nothing in the project actually depended on 14 so we bumped to the current security-patched versions:

| Was | Now | Why |
|---|---|---|
| Next 14.2.35 | **Next 16.2.6** (Turbopack) | Patches 14 CVEs in 14.x (DoS, cache poisoning, SSRF, XSS chain) |
| React 18 | **React 19** | Default with Next 16 |
| ESLint 8 | **ESLint 9.17** | Required peer of `eslint-config-next@16` |
| `@copilotkit/* 1.5.20` | **`@copilotkit/* 1.10.6`** | Latest patch line |
| `lucide-react 0.468` | **`lucide-react 0.469`** | Tracking latest |

Added `overrides` block in `package.json` forcing `prismjs >= 1.30.0` and `postcss ^8.5.10` so the transitive vulns inside `@copilotkit/react-ui` and `next` get resolved without npm trying to *downgrade* CopilotKit to an ancient pre-1.0 release (which is what `npm audit fix --force` did and broke everything).

**Result:** `npm audit` → **`found 0 vulnerabilities`** · `npm run dev` boots in 813ms on Turbopack · `GET /` 200 · `tsc --noEmit` passes.

## Status legend

| Mark | Meaning |
|---|---|
| ☐ | Todo — not started |
| 🟡 | In progress |
| ✅ | Done |
| ⛔ | Blocked (note who/what we're waiting on) |

When you start a sub-task, change `☐` to `🟡`. When you finish it, change it to `✅` and commit.

---

## Stack

- **Framework:** Next.js **16** (App Router, Turbopack) · React **19** · TypeScript 5.7
- **Styling:** Tailwind CSS 3.4 · hand-rolled primitives (no shadcn CLI)
- **Theming:** `next-themes` 0.4 (class-based dark default + `.light` override)
- **Icons:** `lucide-react` 0.469
- **Agentic UI:** `@copilotkit/react-core` · `@copilotkit/react-ui` · `@copilotkit/runtime-client-gql` (all 1.10.6)
- **Transport:** AG-UI events over SSE (consumed by CopilotKit) — wired in F2
- **Lint:** ESLint 9 + `eslint-config-next@16`
- **Dev server:** `http://localhost:3000` (Turbopack)
- **Security:** `npm audit` → 0 vulnerabilities (via `overrides: { prismjs, postcss }`)

---

## Prerequisites — what we need from other roles

These are inputs the frontend depends on. F1 is independent and can start immediately; F2/F3 need these to fully light up.

- ⛔ **From Integration (Task I1):** `contracts/` folder with the Agent Card JSON, the AG-UI POST endpoint shape, and the `STATE_DELTA` payload type committed to the repo. We import types from here so backend + frontend agree on the wire format.
- ⛔ **From Backend (Task B3):** Planner Agent running at `http://localhost:8000/agent`, accepting `{ thread_id, messages }` and streaming the AG-UI event sequence documented in the README.
- ℹ️ **From Backend (Task B2, indirect):** Search Agent must be reachable from the Planner so the Planner emits the `STATE_DELTA { active_agent: "search" }` transition we render in F3. Frontend doesn't talk to it directly.

Until those land, F2 and F3 can be smoke-tested against a mocked SSE stream (see F2.9).

---

## F1 — Scaffold + Two-Panel Layout

> **Target:** EOD Day 1 · **Protocol:** — (pure frontend foundation)

### What it is
A working Next.js app at `localhost:3000` with the two-panel layout from the README: chat on the left, agent activity on the right. No agent calls yet — just the shell.

### Why it matters
Every other frontend task depends on this. More importantly, the two-panel layout *is* the visual metaphor for the POC. Chat on the left makes the user feel like they're talking to one assistant; the activity panel on the right makes the multi-agent protocol stack visible. Without the right panel the demo looks like a normal chatbot and the educational point is lost. Get the layout locked in early so F2 and F3 just drop content into pre-existing containers.

### Sub-tasks
- ✅ **F1.1** Initialized Next.js 14 in `frontend/` (App Router, TypeScript, Tailwind, ESLint, no `src/` dir). PROGRESS.md was temporarily moved out so create-next-app could scaffold cleanly, then restored.
- ✅ **F1.2** Installed CopilotKit (`@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime-client-gql@1.5.20`) plus `next-themes`, `lucide-react@^0.468`, `clsx`, `tailwind-merge`.
- ✅ **F1.3** Hand-rolled the few primitives we need (card, badge, scroll-area equivalents) directly with Tailwind rather than running `shadcn init` — avoids the init step overwriting layout files; cost is ~20 lines of CSS we'd write anyway.
- ✅ **F1.4** `tailwind.config.ts` + `app/globals.css` rebuilt with the console design tokens — dark default, `.light` class override, monospace body, custom keyframes (`pulse-soft`, `blink`, `fade-up`, `flow-dash`), protocol color tokens (mcp / a2a / agui / copilot / vercel).
- ✅ **F1.5** `app/layout.tsx` rewritten with `ThemeProvider` (next-themes, `attribute="class"`, default `dark`), Geist Sans + Mono fonts, and console-flavored metadata. CopilotKit provider will move in during F2 once `runtimeUrl` is wired.
- ✅ **F1.6** `console-header.tsx` — sticky top bar: pulsing `● console` mark, MCP/A2A/AG-UI/CopilotKit protocol pills (horizontal scroll on mobile, centered on desktop), status pill (`idle | ready | streaming | error`), `theme-toggle.tsx` slider.
- ✅ **F1.7** `panels-shell.tsx` — responsive two-panel layout. Side-by-side on `lg+` (1.35fr / 1fr), tabbed on `<lg` so each panel keeps single-viewport scroll and the composer stays anchored.
- ✅ **F1.8** `chat-panel.tsx` shell complete with mock data: section header + active-thread chip, scrollable bubble area (`chat-bubble.tsx` + `tool-call-card.tsx` for the expandable `web_search` results), and `composer.tsx` with auto-grow textarea, send/stop button, and keyboard hint strip.
- ✅ **F1.9** `activity-panel.tsx` shell complete: section header with event count, `agent-flow.tsx` (Planner :8000 → Search :8002 → web_search :8001 with A2A/MCP dashed-arrow connectors and per-node active highlight), and `event-log.tsx` (timestamped, per-event-type color coding via `EVENT_COLOR`).
- ✅ **F1.10** `npm run dev` boots in 2.5s, `GET /` returns 200 in dev compile, `npx tsc --noEmit` passes with no errors. Tested at desktop (1440px) and mobile (360px); tabs appear and switch correctly, panels each maintain internal scroll.

### Done when
A teammate clones the repo, runs `npm install && npm run dev` inside `frontend/`, opens `localhost:3000`, and sees the two-panel layout with the header strip — no agent calls, no errors. ✅

---

## F2 — Chat + Token Streaming

> **Target:** EOD Day 2 · **Protocols:** AG-UI · CopilotKit

### What it is
The chat input on the left actually talks to the Planner Agent. When the user submits a question, tokens stream into the answer bubble character by character.

### Why it matters
This is the moment the protocol stack becomes real. The chat input talks to the Planner Agent over `POST /agent`, which streams an AG-UI event sequence over SSE. The frontend must consume that stream and render `TEXT_MESSAGE_CONTENT` deltas one at a time — a normal `fetch().json()` would defeat the entire point of the AG-UI protocol. CopilotKit's `<CopilotChat>` does most of this for us if we point it at the right runtime URL; our job is wiring + styling + error paths.

### Sub-tasks
- ✅ **F2.1** `lib/env.ts` reads `NEXT_PUBLIC_AGENT_URL` and falls back to `/api/mock-planner`. Add `frontend/.env.local` with `NEXT_PUBLIC_AGENT_URL=/api/agent` once B3 ships and we add the proxy route.
- ✅ **F2.2** `lib/agui-types.ts` — typed mirror of `contracts/{planner_request,state_delta,tools}.py` plus a discriminated union `AnyAgentEvent` with per-type payloads. Activity log and chat consume this — no string-typed events anywhere.
- 🟡 **F2.3** Pending B3 — once the real Planner Agent is reachable on `:8000`, add `app/api/agent/route.ts` as a same-origin proxy so the browser doesn't hit cross-origin SSE. For now `AGENT_URL` points straight at `/api/mock-planner`.
- ⛔ **F2.4** Deferred. We are NOT using `<CopilotChat>` — our hand-rolled chat panel gives full styling control and consumes AG-UI events directly via `useAgentStream`. The CopilotKit React provider will be added if/when we need `useCopilotAction`-style frontend tool calls.
- ⛔ **F2.5** Deferred for the same reason as F2.4. Our `ChatPanel` / `ChatBubble` / `Composer` set already does everything `<CopilotChat>` does, themed correctly.
- ✅ **F2.6** Blinking caret rendered on assistant messages while `streaming === true`, finalized on `TEXT_MESSAGE_END`. Plus a separate `ThinkingBubble` between RUN_STARTED and TEXT_MESSAGE_START with animated dots and the live step label ("thinking…", "searching the web…", "writing answer…").
- ✅ **F2.7** Header status pill: `ready` (idle), `stream active` (between RUN_STARTED and RUN_FINISHED), `error` on RUN_ERROR. Same source of truth (`status` in app-state) drives the agent-flow card pulses and the composer's send→stop swap.
- ✅ **F2.8** RUN_ERROR surfaces an inline error card in the chat with the message text. `cancelRun()` (the composer's red Stop button while streaming) aborts the in-flight `fetch` cleanly; the streaming assistant bubble finalizes without blinking.
- ✅ **F2.9** Mock planner endpoint at `app/api/mock-planner/route.ts` — Next.js Route Handler streams the documented event sequence. F2/F3 are fully testable without the real B3 service.

### Done when
Typing a question into the chat and pressing Enter results in tokens appearing character-by-character in the answer bubble, with a visible typing cursor that disappears at the end. Disconnecting the backend surfaces a visible error with a retry.

---

## F3 — Agent Activity Panel

> **Target:** EOD Day 3 · **Protocol:** AG-UI

### What it is
The right-hand panel reacts to `STATE_DELTA` events from the Planner and shows: (a) which agent is currently active, (b) the current step label, (c) any tool calls currently running.

### Why it matters
This is the educational payload of the POC. Anyone watching the demo can *see* the protocol stack working: the active agent badge swaps from Planner → Search, the `web_search` MCP tool call lights up while it's running, then resolves to "done", and Planner resumes to synthesize the answer. Without this panel the POC is indistinguishable from any other chatbot; with it, the multi-agent coordination becomes legible to a non-technical viewer. This panel is the difference between "we built a chatbot" and "we built a tour of the agent protocol stack".

### Sub-tasks
- ☐ **F3.1** Pick the subscription mechanism — CopilotKit's shared-state hook if available by the time we get here, otherwise a thin custom EventSource subscription against the proxied runtime URL from F2.3. Document the choice at the top of `useAgentState.ts`. *Fits in: this is the data source for everything else in F3.*
- ☐ **F3.2** Build `hooks/useAgentState.ts` — accumulates `STATE_SNAPSHOT` + `STATE_DELTA` (JSON Patch) into a single typed `AgentState = { active_agent: "planner" | "search" | "idle", step: string, tool_calls: ToolCall[] }`. Returns the latest state to React. *Fits in: isolates protocol noise from rendering — the components below only see clean state.*
- ☐ **F3.3** Build `components/AgentBadge.tsx` — small pill with a colored dot per agent (🔵 Planner / 🟡 Search / ⚪ Idle, per the README mock). Active agent is filled; inactive is faded. *Fits in: at-a-glance answer to "who's working right now?".*
- ☐ **F3.4** Build `components/StepTimeline.tsx` — vertical list of `STEP_STARTED`/`STEP_FINISHED` entries with a small timestamp. The current step has a spinner; completed steps have a checkmark. *Fits in: shows the temporal sequence of the multi-agent flow.*
- ☐ **F3.5** Build `components/ToolCallCard.tsx` — one card per active or recent tool call. Shows tool name (`web_search`), the query string from the args, a "Running…" pill with an animated spinner while `status === "running"`, and a "Done" checkmark when `status === "done"`. *Fits in: this is the moment the MCP protocol becomes visible to the user.*
- ☐ **F3.6** Compose them in `ActivityPanel.tsx`: header with two `AgentBadge`s · middle: `StepTimeline` · bottom: list of `ToolCallCard`s. Use shadcn/ui `<ScrollArea>` for the timeline. *Fits in: replaces the F1.8 placeholder with the real panel.*
- ☐ **F3.7** Empty state when `active_agent === "idle"` — short placeholder card explaining what will appear once the user asks a question. References the README. *Fits in: prevents the panel from looking broken before the first run.*
- ☐ **F3.8** Auto-scroll the timeline to the latest step; pause auto-scroll if the user has scrolled up (resume after they scroll back to bottom). *Fits in: usability detail that makes long runs watchable.*
- ☐ **F3.9** Reset cleanly between runs — when `RUN_STARTED` arrives with a new run id, clear the previous run's steps and tool calls. *Fits in: without this, the panel accumulates stale data across multiple questions.*
- ☐ **F3.10** Final visual polish — subtle fade-in on new steps, color transitions on agent badge swaps, consistent spacing. *Fits in: this is the screen on the Loom recording; it has to look intentional.*

### Done when
A user submits a question and the right panel visibly reacts: Planner badge activates → step "Delegating to Search Agent" appears → Search badge activates → a `web_search` tool call card appears in "Running" state → tool call resolves to "Done" → Planner badge re-activates → step "Writing answer" appears → chat tokens stream in alongside.

---

## Cross-cutting tasks

- ☐ **C1** `frontend/README.md` — quickstart: prereqs (Node 20+, the backend services), install steps, env vars, link back to the root README and to this PROGRESS.md.
- ☐ **C2** Accessibility pass — keyboard focus into the chat input on mount, ARIA `aria-live="polite"` on the activity panel so screen readers announce step changes, sufficient contrast on all status colors.
- ☐ **C3** Pre-demo checklist — clear `localStorage`/state between runs, hide any debug logs, set `<title>` to "Two-Agent Research Assistant", check that the demo flow lands cleanly inside one screen recording frame.
- ☐ **C4** Loom-prep test run with the full stack via `docker compose up` (depends on Task I2) — script the demo question and walk through both panels.

---

## Open questions / blockers

Running list — add a line as soon as something blocks you, remove it when resolved.

- _none yet — add the first one here_

---

## Definition of Done (frontend slice of the root README)

- [ ] User types a question, tokens stream into the chat bubble in real time (F2)
- [ ] Agent Activity panel shows which agent is active and what step it's on (F3)
- [ ] Tool call indicator visible while `web_search` is running (F3)
- [ ] Frontend `README.md` with setup instructions committed (C1)
