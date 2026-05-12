# AI-102 practice.html — focused rebuild

**Date:** 2026-05-10
**Status:** Approved for planning
**Goal:** Replace `practice.html` with a focused practice app covering the user's two weakest AI-102 areas — Implement an agentic solution and Implement generative AI solutions (Foundry) — using questions grounded in current Microsoft Learn content.

## Why this rebuild

The user is preparing to retake AI-102. The score report shows weak performance on agentic solutions (~25%) and generative AI Foundry (~30-35%) and strong performance on NLP, knowledge mining, computer vision, plan-and-manage. The existing `practice.html` is heavy on legacy dump content (LUIS, older Cognitive Services patterns), with question counts skewed toward already-strong topics. Microsoft has rebranded "Azure AI Foundry" to "Microsoft Foundry"; the agent-related exam content has changed recently and stale dumps are actively misleading.

A clean-slate rebuild focused on the two weak topics, sourced from current Microsoft Learn paths, is the most direct way to close the gap.

## Scope

**In scope:**
- Replace `practice.html` with a new single-file app.
- New question pool: ~30 agentic + ~30 generative-AI/Foundry = ~60 total.
- All questions sourced from Microsoft Learn unit pages (text-pivot form: `?pivots=text`).
- Question types: MC-single, MC-multi, sequence (drag-to-order rewritten as up/down buttons), hotspot (multiple labeled dropdowns).
- Topic cards (2: agentic + genai-foundry), mixed mode (drawing from both), wrong-answer queue, localStorage progress (existing patterns retained).
- Per-question source attribution (path → module → unit → URL) shown on the feedback panel.

**Out of scope:**
- Other four topics (NLP, knowledge mining, computer vision, plan-and-manage). User has a copy of the previous file elsewhere if needed.
- Exam-mode timer.
- Per-objective stats breakdown.
- Server-side anything; this remains a single static HTML file.
- Automated test suite; smoke-tested by reading the file and using it.

## Source material

Two Microsoft Learn paths:

1. **Develop generative AI apps on Microsoft Foundry** — `https://learn.microsoft.com/en-us/training/paths/develop-generative-ai-apps/`
   - Covers model catalog, deployment, evaluation, prompt flow, Responses API, content filters.
2. **Develop AI Agents on Azure** — `https://learn.microsoft.com/en-us/training/paths/develop-ai-agents-azure/`
   - Covers Foundry Agent Service, Microsoft Agent Framework, RAG for agents, Foundry IQ, multi-agent solutions, MCP integration.

A small number of additional units may be sourced from the responsible-AI module (`https://learn.microsoft.com/en-us/training/modules/responsible-ai-studio/`) since content filters and safety are exam-tested under the gen-AI objective. Cap: at most 5 questions out of the 30 genai-foundry questions may come from this module.

Unit pages are fetched in their text-pivot form (`?pivots=text`) for stable scraping.

## Architecture

Single static HTML file: `practice.html`. Tailwind via CDN. Inline `<script>`. Three views switched via `[data-view]` classes: home, practice, results.

```
practice.html
├── <head>: Tailwind CDN, minimal style overrides
├── <header>: title, reset button
├── <main>
│   ├── <section data-view="home">    — topic cards + mixed + wrong-queue
│   ├── <section data-view="practice"> — one question at a time
│   └── <section data-view="results">  — score summary + redo wrong
└── <script>
    ├── QUESTIONS = [...]              — generated, ~60 entries
    ├── TOPICS = [...]                 — 2 entries
    ├── State (localStorage I/O)
    ├── Renderers: renderHome, renderPractice, renderResults
    ├── Per-type renderers: renderMCSingle, renderMCMulti, renderSequence, renderHotspot
    ├── Per-type graders: gradeMC, gradeSequence, gradeHotspot
    └── Helpers: shuffle, escapeHtml, sameSet
```

### Question schema

Common fields on every question:

