# AI-102 practice — add natural-language topic (+50 questions)

**Date:** 2026-05-12
**Status:** Approved for planning
**Goal:** Add the sixth and final topic, `natural-language`, to `practice2.html` with 50 questions split evenly between Azure AI Language and Azure AI Speech. Takes the pool from 250 to 300 questions and covers ALL 6 AI-102 exam topics.

## Why this expansion

This is the final expansion to complete AI-102 exam coverage. NLP was the user's strongest area on the 2026-05-07 attempt, which is why it was the last topic to be added — every prior round prioritised the four weakest bars (agentic, generative AI Foundry, computer vision, plan-and-manage) and then the next-weakest (knowledge mining). Adding NLP rounds out 6 of 6 topics so mixed-mode sampling matches the real exam's topic distribution, and dedicated practice in this topic remains useful for keeping the area sharp before retake even when expected point-gain is lower per question.

Microsoft's AI-102 exam outline gives "Implement natural language processing solutions" a 15-20% weight — proportionally similar to knowledge mining and generative AI.

## Scope

**In scope:**
- Add one new topic `natural-language` to `TOPICS`, `TOPIC_WEIGHTS`, the validator whitelist in `practice2.html`, and the `ALLOWED_TOPICS` constant in `build/validate-v2.js`.
- Add 50 questions (ids 251-300).
- 25 questions on Azure AI Language (ids 251-275).
- 25 questions on Azure AI Speech (ids 276-300).

**Out of scope:**
- Schema, renderer, persistence, or mixed-mode logic changes.
- Per-topic results breakdown, exam-mode timer, automated test suite — same exclusions as prior rounds.
- Rewriting any of the existing 250 questions.
- Storage migration. Existing localStorage key `ai102-practice-v2` is preserved.

## Target deltas

| Topic | Current | Target | Delta | ID range |
|---|---|---|---|---|
| `agentic` | 50 | 50 | 0 | — |
| `genai-foundry` | 50 | 50 | 0 | — |
| `computer-vision` | 50 | 50 | 0 | — |
| `plan-and-manage` | 50 | 50 | 0 | — |
| `knowledge-mining` | 50 | 50 | 0 | — |
| `natural-language` (new) | 0 | 50 | +50 | 251-300 |
| **Total** | **250** | **300** | **+50** | |

**Sub-area split:**
- **Agent F1 — Azure AI Language (25, ids 251-275):** text analytics (sentiment, key phrase extraction, named entity recognition, PII detection, language detection), Azure AI Translator, Conversational Language Understanding (CLU), custom question answering, custom text classification, custom NER.
- **Agent F2 — Azure AI Speech (25, ids 276-300):** speech-to-text (real-time + batch), text-to-speech, SSML, speech translation, custom speech (training), speaker recognition, speech recognition modes (dictation / conversation / interactive).

**Sub-area boundary rule:** F1 only writes about Speech when it appears as **translation input/output** in a Language Translator scenario, or in a **multimodal Language scenario** where Speech is the transport rather than the focus. F2 owns the Speech service surface — STT, TTS, SSML, custom speech, speaker recognition. If a question would belong equally to both (e.g., "should you use Speech Translation or Translator's audio support?"), default to the service-owning agent — F2 if the focal question is about an audio capability, F1 if it's about how text translation is invoked.

**Quality floor (per sub-area, post-validation):** ≥22 accepted each (so ≥44 of 50). If a sub-area falls below floor after one re-dispatch round, accept the lower count rather than fabricate — same quality-first stance as prior rounds.

**Type mix per agent (target, ±2 each):** ~15 mc_single, ~1-2 mc_multi, ~5 sequence, ~3-4 hotspot. Across the full 50: ~30 mc_single, ~2-3 mc_multi, ~10 sequence, ~7-8 hotspot. Matches the existing pool's ratios.

## Source material

Primary sources (canonical URLs to be confirmed at URL-list time — paths have been renamed multiple times across LUIS → CLU → Foundry rebranding):

