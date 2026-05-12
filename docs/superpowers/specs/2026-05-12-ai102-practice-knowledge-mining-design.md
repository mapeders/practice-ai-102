# AI-102 practice — add knowledge-mining topic (+50 questions)

**Date:** 2026-05-12
**Status:** Approved for planning
**Goal:** Add a fifth topic, `knowledge-mining`, to `practice2.html` with 50 questions split evenly between Azure AI Search and Azure AI Document Intelligence. Brings the pool from 200 to 250 questions and covers 5 of the 6 official AI-102 exam topics.

## Why this expansion

The user's score report ranks knowledge mining as the 5th-weakest bar (only NLP was stronger). After three rounds of expansion concentrated on the four weakest topics, knowledge mining is the next highest expected point-gain area on a retake. Microsoft's AI-102 exam outline gives "Implement knowledge mining and information extraction solutions" a 15-20% weight — proportionally significant — and the topic crosscuts two distinct Azure AI services (AI Search and Document Intelligence) that share content but have different exam-relevant surfaces.

NLP is intentionally still excluded (top score on the report; lowest point-gain per question).

## Scope

**In scope:**
- Add one new topic `knowledge-mining` to `TOPICS`, `TOPIC_WEIGHTS`, and the validator whitelist.
- Add 50 questions (ids 201-250).
- 25 questions on Azure AI Search (ids 201-225).
- 25 questions on Azure AI Document Intelligence (ids 226-250).

**Out of scope:**
- NLP topic (intentionally excluded — strongest area on score report).
- Schema, renderer, persistence, or mixed-mode logic changes.
- Per-topic results breakdown, exam-mode timer, automated test suite — same exclusions as prior rounds.
- Rewriting any of the existing 200 questions.
- Storage migration. Existing localStorage key `ai102-practice-v2` is preserved.

## Target deltas

| Topic | Current | Target | Delta | ID range |
|---|---|---|---|---|
| `agentic` | 50 | 50 | 0 | — |
| `genai-foundry` | 50 | 50 | 0 | — |
| `computer-vision` | 50 | 50 | 0 | — |
| `plan-and-manage` | 50 | 50 | 0 | — |
| `knowledge-mining` (new) | 0 | 50 | +50 | 201-250 |
| **Total** | **200** | **250** | **+50** | |

**Sub-area split:**
- **Agent E1 — Azure AI Search (25, ids 201-225):** indexes & indexer pipelines, skillsets (built-in + custom), knowledge store, integrated vectorization, vector / hybrid / semantic queries, RAG patterns with AI Search, scoring profiles & analyzers.
- **Agent E2 — Document Intelligence (25, ids 226-250):** prebuilt models (invoice, receipt, ID, business card, layout, read), custom extraction models, custom classifiers, training & evaluation, signature / table / checkbox extraction, composed models.

**Sub-area boundary rule (critical to avoid agent overlap):** E1 only writes about Document Intelligence when it appears as an AI Search skillset wrapper or as input to a search index. E2 owns the Document Intelligence service itself (its endpoints, SDKs, model training UX, prebuilt model fields). If a question would belong equally to both, default to the service-owning agent (E2 for "what does the prebuilt invoice model return"; E1 for "how do you wire Document Intelligence outputs into an AI Search skillset").

**Quality floor (per sub-area, post-validation):** ≥22 accepted each (so ≥44 of 50). If a sub-area falls below floor after one re-dispatch round, accept the lower count rather than fabricate — same quality-first stance as prior rounds.

**Type mix per agent (target, ±2 each):** ~15 mc_single, ~1-2 mc_multi, ~5 sequence, ~3-4 hotspot. Across the full 50: ~30 mc_single, ~2-3 mc_multi, ~10 sequence, ~7-8 hotspot. Matches the existing pool's ratios.

## Source material

