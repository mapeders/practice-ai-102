# AI-102 practice — knowledge-mining topic (+50 questions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fifth topic `knowledge-mining` to `practice2.html` with 50 questions split evenly between Azure AI Search (ids 201-225) and Azure AI Document Intelligence (ids 226-250). Takes the pool from 200 to 250 questions covering 5 of 6 AI-102 exam topics.

**Architecture:** Top-up build over the existing static HTML file. Apply three small code changes (TOPICS, TOPIC_WEIGHTS, validator whitelist) and browser-verify the new topic card renders BEFORE generating questions, so topic plumbing is independently testable. Then generate +50 questions via 2 parallel subagents (one per sub-area) with an explicit boundary rule to prevent overlap. Validate against schema + assigned-URL allowlist + per-sub-area floor, then append to the existing `RAW_QUESTIONS` array.

**Tech Stack:** Plain HTML + inline JavaScript, Tailwind via CDN, `localStorage` for state, `WebFetch` for Microsoft Learn unit pages, parallel `general-purpose` subagents for question generation.

**Spec:** `docs/superpowers/specs/2026-05-12-ai102-practice-knowledge-mining-design.md`

---

## File Structure

**Modified:**
- `practice2.html` — single source-of-truth file:
  - `TOPICS` array (lines 2499-2508): append knowledge-mining entry
  - `TOPIC_WEIGHTS` map (lines 2509-2514): append `"knowledge-mining": 17.5`
  - Validator topic whitelist (line 2528): add `'knowledge-mining'` to allowed list
  - `RAW_QUESTIONS` array (line 54 .. close at column-0 `];`): append +50 entries before close

**Created (build artifacts, not shipped):**
- `build/url-list-v4.json` — enumerated Learn-unit URLs for AI Search and Document Intelligence
- `build/chunk-search-v4.json` — agent E1 output (AI Search, 25 questions)
- `build/chunk-di-v4.json` — agent E2 output (Document Intelligence, 25 questions)
- `build/merged-v4.json` — validated merged delta (50 entries) before injection

**Reference (read only):**
- `docs/superpowers/specs/2026-05-12-ai102-practice-knowledge-mining-design.md` — spec
- `build/validate-v2.js` — existing chunk validator (reuse as-is; one-line update needed for new topic)
- `build/url-list-v2.json` and `build/url-list-v3.json` — prior URL lists (informational)

---

## Task 1: Pre-flight — verify existing pool integrity

**Files:**
- Read: `practice2.html`

- [ ] **Step 1: Confirm 200 questions, ids 1..200 unique, five-way topic counts not yet present**

Run:
```bash
grep -oE '"id":\s*[0-9]+' practice2.html | wc -l
grep -oE '"topic":\s*"[^"]+"' practice2.html | sort | uniq -c
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | uniq -c | awk '$1 > 1'
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | tail -1
```

Expected:
- First: `200` (option-level `"id":` fields look identical to question-level when greppd this way; in the current file the numeric-id count happens to be 200 because option ids are quoted strings like `"A"` — they don't match `[0-9]`)
- Second: `50 agentic`, `50 genai-foundry`, `50 computer-vision`, `50 plan-and-manage`
- Third: empty (no duplicates)
- Fourth: `200`

If any of these don't match, stop. The id-range allocation below assumes a clean 1..200 starting point.

- [ ] **Step 2: Confirm `knowledge-mining` is NOT already present**

Run:
```bash
grep -c '"knowledge-mining"' practice2.html
```

Expected: `0`. If non-zero, the topic plumbing was added by a previous attempt — investigate before proceeding.

- [ ] **Step 3: Commit nothing** — read-only verification.

---

## Task 2: Extend `TOPICS` array

**Files:**
- Modify: `practice2.html:2499-2508`

- [ ] **Step 1: Read the current TOPICS block**

Run:
```bash
sed -n '2499,2510p' practice2.html
```

Expected output (so you know the indentation and the closing `];`):
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
    ];
