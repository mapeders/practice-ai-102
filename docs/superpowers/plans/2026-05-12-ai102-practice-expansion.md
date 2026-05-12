# AI-102 practice expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `practice2.html` from 60 to ~160 AI-102 practice questions by adding two new topic categories (computer-vision, plan-and-manage) and topping up the two existing weak categories (agentic, genai-foundry), driven by score-report signal.

**Architecture:** Top-up build over a single static HTML file. Generate +100 questions via 4 parallel subagents (one per topic), validate against schema + assigned-URL allowlist + floor counts, then append to the existing `RAW_QUESTIONS` array. Update `TOPICS`, `TOPIC_WEIGHTS`, validator topic whitelist, and one renderer template. Storage shape and existing in-progress practice state preserved.

**Tech Stack:** Plain HTML + inline JavaScript, Tailwind via CDN, `localStorage` for state, `WebFetch` for Microsoft Learn unit pages, parallel `general-purpose` subagents for question generation.

**Spec:** `docs/superpowers/specs/2026-05-12-ai102-practice-expansion-design.md`

---

## File Structure

**Modified:**
- `practice2.html` — single source-of-truth file:
  - line 54: `RAW_QUESTIONS` array (append +100 entries)
  - line 2399: `TOPICS` array (extend with two entries + `subtitle` field)
  - line 2403: `TOPIC_WEIGHTS` map (extend with two entries)
  - line 2417: validator topic whitelist inside `validateQuestions` (extend allowed list)
  - lines 2522-2540: `renderHome` (render `subtitle` on each topic card)
  - line 2551: mixed-mode card copy update ("both topics" → "all four topics")

**Created (build artifacts, not shipped):**
- `build/url-list-v2.json` — enumerated Learn-unit URLs grouped by topic
- `build/chunk-agentic.json` — agent A output
- `build/chunk-genai.json` — agent B output
- `build/chunk-cv.json` — agent C output
- `build/chunk-plan.json` — agent D output
- `build/merged-v2.json` — validated merged delta before injection

**Reference (read only):**
- `docs/superpowers/specs/2026-05-12-ai102-practice-expansion-design.md` — spec
- `scorereport.pdf` — score report
- `build/questions.json` — existing 60 questions (for reference / id-range confirmation)

---

## Task 1: Pre-flight — verify existing pool integrity

**Files:**
- Read: `practice2.html` (RAW_QUESTIONS block starting line 54)

- [ ] **Step 1: Confirm 60 questions, ids 1..60 unique, topics agentic/genai-foundry only**

Run:
```bash
grep -c '"id":' practice2.html
grep -oE '"topic":\s*"[^"]+"' practice2.html | sort | uniq -c
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | uniq -c | awk '$1 > 1'
```

Expected:
- First command: `60`
- Second: `32 "topic": "agentic"` and `28 "topic": "genai-foundry"`
- Third: empty output (no duplicate ids)

If any of these don't match, stop and surface the discrepancy — the spec assumes a clean 1..60 starting point and the id-range allocation below depends on it.

- [ ] **Step 2: Capture max(id) as the offset for new ids**

Run:
```bash
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | tail -1
```

Expected: `60`. New ids will start at 61.

- [ ] **Step 3: Commit nothing** — this is a read-only verification step.

---

## Task 2: Extend `TOPICS` array with the two new topic entries and a `subtitle` field

**Files:**
- Modify: `practice2.html:2399-2402`

- [ ] **Step 1: Replace the TOPICS declaration**

Current (lines 2399-2402):
```js
const TOPICS = [
  { id: "agentic",       title: "Implement an agentic solution",                 weight: "5-10%"  },
  { id: "genai-foundry", title: "Implement generative AI solutions (Foundry)",  weight: "15-20%" },
];
```

Replace with:
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

- [ ] **Step 2: Open `practice2.html` in a browser and load the home view**

Expected: four topic cards render. The two new cards are visually present but **disabled** (`opacity-50`, "no questions yet") because no questions match their topic ids yet. Subtitles do not yet render (template change comes in Task 5).

If only two cards render, the edit did not take. Re-check the indentation/quoting.

- [ ] **Step 3: Commit**

```bash
git add practice2.html
git commit -m "Add two topic entries to TOPICS for cv and plan-and-manage"
```

---

## Task 3: Extend `TOPIC_WEIGHTS` map

**Files:**
- Modify: `practice2.html:2403`

- [ ] **Step 1: Replace TOPIC_WEIGHTS**