Primary sources:
- **AI Search:** `https://learn.microsoft.com/en-us/training/paths/implement-knowledge-mining-azure-ai-search/` (training path), supplemented by product docs at `https://learn.microsoft.com/en-us/azure/search/` — especially for integrated vectorization and vector/hybrid/semantic search which evolve faster than training content.
- **Document Intelligence:** `https://learn.microsoft.com/en-us/training/paths/extract-information-from-text-documents-azure-ai-document-intelligence/` (or current canonical), supplemented by product docs at `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/`.

All training-module unit pages fetched as `?pivots=text`. Product docs typically don't accept the pivot param — fetch without the suffix for those.

**No dedup brief needed** — this is a new topic with no existing questions to dedupe against.

## Architecture

No architectural change. Single static HTML file `practice2.html`. Code-level changes localised to three places:

1. **`TOPICS` array** (currently lines 2499-2508): append one entry.
2. **`TOPIC_WEIGHTS` map** (currently lines 2509-2514): append one entry.
3. **Validator topic whitelist** (currently line 2528): extend from four ids to five.

Plus: the `RAW_QUESTIONS` array grows by 50 entries (ids 201-250).

### Updated `TOPICS` (illustrative)

```js
const TOPICS = [
  { id: "agentic",         title: "Implement an agentic solution",
    weight: "5-10%",   subtitle: "Foundry Agent Service, tools, RAG, multi-agent" },
  { id: "genai-foundry",   title: "Implement generative AI solutions (Foundry)",
    weight: "15-20%",  subtitle: "Model catalog, Prompt Flow, Responses API, content filters" },
  { id: "computer-vision", title: "Implement computer vision solutions",
    weight: "10-15%",  subtitle: "Image, video, face, OCR — exam priority: video" },
  { id: "plan-and-manage", title: "Plan and manage an Azure AI solution",
    weight: "20-25%",  subtitle: "Provisioning, RBAC, monitoring, networking, content safety" },
  { id: "knowledge-mining", title: "Implement knowledge mining and information extraction solutions",
    weight: "15-20%",  subtitle: "Azure AI Search, Document Intelligence, RAG/vector, custom skills" },
];

const TOPIC_WEIGHTS = {
  "agentic": 7.5,
  "genai-foundry": 17.5,
  "computer-vision": 12.5,
  "plan-and-manage": 22.5,
  "knowledge-mining": 17.5,
};
```

### Schema unchanged

Question schema, per-type fields, renderers, graders, persistence — all unchanged. New questions follow the same shape, just with `topic: "knowledge-mining"`.

## Data flow

### Build pipeline (one-time)

```
[1] Pre-flight — verify existing pool integrity
    - Confirm 200 questions, ids 1..200 unique
    - Confirm four topics × 50
    - Confirm new topic id NOT already present in pool
    - max(id) = 200 → id-offset for new questions = 201

[2] Compose URL list build/url-list-v4.json
    - Enumerate AI Search training-path units (+ product-doc pages for vector/integrated vectorization)
    - Enumerate Document Intelligence training-path units (+ product-doc pages where training is thin)
    - Tag each URL with sub-area (search or di)
    - Sanity-check: ≥10 URLs per sub-area

[3] Apply the 3 code changes to practice2.html
    - TOPICS: append knowledge-mining entry
    - TOPIC_WEIGHTS: append knowledge-mining: 17.5
    - Validator whitelist: add 'knowledge-mining'
    - Browser-verify: 5th topic card renders (disabled, "no questions yet")
    - Commit (separately from question injection so a bad chunk doesn't block the topic plumbing)

[4] Dispatch 2 parallel subagents — one per sub-area — in a single message
    - Agent E1 (AI Search):       ids 201..225, target 25, URL list E1, boundary rule
    - Agent E2 (Document Intel.): ids 226..250, target 25, URL list E2, boundary rule
    - Each agent given: full schema, its URL list, id range, type-mix target, quality rules, boundary rule (own topic: "knowledge-mining")

[5] Validate each chunk
    - JSON parses
    - All required fields per type
    - source.url ∈ agent's assigned URL list (catches hallucinated citations)
    - No id collisions
    - Floor check (≥22)
    - Type-mix check (±2 of target)
    - Boundary check (spot-read 3-5 per chunk for sub-area discipline)

[6] Re-dispatch any chunk below floor or with boundary violations
    - One re-dispatch round only; after that, accept under-target

[7] Merge validated chunks
    - Build merged-v4.json from chunk-search-v4.json + chunk-di-v4.json
    - Append to RAW_QUESTIONS in practice2.html before its closing ];

[8] Smoke-read merged file
    - Counts by topic (expect 50/50/50/50/50)
    - id range continuous 1..250
    - All source URLs are learn.microsoft.com
```

