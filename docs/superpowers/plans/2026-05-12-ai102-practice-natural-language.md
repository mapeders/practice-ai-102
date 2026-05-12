# AI-102 practice — natural-language topic (+50 questions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the sixth and final topic `natural-language` to `practice2.html` with 50 questions split evenly between Azure AI Language (ids 251-275) and Azure AI Speech (ids 276-300). Takes the pool from 250 to 300 questions covering all 6 AI-102 exam topics.

**Architecture:** Top-up build over the existing static HTML file. Apply three small `practice2.html` code changes (TOPICS, TOPIC_WEIGHTS, in-file validator whitelist) as one plumbing commit, then generate +50 questions via 2 parallel subagents (one per Azure service) with explicit boundary rule and LUIS-exclusion. Validate against schema + assigned-URL allowlist + per-sub-area floor, patch validate-v2.js's `ALLOWED_TOPICS` constant in sync, then append to `RAW_QUESTIONS`.

**Tech Stack:** Plain HTML + inline JavaScript, Tailwind via CDN, `localStorage` for state, `WebFetch` for Microsoft Learn unit pages, parallel `general-purpose` subagents for question generation.

**Spec:** `docs/superpowers/specs/2026-05-12-ai102-practice-natural-language-design.md`

---

## File Structure

**Modified:**
- `practice2.html` — single source-of-truth file:
  - `TOPICS` array (around lines 2547-2548): append natural-language entry
  - `TOPIC_WEIGHTS` map (around lines 2555-2557): append `"natural-language": 17.5`
  - In-file validator whitelist (around line 2571): add `'natural-language'` to allowed list
  - `RAW_QUESTIONS` array (line 54 .. close at column-0 `];`): append +50 entries before close
- `build/validate-v2.js` (line 21): add `'natural-language'` to `ALLOWED_TOPICS` constant

**Created (build artifacts, not shipped):**
- `build/url-list-v5.json` — enumerated Learn-unit URLs for AI Language and AI Speech
- `build/chunk-lang-v5.json` — agent F1 output (Azure AI Language, 25 questions)
- `build/chunk-speech-v5.json` — agent F2 output (Azure AI Speech, 25 questions)
- `build/merged-v5.json` — validated merged delta (50 entries) before injection

**Reference (read only):**
- `docs/superpowers/specs/2026-05-12-ai102-practice-natural-language-design.md` — spec

---

## Task 1: Pre-flight — verify existing pool integrity

**Files:**
- Read: `practice2.html`

- [ ] **Step 1: Confirm 250 questions, 5 topics × 50, ids 1..250 unique, max id 250**

Run:
```bash
grep -oE '"id":\s*[0-9]+' practice2.html | wc -l
grep -oE '"topic":\s*"[^"]+"' practice2.html | sort | uniq -c
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | uniq -c | awk '$1 > 1'
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | tail -1
```

Expected:
- First: `250`
- Second: `50 agentic`, `50 computer-vision`, `50 genai-foundry`, `50 knowledge-mining`, `50 plan-and-manage`
- Third: empty (no duplicates)
- Fourth: `250`

If any of these don't match, stop. The id-range allocation below assumes a clean 1..250 starting point.

- [ ] **Step 2: Confirm `natural-language` is NOT already present**

Run:
```bash
grep -c '"natural-language"' practice2.html
grep -c "'natural-language'" practice2.html
```

Expected: both `0`. If non-zero, the topic plumbing was added by a previous attempt — investigate before proceeding.

- [ ] **Step 3: Commit nothing** — read-only verification.

---

## Task 2: Apply plumbing edits to `practice2.html`

**Files:**
- Modify: `practice2.html` — three locations.

