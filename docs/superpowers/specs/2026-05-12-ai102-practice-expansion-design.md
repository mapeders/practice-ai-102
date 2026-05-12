# AI-102 practice — pool expansion + two new topics

**Date:** 2026-05-12
**Status:** Approved for planning
**Goal:** Expand the existing `practice2.html` question pool from 60 to ~160 questions, adding two new topic categories (computer vision and plan-and-manage) selected from score-report signal, while reinforcing the two existing weak areas (agentic, generative AI Foundry).

## Why this expansion

The user took AI-102 on 2026-05-07 and scored 672 (below the 700 pass mark). The score report identifies:

- **Weakest bars (in order):** agentic, generative AI Foundry, computer vision, plan-and-manage, knowledge mining, NLP.
- **Top-3 priority skills to retake:** Analyze videos, Create custom agents, Build generative AI solutions with Azure AI Foundry.

The existing `practice2.html` (60 questions, agentic + Foundry only) covers two of the three priority skills but leaves the third — Analyze videos, under computer vision — unaddressed. Plan-and-manage is the largest exam slice (20-25%) and was a mid-strength bar; it's high expected-point-gain territory.

This change adds the two missing topics and reinforces the two existing weak topics. Storage and UI shape are preserved so in-progress practice state survives.

## Scope

**In scope:**
- Add ~100 questions to the existing pool, ending at ~160 total.
- Add two new topics: `computer-vision` and `plan-and-manage`.
- Update the in-file validator's topic whitelist and add `TOPIC_WEIGHTS` entries.
- Add subtitles to topic cards for the two new topics.
- Bias computer-vision questions to include 8-10 questions on video analysis (Video Indexer, video frames, spatial analysis on video) since that's the named priority skill.

**Out of scope:**
- Per-topic results breakdown on the results screen (user chose minimal UI).
- Difficulty / topic filter on mixed mode.
- Rewriting any of the existing 60 questions (top-up only).
- Knowledge mining and NLP topics (strong on score report; not a point-gain target).
- Storage migration. Existing localStorage key `ai102-practice-v2` is preserved as-is; new question ids are simply additional keys in `results`.
- Exam-mode timer, server-side anything, automated test suite — all out as in prior spec.

## Target deltas

| Topic | Current | Target | Delta |
|---|---|---|---|
| `agentic` | 32 | ~50 | +18 |
| `genai-foundry` | 28 | ~50 | +22 |
| `computer-vision` (new) | 0 | ~30 | +30 |
| `plan-and-manage` (new) | 0 | ~30 | +30 |
| **Total** | **60** | **~160** | **+100** |

**Quality floor (per topic, post-validation — totals including the 60 existing):** agentic ≥48 total (so ≥16 new), genai ≥48 total (so ≥20 new), computer-vision ≥28 new, plan-and-manage ≥28 new. If a topic falls below floor after one re-dispatch round, accept the lower count rather than fabricate (quality-first stance confirmed in brainstorming).

**Type mix (per new question, per topic):** maintain existing ratio — roughly 60% mc_single, 5% mc_multi, 20% sequence, 15% hotspot. Within ±2 of target per topic.

## Source material

Four Learn paths, plus targeted supplemental modules:

1. **Agentic (+18)** — `https://learn.microsoft.com/en-us/training/paths/develop-ai-agents-azure/`. Bias toward gaps in current pool: Foundry IQ knowledge sources, multi-agent orchestration, MCP integration, agent tools (file search, code interpreter, function calling).
2. **Genai-Foundry (+22)** — `https://learn.microsoft.com/en-us/training/paths/develop-generative-ai-apps/`. Bias toward: model catalog & deployment options, Prompt Flow, Responses API, content filters, evaluation. Direct alignment with "Build generative AI solutions with Azure AI Foundry" priority skill. Up to 5 may come from the responsible-AI module (existing cap).
3. **Computer vision (+30, new)** — primary: `https://learn.microsoft.com/en-us/training/paths/develop-computer-vision-solutions-azure/` (or current equivalent). Up to 5 of 30 may come from `learn.microsoft.com/en-us/azure/azure-video-indexer/` documentation pages to cover the Analyze videos priority skill if the main training path's video coverage is thin. **Video bias:** 8-10 of the 30 must target video analysis (Video Indexer, video frames, spatial analysis on video, video moderation).
4. **Plan-and-manage (+30, new)** — primary: `https://learn.microsoft.com/en-us/training/paths/prepare-develop-ai-solutions-azure/` plus the cross-cutting "Get started with Azure AI Services" content. Up to 5 may come from `https://learn.microsoft.com/en-us/training/modules/responsible-ai-studio/` for governance content. Topic crosscuts more than the others; explicit broader sourcing allowance.