- **AI Language:** AI-102 Develop Language solutions training path at `learn.microsoft.com/en-us/training/paths/`, supplemented by product docs at `https://learn.microsoft.com/en-us/azure/ai-services/language-service/` for CLU, custom text classification, custom NER, and question answering — these are the sub-areas most affected by the LUIS deprecation and current Foundry-portal UX.
- **AI Speech:** AI-102 Develop Speech-enabled applications training path at `learn.microsoft.com/en-us/training/paths/`, supplemented by product docs at `https://learn.microsoft.com/en-us/azure/ai-services/speech-service/` — especially for SSML, custom speech training, and the speech recognition modes which evolve faster than training content.

All training-module unit pages fetched as `?pivots=text`. Product docs typically don't accept the pivot param — fetch without the suffix for those. URL-list build (Task 5 in the plan) will WebFetch and confirm canonical URLs.

**LUIS exclusion rule:** Any URL referencing Language Understanding Intelligent Service (LUIS) as the recommended approach is excluded. Microsoft retired LUIS; questions citing LUIS would mislead the user during the retake. Only Conversational Language Understanding (CLU) URLs are allowed for that sub-area.

**No dedup brief needed** — this is a new topic with no existing questions to dedupe against.

## Architecture

No architectural change. Two files touched:

1. **`practice2.html`** — three small additions:
   - `TOPICS` array (currently around lines 2547-2548): append one entry.
   - `TOPIC_WEIGHTS` map (currently around lines 2555-2557): append one entry.
   - Validator topic whitelist (currently around line 2571): extend from five ids to six.
   Plus: the `RAW_QUESTIONS` array grows by 50 entries (ids 251-300).

2. **`build/validate-v2.js`** — one-line addition to the `ALLOWED_TOPICS` constant. The constant is currently dead code (the loop doesn't reference it) but keeping it in sync prevents future confusion.

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
  { id: "natural-language", title: "Implement natural language processing solutions",
    weight: "15-20%",  subtitle: "Azure AI Language, Speech, translator, CLU, custom text" },
];

const TOPIC_WEIGHTS = {
  "agentic": 7.5,
  "genai-foundry": 17.5,
  "computer-vision": 12.5,
  "plan-and-manage": 22.5,
  "knowledge-mining": 17.5,
  "natural-language": 17.5,
};
```

### Schema unchanged

Question schema, per-type fields, renderers, graders, persistence — all unchanged. New questions follow the same shape, just with `topic: "natural-language"`.

## Data flow

### Build pipeline (one-time)

```
[1] Pre-flight — verify existing pool integrity
    - Confirm 250 questions, ids 1..250 unique
    - Confirm five topics × 50
    - Confirm `natural-language` NOT already present
    - max(id) = 250 → id-offset for new questions = 251

[2] Compose URL list build/url-list-v5.json
    - WebFetch AI Language training-path index (follow canonical URL if renamed)
    - WebFetch AI Speech training-path index (follow canonical URL if renamed)
    - Add product-doc supplements for CLU, custom text features, SSML, custom speech
    - LUIS exclusion: reject any URL where LUIS is the focal service
    - Sanity-check: ≥10 URLs per sub-area

[3] Apply plumbing edits to practice2.html in one commit
    - TOPICS: append natural-language entry
    - TOPIC_WEIGHTS: append natural-language: 17.5
    - In-file validator whitelist: add 'natural-language'

[4] Dispatch 2 parallel subagents — one per sub-area — in a single message
    - Agent F1 (Language): ids 251..275, target 25, URL list F1, boundary rule
    - Agent F2 (Speech):   ids 276..300, target 25, URL list F2, boundary rule
    - Each agent given: full schema, its URL list, id range, type-mix target,
                        quality rules, boundary rule, LUIS exclusion (F1 only)

[5] Validate each chunk via build/validate-v2.js
    - Temporarily swap url-list-v2.json with a combined-key version derived
      from url-list-v5.json (same pattern as v4)
    - JSON parses
    - All required fields per type
    - source.url ∈ assigned URL list (catches hallucinated citations)
    - No id collisions
    - Floor check (≥22)
    - Type-mix check (±2 of target)
    - Boundary check (spot-read 3-5 per chunk for sub-area discipline)
    - LUIS spot-check on the Language chunk
    - Restore url-list-v2.json after validation