Current (line 2403):
```js
const TOPIC_WEIGHTS = { "agentic": 7.5, "genai-foundry": 17.5 };
```

Replace with (use exam-weight midpoints):
```js
const TOPIC_WEIGHTS = {
  "agentic": 7.5,
  "genai-foundry": 17.5,
  "computer-vision": 12.5,
  "plan-and-manage": 22.5,
};
```

- [ ] **Step 2: Reload `practice2.html` in the browser and click "Mixed"**

Expected: mixed mode still works. Today this samples only across the two topics with non-zero question pools (the new topics' weights have no effect yet because `pool.length === 0` short-circuits in `startMixed`, line 2585). No regression.

- [ ] **Step 3: Commit**

```bash
git add practice2.html
git commit -m "Add weight entries for cv and plan-and-manage in TOPIC_WEIGHTS"
```

---

## Task 4: Extend validator topic whitelist

**Files:**
- Modify: `practice2.html:2417`

- [ ] **Step 1: Update the allowed-topics check inside `validateQuestions`**

Current (line 2417, inside the for-loop in `validateQuestions`):
```js
if (!['agentic','genai-foundry'].includes(q.topic)) errs.push('bad topic');
```

Replace with:
```js
if (!['agentic','genai-foundry','computer-vision','plan-and-manage'].includes(q.topic)) errs.push('bad topic');
```

- [ ] **Step 2: Reload the page and check the browser console**

Expected: no new console warnings. No question in the current 60 uses the new topic ids, so behaviour is unchanged. Future questions with the new topic ids will now pass validation; without this change they would be filtered out at load time.

- [ ] **Step 3: Commit**

```bash
git add practice2.html
git commit -m "Allow cv and plan-and-manage topics in question validator"
```

---

## Task 5: Render the `subtitle` field on topic cards in `renderHome`

**Files:**
- Modify: `practice2.html:2528-2539` (the `cards` template literal inside `renderHome`)

- [ ] **Step 1: Insert a subtitle line into the card template**

Current (lines 2528-2539, the `return` block inside `TOPICS.map`):
```js
return `
  <button class="topic-card w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-msblue active:bg-gray-100 dark:active:bg-gray-700'}"
          data-topic="${t.id}" ${disabled ? 'disabled' : ''}>
    <div class="flex justify-between items-start gap-2">
      <div class="font-semibold">${t.title}</div>
      <div class="text-sm text-gray-500 whitespace-nowrap">${t.weight}</div>
    </div>
    <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      ${disabled ? 'no questions yet' : `${s.answered} / ${s.total} answered · ${s.pct}% correct`}
    </div>
    ${disabled ? '' : `<div class="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"><div class="h-full bg-msblue" style="width:${s.total ? Math.round((s.answered/s.total)*100) : 0}%"></div></div>`}
  </button>`;
```

Replace with (adds a single subtitle line below the title row, only when `t.subtitle` is present so existing topics with no subtitle wouldn't break):
```js
return `
  <button class="topic-card w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-msblue active:bg-gray-100 dark:active:bg-gray-700'}"
          data-topic="${t.id}" ${disabled ? 'disabled' : ''}>
    <div class="flex justify-between items-start gap-2">
      <div class="font-semibold">${t.title}</div>
      <div class="text-sm text-gray-500 whitespace-nowrap">${t.weight}</div>
    </div>
    ${t.subtitle ? `<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">${t.subtitle}</div>` : ''}
    <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      ${disabled ? 'no questions yet' : `${s.answered} / ${s.total} answered · ${s.pct}% correct`}
    </div>
    ${disabled ? '' : `<div class="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"><div class="h-full bg-msblue" style="width:${s.total ? Math.round((s.answered/s.total)*100) : 0}%"></div></div>`}
  </button>`;
```

- [ ] **Step 2: Reload `practice2.html` in the browser**

Expected: four topic cards now each show a one-line grey subtitle between the title and the "X / Y answered" line. Verify all four subtitles render correctly. The two existing topics show their new subtitles; the two new topics show theirs (still disabled).

- [ ] **Step 3: Commit**

```bash
git add practice2.html
git commit -m "Render topic subtitles on home cards"
```

---

## Task 6: Update mixed-mode card copy to reflect four topics

**Files:**
- Modify: `practice2.html:2549-2553`

- [ ] **Step 1: Update mixed-mode card description**

Current (lines 2549-2553):
```js
const mixedCard = QUESTIONS.length > 0 ? `
  <button class="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 hover:border-msblue" data-mode="mixed">
    <div class="font-semibold">Mixed — random across both topics</div>
    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">20 questions weighted by exam %</div>
  </button>` : '';
```

Replace with:
```js
const mixedCard = QUESTIONS.length > 0 ? `
  <button class="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 hover:border-msblue" data-mode="mixed">
    <div class="font-semibold">Mixed — random across all topics</div>
    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">20 questions weighted by exam %</div>
  </button>` : '';
```

- [ ] **Step 2: Reload the page**

Expected: mixed-mode card now reads "Mixed — random across all topics".

- [ ] **Step 3: Commit**

```bash
git add practice2.html
git commit -m "Update mixed-mode card copy for four topics"
```

---

## Task 7: Build URL list for the four topics

**Files:**
- Create: `build/url-list-v2.json`

- [ ] **Step 1: Enumerate Learn-path unit URLs for each topic**

Use WebFetch on each of the following index pages and extract every `learn.microsoft.com/.../training/modules/.../<unit>/?pivots=text` URL listed. Tag each URL with its topic.

Paths to enumerate:
- `agentic` → `https://learn.microsoft.com/en-us/training/paths/develop-ai-agents-azure/`
- `genai-foundry` → `https://learn.microsoft.com/en-us/training/paths/develop-generative-ai-apps/` plus, optionally up to 1 module worth, `https://learn.microsoft.com/en-us/training/modules/responsible-ai-studio/`
- `computer-vision` → `https://learn.microsoft.com/en-us/training/paths/develop-computer-vision-solutions-azure/` plus, for the video bias, several pages from `https://learn.microsoft.com/en-us/azure/azure-video-indexer/` (specifically: `video-indexer-overview`, `concepts-content-models`, `analyze-video-using-rest-api`, `customize-language-model-with-api`, `cognitive-search`)
- `plan-and-manage` → `https://learn.microsoft.com/en-us/training/paths/prepare-develop-ai-solutions-azure/` plus, for governance, `https://learn.microsoft.com/en-us/training/modules/responsible-ai-studio/`

Note: if a Learn path has been renamed/restructured, follow the redirect and use the current canonical URL — record the canonical URL in the output.

- [ ] **Step 2: Write `build/url-list-v2.json`**

Structure:
```json
{
  "agentic":          [{ "url": "...?pivots=text", "module": "...", "unit": "..." }, ...],
  "genai-foundry":    [...],
  "computer-vision":  [...],
  "plan-and-manage":  [...]
}
```

Each entry must include the `?pivots=text` suffix on the URL where the page supports it.

- [ ] **Step 3: Sanity check the counts**

Run:
```bash
python3 -c "import json; d=json.load(open('build/url-list-v2.json')); [print(k, len(v)) for k,v in d.items()]"
```

Expected (rough): each topic has ≥6 URLs (gives each agent enough variety; one question per URL would suffice for the smaller deltas, with some doubling-up for cv and plan).

If any topic has <6, expand its list before continuing (e.g., follow "next module" links from the path page).

- [ ] **Step 4: Commit**

```bash
git add build/url-list-v2.json
git commit -m "Enumerate Learn URL lists for v2 expansion"
```

---

## Task 8: Dispatch 4 parallel subagents to generate questions

**Files:**
- Create: `build/chunk-agentic.json`, `build/chunk-genai.json`, `build/chunk-cv.json`, `build/chunk-plan.json`

This task uses one message with four `Agent` tool-uses (subagent_type `general-purpose`) so all four run concurrently. Each subagent gets the schema, its URL list, its id range, and topic-specific discipline rules.

- [ ] **Step 1: Prepare the shared question schema text**

Schema (copy verbatim into each agent prompt):
```
Each question is a JSON object:
{
  id: <int, unique, within your assigned range>,
  topic: <one of: "agentic", "genai-foundry", "computer-vision", "plan-and-manage">,
  type: <one of: "mc_single", "mc_multi", "sequence", "hotspot">,
  question: "<question body, plain text; can include code blocks>",
  explanation: "<post-answer explanation grounded in the cited Learn unit>",
  source: {
    path: "<Learn path title>",
    module: "<Learn module title>",
    unit: "<Learn unit title>",
    url: "<exact URL from your assigned list, including ?pivots=text>"
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
- Distractors must be plausible: other Foundry / Azure AI services, near-miss API names, similar settings.
- Output: a single JSON array (no markdown fences, no commentary). The array contains your N questions.
```

- [ ] **Step 2: Dispatch all four agents in a single message**

Use one assistant message containing four `Agent` tool-uses (this runs them concurrently). Per-agent parameters:

**Agent A — agentic (+18)**
- subagent_type: `general-purpose`
- description: `Generate 18 agentic questions`
- prompt content:
  - Shared schema block above
  - "Your topic: `agentic`. Your URL list: <list from url-list-v2.json key 'agentic'>"
  - "Your id range: 61..78 inclusive. Use each id exactly once. Produce ~18 questions."
  - "Type mix target: ~11 mc_single, ~1 mc_multi, ~4 sequence, ~2 hotspot."
  - "Topic bias: prefer underrepresented sub-areas — Foundry IQ knowledge sources, multi-agent orchestration, MCP integration, agent tools (file search, code interpreter, function calling)."
  - "Write your final output as a JSON array to `build/chunk-agentic.json` using the Write tool, then return a one-line confirmation."

**Agent B — genai-foundry (+22)**
- subagent_type: `general-purpose`
- description: `Generate 22 genai-foundry questions`
- prompt content:
  - Shared schema block above
  - "Your topic: `genai-foundry`. Your URL list: <list from url-list-v2.json key 'genai-foundry'>"
  - "Your id range: 79..100 inclusive. Use each id exactly once. Produce ~22 questions."
  - "Type mix target: ~13 mc_single, ~1 mc_multi, ~5 sequence, ~3 hotspot."
  - "Topic bias: model catalog & deployment options, Prompt Flow, Responses API, content filters, evaluation. Up to 4 questions may come from the responsible-AI module URL if present in your list."
  - "Write your final output as a JSON array to `build/chunk-genai.json` and return a one-line confirmation."

**Agent C — computer-vision (+30, video-biased)**
- subagent_type: `general-purpose`
- description: `Generate 30 computer-vision questions, video-biased`
- prompt content:
  - Shared schema block above
  - "Your topic: `computer-vision`. Your URL list: <list from url-list-v2.json key 'computer-vision'>"
  - "Your id range: 101..130 inclusive. Use each id exactly once. Produce ~30 questions."
  - "Type mix target: ~18 mc_single, ~2 mc_multi, ~6 sequence, ~4 hotspot."
  - "Video bias: 8 to 10 of your 30 questions MUST target video analysis — Azure AI Video Indexer, video frame extraction, custom vision on video frames, video moderation, spatial analysis on video. Use the video-indexer URLs in your list for these."
  - "Coverage: the remaining 20-22 should cover image analysis, face, OCR (Document Intelligence overlap is fine), custom vision on images."
  - "Write your final output as a JSON array to `build/chunk-cv.json` and return a one-line confirmation."

**Agent D — plan-and-manage (+30, AI-services-disciplined)**
- subagent_type: `general-purpose`
- description: `Generate 30 plan-and-manage questions`
- prompt content:
  - Shared schema block above
  - "Your topic: `plan-and-manage`. Your URL list: <list from url-list-v2.json key 'plan-and-manage'>"
  - "Your id range: 131..160 inclusive. Use each id exactly once. Produce ~30 questions."
  - "Type mix target: ~18 mc_single, ~2 mc_multi, ~6 sequence, ~4 hotspot."
  - "DISCIPLINE: every question must be specifically about **Azure AI services** concerns, not generic Azure. Acceptable: multi-service vs single-service AI-services account, AI-services SKU/region selection, endpoints/keys for AI services, managed identity for an AI workload, private endpoints for AI services, customer-managed keys for AI services, diagnostic settings / Application Insights for AI services, Azure AI Content Safety configuration, responsible AI tooling. Not acceptable: generic Azure RBAC mechanics, generic VNet design, generic Azure Monitor not scoped to AI workloads — questions like that would belong on AZ-104, not AI-102. Reject any draft that could appear on a non-AI Azure exam."
  - "Write your final output as a JSON array to `build/chunk-plan.json` and return a one-line confirmation."

- [ ] **Step 3: After all four agents return, confirm files exist**

Run:
```bash
ls -la build/chunk-*.json
```

Expected: four files, each non-empty.

- [ ] **Step 4: Commit the raw chunk outputs**

```bash
git add build/chunk-agentic.json build/chunk-genai.json build/chunk-cv.json build/chunk-plan.json
git commit -m "Raw v2 question chunks from parallel subagents"
```

---

## Task 9: Validate each chunk

**Files:**
- Read: `build/chunk-*.json`, `build/url-list-v2.json`
- Create: `build/validate-v2.js` (chunk validator)

- [ ] **Step 1: Write the chunk validator**

Create `build/validate-v2.js`:
```js
// Validates one chunk JSON file against schema + assigned URL list + id range + topic.
// Usage: node build/validate-v2.js <chunk-file> <topic> <id-min> <id-max>
// Exits non-zero on validation failure; prints a JSON summary on success.
const fs = require('fs');
const path = require('path');

const [,, chunkPath, topic, idMinStr, idMaxStr] = process.argv;
if (!chunkPath || !topic || !idMinStr || !idMaxStr) {
  console.error('Usage: node build/validate-v2.js <chunk-file> <topic> <id-min> <id-max>');
  process.exit(2);
}
const idMin = parseInt(idMinStr, 10);
const idMax = parseInt(idMaxStr, 10);

const allUrls = JSON.parse(fs.readFileSync('build/url-list-v2.json', 'utf8'));
const allowedUrls = new Set((allUrls[topic] || []).map(u => u.url));

const arr = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
if (!Array.isArray(arr)) { console.error('not a JSON array'); process.exit(1); }

const ALLOWED_TOPICS = ['agentic','genai-foundry','computer-vision','plan-and-manage'];
const ALLOWED_TYPES  = ['mc_single','mc_multi','sequence','hotspot'];
const errs = [];
const seenIds = new Set();
const typeCounts = { mc_single: 0, mc_multi: 0, sequence: 0, hotspot: 0 };

for (const q of arr) {
  const eid = q && q.id;
  const pre = `id=${eid}`;
  if (typeof q.id !== 'number') errs.push(`${pre}: id not a number`);
  else if (q.id < idMin || q.id > idMax) errs.push(`${pre}: id out of range [${idMin}..${idMax}]`);
  else if (seenIds.has(q.id)) errs.push(`${pre}: duplicate id`);
  else seenIds.add(q.id);

  if (q.topic !== topic) errs.push(`${pre}: topic ${q.topic} != ${topic}`);
  if (!ALLOWED_TYPES.includes(q.type)) errs.push(`${pre}: bad type ${q.type}`);
  if (typeof q.question !== 'string' || !q.question.trim()) errs.push(`${pre}: missing question`);
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) errs.push(`${pre}: missing explanation`);
  if (!q.source || !q.source.url || !q.source.path || !q.source.module || !q.source.unit) {
    errs.push(`${pre}: missing source fields`);
  } else if (!allowedUrls.has(q.source.url)) {
    errs.push(`${pre}: source.url not in assigned list (${q.source.url})`);
  }

  if (ALLOWED_TYPES.includes(q.type)) typeCounts[q.type]++;

  if (q.type === 'mc_single' || q.type === 'mc_multi') {
    if (!Array.isArray(q.options) || q.options.length < 2) errs.push(`${pre}: options must be 2+`);
    if (!Array.isArray(q.correct) || q.correct.length === 0) errs.push(`${pre}: correct missing`);
    if (q.type === 'mc_single' && q.correct && q.correct.length !== 1) errs.push(`${pre}: mc_single needs exactly 1 correct`);
    if (q.type === 'mc_multi'  && q.correct && q.correct.length < 2)   errs.push(`${pre}: mc_multi needs 2+ correct`);
    const optIds = new Set((q.options || []).map(o => o && o.id));
    for (const c of (q.correct || [])) if (!optIds.has(c)) errs.push(`${pre}: correct id ${c} not in options`);
  } else if (q.type === 'sequence') {
    if (!Array.isArray(q.items) || q.items.length < 3) errs.push(`${pre}: items must be 3+`);
    if (!Array.isArray(q.correct_order)) errs.push(`${pre}: correct_order missing`);
    else if (q.items && q.items.length !== q.correct_order.length) errs.push(`${pre}: items/correct_order length mismatch`);
    const itemIds = new Set((q.items || []).map(i => i && i.id));
    for (const c of (q.correct_order || [])) if (!itemIds.has(c)) errs.push(`${pre}: correct_order id ${c} not in items`);
  } else if (q.type === 'hotspot') {
    if (!Array.isArray(q.blanks) || q.blanks.length < 2) errs.push(`${pre}: blanks must be 2+`);
    for (const b of (q.blanks || [])) {
      if (!b || !b.id || !b.prompt || !Array.isArray(b.options) || b.options.length < 2 || b.correct == null) {
        errs.push(`${pre}: blank malformed`); break;
      }
      const bOpts = new Set(b.options.map(o => o && o.id));
      if (!bOpts.has(b.correct)) { errs.push(`${pre}: blank correct ${b.correct} not in options`); break; }
    }
  }
}

const summary = {
  chunk: path.basename(chunkPath),
  topic, count: arr.length,
  ids: { min: Math.min(...arr.map(q=>q.id)), max: Math.max(...arr.map(q=>q.id)) },
  typeCounts,
  errors: errs.length,
};
if (errs.length) {
  console.error(JSON.stringify(summary, null, 2));
  console.error('--- errors ---');
  for (const e of errs.slice(0, 50)) console.error(e);
  if (errs.length > 50) console.error(`... and ${errs.length - 50} more`);
  process.exit(1);
}
console.log(JSON.stringify(summary, null, 2));
```

- [ ] **Step 2: Run validator on each chunk**

Run all four (sequentially is fine, validation is fast):
```bash
node build/validate-v2.js build/chunk-agentic.json agentic 61 78
node build/validate-v2.js build/chunk-genai.json    genai-foundry 79 100
node build/validate-v2.js build/chunk-cv.json       computer-vision 101 130
node build/validate-v2.js build/chunk-plan.json     plan-and-manage 131 160
```

Expected on each: zero-exit, summary JSON printed. Floors (post-validation):
- agentic: count ≥16
- genai-foundry: count ≥20
- computer-vision: count ≥28
- plan-and-manage: count ≥28

Type-mix tolerance: each `typeCounts.*` within ±2 of its per-topic target (Task 8 step 2).

- [ ] **Step 3: For computer-vision, manually verify the video bias**

Open `build/chunk-cv.json` and count questions whose `source.url` is under `azure-video-indexer/` OR whose `question` text mentions video/Video Indexer/frames/spatial analysis on video. Should be 8-10 of 30.

Run:
```bash
python3 -c "import json; d=json.load(open('build/chunk-cv.json')); v=[q for q in d if 'video' in (q.get('question','')+q.get('source',{}).get('url','')).lower()]; print(f'video-related: {len(v)} / {len(d)}')"
```

Expected: 8-10. If under 8, this triggers Task 10 (re-dispatch) targeting more video questions.

- [ ] **Step 4: For plan-and-manage, manually spot-check AI-services discipline**

Open `build/chunk-plan.json`. Read all 30 questions and flag any that would be at home on AZ-104 (e.g., "How do you create an Azure VNet?"). Maximum acceptable cross-over: 2 of 30. If more than 2 look generic-Azure, this triggers Task 10 for that chunk.

- [ ] **Step 5: Commit validator and validation pass**

```bash
git add build/validate-v2.js
git commit -m "Add chunk validator for v2 question generation"
```

---

## Task 10: Re-dispatch any chunk below floor or with discipline failures (conditional)

Only run this task if Task 9 failed for one or more chunks.

**Files:**
- Re-create: the offending `build/chunk-*.json`

- [ ] **Step 1: For each failed chunk, identify the failure mode**

Map each chunk's failure to one of:
- **A.** JSON malformed / schema violations → re-dispatch with parse errors in prompt
- **B.** Topic count below floor → re-dispatch asking for `(floor - current)` more questions, with new unused ids in the chunk's range; keep validated questions from prior round
- **C.** Type-mix off by >2 → re-dispatch asking specifically for missing types
- **D.** Video bias under 8 (cv only) → re-dispatch agent C asking for additional video-only questions
- **E.** Plan discipline failures > 2 (plan only) → re-dispatch agent D with explicit examples of failing questions and the AI-services-only rule restated

- [ ] **Step 2: Dispatch only the failed agents (in one message if more than one)**

Reuse the prompt structure from Task 8 step 2 with:
- The original schema block
- Original URL list (or a subset if scoping to a sub-area for D)
- New id range = unused ids within the original range (if topping up) OR the same range (if regenerating from scratch)
- Explicit "previous attempt had these problems: …" preamble
- Same Write-to-file instruction (overwrite if regenerating; write to a temp file if topping up, then merge)

- [ ] **Step 3: Re-validate**

Run the relevant `node build/validate-v2.js …` commands again. **Only one re-dispatch round.** If still below floor after one re-dispatch, accept the lower count and move on (quality-first stance from spec).

- [ ] **Step 4: Commit if changes occurred**

```bash
git add build/chunk-*.json
git commit -m "Re-dispatched <topic> chunk to address <failure mode>"
```

---

## Task 11: Merge validated chunks and inject into `practice2.html`

**Files:**
- Read: `build/chunk-*.json`
- Create: `build/merged-v2.json`
- Modify: `practice2.html:54-???` (the `RAW_QUESTIONS` array — append before the closing `];`)

- [ ] **Step 1: Build the merged delta**

Create `build/merged-v2.json` by concatenating the four chunk arrays in order (agentic, genai, cv, plan):
```bash
python3 - <<'PY'
import json
chunks = ['agentic','genai','cv','plan']
out = []
for c in chunks:
    out.extend(json.load(open(f'build/chunk-{c}.json')))
# safety: dedupe ids
ids = [q['id'] for q in out]
assert len(ids) == len(set(ids)), 'duplicate ids in merged delta'
# safety: all ids >= 61
assert min(ids) >= 61, 'new id collides with existing pool (1..60)'
json.dump(out, open('build/merged-v2.json','w'), indent=2)
print(f'merged: {len(out)} questions, id range {min(ids)}..{max(ids)}')
PY
```

Expected: `merged: 100 questions, id range 61..160` (or fewer if Task 10 accepted under-target).

- [ ] **Step 2: Find the closing bracket of `RAW_QUESTIONS` in practice2.html**

Run:
```bash
grep -n "^    \];" practice2.html | head -5
```

This finds top-level array closings. The first one after line 54 is the close of `RAW_QUESTIONS`. Record its line number — call it `CLOSE_LINE`.

- [ ] **Step 3: Insert the merged questions before `CLOSE_LINE`**

Use the Edit tool on `practice2.html`. The exact insertion point is immediately before the line `    ];` that closes `RAW_QUESTIONS`. The last existing question entry ends with `}` and is followed by either `,` or nothing (last entry).

Inspect the last entry first:
```bash
grep -n "^    \];" practice2.html | head -1
```

Then read the 3 lines before that closing bracket to confirm the last entry's trailing punctuation. Then insert:

1. If the last existing entry has no trailing comma, add one.
2. Insert each question from `build/merged-v2.json` in canonical 2-space-indented JS-object form, comma-separated, immediately above the `    ];` line.

Concretely, use a small helper rather than editing by hand:
```bash
python3 - <<'PY'
import json, re
src = open('practice2.html').read()
delta = json.load(open('build/merged-v2.json'))

# Render each entry as a 4-space-indented JS object (JSON is valid JS for our shape).
def render(q):
    return '    ' + json.dumps(q, ensure_ascii=False)

block = ',\n'.join(render(q) for q in delta)

# Find the closing of RAW_QUESTIONS: the first "\n    ];\n" after the `const RAW_QUESTIONS = [` line.
start = src.index('const RAW_QUESTIONS = [')
close_idx = src.index('\n    ];\n', start)
# Insert ", " before close so existing last entry gets a trailing comma, then our block, then newline.
before = src[:close_idx]
after  = src[close_idx:]  # starts with "\n    ];\n"
new_src = before + ',\n' + block + after
open('practice2.html','w').write(new_src)
print(f'inserted {len(delta)} questions before close at offset {close_idx}')
PY
```

- [ ] **Step 4: Verify counts in the modified file**

Run:
```bash
grep -c '"id":' practice2.html
grep -oE '"topic":\s*"[^"]+"' practice2.html | sort | uniq -c
```

Expected (with full delta):
- Total: ~160
- Per topic: ~50 agentic, ~50 genai-foundry, ~30 computer-vision, ~30 plan-and-manage
- (Adjust expected if Task 10 accepted under-target.)

Also confirm no duplicate ids:
```bash
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | uniq -c | awk '$1 > 1'
```
Expected: empty output.

- [ ] **Step 5: Open `practice2.html` in a browser**

Expected:
- Four topic cards visible, all enabled (each shows a non-zero "X / Y answered" line; for fresh state it'd be "0 / N answered").
- Click each card: practice view opens, first question renders.
- Click "Mixed": 20-question session draws from all four pools.
- Open browser console: no "Rejected N invalid questions" warning (or, if there is one, the count must be 0 — i.e., absent or `Rejected 0 invalid questions`).

If the console shows rejections, run the in-file validator manually on the merged file via the JS console:
```js
JSON.stringify(_vRes.invalid, null, 2)
```
Investigate any rejected entries.

- [ ] **Step 6: Commit the populated file**

```bash
git add practice2.html build/merged-v2.json
git commit -m "Inject +100 v2 questions: agentic, genai, cv, plan-and-manage"
```

---

## Task 12: Final smoke-read

**Files:**
- Read: `practice2.html`

- [ ] **Step 1: Sample-read top/middle/bottom of RAW_QUESTIONS**

Read the first 3, middle 3, and last 3 entries of `RAW_QUESTIONS`. For each:
- Required fields present
- `source.url` is a `learn.microsoft.com/...` URL
- `explanation` makes sense in context of the question

Run a quick automated scan for obvious problems:
```bash
python3 - <<'PY'
import re, json
src = open('practice2.html').read()
# Crude extraction: pull every {...} object inside RAW_QUESTIONS via regex by id.
ids = sorted(int(m.group(1)) for m in re.finditer(r'"id":\s*(\d+)', src))
print('total ids:', len(ids), 'min:', min(ids), 'max:', max(ids))
print('gaps:', [i for i in range(min(ids), max(ids)+1) if i not in set(ids)])
# Check all source URLs start with https://learn.microsoft.com
bad = re.findall(r'"url":\s*"((?!https://learn\.microsoft\.com)[^"]*)"', src)
print('non-learn URLs:', bad)
PY
```

Expected:
- `total ids: ~160`
- `min: 1`, `max: ~160`
- `gaps: []` (or a small acceptable set if Task 10 accepted under-target — in that case the gaps are the un-filled ids)
- `non-learn URLs: []`

- [ ] **Step 2: Spot-check the video bias once more in-place**

```bash
python3 -c "
import re
src = open('practice2.html').read()
cv_block = re.findall(r'\\{[^{}]*\"topic\":\\s*\"computer-vision\"[^{}]*\\}', src, flags=re.DOTALL)
print('cv entries scanned:', len(cv_block))
video = [b for b in cv_block if 'video' in b.lower()]
print('video-related cv:', len(video))
"
```

Expected: `video-related cv: 8-10` (the bias target).

- [ ] **Step 3: No commit** — read-only verification.

---

## Task 13: Browser exercise (user-validated)

**Files:** none modified

This is the human-in-the-loop check. The plan can be considered complete only after this passes.

- [ ] **Step 1: Open `practice2.html` in a real browser**

Verify on the home screen:
- All four topic cards render with subtitles
- Each card shows correct exam weight on the right
- Each card is enabled (clickable)
- Mixed mode card reads "Mixed — random across all topics"

- [ ] **Step 2: Run a 5-question session in each new topic**

For both `computer-vision` and `plan-and-manage`:
- Start the topic
- Answer 5 questions
- Confirm: question renders, options render, grading works, explanation appears, source attribution links to `learn.microsoft.com`, Next advances

- [ ] **Step 3: Run a 20-question mixed session**

Confirm the distribution feels right (questions from multiple topics, weighting roughly matches exam %, no obvious crashes).

- [ ] **Step 4: Reset and re-open**

Click reset, reload, confirm in-progress state clears and home view is clean.

- [ ] **Step 5: Commit a marker that the build was user-validated** (optional)

```bash
git commit --allow-empty -m "User-validated v2 expansion: 4 topics, ~160 questions"
```

---

## Self-Review (post-write)

**Spec coverage:**
- "Add ~100 questions, ~160 total" → Tasks 8, 11
- "Add `computer-vision` and `plan-and-manage` topic ids" → Tasks 2, 4
- "Update validator whitelist" → Task 4
- "Add `TOPIC_WEIGHTS` entries" → Task 3
- "Subtitle field on topic cards" → Tasks 2, 5
- "Video bias 8-10 of 30 in cv" → Task 8 step 2 (agent C prompt), Task 9 step 3 (validation), Task 12 step 2
- "Plan-and-manage AI-services discipline" → Task 8 step 2 (agent D prompt), Task 9 step 4 (validation)
- "Quality floors with one re-dispatch round" → Task 9 floors, Task 10 conditional re-dispatch
- "Source.url ∈ agent's assigned list" → `build/validate-v2.js`
- "No id collisions with existing 1..60" → Task 1 verifies start, Task 11 merge script asserts
- "Preserve localStorage" → no migration anywhere in plan; storage key untouched
- "Mixed-mode draws from all four pools" → Tasks 3 (weights), 6 (copy), Task 13 step 3 (validate)
- "Single static HTML file" → all edits target `practice2.html`

All spec requirements have at least one task. No gaps.

**Placeholder scan:** No TBDs, no "implement appropriate error handling", no naked "write tests for the above". Each step has either exact code, an exact command, or a concrete verification action.

**Type consistency:** Topic ids used throughout are exactly `agentic`, `genai-foundry`, `computer-vision`, `plan-and-manage`. The `subtitle` field is added consistently in `TOPICS` (Task 2) and consumed in `renderHome` (Task 5). The validator topic whitelist (Task 4) matches the four ids exactly. Id ranges 61..78, 79..100, 101..130, 131..160 do not overlap and sum to 100.

No issues to fix.