```js
{
  id: 1,                               // sequential int, unique
  topic: "agentic" | "genai-foundry",
  type: "mc_single" | "mc_multi" | "sequence" | "hotspot",
  question: "...",                     // body text, may include code blocks; rendered via <pre>
  explanation: "...",                  // shown after grading; cite Learn unit content
  source: {
    path: "Develop AI Agents on Azure",
    module: "Build agents with Azure AI Foundry Agent Service",
    unit: "Add tools to your agent",
    url: "https://learn.microsoft.com/.../?pivots=text"
  }
}
```

Per-type fields:

```js
// mc_single (correct.length === 1) and mc_multi (correct.length >= 2)
{ options: [{ id: "A", text: "..." }, ...], correct: ["A"] }

// sequence
{ items: [{ id: "S1", text: "Create the project" }, ...],
  correct_order: ["S1", "S2", "S3", "S4"] }

// hotspot — multiple labeled dropdowns embedded in a scenario
{ blanks: [
    { id: "B1", prompt: "Authentication method",
      options: [{ id: "a", text: "Managed identity" }, ...],
      correct: "a" },
    ...
] }
```

### Renderers

Each per-type renderer owns a single question type. They write into `#view-practice` and call into a shared submit path with a single boolean (`correct`) and a typed `picked` value for persistence.

- **renderMCSingle:** options as buttons; tap → grade immediately, no submit button.
- **renderMCMulti:** options as toggle buttons; submit enables when ≥1 selected; grade via `sameSet(picked, correct)`.
- **renderSequence:** items rendered shuffled, each row has up/down buttons that swap with neighbours. Submit always enabled. Grade by comparing `currentOrder === correct_order`. On wrong, each row shows green/red and "should be position N" hint on misplaced rows. Buttons (not HTML5 drag) so it works on touch and keyboard with no library.
- **renderHotspot:** question text above; a list of labeled rows below, each with a `<label>` and a `<select>`. Submit enables when every blank has a chosen value. Grade blank-by-blank; whole question is correct only if every blank is correct (mirrors how MS Learn scores hotspot).

### Graders

Pure functions, data-only. The render layer calls one of them and is otherwise unaware of question shape:

```js
gradeMC(q, picked: string[]) → boolean
gradeSequence(q, order: string[]) → boolean
gradeHotspot(q, picks: { [blankId: string]: string }) → boolean
```

### Shared post-grade panel

Same look for all types:

- Banner: "Correct" (green) / "Wrong" (red)
- `explanation` text
- Source line: `📚 {path} → {module} → {unit}` linking to `source.url`
- Next button → advances cursor

### Persistence

Same shape as the previous file, new storage key to avoid mixing with old progress:

```js
localStorage["ai102-practice-v2"] = {
  results: {
    [qid]: { correct: bool, picked: <type-specific>, attempts: int, ts: number }
  },
  wrongQueue: [qid, ...]
}
```

`picked` is stored as the user submitted: `["A","C"]` for MC, `["S2","S1","S3","S4"]` for sequence, `{B1:"a", B2:"c"}` for hotspot. Stored as-is to keep options open for a future "show my answer vs. correct" view; not surfaced now.

Falls back to in-memory state if `localStorage` throws (private browsing).

## Data flow

```
Build pipeline (one-time, this session)
─────────────────────────────────────────
[1] Fetch Learn path index pages
        ↓ enumerates unit URLs for both paths
[2] Write practice.html scaffold
        - full UI for all 4 types
        - empty QUESTIONS = []
        - JSON schema in comment block
[3] Split unit URL list into 4 chunks (each chunk has both topics)
[4] Dispatch 4 parallel subagents in one message
        - each given: schema + URL list + id range + type-mix target
        - each returns: JSON array of validated questions
[5] Validate + merge
        - JSON parses
        - required fields present per type
        - source.url ∈ URLs given to that agent
        - no id collisions
        - type mix within ±2 of target
[6] Inject merged QUESTIONS into practice.html
[7] Manual smoke-read
        - count by topic ≈ 30/30
        - type mix as designed
        - no obviously malformed entries

Runtime (in browser, every session)
───────────────────────────────────
loadState()
    ↓
renderHome → topic card click → startTopic()
    ↓
renderPractice → render{Type}() → submitAnswer()
    ↓                                ↓
    ←──── advance() ←──── grade{Type}() + persist + show feedback panel
                                     ↓
                              session ends → renderResults()
```