[6] Patch build/validate-v2.js ALLOWED_TOPICS to include natural-language
    - One-line change; separate commit for clean diff

[7] Re-dispatch any chunk below floor or with discipline failures
    - One re-dispatch round only; after that, accept under-target

[8] Merge validated chunks
    - Build merged-v5.json from chunk-lang-v5.json + chunk-speech-v5.json
    - Append to RAW_QUESTIONS in practice2.html before its closing ];

[9] Smoke-read merged file
    - Counts by topic (expect 50/50/50/50/50/50)
    - id range continuous 1..300
    - All source URLs are learn.microsoft.com
```

### Runtime (unchanged)

`loadState` → `renderHome` → click topic / mixed / wrong-queue → `renderPractice` → per-type render → submit → grade → feedback panel → advance / end → `renderResults`. Identical to today.

## Persistence

**No storage migration.** Storage key stays `ai102-practice-v2`. New questions appear as additional keys in `results` once the user answers them; existing 250 entries' results carry over untouched.

Falls back to in-memory state if `localStorage` throws (existing pattern).

## UI changes

- **Home view:** sixth topic card appears automatically from the extended `TOPICS` array.
- **Mixed mode:** weights re-normalize automatically (sum becomes 95.0; sampling distribution shifts proportionally; NLP share ≈ 18%). No copy change required.
- **Wrong queue, results screen:** unchanged.
- **No new question types, no new renderers, no new graders.**

## Error handling

Inherited from existing app, unchanged.

Build-pipeline-specific (same as prior rounds):

- **`WebFetch` failure on a unit URL** → agent skips that unit, produces from remaining URLs.
- **Agent returns invalid JSON** → re-dispatched once with parse error.
- **Hallucinated source URL** (validation catches `source.url ∉ assigned list`) → entry rejected; counted against the chunk's floor.
- **Sub-area boundary violation** → spot-check during validation; chunk re-dispatched if >3 cross-domain violations per 25-question chunk.
- **LUIS reference in a Language question** → rejected; reported in re-dispatch prompt if any present.

## Testing

Same regime — single-file static app, no automated test framework:

- **Build-time:** schema validator + topic/url/id checks before injecting into the file.
- **Smoke-read post-build:** human read of file structure (top/middle/bottom), counts by topic.
- **User-validated:** first practice session after delivery — render correctness, sixth topic card layout, mixed-mode distribution feel.

Runtime `renderPractice` try/catch ensures one bad question doesn't kill the session.

## Risks

1. **Topic plumbing missed.** Same as v4 — if any of the three `practice2.html` edits is missed, all 50 questions get filtered out at load time. *Mitigation:* smoke-read verifies per-topic count after injection; bundling the three edits into one commit reduces the chance of partial application.

2. **LUIS contamination in Language chunk.** Microsoft Learn material still includes some LUIS-referencing pages even though LUIS is retired. *Mitigation:* explicit LUIS exclusion rule in F1's prompt; URL-list build rejects any URL where LUIS is the focal service; validation step includes a LUIS spot-check on the Language chunk.

3. **Sub-area boundary drift between F1 and F2.** Speech Translation overlaps Translator; "speech-enabled chatbots" is borderline. *Mitigation:* explicit boundary rule (service ownership default with tie-break to the agent owning the focal capability); validation spot-check flags any chunk with >3 cross-domain violations.

4. **Custom speech, custom CLU, custom QA, custom text classification — four "custom" features across two sub-areas.** Each has its own training UX and there's risk the agents conflate procedures. *Mitigation:* boundary rule + per-feature URL allowlist forces each question to cite a specific custom-feature unit; validator's source-URL check catches misattributions.

5. **Quality-first may end at 44 instead of 50.** Acceptable per prior stance. Floors guarantee ≥22 accepted per sub-area.

## Open questions

None at design approval. Implementation plan to follow.