All unit pages fetched as `?pivots=text` for stable scraping (existing pattern).

**Plan-and-manage focus discipline:** every question for this topic must be tied to **AI-services-specific** concerns — provisioning AI-services resources (multi-service vs single-service accounts, regions, SKUs), endpoints & keys, RBAC & managed identity for AI workloads, networking (private endpoints, customer-managed keys for AI), monitoring (diagnostic settings, Application Insights for AI services), content safety configuration. Generic Azure platform trivia (e.g., generic Azure RBAC mechanics, generic VNet design) is excluded; questions must clearly belong on an AI-102 exam.

## Architecture

No architectural change. Single static HTML file `practice2.html`, Tailwind via CDN, inline `<script>`, three views (`home` / `practice` / `results`).

Code-level changes localized to three places in the existing file:

1. **`TOPICS` array** (currently line 2399): two entries appended.
2. **`TOPIC_WEIGHTS` map** (currently line 2403): two entries added matching the exam-weight midpoints.
3. **Validator topic whitelist** (currently line 2417): expanded from `['agentic','genai-foundry']` to include the two new topic ids.

Plus: the `RAW_QUESTIONS` array (the data block injected at file-load) grows by ~100 entries. No renderer, grader, persistence-shape, or session-flow changes.

### Updated `TOPICS` (illustrative)

```js
const TOPICS = [
  { id: "agentic",         title: "Implement an agentic solution",
    weight: "5-10%",  subtitle: "Foundry Agent Service, tools, RAG, multi-agent" },
  { id: "genai-foundry",   title: "Implement generative AI solutions (Foundry)",
    weight: "15-20%", subtitle: "Model catalog, Prompt Flow, Responses API, content filters" },
  { id: "computer-vision", title: "Implement computer vision solutions",
    weight: "10-15%", subtitle: "Image, video, face, OCR — exam priority: video" },
  { id: "plan-and-manage", title: "Plan and manage an Azure AI solution",
    weight: "20-25%", subtitle: "Provisioning, RBAC, monitoring, networking, content safety" },
];

const TOPIC_WEIGHTS = {
  "agentic": 7.5,
  "genai-foundry": 17.5,
  "computer-vision": 12.5,
  "plan-and-manage": 22.5,
};
```

Mixed-mode sampling weights then favor plan-and-manage (largest exam slice) and de-emphasize the smaller agentic slice — matches real exam distribution.

The `subtitle` field is new. If the existing `renderHome()` template doesn't reference `subtitle`, the change becomes either (a) add subtitle rendering in `renderHome()`, or (b) drop the field and bake subtitles into `title` as a `<br>`-separated string. Implementation-plan decision; either is fine.

### Schema unchanged

Question schema, per-type fields, renderers, graders, persistence — all unchanged. New questions follow the same shape, just with `topic: "computer-vision"` or `topic: "plan-and-manage"`.

## Data flow

### Build pipeline (one-time)

```
[1] Verify existing pool integrity
    - Read practice2.html
    - Parse out RAW_QUESTIONS / QUESTIONS array
    - Confirm 60 entries, ids 1..60 unique
    - max(id) = 60 → id-offset for new questions

[2] Fetch Learn path index pages
    - Develop AI Agents on Azure
    - Develop generative AI apps on Microsoft Foundry
    - Develop computer vision solutions in Azure
    - Prepare to develop AI solutions on Azure
    - Plus targeted supplements (responsible-AI module, video-indexer docs)
    - Tag each enumerated unit URL with its target topic

[3] Dispatch 4 parallel subagents — one per topic — in a single message
    - Agent A (agentic):         ids 61..78,    target 18, URL list A
    - Agent B (genai-foundry):   ids 79..100,   target 22, URL list B
    - Agent C (computer-vision): ids 101..130,  target 30, URL list C (video bias instruction)
    - Agent D (plan-and-manage): ids 131..160,  target 30, URL list D (AI-specific discipline instruction)
    - Each agent given: full schema, its URL list, id range, per-type mix target, quality rules

[4] Validate each chunk independently
    - JSON parses
    - All required fields per type
    - source.url ∈ agent's assigned URL list  (catches hallucinated citations)
    - No id collisions  (chunked ranges prevent this; double-check)
    - Topic-count floor check
    - Type-mix check (±2 of target)

[5] Re-dispatch any agent below floor or with malformed output
    - Provide parse error / count gap / type-mix gap explicitly in the re-dispatch prompt
    - One re-dispatch round only; after that, accept under-target (quality-first)

[6] Merge validated chunks
    - Append to RAW_QUESTIONS array in practice2.html
    - Update TOPICS array, TOPIC_WEIGHTS map, validator topic whitelist
    - Optionally update mixed-mode session size from 20 → 25 if pool growth justifies it (plan-time decision; current 20 still works)

[7] Smoke-read merged file
    - Top, sampled middle, bottom of RAW_QUESTIONS
    - Counts by topic
    - All four topic cards render on a quick browser open
```