```

- [ ] **Step 2: Insert the knowledge-mining entry before the closing `];`**

Use the Edit tool on `practice2.html`. Replace:

```js
      { id: "plan-and-manage", title: "Plan and manage an Azure AI solution",
        weight: "20-25%",  subtitle: "Provisioning, RBAC, monitoring, networking, content safety" },
    ];
```

with:

```js
      { id: "plan-and-manage", title: "Plan and manage an Azure AI solution",
        weight: "20-25%",  subtitle: "Provisioning, RBAC, monitoring, networking, content safety" },
      { id: "knowledge-mining", title: "Implement knowledge mining and information extraction solutions",
        weight: "15-20%",  subtitle: "Azure AI Search, Document Intelligence, RAG/vector, custom skills" },
    ];
```

- [ ] **Step 3: Verify the change applied cleanly**

Run:
```bash
grep -n '"knowledge-mining"' practice2.html
```

Expected: one hit in `TOPICS`, around line 2509-2510. Should show the entry exactly as inserted.

- [ ] **Step 4: Commit**

```bash
git add practice2.html
git commit -m "$(cat <<'EOF'
Add knowledge-mining entry to TOPICS array

Fifth topic. Plumbing-only commit; questions appear in a later commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Extend `TOPIC_WEIGHTS` map

