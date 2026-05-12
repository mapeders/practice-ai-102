# AI-102 practice — +20 to computer-vision and plan-and-manage

**Date:** 2026-05-12
**Status:** Approved for planning
**Goal:** Extend `practice2.html` by adding 20 questions each to the `computer-vision` and `plan-and-manage` topics, taking the pool from 160 to 200. Reinforces the two weak topics that produced the smallest existing question counts (30 each) without disturbing the well-covered `agentic` and `genai-foundry` topics (50 each).

## Why this expansion

Following the 2026-05-12 expansion to 160 questions, the two newly-added topics (`computer-vision`, `plan-and-manage`) sit at 30 questions apiece — half the depth of the two reinforced topics. The user wants more practice depth in these two areas before the AI-102 retake. Both were among the four weakest bars on the 2026-05-07 score report, and `plan-and-manage` is the largest exam slice (20-25%). This is a top-up only — same mix, more depth.

## Scope

**In scope:**
- Add 20 questions to `computer-vision` (ids 161-180).
- Add 20 questions to `plan-and-manage` (ids 181-200).
- Pre-flight dedup briefing built from the existing 30 questions per topic, given to each subagent as a "do not re-cover" list.
- Post-hoc near-duplicate scan against the existing pool as a backstop.

**Out of scope:**
- Any questions for `agentic` or `genai-foundry`.
- Schema, validator, `TOPICS`, `TOPIC_WEIGHTS`, or UI changes — all already in place from the prior round.
- Per-topic results breakdown, exam-mode timer, automated test suite — same exclusions as the prior spec.
- Rewriting any of the existing 160 questions (top-up only).
- Storage migration. Existing localStorage key `ai102-practice-v2` is preserved; new question ids are additional `results` entries.

## Target deltas

| Topic | Current | Target | Delta | ID range |
|---|---|---|---|---|
| `agentic` | 50 | 50 | 0 | — |
| `genai-foundry` | 50 | 50 | 0 | — |
| `computer-vision` | 30 | 50 | +20 | 161-180 |
| `plan-and-manage` | 30 | 50 | +20 | 181-200 |
| **Total** | **160** | **200** | **+40** | |

**Quality floor (per topic, post-validation, totals including existing 30):** computer-vision ≥48 total (so ≥18 new accepted), plan-and-manage ≥48 total (so ≥18 new accepted). If a topic falls below floor after one re-dispatch round, accept the lower count rather than fabricate — same quality-first stance as the prior spec.

**Sub-area mix (per topic):**
- **Computer-vision (20):** 6-7 video-focused (Video Indexer, video frames, spatial-on-video, video content moderation), 13-14 spread across image analysis 4.0, Face API including liveness, OCR/Read API, custom vision / image classification. Maintains the prior round's ~33% video share.
- **Plan-and-manage (20):** AI-services-only discipline strict. Coverage spread across provisioning (multi-service vs single-service accounts, regions, SKUs), endpoints & keys, RBAC + managed identity for AI workloads, networking (private endpoints, CMK for AI), monitoring (diagnostic settings, App Insights for AI services), content safety configuration. No hard per-bucket quotas — the discipline (AI-services-specific) and the dedup brief (which buckets are thin in the existing 30) together drive the spread. Generic Azure platform trivia excluded.

**Type mix (per topic, ±2 of target):** ~12 mc_single, ~1 mc_multi, ~4 sequence, ~3 hotspot. Matches existing ratios.

## Source material

Same Learn paths as the prior round, with URL lists biased toward units the prior batch under-used:

1. **Computer vision (+20)** — primary: `https://learn.microsoft.com/en-us/training/paths/develop-computer-vision-solutions-azure/`. Up to 5 of 20 may come from `https://learn.microsoft.com/en-us/azure/azure-video-indexer/` documentation pages to support the video-bias target. URL list built by cross-referencing the source URLs of the existing 30 CV questions and favoring units with low or zero hits.
2. **Plan-and-manage (+20)** — primary: `https://learn.microsoft.com/en-us/training/paths/prepare-develop-ai-solutions-azure/` plus cross-cutting "Get started with Azure AI Services" content. Up to 5 may come from `https://learn.microsoft.com/en-us/training/modules/responsible-ai-studio/` for governance content. URL list built the same way — favor units under-used by the existing 30.

All unit pages fetched as `?pivots=text` for stable scraping (existing pattern).

**Plan-and-manage focus discipline (unchanged from prior spec):** every question must be tied to AI-services-specific concerns. Generic Azure trivia (e.g. generic Azure RBAC mechanics, generic VNet design) is excluded; questions must clearly belong on an AI-102 exam.

## Architecture

No architectural change. The only file touched is `practice2.html`, and only the `RAW_QUESTIONS` array grows by 40 entries.

Already in place from the prior round and **not** modified this time:
- `TOPICS` array (line 2499) — both topics already present with subtitles.
- `TOPIC_WEIGHTS` map (line 2509) — both topics already weighted.
- Validator topic whitelist (line 2528) — already accepts both topics.
- Renderers, graders, persistence, error handling — unchanged.

### Schema unchanged