### Runtime (unchanged)

`loadState` → `renderHome` → click topic / mixed / wrong-queue → `renderPractice` → per-type render → submit → grade → feedback panel → advance / end → `renderResults`. Identical to today.

## Persistence

**No storage migration.** Storage key stays `ai102-practice-v2`. New questions appear as additional keys in `results` once the user answers them; the existing 60 entries' results carry over untouched. The wrong-queue continues to reference ids 1..60 it already contains; new wrong answers add ids ≥61.

Falls back to in-memory state if `localStorage` throws (existing pattern).

## UI changes

Per the user's "minimal" choice in brainstorming:

- **Home view:** two additional topic cards appear automatically from the extended `TOPICS` array. Subtitle line under each title (small grey text) gives a one-phrase scope hint. The subtitle pattern is new; either add it to the existing `renderHome` card template or fold it into `title` — implementation-plan decision.
- **Header subtitle:** one-line copy update from agentic/Foundry-focused phrasing to a four-topic phrasing. Cosmetic.
- **Mixed mode:** behavior unchanged. Sampling automatically respects the new `TOPIC_WEIGHTS` map.
- **Wrong queue:** unchanged. Topic-agnostic by design.
- **Results screen:** unchanged. No per-topic breakdown in this iteration.
- **No new question types**, no new renderers, no new graders.

## Error handling

Inherited from existing app, unchanged:

- **Malformed question at load** → validator filters bad entries and logs to console; survivors render.
- **Unknown `type`** → renderer dispatch throws; caught by `renderPractice`'s wrap; surfaces as skippable card.
- **`localStorage` unavailable** → memory-only fallback.
- **Empty topic pool** → topic card disabled with "no questions yet" (already in code).

Build-pipeline-specific:

- **`WebFetch` failure on a unit URL** → agent skips that unit, produces from remaining URLs in its list. Slight under-target acceptable; re-dispatch round may recover.
- **Agent returns invalid JSON** → re-dispatched once with parse error. After second failure, that chunk's count is accepted at whatever validated.
- **Hallucinated source URL** (validation catches `source.url ∉ assigned list`) → entry rejected; agent re-dispatched once to refill.

## Testing

Same regime as before — single-file static app, no automated test framework:

- **Build-time:** schema validator + topic/url/id checks before injecting into the file.
- **Smoke-read post-build:** human read of file structure (top/middle/bottom), counts by topic.
- **User-validated:** first practice session after delivery — render correctness, topic-card layout, mixed-mode distribution feel.

Runtime `renderPractice` try/catch ensures one bad question doesn't kill the session.

## Risks

1. **Plan-and-manage drift toward generic Azure trivia.** The topic crosscuts platform concerns; an LLM generating questions can easily produce "what does Azure RBAC do?" when we need "how do you grant a Function App access to Azure AI Services using managed identity?" *Mitigation:* explicit AI-services-only discipline rule in agent D's prompt; reviewer pass during smoke-read flags any question that could appear on any non-AI Azure exam.

2. **Computer-vision video sub-coverage thin in main Learn path.** The training path's emphasis may be image-heavy. *Mitigation:* agent C is briefed that 8-10 of its 30 must be video-specific, and can source up to 5 from `azure-video-indexer/` docs if the training path's video coverage is shallow.

3. **Mixed-mode session at 20 may feel small relative to 160-question pool.** Practice sessions cycle through a narrow slice. *Mitigation:* easy one-line bump from 20 to 25 in the implementation plan if it feels thin during user-testing.

4. **Subtitle field requires `renderHome` change.** Minor — either add a subtitle render line in the card template or fold subtitles into `title` with a line break. Implementation-plan decides.

5. **Quality-first means we may end with 145 questions instead of 160.** This is acceptable per the user's confirmed stance: better fewer good questions than padded filler. Floors guarantee the practical minimum.

## Open questions

None at design approval. Implementation plan to follow.