## Build pipeline details

### Phase 1: scaffold (deterministic, in this session)

1. WebFetch the two Learn path index pages, plus the responsible-AI module page. Extract every unit URL. Tag each URL with its topic — `agentic` for units in `Develop AI Agents on Azure`, `genai-foundry` for units in `Develop generative AI apps on Microsoft Foundry` and the responsible-AI module.
2. Write `practice.html` with:
   - Three views, header, body, all event wiring
   - All four per-type renderers and graders fully implemented
   - `QUESTIONS = []` placeholder with the JSON schema documented in a leading comment block
   - `TOPICS = [{id:"agentic",...}, {id:"genai-foundry",...}]`
3. Smoke-load the empty file mentally — does the scaffold render the home view with two disabled topic cards? If yes, scaffold is done.

### Phase 2: question generation (parallel subagents)

Split unit URL list into 4 chunks of roughly equal size. Each chunk contains a mix of agentic and Foundry units. Each subagent receives:

- The exact JSON schema (copy from the file header)
- Its assigned URL list (typically 6-10 unit URLs)
- Its id range (e.g. agent 1 owns ids 1-15, agent 2 owns 16-30, etc.)
- Target: ~15 questions, mix ≈ 10 MC / 3 sequence / 2 hotspot
- Strict requirements:
  - Every question must cite a `source.url` taken from its own list
  - `explanation` must reflect what the unit actually says (no generic AI-102 trivia)
  - `correct` answers must be derivable from the unit content
  - No "all of the above" / "none of the above" distractors
  - Distractors should be plausible (other Foundry / Azure AI services, similar method names, near-miss configs)

Dispatch all four agents in a single message with `general-purpose` subagent_type so they run concurrently.

### Phase 3: merge + validate

For each returned chunk:

1. Parse JSON. If invalid → re-dispatch that single agent with the parse error in the prompt.
2. For every entry, verify all required fields per type (`type`, `topic`, `question`, `explanation`, `source.{path,module,unit,url}`, plus type-specific).
3. Verify `source.url` ∈ the URLs given to that agent. (Catches hallucinated URLs — high-value check given LLMs tend to confabulate citations.)
4. Verify no id collisions (chunked id ranges should make this impossible; verify).
5. Compute totals across the merged set:
   - **By topic:** at least 28 questions each for agentic and genai-foundry (target 30/30, floor 28/28). If under floor, re-dispatch the relevant agent for top-up.
   - **By type:** within ±2 of target (≈40 MC / ≈12 sequence / ≈8 hotspot). If a type is over-produced, re-dispatch the agent that over-produced to substitute (do not trim, since trimming risks falling below the topic floor).

Inject the merged `QUESTIONS` array into `practice.html`. Done.

### Phase 4: verification

Read the saved file, top + bottom + sampled middle, and confirm:

- Total ~60, by topic ~30/30
- Type mix within ±2 of target (≈40 MC / ≈12 sequence / ≈8 hotspot)
- No duplicate ids
- Source URLs all match the original Learn paths' domain (`learn.microsoft.com`)

## Error handling

- **Malformed question at load** → one-pass validator filters bad entries and logs to console; app still loads with the survivors.
- **Unknown `type`** → renderer dispatch throws; caught by a try/catch wrap in `renderPractice`; shows "this question failed to render — Skip" with an advance button. One bad question doesn't kill the session.
- **localStorage unavailable** → falls back to memory state (existing pattern).
- **No questions for a topic** → topic card disabled with "no questions yet" (existing pattern).
- **WebFetch failure during build** → if a single unit URL fails, the assigned subagent should skip it and still produce questions from the rest of its chunk; we accept slight under-target and rebalance in merge.

## Testing

Single-file static HTML app — no automated test framework. Verification is:

- Build-time: schema validator on the merged JSON before injecting into the file.
- Smoke-read: human read of file structure post-build.
- User-validated: first practice run after delivery; any visual/interaction bug shows up immediately.

If a question type is rendered with a runtime error during practice, the shared try/catch in `renderPractice` surfaces it as a skippable card so the session keeps moving.

## Open questions

None at design approval. Implementation plan to follow.