This task bundles the three in-file changes into one plumbing commit (matches the v4 round's clean pattern). They form one atomic plumbing change — partial application would break the topic anyway.

- [ ] **Step 1: Locate the three target lines**

Run:
```bash
grep -nE "const TOPICS|const TOPIC_WEIGHTS|'agentic','genai-foundry'" practice2.html
```

Expected: three line numbers; the line numbers will have shifted from the spec's reference values because questions were injected after each prior expansion. Use the actual line numbers reported.

- [ ] **Step 2: Read the TOPICS block to confirm shape before editing**

Run:
```bash
grep -nA12 'const TOPICS' practice2.html | head -14
```

Expected output (confirm five existing entries plus the closing `];`):
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
```

- [ ] **Step 3: Edit TOPICS + TOPIC_WEIGHTS in one Edit call**

Use the Edit tool on `practice2.html`. Replace:

```js
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

with:

```js
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

- [ ] **Step 4: Edit the in-file validator whitelist**

Use the Edit tool on `practice2.html`. Replace:

```js
if (!['agentic','genai-foundry','computer-vision','plan-and-manage','knowledge-mining'].includes(q.topic)) errs.push('bad topic');
```

with:

```js
if (!['agentic','genai-foundry','computer-vision','plan-and-manage','knowledge-mining','natural-language'].includes(q.topic)) errs.push('bad topic');
```

- [ ] **Step 5: Verify all three edits applied**

Run:
```bash
grep -n 'natural-language' practice2.html
```

Expected: three hits — one in `TOPICS`, one in `TOPIC_WEIGHTS`, one in the validator. Each on a different line.

- [ ] **Step 6: Commit**

```bash
git add practice2.html
git commit -m "$(cat <<'EOF'
Add natural-language topic plumbing

Three edits in practice2.html:
- TOPICS array: append natural-language entry
- TOPIC_WEIGHTS map: append natural-language: 17.5
- In-file validator topic whitelist: extend to include 'natural-language'

Plumbing-only commit; questions appear in a later commit. With this
in place, the sixth topic card renders (disabled) on the home view
until questions exist.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Build URL list for the two sub-areas

**Files:**
- Create: `build/url-list-v5.json`

This task is research-heavy and best dispatched to a subagent that can WebFetch each candidate URL to confirm canonical forms (the Language/Speech Learn paths have been renamed several times with the LUIS → CLU and Foundry rebrand).

- [ ] **Step 1: Dispatch a research subagent**

Dispatch one Agent (subagent_type `general-purpose`, model `sonnet`) with the following prompt:

```
You are implementing Task 3 of an AI-102 practice quiz expansion: compose a v5 Microsoft Learn URL list for the natural-language topic, split into two sub-areas.

Write `/home/mads/src/ai-102c/build/url-list-v5.json` with this structure:

{
  "natural-language-lang":   [{ "url": "...", "module": "...", "unit": "..." }, ...],
  "natural-language-speech": [{ "url": "...", "module": "...", "unit": "..." }, ...]
}

Each sub-area must have ≥10 URLs.

Working dir: /home/mads/src/ai-102c
Branch: develop (don't create a worktree)

Sources to enumerate:

natural-language-lang (Azure AI Language):
- Training path: search Microsoft Learn for the current AI-102 "Develop natural language processing solutions" or "Develop language solutions" path. Recent canonical: https://learn.microsoft.com/en-us/training/paths/develop-language-solutions-azure-ai/. WebFetch the index; follow any canonical-URL redirect. Extract every learn.microsoft.com/.../training/modules/.../<unit>/?pivots=text URL.
- Supplemental product docs (WebFetch each first to confirm it loads; follow canonical redirects):
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/conversational-language-understanding/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/custom-text-classification/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/custom-named-entity-recognition/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/question-answering/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/personally-identifiable-information/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/language-service/sentiment-opinion-mining/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/translator/translator-overview
  - https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation-overview

natural-language-speech (Azure AI Speech):
- Training path: search for the current AI-102 "Develop speech-enabled applications" path. Recent canonical: https://learn.microsoft.com/en-us/training/paths/develop-speech-enabled-applications-azure-ai-services/. WebFetch the index; follow any canonical-URL redirect. Extract every training-module unit URL.
- Supplemental product docs:
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-to-text
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speaker-recognition-overview
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription
  - https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-recognize-intents-from-speech-csharp

CRITICAL — LUIS EXCLUSION:
Reject any URL where Language Understanding Intelligent Service (LUIS) is the focal service. Microsoft retired LUIS; the current canonical is Conversational Language Understanding (CLU). If a Learn page describes LUIS as the recommended approach, exclude it. Pages that mention LUIS only as "migrate from LUIS to CLU" or that describe CLU directly are fine.

Process:
1. WebFetch each candidate URL (training-path index + every supplemental). For training-module units, fetch with ?pivots=text. For product docs, fetch without the pivot param. Follow canonical redirects.
2. Apply LUIS exclusion.
3. Write build/url-list-v5.json with both keys populated; each entry must include url + module + unit (use sensible "module" / "unit" titles for product docs — e.g., module = "Azure AI Language documentation", unit = the page H1).
4. Verify each sub-area has ≥10 URLs; expand if not.
5. Commit:

git add build/url-list-v5.json
git commit -m "$(cat <<'COMMITEOF'
v5 URL list for natural-language: AI Language + AI Speech

Mix of training-module units (?pivots=text) and product-doc pages
for fast-moving sub-areas (CLU/custom-text for Language; custom
speech/SSML for Speech). LUIS-only pages excluded.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
COMMITEOF
)"

Report: URL count per sub-area, git commit SHA, any canonical redirects followed, any LUIS-only URLs rejected.
```

- [ ] **Step 2: Verify the file**

Run:
```bash
python3 -c "
import json
d = json.load(open('build/url-list-v5.json'))
for k, v in d.items():
    print(f'{k}: {len(v)} URLs')
    for u in v[:3]:
        print(f'  {u[\"url\"]}')
"
```

Expected: both sub-areas show ≥10 URLs each. URLs are `learn.microsoft.com/...` paths.

---

## Task 4: Dispatch 2 parallel subagents to generate +25 each

**Files:**
- Create: `build/chunk-lang-v5.json`, `build/chunk-speech-v5.json`

This task uses one message with two `Agent` tool-uses (subagent_type `general-purpose`, model `sonnet`) so both run concurrently.

- [ ] **Step 1: Dispatch both agents in a single message**

**Agent F1 — AI Language (25 questions, ids 251-275)**
- subagent_type: `general-purpose`
- model: `sonnet`
- description: `Generate 25 AI Language questions (boundary + LUIS exclusion)`
- prompt:
```
You are generating 25 AI-102 natural-language practice questions on the Azure AI Language sub-area. Work in /home/mads/src/ai-102c.

Inputs:
- build/url-list-v5.json — read the natural-language-lang array. Every question's source.url must EXACTLY match a URL in that array (the validator enforces this).

Output: build/chunk-lang-v5.json — a JSON array of ~25 question objects. No markdown fences, no commentary.

Schema (each question is a JSON object):
{
  id: <int, 251..275 inclusive, each used exactly once>,
  topic: "natural-language",
  type: "mc_single" | "mc_multi" | "sequence" | "hotspot",
  question: "<question body, plain text; can include code blocks>",
  explanation: "<post-answer explanation grounded in the cited Learn unit>",
  source: {
    path: "<Learn path title>",
    module: "<Learn module title>",
    unit: "<Learn unit title>",
    url: "<exact URL from your assigned list>"
  },
  // type-specific:
  // mc_single: options: [{id:"A",text:"..."}, ...], correct: ["A"]  (exactly 1 correct)
  // mc_multi:  options: [{id:"A",text:"..."}, ...], correct: ["A","C"]  (>=2 correct)
  // sequence:  items:   [{id:"S1",text:"..."}, ...], correct_order: ["S1","S2","S3","S4"]
  // hotspot:   blanks:  [{id:"B1", prompt:"...", options:[{id:"a",text:"..."}, ...], correct:"a"}, ...]
}

Constraints:
- id range: 251..275 inclusive, each used exactly once
- type mix target: ~15 mc_single, ~1-2 mc_multi, ~5 sequence, ~3-4 hotspot (±2 each)
- Coverage: text analytics (sentiment, key phrase extraction, named entity recognition, PII detection, language detection), Azure AI Translator, Conversational Language Understanding (CLU), custom question answering, custom text classification, custom NER.
- BOUNDARY RULE: You may only write about Speech when it appears as translation input/output in a Language Translator scenario, or as transport in a multimodal Language scenario. Do NOT write about the Speech service surface — STT, TTS, SSML, custom speech, speaker recognition — that's the OTHER agent's territory. When in doubt, skip.
- LUIS EXCLUSION RULE: Microsoft retired LUIS. Do NOT produce any question where the correct answer is "use LUIS" or where LUIS is the focal service. Only CLU (Conversational Language Understanding) is current canonical. If a Learn unit you fetch describes LUIS, redirect to the CLU equivalent or skip that unit.
- Strict rules:
  - source.url must exactly match a URL in your assigned list (paste from list, don't synthesize)
  - Explanations must reflect what the cited Learn unit actually teaches
  - Correct answers must be derivable from that unit's content
  - No "all of the above" / "none of the above" distractors
  - Distractors must be plausible: other Azure AI services, near-miss API names, similar settings

Process:
1. Read build/url-list-v5.json and extract the natural-language-lang URLs.
2. WebFetch 10-15 of the URLs covering the coverage areas above. Vary sources so your 25 questions aren't all from one or two units.
3. For each URL fetched, draft 1-3 questions covering specific facts from that unit. Vary the question types to hit the type mix.
4. Apply the boundary rule and LUIS exclusion strictly.
5. Write the JSON array to build/chunk-lang-v5.json using the Write tool.
6. Return a one-line confirmation. Do NOT commit.

Verify before reporting:
- Exactly 25 entries (or 22-25 if floor met)
- All ids in 251..275, no duplicates
- All source.url values in build/url-list-v5.json natural-language-lang
- Type-mix within ±2 of target
- Self-check: any question where the correct answer is "use LUIS"? Rework if yes.
- Self-check: any question primarily about Speech service surface? Rework if more than 2.

Report: "Wrote N questions to build/chunk-lang-v5.json (type mix: X/Y/Z/W mc_single/mc_multi/sequence/hotspot)."
```

**Agent F2 — AI Speech (25 questions, ids 276-300)**
- subagent_type: `general-purpose`
- model: `sonnet`
- description: `Generate 25 AI Speech questions (boundary)`
- prompt:
```
You are generating 25 AI-102 natural-language practice questions on the Azure AI Speech sub-area. Work in /home/mads/src/ai-102c.

Inputs:
- build/url-list-v5.json — read the natural-language-speech array. Every question's source.url must EXACTLY match a URL in that array (the validator enforces this).

Output: build/chunk-speech-v5.json — a JSON array of ~25 question objects. No markdown fences, no commentary.

Schema (each question is a JSON object):
{
  id: <int, 276..300 inclusive, each used exactly once>,
  topic: "natural-language",
  type: "mc_single" | "mc_multi" | "sequence" | "hotspot",
  question: "<question body, plain text; can include code blocks>",
  explanation: "<post-answer explanation grounded in the cited Learn unit>",
  source: {
    path: "<Learn path title>",
    module: "<Learn module title>",
    unit: "<Learn unit title>",
    url: "<exact URL from your assigned list>"
  },
  // type-specific:
  // mc_single: options: [{id:"A",text:"..."}, ...], correct: ["A"]  (exactly 1 correct)
  // mc_multi:  options: [{id:"A",text:"..."}, ...], correct: ["A","C"]  (>=2 correct)
  // sequence:  items:   [{id:"S1",text:"..."}, ...], correct_order: ["S1","S2","S3","S4"]
  // hotspot:   blanks:  [{id:"B1", prompt:"...", options:[{id:"a",text:"..."}, ...], correct:"a"}, ...]
}

Constraints:
- id range: 276..300 inclusive, each used exactly once
- type mix target: ~15 mc_single, ~1-2 mc_multi, ~5 sequence, ~3-4 hotspot (±2 each)
- Coverage: speech-to-text (real-time + batch), text-to-speech, SSML, speech translation, custom speech (training), speaker recognition, speech recognition modes (dictation/conversation/interactive).
- BOUNDARY RULE: You OWN the Speech service surface. Write about its endpoints, SDKs, model training UX, recognition modes, SSML constructs, custom speech training data formats, speaker recognition workflows. If a question would belong to Language (about text translation invoked from a Language scenario, or text analytics applied to transcribed text), that's the OTHER agent's territory — skip it. When in doubt, keep (you own this domain).
- Strict rules:
  - source.url must exactly match a URL in your assigned list (paste from list, don't synthesize)
  - Explanations must reflect what the cited Learn unit actually teaches
  - Correct answers must be derivable from that unit's content
  - No "all of the above" / "none of the above" distractors
  - Distractors must be plausible: other Azure AI services, near-miss API names, similar settings

Process:
1. Read build/url-list-v5.json and extract the natural-language-speech URLs.
2. WebFetch 10-15 of the URLs covering the coverage areas above. Vary sources so your 25 questions aren't all from one or two units.
3. For each URL fetched, draft 1-3 questions covering specific facts from that unit. Vary the question types to hit the type mix.
4. Apply the boundary rule strictly.
5. Write the JSON array to build/chunk-speech-v5.json using the Write tool.
6. Return a one-line confirmation. Do NOT commit.

Verify before reporting:
- Exactly 25 entries (or 22-25 if floor met)
- All ids in 276..300, no duplicates
- All source.url values in build/url-list-v5.json natural-language-speech
- Type-mix within ±2 of target
- Self-check: any question primarily about Language service surface (text analytics, CLU, translator)? Rework if more than 2.

Report: "Wrote N questions to build/chunk-speech-v5.json (type mix: X/Y/Z/W mc_single/mc_multi/sequence/hotspot)."
```

- [ ] **Step 2: Confirm both files exist and are non-empty**

Run:
```bash
ls -la build/chunk-lang-v5.json build/chunk-speech-v5.json
python3 -c "import json; print('lang:', len(json.load(open('build/chunk-lang-v5.json')))); print('speech:', len(json.load(open('build/chunk-speech-v5.json'))))"
```

Expected: both files present, each printing a count ~25.

- [ ] **Step 3: Commit the raw chunks**

```bash
git add build/chunk-lang-v5.json build/chunk-speech-v5.json
git commit -m "$(cat <<'EOF'
Raw v5 chunks: natural-language (AI Language + AI Speech)

Two parallel subagents, 25 questions each. AI Language covers
text analytics, Translator, CLU, custom QA / classification / NER
(LUIS exclusion enforced). AI Speech covers STT, TTS, SSML, speech
translation, custom speech, speaker recognition. Boundary rule
applied to prevent cross-service overlap.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Validate each chunk

**Files:**
- Read: `build/chunk-lang-v5.json`, `build/chunk-speech-v5.json`, `build/url-list-v5.json`, `build/validate-v2.js`

The existing `build/validate-v2.js` validator hardcodes `build/url-list-v2.json` for the URL allowlist. We use the same swap trick as v4: build a temporary v2-formatted URL list keyed by the topic name (`natural-language`) containing the union of both sub-area URL arrays.

- [ ] **Step 1: Build a temporary URL list keyed by `natural-language`**

```bash
python3 - <<'PY'
import json
d = json.load(open('build/url-list-v5.json'))
combined = d['natural-language-lang'] + d['natural-language-speech']
print(f'combined: {len(combined)} URLs')
json.dump({'natural-language': combined}, open('build/url-list-v2.json.bak.tmp','w'), indent=2)
PY
cp build/url-list-v2.json build/url-list-v2.json.bak
cp build/url-list-v2.json.bak.tmp build/url-list-v2.json
```

- [ ] **Step 2: Run validator on both chunks**

```bash
node build/validate-v2.js build/chunk-lang-v5.json   natural-language 251 275
node build/validate-v2.js build/chunk-speech-v5.json natural-language 276 300
```

Expected on each: zero-exit, summary JSON printed.

Floors (per sub-area, post-validation):
- AI Language: count ≥22
- AI Speech: count ≥22

Type-mix tolerance: each `typeCounts.*` within ±2 of its per-agent target.

- [ ] **Step 3: Restore the validator URL list**

```bash
mv build/url-list-v2.json.bak build/url-list-v2.json
rm build/url-list-v2.json.bak.tmp
```

- [ ] **Step 4: Boundary + LUIS spot-check**

Read all 25 stems in each chunk:
```bash
python3 -c "
import json
for path, label in [('build/chunk-lang-v5.json', 'LANG'), ('build/chunk-speech-v5.json', 'SPEECH')]:
    print(f'--- {label} ---')
    for q in json.load(open(path)):
        stem = ' '.join(q['question'].split())[:130]
        print(f\"id={q['id']} [{q['type']}] unit={q['source']['unit'][:50]}\")
        print(f'  Q: {stem}')
"
```

For each chunk, flag:
- **Lang chunk:** any question where the correct answer is "use LUIS", or any question primarily about the Speech service surface (STT/TTS/SSML/custom speech). Acceptable cross-domain: ≤2 of 25; LUIS: 0 of 25 (zero tolerance).
- **Speech chunk:** any question primarily about Language service surface (text analytics, CLU, translator). Acceptable cross-domain: ≤2 of 25.

If any LUIS reference appears in the Lang chunk, or either chunk exceeds the cross-domain count, trigger Task 6.

- [ ] **Step 5: No commit yet** — validator patch happens in Task 7 after potential re-dispatch.

---

## Task 6: Re-dispatch any chunk that fails (conditional)

Only run this task if Task 5 failed (count below floor, LUIS reference in Lang chunk, or cross-domain count exceeded). If both passed, skip to Task 7.

**Files:**
- Re-create: the offending `build/chunk-*-v5.json`

- [ ] **Step 1: Identify the failure mode**

Map each failed chunk to one of:
- **A.** JSON malformed / schema violations → re-dispatch with parse errors in prompt
- **B.** Topic count below floor (22) → re-dispatch asking for `(floor - current)` more questions with new unused ids; keep validated questions from prior round
- **C.** Type-mix off by >2 → re-dispatch asking specifically for missing types
- **D.** LUIS reference present in Lang chunk → re-dispatch with the offending stems quoted and the LUIS-exclusion rule restated stronger
- **E.** Cross-domain count >2 → re-dispatch with the offending stems quoted and the boundary rule restated stronger

- [ ] **Step 2: Dispatch only the failed agents (in one message if both)**

Reuse the prompt structure from Task 4 step 1 with:
- The original schema block
- Original URL list reference
- New id range = unused ids within the original range (if topping up) OR the same range (if regenerating from scratch)
- Explicit "previous attempt had these problems: …" preamble (paste 1-3 failing examples)
- Same Write-to-file instruction (overwrite if regenerating; write to a temp file if topping up, then merge by hand)

- [ ] **Step 3: Re-validate**

Re-run Task 5 step 1 + step 2 + step 3 + step 4. **Only one re-dispatch round.** If still below floor after one re-dispatch, accept the lower count and move on.

- [ ] **Step 4: Commit if changes occurred**

```bash
git add build/chunk-*-v5.json
git commit -m "Re-dispatched <sub-area> v5 chunk to address <failure mode>"
```

---

## Task 7: Patch validator's `ALLOWED_TOPICS` constant

**Files:**
- Modify: `build/validate-v2.js` (line 21)

The constant is currently dead code (the validator loop doesn't reference it) but kept in sync to prevent future confusion. Separate one-line commit for a clean diff.

- [ ] **Step 1: Verify current ALLOWED_TOPICS**

Run:
```bash
grep -n 'ALLOWED_TOPICS' build/validate-v2.js
```

Expected (line 21):
```js
const ALLOWED_TOPICS = ['agentic','genai-foundry','computer-vision','plan-and-manage','knowledge-mining'];
```

- [ ] **Step 2: Add `natural-language`**

Use the Edit tool on `build/validate-v2.js`. Replace:
```js
const ALLOWED_TOPICS = ['agentic','genai-foundry','computer-vision','plan-and-manage','knowledge-mining'];
```
with:
```js
const ALLOWED_TOPICS = ['agentic','genai-foundry','computer-vision','plan-and-manage','knowledge-mining','natural-language'];
```

- [ ] **Step 3: Commit**

```bash
git add build/validate-v2.js
git commit -m "$(cat <<'EOF'
Allow natural-language in chunk validator's ALLOWED_TOPICS

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Merge validated chunks and inject into `practice2.html`

**Files:**
- Read: `build/chunk-lang-v5.json`, `build/chunk-speech-v5.json`
- Create: `build/merged-v5.json`
- Modify: `practice2.html` (`RAW_QUESTIONS` array — append before the closing `];`)

- [ ] **Step 1: Build the merged delta**

```bash
python3 - <<'PY'
import json
chunks = ['lang-v5', 'speech-v5']
out = []
for c in chunks:
    out.extend(json.load(open(f'build/chunk-{c}.json')))
ids = [q['id'] for q in out]
assert len(ids) == len(set(ids)), f'duplicate ids: {[i for i in ids if ids.count(i) > 1]}'
assert min(ids) >= 251, f'new id collides: min id is {min(ids)}'
assert max(ids) <= 300, f'new id exceeds range: max id is {max(ids)}'
json.dump(out, open('build/merged-v5.json','w'), indent=2)
print(f'merged: {len(out)} questions, id range {min(ids)}..{max(ids)}')
PY
```

Expected: `merged: 50 questions, id range 251..300` (or fewer if Task 6 accepted under-target).

- [ ] **Step 2: Locate the closing `];` of `RAW_QUESTIONS`**

In this file the `RAW_QUESTIONS` array closes with `];` at column 0 (no indent), NOT `    ];` like other arrays.

Run:
```bash
grep -nE '^\];$' practice2.html
```
Expected: one hit (the close of RAW_QUESTIONS).

- [ ] **Step 3: Insert the merged questions before the close**

```bash
python3 - <<'PY'
import json
src = open('practice2.html').read()
delta = json.load(open('build/merged-v5.json'))

def render(q):
    return '  ' + json.dumps(q, ensure_ascii=False)

block = ',\n'.join(render(q) for q in delta)

start = src.index('const RAW_QUESTIONS = [')
close_idx = src.index('\n];\n', start)
before = src[:close_idx]
after  = src[close_idx:]
new_src = before + ',\n' + block + after
open('practice2.html','w').write(new_src)
print(f'inserted {len(delta)} questions before close at offset {close_idx}')
PY
```

- [ ] **Step 4: Verify counts**

```bash
grep -oE '"id":\s*[0-9]+' practice2.html | wc -l
grep -oE '"topic":\s*"[^"]+"' practice2.html | sort | uniq -c
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | uniq -c | awk '$1 > 1'
```

Expected:
- Total numeric ids: `300`
- Per topic: `50 agentic`, `50 computer-vision`, `50 genai-foundry`, `50 knowledge-mining`, `50 natural-language`, `50 plan-and-manage`
- Duplicate-ids check: empty output

(Adjust expected if Task 6 accepted under-target.)

- [ ] **Step 5: Commit**

```bash
git add practice2.html build/merged-v5.json
git commit -m "$(cat <<'EOF'
Inject +50 natural-language questions (ids 251-300)

25 AI Language (ids 251-275): text analytics (sentiment, KE, NER,
PII, language detection), Azure AI Translator, Conversational
Language Understanding (CLU), custom question answering, custom
text classification, custom NER.

25 AI Speech (ids 276-300): speech-to-text (real-time + batch),
text-to-speech, SSML, speech translation, custom speech (training),
speaker recognition, recognition modes.

Pool: 250 → 300. Covers all 6 of 6 AI-102 exam topics.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Final smoke-read

**Files:**
- Read: `practice2.html`

- [ ] **Step 1: Sample-read top/middle/bottom of RAW_QUESTIONS**

Read entries at ids 1-3, around id 150, and 298-300. For each:
- Required fields present
- `source.url` is a `learn.microsoft.com/...` URL
- `explanation` makes sense in context of the question

Run an automated scan:
```bash
python3 - <<'PY'
import re
src = open('practice2.html').read()
ids = sorted(int(m.group(1)) for m in re.finditer(r'"id":\s*(\d+)(?:,\s*"topic")', src))
print('question ids found:', len(ids))
if ids:
    print('min:', min(ids), 'max:', max(ids))
    print('gaps:', [i for i in range(min(ids), max(ids)+1) if i not in set(ids)])
bad = re.findall(r'"url":\s*"((?!https://learn\.microsoft\.com)[^"]*)"', src)
print('non-learn URLs:', bad)
# LUIS smoke-check
luis_hits = []
for m in re.finditer(r'"id":\s*(\d+),\s*"topic":\s*"natural-language"', src):
    start = m.start()
    window = src[start:start+3000]
    if 'LUIS' in window or 'Language Understanding Intelligent' in window:
        # Only flag if LUIS is in the question/explanation, not just a mention
        luis_hits.append(int(m.group(1)))
print('NL questions mentioning LUIS:', luis_hits)
PY
```

Expected:
- `question ids found: 300` (or close if Task 6 accepted under-target)
- `min: 1`, `max: 300`
- `gaps: []` (or a small set of unfilled ids inside 251..300)
- `non-learn URLs: []`
- `NL questions mentioning LUIS: []` (zero tolerance — LUIS should not appear anywhere in the new natural-language questions)

If `NL questions mentioning LUIS` is non-empty, this is a LUIS-contamination escape from Task 5. Either prune those questions from `practice2.html` by hand (locate the entries and remove them), or accept and document the violation. Prefer pruning.

- [ ] **Step 2: No commit** — read-only verification.

---

## Task 10: Browser exercise (user-validated)

**Files:** none modified.

- [ ] **Step 1: Open `practice2.html` in a real browser**

Verify on the home screen:
- All SIX topic cards render with subtitles.
- The new `natural-language` card shows `0 / 50` answered (or carries over progress if you've practiced before) and is ENABLED.

- [ ] **Step 2: Run a 5-question session in natural-language**

Start the topic, answer 5 questions. Confirm: questions render, options render, grading works, explanations appear, source attribution links to `learn.microsoft.com`, Next advances. Note whether questions feel evenly split between AI Language and AI Speech across the first ~10.

- [ ] **Step 3: Run a 20-question mixed session**

Confirm distribution: questions from all six topics appear, weighting roughly matches exam % (NL at ~18% share of the new weight sum 95.0 → expect ~3-4 NL questions in a 20-question mixed session).

- [ ] **Step 4: Reset and re-open**

Click reset, reload, confirm in-progress state clears and home view is clean.

- [ ] **Step 5: Commit a marker (optional)**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
User-validated v5 expansion: +50 natural-language, 300 questions total, 6/6 AI-102 topics

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review (post-write)

**Spec coverage:**
- "Add `natural-language` to TOPICS, TOPIC_WEIGHTS, in-file validator whitelist" → Task 2
- "Add `natural-language` to `build/validate-v2.js` `ALLOWED_TOPICS`" → Task 7
- "Plumbing bundled in one commit" → Task 2 step 6
- "50 questions split 25/25 between Language (ids 251-275) and Speech (ids 276-300)" → Task 4, Task 8
- "Sub-area boundary rule" → Task 4 step 1 (per-agent prompts), Task 5 step 4 (validation)
- "LUIS exclusion rule" → Task 3 (URL-list build), Task 4 step 1 (Lang agent prompt), Task 5 step 4 (spot-check), Task 9 step 1 (final smoke-read)
- "URL allowlist with per-sub-area sources + product-doc supplements" → Task 3
- "Quality floor ≥22 per sub-area, one re-dispatch round" → Task 5 (floors), Task 6 (conditional re-dispatch)
- "Source.url ∈ agent's assigned list" → Task 5 (validator enforces this via the swapped url-list)
- "No id collisions with existing 1..250" → Task 1 verifies start, Task 8 step 1 asserts at merge
- "Storage preserved (key ai102-practice-v2)" → no migration in any task
- "Single static HTML file + validator script" → only `practice2.html` and `build/validate-v2.js` are modified
- "6-topic mixed mode" → Task 10 step 3 validates distribution

All spec requirements have at least one task. No gaps.

**Placeholder scan:** No TBDs, no "implement appropriate error handling", no naked "write tests for the above". Each step has either exact code, an exact command, or a concrete verification action.

**Type consistency:** Topic id used throughout is exactly `natural-language` (with a hyphen, lowercase). The URL list key suffixes `-lang` and `-speech` (Task 3) are consistently referenced in Task 4 (agent prompts) and Task 5 (combined-key building). Id ranges 251..275 and 276..300 do not overlap and sum to 50. The validator constant name `ALLOWED_TOPICS` (Task 7) matches the actual constant name in `build/validate-v2.js`.

No issues to fix.