**Files:**
- Modify: `practice2.html` (`TOPIC_WEIGHTS` block, currently around lines 2511-2517 after Task 2's insert)

- [ ] **Step 1: Read the current TOPIC_WEIGHTS block**

Run:
```bash
grep -nA8 'const TOPIC_WEIGHTS' practice2.html | head -10
```

Expected (line numbers shift by 2 after Task 2):
```js
    const TOPIC_WEIGHTS = {
      "agentic": 7.5,
      "genai-foundry": 17.5,
      "computer-vision": 12.5,
      "plan-and-manage": 22.5,
    };
```

- [ ] **Step 2: Insert the knowledge-mining weight before the closing `};`**

Use the Edit tool. Replace:
```js
      "plan-and-manage": 22.5,
    };
```
with:
```js
      "plan-and-manage": 22.5,
      "knowledge-mining": 17.5,
    };
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -n '"knowledge-mining"' practice2.html
```

Expected: two hits now (one in TOPICS, one in TOPIC_WEIGHTS).

- [ ] **Step 4: Commit**

```bash
git add practice2.html
git commit -m "$(cat <<'EOF'
Add knowledge-mining weight (17.5) to TOPIC_WEIGHTS

Mid-point of the 15-20% exam outline range for the topic.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Extend validator topic whitelist

**Files:**
- Modify: `practice2.html` (validator line, currently line 2528 + 2 shift = around 2530)

- [ ] **Step 1: Locate the validator whitelist line**

Run:
```bash
grep -n "'agentic','genai-foundry'" practice2.html
```

Expected: one hit, returning a line of the form:
```js
        if (!['agentic','genai-foundry','computer-vision','plan-and-manage'].includes(q.topic)) errs.push('bad topic');
```

- [ ] **Step 2: Add knowledge-mining to the array**

Use the Edit tool. Replace:
```js
if (!['agentic','genai-foundry','computer-vision','plan-and-manage'].includes(q.topic)) errs.push('bad topic');
```
with:
```js
if (!['agentic','genai-foundry','computer-vision','plan-and-manage','knowledge-mining'].includes(q.topic)) errs.push('bad topic');
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -c '"knowledge-mining"' practice2.html
grep -c "'knowledge-mining'" practice2.html
```

Expected: first count `2` (TOPICS + TOPIC_WEIGHTS), second count `1` (validator).

- [ ] **Step 4: Open `practice2.html` in a browser to confirm the fifth topic card renders (disabled)**

This is the most important verification step in this task. Either open the file path directly in your browser (`file:///home/mads/src/ai-102c/practice2.html`) or run a local server (`python3 -m http.server 8000 --directory /home/mads/src/ai-102c` and visit `http://localhost:8000/practice2.html`). Confirm:

- A FIFTH topic card appears under the existing four.
- It reads "Implement knowledge mining and information extraction solutions" with the subtitle "Azure AI Search, Document Intelligence, RAG/vector, custom skills".
- It shows weight "15-20%".
- It is DISABLED (`opacity-50`, says "no questions yet") — because no questions match its topic id yet.
- Open browser console (F12) — confirm no `Rejected N invalid questions` warning. (Existing 200 questions still validate; the whitelist change only affects what `knowledge-mining` does in future entries.)

If only four cards render or anything else looks wrong, the edit did not take. Re-check with `grep -n '"knowledge-mining"\|''knowledge-mining''' practice2.html`.

- [ ] **Step 5: Commit**

```bash
git add practice2.html
git commit -m "$(cat <<'EOF'
Allow knowledge-mining topic in question validator

Plumbing-only commit. New topic card now renders (disabled) on home.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Build URL list for the two sub-areas

**Files:**
- Create: `build/url-list-v4.json`

- [ ] **Step 1: Enumerate AI Search Learn-path units**

Use WebFetch on the AI Search training path index page:
```
https://learn.microsoft.com/en-us/training/paths/implement-knowledge-mining-azure-ai-search/
```

Extract every `learn.microsoft.com/.../training/modules/.../<unit>/?pivots=text` URL. If the path has been renamed or restructured, follow the canonical URL listed in the page header and use that.

Additionally, enumerate these product-doc pages (AI Search Learn content lags product docs on vector/integrated vectorization — these are explicitly permitted per the spec, with E1 allowed up to 8 of 25 from product docs):
- `https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search`
- `https://learn.microsoft.com/en-us/azure/search/search-indexer-overview`
- `https://learn.microsoft.com/en-us/azure/search/cognitive-search-concept-intro`
- `https://learn.microsoft.com/en-us/azure/search/knowledge-store-concept-intro`
- `https://learn.microsoft.com/en-us/azure/search/vector-search-overview`
- `https://learn.microsoft.com/en-us/azure/search/vector-search-integrated-vectorization`
- `https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview`
- `https://learn.microsoft.com/en-us/azure/search/semantic-search-overview`

WebFetch each candidate before adding to the list to confirm it loads (the product-doc URLs above are stable but some pages have been renamed).

- [ ] **Step 2: Enumerate Document Intelligence Learn-path units**

Use WebFetch on the Document Intelligence training path index page:
```
https://learn.microsoft.com/en-us/training/paths/extract-information-from-text-documents-azure-ai-document-intelligence/
```

If that path has been renamed/restructured, search Microsoft Learn for the current "Document Intelligence" training path and follow to the canonical URL.

Additionally, enumerate these product-doc pages (analogous to AI Search — DI content evolves quickly with new prebuilt models):
- `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview`
- `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/invoice`
- `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/receipt`
- `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/id-document`
- `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/layout`
- `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/read`
- `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/train/custom-template`
- `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/train/custom-neural`
- `https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/train/custom-classifier`

WebFetch each candidate before adding. If a page has been renamed (e.g., from `/concept-X/` to `/prebuilt/X/`), use the canonical URL.

- [ ] **Step 3: Write `build/url-list-v4.json`**

Structure:
```json
{
  "knowledge-mining-search":  [{ "url": "...", "module": "...", "unit": "..." }, ...],
  "knowledge-mining-di":      [{ "url": "...", "module": "...", "unit": "..." }, ...]
}
```

The keys use sub-area suffixes (`-search`, `-di`) because the validator keys by topic; we'll handle that in Task 7 by either flattening into one `knowledge-mining` key or running the validator once per sub-area with a topic alias. Either way the URL list file itself stays per-sub-area for clarity.

Each URL entry must include the `?pivots=text` suffix for training-module units (where it works) and the bare URL for product-doc pages (which typically reject the pivot param).

- [ ] **Step 4: Sanity-check counts and shape**

Run:
```bash
python3 -c "import json; d=json.load(open('build/url-list-v4.json')); [print(k, len(v)) for k,v in d.items()]"
```

Expected: each sub-area has ≥10 URLs (gives each agent variety for 25 questions with some doubling-up).

If either sub-area has fewer than 10, expand the list before continuing.

- [ ] **Step 5: Commit**

```bash
git add build/url-list-v4.json
git commit -m "$(cat <<'EOF'
v4 URL list for knowledge-mining: AI Search + Document Intelligence

Mix of training-module units (?pivots=text) and product-doc pages
for fast-moving sub-areas (vector / integrated vectorization for
AI Search; prebuilt + custom model pages for Document Intelligence).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Dispatch 2 parallel subagents to generate +25 each

**Files:**
- Create: `build/chunk-search-v4.json`, `build/chunk-di-v4.json`

This task uses one message with two `Agent` tool-uses (subagent_type `general-purpose`, model `sonnet`) so both run concurrently.

- [ ] **Step 1: Prepare the shared question schema text**

Schema (copy verbatim into each agent prompt — same as prior round):
```
Each question is a JSON object:
{
  id: <int, unique, within your assigned range>,
  topic: "knowledge-mining",
  type: <one of: "mc_single", "mc_multi", "sequence", "hotspot">,
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

Strict rules:
- Every question must cite a source.url drawn from your assigned URL list (no other URLs).
- Explanations must reflect what the cited Learn unit actually teaches — no generic AI-102 trivia.
- correct answers must be derivable from that unit's content.
- No "all of the above" / "none of the above" distractors.
- Distractors must be plausible: other Azure AI services, near-miss API names, similar settings.
- Output: a single JSON array (no markdown fences, no commentary). The array contains your N questions.
```

- [ ] **Step 2: Dispatch both agents in a single message**

Use one assistant message containing two `Agent` tool-uses. Per-agent parameters:

**Agent E1 — AI Search (25 questions, ids 201-225)**
- subagent_type: `general-purpose`
- model: `sonnet`
- description: `Generate 25 AI Search questions (knowledge-mining)`
- prompt content:
  - Shared schema block above
  - "Your topic: `knowledge-mining`. Your sub-area: Azure AI Search."
  - "Your URL list: read `build/url-list-v4.json` and use the `knowledge-mining-search` array. Every `source.url` you cite MUST appear in that array exactly."
  - "Your id range: 201..225 inclusive. Use each id exactly once. Produce ~25 questions."
  - "Type mix target: ~15 mc_single, ~1-2 mc_multi, ~5 sequence, ~3-4 hotspot."
  - "Coverage: indexes & indexer pipelines, skillsets (built-in + custom), knowledge store, integrated vectorization, vector / hybrid / semantic queries, RAG patterns with AI Search, scoring profiles & analyzers."
  - "BOUNDARY RULE (critical): you may only write about Document Intelligence when it appears as an AI Search skillset wrapper or as input to a search index. Do NOT write about the Document Intelligence service's own endpoints, SDKs, model training UX, or prebuilt model fields — that belongs to the other agent. If a draft would belong equally to both, default to the Document Intelligence agent (skip it)."
  - "Source freedom: up to 8 of your 25 may come from product-doc pages (the `learn.microsoft.com/en-us/azure/search/*` entries in your list); the rest should come from the training-module pages."
  - "Write your final output as a JSON array to `build/chunk-search-v4.json` using the Write tool, then return a one-line confirmation."

**Agent E2 — Document Intelligence (25 questions, ids 226-250)**
- subagent_type: `general-purpose`
- model: `sonnet`
- description: `Generate 25 Document Intelligence questions (knowledge-mining)`
- prompt content:
  - Shared schema block above
  - "Your topic: `knowledge-mining`. Your sub-area: Azure AI Document Intelligence."
  - "Your URL list: read `build/url-list-v4.json` and use the `knowledge-mining-di` array. Every `source.url` you cite MUST appear in that array exactly."
  - "Your id range: 226..250 inclusive. Use each id exactly once. Produce ~25 questions."
  - "Type mix target: ~15 mc_single, ~1-2 mc_multi, ~5 sequence, ~3-4 hotspot."
  - "Coverage: prebuilt models (invoice, receipt, ID, business card, layout, read), custom extraction models, custom classifiers, training & evaluation, signature / table / checkbox extraction, composed models."
  - "BOUNDARY RULE (critical): you OWN the Document Intelligence service itself. Write about its endpoints, SDKs, model training UX, prebuilt model output fields. If a question would belong to AI Search (about how DI outputs flow into a search index/skillset), that's the OTHER agent's territory — skip it."
  - "Write your final output as a JSON array to `build/chunk-di-v4.json` using the Write tool, then return a one-line confirmation."

- [ ] **Step 3: After both agents return, confirm files exist and are non-empty**

Run:
```bash
ls -la build/chunk-search-v4.json build/chunk-di-v4.json
python3 -c "import json; print('search:', len(json.load(open('build/chunk-search-v4.json')))); print('di:', len(json.load(open('build/chunk-di-v4.json'))))"
```

Expected: both files present, each printing a count ~25.

- [ ] **Step 4: Commit the raw chunk outputs**

```bash
git add build/chunk-search-v4.json build/chunk-di-v4.json
git commit -m "$(cat <<'EOF'
Raw v4 chunks: knowledge-mining (AI Search + Document Intelligence)

Two parallel subagents, 25 questions each. AI Search covers
indexes/skillsets/knowledge-store/vector/hybrid/semantic.
Document Intelligence covers prebuilt + custom + classifier models.
Boundary rule applied to prevent cross-domain overlap.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Validate each chunk

**Files:**
- Read: `build/chunk-search-v4.json`, `build/chunk-di-v4.json`, `build/url-list-v4.json`, `build/validate-v2.js`

The existing `build/validate-v2.js` validator hardcodes `build/url-list-v2.json` for the URL allowlist, and its allowed-topics list inside the script (`ALLOWED_TOPICS` constant) doesn't include `knowledge-mining`. Two adjustments are needed for this round:

1. Temporarily swap the URL list source (same trick as v3).
2. Extend the validator's own `ALLOWED_TOPICS` constant (a one-line patch to the script).

The URL list source needs special handling: the v4 file is keyed by sub-area (`knowledge-mining-search`, `knowledge-mining-di`), but the validator's `allUrls[topic]` lookup expects the topic name as the key. We solve this by pre-building a temporary URL list file keyed by `knowledge-mining`, containing the union of both sub-areas' URLs.

- [ ] **Step 1: Patch the validator's `ALLOWED_TOPICS` constant**

Use the Edit tool on `build/validate-v2.js`. Replace:
```js
const ALLOWED_TOPICS = ['agentic','genai-foundry','computer-vision','plan-and-manage'];
```
with:
```js
const ALLOWED_TOPICS = ['agentic','genai-foundry','computer-vision','plan-and-manage','knowledge-mining'];
```

- [ ] **Step 2: Build a temporary URL list keyed by `knowledge-mining`**

```bash
python3 - <<'PY'
import json
d = json.load(open('build/url-list-v4.json'))
combined = d['knowledge-mining-search'] + d['knowledge-mining-di']
json.dump({'knowledge-mining': combined}, open('build/url-list-v2.json.bak.tmp','w'), indent=2)
PY
cp build/url-list-v2.json build/url-list-v2.json.bak
cp build/url-list-v2.json.bak.tmp build/url-list-v2.json
```

- [ ] **Step 3: Run validator on both chunks**

Run:
```bash
node build/validate-v2.js build/chunk-search-v4.json knowledge-mining 201 225
node build/validate-v2.js build/chunk-di-v4.json    knowledge-mining 226 250
```

Expected on each: zero-exit, summary JSON printed.

Floors (per sub-area, post-validation):
- AI Search: count ≥22
- Document Intelligence: count ≥22

Type-mix tolerance: each `typeCounts.*` within ±2 of its per-agent target from Task 6 step 2.

- [ ] **Step 4: Boundary spot-check**

Open `build/chunk-search-v4.json` and `build/chunk-di-v4.json`. For each, read all 25 question stems and flag any that violate the boundary rule:
- Search chunk: any question primarily about Document Intelligence as a service (not as an AI Search skillset)?
- DI chunk: any question primarily about wiring DI outputs into an AI Search index?

Maximum acceptable cross-domain violations: 3 per chunk. If more, trigger Task 8.

- [ ] **Step 5: Restore the validator URL list**

```bash
mv build/url-list-v2.json.bak build/url-list-v2.json
rm build/url-list-v2.json.bak.tmp
```

- [ ] **Step 6: Commit the validator patch**

```bash
git add build/validate-v2.js
git commit -m "$(cat <<'EOF'
Allow knowledge-mining in chunk validator's ALLOWED_TOPICS

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Re-dispatch any chunk below floor or with boundary violations (conditional)

Only run this task if Task 7 failed for one or both chunks. If both passed, skip to Task 9.

**Files:**
- Re-create: the offending `build/chunk-*-v4.json`

- [ ] **Step 1: For each failed chunk, identify the failure mode**

Map each chunk's failure to one of:
- **A.** JSON malformed / schema violations → re-dispatch with parse errors in prompt
- **B.** Topic count below floor (22) → re-dispatch asking for `(floor - current)` more questions with new unused ids in the chunk's range; keep validated questions from prior round
- **C.** Type-mix off by >2 → re-dispatch asking specifically for missing types
- **D.** Boundary violations >3 → re-dispatch with explicit examples of failing questions and the boundary rule restated more strongly

- [ ] **Step 2: Dispatch only the failed agents (in one message if both)**

Reuse the prompt structure from Task 6 step 2 with:
- The original schema block
- Original URL list reference
- New id range = unused ids within the original range (if topping up) OR the same range (if regenerating from scratch)
- Explicit "previous attempt had these problems: …" preamble (paste 1-3 failing examples if applicable)
- Same Write-to-file instruction (overwrite if regenerating; write to a temp file if topping up, then merge by hand)

- [ ] **Step 3: Re-validate**

Re-run Task 7 step 2 + step 3. **Only one re-dispatch round.** If still below floor after one re-dispatch, accept the lower count and move on (quality-first stance from spec).

- [ ] **Step 4: Commit if changes occurred**

```bash
git add build/chunk-*-v4.json
git commit -m "Re-dispatched <sub-area> v4 chunk to address <failure mode>"
```

---

## Task 9: Merge validated chunks and inject into `practice2.html`

**Files:**
- Read: `build/chunk-search-v4.json`, `build/chunk-di-v4.json`
- Create: `build/merged-v4.json`
- Modify: `practice2.html` (`RAW_QUESTIONS` array — append before the closing `];`)

- [ ] **Step 1: Build the merged delta**

```bash
python3 - <<'PY'
import json
chunks = ['search-v4', 'di-v4']
out = []
for c in chunks:
    out.extend(json.load(open(f'build/chunk-{c}.json')))
ids = [q['id'] for q in out]
assert len(ids) == len(set(ids)), f'duplicate ids in merged delta: {[i for i in ids if ids.count(i) > 1]}'
assert min(ids) >= 201, f'new id collides with existing pool: min id is {min(ids)}'
assert max(ids) <= 250, f'new id exceeds reserved range: max id is {max(ids)}'
json.dump(out, open('build/merged-v4.json','w'), indent=2)
print(f'merged: {len(out)} questions, id range {min(ids)}..{max(ids)}')
PY
```

Expected: `merged: 50 questions, id range 201..250` (or fewer if Task 8 accepted under-target).

- [ ] **Step 2: Locate the closing `];` of `RAW_QUESTIONS`**

In this file the `RAW_QUESTIONS` array closes with `];` at column 0 (no indent), NOT `    ];` like other arrays. Confirm:
```bash
grep -nE '^\];$' practice2.html
```
Expected: one hit (the close of RAW_QUESTIONS).

- [ ] **Step 3: Insert the merged questions before the close**

```bash
python3 - <<'PY'
import json
src = open('practice2.html').read()
delta = json.load(open('build/merged-v4.json'))

def render(q):
    return '  ' + json.dumps(q, ensure_ascii=False)

block = ',\n'.join(render(q) for q in delta)

# Find the closing of RAW_QUESTIONS. The array opens with "const RAW_QUESTIONS = ["
# and closes with "\n];\n" at column 0.
start = src.index('const RAW_QUESTIONS = [')
close_idx = src.index('\n];\n', start)
before = src[:close_idx]
after  = src[close_idx:]
new_src = before + ',\n' + block + after
open('practice2.html','w').write(new_src)
print(f'inserted {len(delta)} questions before close at offset {close_idx}')
PY
```

- [ ] **Step 4: Verify counts in the modified file**

Run:
```bash
grep -oE '"id":\s*[0-9]+' practice2.html | wc -l
grep -oE '"topic":\s*"[^"]+"' practice2.html | sort | uniq -c
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | uniq -c | awk '$1 > 1'
```

Expected (with full delta):
- Total numeric ids: `250`
- Per topic: `50 agentic`, `50 genai-foundry`, `50 computer-vision`, `50 plan-and-manage`, `50 knowledge-mining`
- Duplicate-ids check: empty output

(Adjust expected if Task 8 accepted under-target.)

- [ ] **Step 5: Open `practice2.html` in a browser**

Expected:
- All five topic cards visible and ENABLED (previously disabled `knowledge-mining` card is now active).
- The new card shows `0 / 50 answered` (or carries over progress if you've practiced before).
- Click the new card: practice view opens, first knowledge-mining question renders.
- Click "Mixed": 20-question session draws from all five pools.
- Open browser console (F12): no `Rejected N invalid questions` warning, or if present the count is 0.

If the console shows rejections, inspect via the JS console:
```js
JSON.stringify(_vRes.invalid, null, 2)
```
Investigate any rejected entries; if specific entries are bad, remove them from the chunk file and re-run Task 9 step 1 + step 3.

- [ ] **Step 6: Commit the populated file**

```bash
git add practice2.html build/merged-v4.json
git commit -m "$(cat <<'EOF'
Inject +50 knowledge-mining questions (ids 201-250)

25 AI Search (ids 201-225): indexes, skillsets, knowledge store,
integrated vectorization, vector/hybrid/semantic, RAG patterns.

25 Document Intelligence (ids 226-250): prebuilt models, custom
extraction & classifier, training & evaluation, signatures/tables.

Pool: 200 → 250. Covers 5 of 6 AI-102 exam topics.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Final smoke-read

**Files:**
- Read: `practice2.html`

- [ ] **Step 1: Sample-read top/middle/bottom of RAW_QUESTIONS**

Read entries at ids 1-3, around id 125, and 248-250. For each:
- Required fields present
- `source.url` is a `learn.microsoft.com/...` URL
- `explanation` makes sense in context of the question

Run a quick automated scan:
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
PY
```

Expected:
- `question ids found: 250` (or close if Task 8 accepted under-target)
- `min: 1`, `max: 250`
- `gaps: []` (or a small set of unfilled ids inside 201..250)
- `non-learn URLs: []`

- [ ] **Step 2: No commit** — read-only verification.

---

## Task 11: Browser exercise (user-validated)

**Files:** none modified.

This is the human-in-the-loop check. The plan can be considered complete only after this passes.

- [ ] **Step 1: Open `practice2.html` in a real browser**

Verify on the home screen:
- All FIVE topic cards render with subtitles.
- The new `knowledge-mining` card shows `0 / 50` answered (or carries over progress if you've practiced before) and is ENABLED.

- [ ] **Step 2: Run a 5-question session in knowledge-mining**

Start the topic, answer 5 questions. Confirm: questions render, options render, grading works, explanations appear, source attribution links to `learn.microsoft.com`, Next advances. Note whether questions feel evenly split between AI Search and Document Intelligence (sampling within a topic is random, so 5 may not be perfectly balanced, but you should see both sub-areas across the first 10 or so).

- [ ] **Step 3: Run a 20-question mixed session**

Confirm distribution: questions from all five topics appear, weighting roughly matches exam % (KM at ~22% share of the new weight sum 77.5 → expect ~4-5 KM questions in a 20-question mixed session).

- [ ] **Step 4: Reset and re-open**

Click reset, reload, confirm in-progress state clears and home view is clean.

- [ ] **Step 5: Commit a marker that the build was user-validated** (optional)

```bash
git commit --allow-empty -m "$(cat <<'EOF'
User-validated v4 expansion: +50 knowledge-mining, 250 questions total

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review (post-write)

**Spec coverage:**
- "Add `knowledge-mining` to TOPICS, TOPIC_WEIGHTS, validator whitelist" → Tasks 2, 3, 4
- "Plumbing committed separately, browser-verified before generation" → Tasks 2-4 each commit; Task 4 step 4 verifies the new card renders disabled
- "50 questions split 25/25 between AI Search (ids 201-225) and DI (ids 226-250)" → Task 6, Task 9
- "Sub-area boundary rule" → Task 6 step 2 (per-agent prompts), Task 7 step 4 (validation)
- "URL allowlist with per-sub-area sources + product-doc supplements" → Task 5
- "Quality floor ≥22 per sub-area, one re-dispatch round" → Task 7 step 3 (floors), Task 8 (conditional re-dispatch)
- "Source.url ∈ agent's assigned list" → Task 7 step 3 (validator enforces this via the swapped url-list)
- "No id collisions with existing 1..200" → Task 1 verifies start, Task 9 step 1 asserts at merge
- "Storage preserved (key ai102-practice-v2)" → no migration in any task
- "Single static HTML file" → only `practice2.html` is modified (plus `build/validate-v2.js` line patch in Task 7 step 1)
- "5-topic mixed mode" → Task 11 step 3 validates distribution

All spec requirements have at least one task. No gaps.

**Placeholder scan:** No TBDs, no "implement appropriate error handling", no naked "write tests for the above". Each step has either exact code, an exact command, or a concrete verification action.

**Type consistency:** Topic id used throughout is exactly `knowledge-mining` (with a hyphen, lowercase). The validator constant name `ALLOWED_TOPICS` (Task 7 step 1) matches the actual constant name in `build/validate-v2.js`. Id ranges 201..225 and 226..250 do not overlap and sum to 50. The URL list key suffixes `-search` and `-di` (Task 5 step 3) are consistently referenced in Task 6 step 2 and Task 7 step 2.

The validator's URL key handling (Task 7 step 2 builds a combined `knowledge-mining` key from the two sub-area keys) is internally consistent: both chunks validate against the same combined allowlist, which is correct because both sub-areas legitimately belong to the same topic — the sub-area split is for content discipline, not for URL ownership.

No issues to fix.