### Runtime (unchanged)

`loadState` → `renderHome` → click topic / mixed / wrong-queue → `renderPractice` → per-type render → submit → grade → feedback panel → advance / end → `renderResults`. Identical to today.

## Persistence

**No storage migration.** Storage key stays `ai102-practice-v2`. New questions appear as additional keys in `results` once the user answers them; existing 200 entries' results carry over untouched.

Falls back to in-memory state if `localStorage` throws (existing pattern).

## UI changes

- **Home view:** fifth topic card appears automatically from the extended `TOPICS` array. Subtitle rendering already in place from v2 round.
- **Mixed mode:** weights re-normalize automatically (sum becomes 77.5; sampling distribution shifts proportionally). No copy change required — current "Mixed — random across all topics" still accurate.
- **Wrong queue, results screen:** unchanged.
- **No new question types, no new renderers, no new graders.**

## Error handling

Inherited from existing app, unchanged.

Build-pipeline-specific (same as prior rounds):

- **`WebFetch` failure on a unit URL** → agent skips that unit, produces from remaining URLs.
- **Agent returns invalid JSON** → re-dispatched once with parse error.
- **Hallucinated source URL** (validation catches `source.url ∉ assigned list`) → entry rejected; counted against the chunk's floor.
- **Sub-area boundary violation** → spot-check during validation; chunk re-dispatched if >3 cross-domain violations per 25-question chunk.

## Testing

Same regime — single-file static app, no automated test framework:

- **Build-time:** schema validator + topic/url/id checks before injecting into the file.
- **Smoke-read post-build:** human read of file structure (top/middle/bottom), counts by topic.
- **User-validated:** first practice session after delivery — render correctness, fifth topic card layout, mixed-mode distribution feel.

Runtime `renderPractice` try/catch ensures one bad question doesn't kill the session.

## Risks

1. **Topic plumbing broken if any of the three code changes is missed.** If `TOPICS` is updated but the validator whitelist is not, all 50 new questions get filtered out at load time and the topic card shows "no questions yet" with no obvious reason. *Mitigation:* the build pipeline applies the three code changes in step 3 and browser-verifies the new card renders BEFORE generating questions — this catches whitelist/TOPICS mismatches early. Smoke-read at step 8 verifies the per-topic count.

2. **Sub-area boundary drift between E1 and E2.** Document Intelligence content can legitimately appear in AI Search skillsets, creating overlap risk. *Mitigation:* explicit boundary rule in each agent's prompt (service ownership default); validation spot-check flags any chunk with >3 cross-domain violations and triggers re-dispatch.

3. **Integrated vectorization is fast-moving.** The AI Search training path may lag the product docs on vector / hybrid / semantic search. *Mitigation:* E1 is permitted (and encouraged) to source up to 8 of its 25 questions from product-doc pages (`learn.microsoft.com/en-us/azure/search/vector-search-*`), with the validator's URL allowlist explicitly including these.

4. **Quality-first means we may end with 44 questions instead of 50.** Acceptable per the prior stance. Floors guarantee ≥22 accepted per sub-area.

5. **5-topic mixed mode distribution may feel different.** With KM at 17.5 weight, mixed sessions will now devote ~22% of questions to KM. *Mitigation:* this is the correct exam-weighted behaviour; user can still target the topic directly or use Mixed-mode at will. No code change.

## Open questions

None at design approval. Implementation plan to follow.