New questions follow the existing shape — `id`, `topic`, `type`, `question`, `options` / `items` / `blanks` per type, `correct` / `correct_order`, `explanation`, `source` with `url` / `path` / `module` / `unit`.

## Data flow

### Build pipeline (one-time)

```
[1] Verify existing pool integrity
    - Read practice2.html
    - Parse out RAW_QUESTIONS array
    - Confirm 160 entries, ids 1..160 unique
    - max(id) = 160 → id-offset for new questions

[2] Build pre-flight dedup briefing
    - For each of computer-vision and plan-and-manage:
      - Extract the existing 30 questions
      - Produce compact list: sub-area tag + question stem fragment + source URL
      - ~30-60 lines per topic
    - This becomes the "do not re-cover" briefing for the corresponding subagent

[3] Compose URL lists
    - For each topic, cross-reference source URLs of existing 30 questions
    - Favor Learn units with low or zero hits in the existing pool
    - Tag each URL with its target topic

[4] Dispatch 2 parallel subagents in a single message
    - Agent C2 (computer-vision): ids 161..180, target 20, video-bias instruction,
                                  dedup brief CV, URL list C2
    - Agent D2 (plan-and-manage): ids 181..200, target 20, AI-services-only discipline,
                                  dedup brief PM, URL list D2
    - Each agent given: full schema, its URL list, id range, per-type mix target,
                        sub-area mix target, quality rules, dedup brief

[5] Validate each chunk independently
    - JSON parses
    - All required fields per type
    - source.url ∈ agent's assigned URL list  (catches hallucinated citations)
    - No id collisions with existing 1..160 or within the chunk
    - Topic-count floor check (≥18)
    - Type-mix check (±2 of target)
    - Sub-area mix check (CV only: video 6-7 of 20 within ±2; PM has no hard sub-bucket quota — verify only that the AI-services discipline is met and the dedup brief's thin buckets are addressed)
    - Near-duplicate scan: simple stem-overlap check against existing 30 of the same topic;
      reject entries with high overlap

[6] Re-dispatch any agent below floor or with malformed output
    - Provide parse error / count gap / type-mix gap / dedup rejections explicitly
    - One re-dispatch round only; after that, accept under-target (quality-first)

[7] Merge validated chunks
    - Append to RAW_QUESTIONS array in practice2.html
    - No other code changes

[8] Smoke-read merged file
    - Top, sampled middle, bottom of RAW_QUESTIONS
    - Counts by topic (expect 50/50/50/50)
    - Open in browser: confirm topic cards render, sample one new question per topic
```

### Runtime (unchanged)

`loadState` → `renderHome` → click topic / mixed / wrong-queue → `renderPractice` → per-type render → submit → grade → feedback panel → advance / end → `renderResults`. Identical to today.

## Persistence

**No storage migration.** Storage key stays `ai102-practice-v2`. New questions appear as additional keys in `results` once the user answers them; the existing 160 entries' results carry over untouched. The wrong-queue continues to reference ids it already contains; new wrong answers add ids ≥161.

Falls back to in-memory state if `localStorage` throws (existing pattern).

## UI changes

None. The two topic cards already render from the existing `TOPICS` array. Mixed-mode sampling already respects `TOPIC_WEIGHTS`. Wrong queue and results screen unchanged.

## Error handling

Inherited from existing app, unchanged. Build-pipeline-specific (same as prior spec):

- **`WebFetch` failure on a unit URL** → agent skips that unit, produces from remaining URLs.
- **Agent returns invalid JSON** → re-dispatched once with parse error. After second failure, accept whatever validated.
- **Hallucinated source URL** → entry rejected; counted against the chunk's floor.
- **Near-duplicate detected** → entry rejected; counted against the chunk's floor.

## Testing

Same regime — single-file static app, no automated test framework:

- **Build-time:** schema validator + topic/url/id/dedup checks before injecting into the file.
- **Smoke-read post-build:** human read of file structure (top/middle/bottom), counts by topic.
- **User-validated:** first practice session after delivery — render correctness, mixed-mode distribution feel, no near-duplicates surfacing back-to-back.

Runtime `renderPractice` try/catch ensures one bad question doesn't kill the session.

## Risks

1. **Duplication with existing pool.** The existing 30 questions per topic already cover the most prominent sub-areas; a naive top-up risks producing close paraphrases. *Mitigation:* pre-flight dedup briefing + URL lists biased toward under-used Learn units + post-hoc stem-overlap scan as backstop. If dedup rejection eats too much of the chunk, the re-dispatch round provides recovery.

2. **Plan-and-manage drift toward generic Azure trivia.** Same risk as prior round; same mitigation — explicit AI-services-only discipline rule in agent D2's prompt; smoke-read flags any question that could appear on any non-AI Azure exam.

3. **Computer-vision video sub-coverage thin in main Learn path.** Same risk and mitigation as prior round — agent C2 may source up to 5 from `azure-video-indexer/` docs.

4. **Quality-first means we may end with 36 questions instead of 40.** Acceptable per prior stance. Floors guarantee ≥18 accepted per topic.

## Open questions

None at design approval. Implementation plan to follow.
