# AI-102 Python & REST focus pack — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 30-question "Python & REST — Focus" pack (IDs 421-450, `category="python-rest"`) to `practice2.html`, fronted by a new emerald home-screen card, sourced exclusively from Microsoft Learn AI-102 training modules.

**Architecture:** Single-file static HTML quiz. Append 30 question objects to the `RAW_QUESTIONS` array, then add four small UI additions (card, wiring, start handler, completion label) that mirror the existing `test1`/`test2`/`test3` pattern. No new dependencies; no new build step; no schema-validator changes.

**Tech Stack:** Static HTML + vanilla JS + Tailwind (CDN). Content sourced from `learn.microsoft.com` AI-102 training modules. Git workflow: feature branch → develop → main fast-forward → tag.

**Spec:** `docs/superpowers/specs/2026-05-22-ai102-python-rest-focus-design.md`

---

## Working assumptions

- You are on branch `feature/python-rest-focus` (already created off `develop`). The spec has already been committed as `d10ff9a`. The repo's working tree must be clean before each task that ends in a commit.
- The next free question ID is 421. The closing `];` of `RAW_QUESTIONS` is at line 2754 of `practice2.html` (verify with `grep -n '^];$' practice2.html` before inserting — line numbers shift as you edit).
- Every question must satisfy `validateQuestions` in `practice2.html` (see §Schema below). Invalid questions are silently dropped at load time and printed to the console; that's the *only* "test" infrastructure this project has.
- "Python-focused" means: where a Learn page shows the same example in C#, JS, and Python, you transcribe only the Python form into the question. See commit `b650e5c` for precedent.

## Schema (per question — copy-paste this when authoring)

```jsonc
// mc_single
{
  "id": 421,
  "topic": "genai-foundry",                // one of: agentic, genai-foundry, computer-vision, plan-and-manage, knowledge-mining, natural-language
  "category": "python-rest",
  "type": "mc_single",
  "question": "…",
  "options": [
    {"id": "A", "text": "…"},
    {"id": "B", "text": "…"},
    {"id": "C", "text": "…"},
    {"id": "D", "text": "…"}
  ],
  "correct": ["B"],                         // length must be 1 for mc_single
  "explanation": "…",
  "source": {"path": "…", "module": "…", "unit": "…", "url": "https://learn.microsoft.com/…"}
}

// mc_multi
{ /* same as mc_single but `correct` has length >= 2 */ }

// hotspot
{
  "id": 425,
  "topic": "natural-language",
  "category": "python-rest",
  "type": "hotspot",
  "question": "Complete the Azure AI Language REST call.\n\nPOST https://{endpoint}/language/:[BLANK_1]?api-version=[BLANK_2]\nHeaders: [BLANK_3]: <key>",
  "blanks": [
    {"id": "B1", "prompt": "…", "options": [{"id":"a","text":"…"},{"id":"b","text":"…"}], "correct": "b"},
    {"id": "B2", "prompt": "…", "options": [{"id":"a","text":"…"},{"id":"b","text":"…"}], "correct": "a"},
    {"id": "B3", "prompt": "…", "options": [{"id":"a","text":"…"},{"id":"b","text":"…"}], "correct": "b"}
  ],
  "explanation": "…",
  "source": {"path":"…","module":"…","unit":"…","url":"https://learn.microsoft.com/…"}
}

// sequence
{
  "id": 430,
  "topic": "knowledge-mining",
  "category": "python-rest",
  "type": "sequence",
  "question": "Order the steps to analyze a document with the Document Intelligence Python SDK.",
  "items": [
    {"id": "S1", "text": "from azure.ai.documentintelligence import DocumentIntelligenceClient"},
    {"id": "S2", "text": "Create the client with endpoint + AzureKeyCredential"},
    {"id": "S3", "text": "Call client.begin_analyze_document(...)"},
    {"id": "S4", "text": "Call .result() on the returned poller"},
    {"id": "S5", "text": "Iterate result.documents to access extracted fields"}
  ],
  "correct_order": ["S1", "S2", "S3", "S4", "S5"],
  "explanation": "…",
  "source": {"path":"…","module":"…","unit":"…","url":"https://learn.microsoft.com/…"}
}
```

Validator rules (from `validateQuestions`):
- `id` unique integer
- `topic` ∈ the 6-topic allow-list
- `type` ∈ `{mc_single, mc_multi, sequence, hotspot}`
- `source` has all of `path`, `module`, `unit`, `url`
- `mc_single`: `correct.length === 1`; `mc_multi`: `correct.length >= 2`
- `sequence`: `items.length >= 3`; `correct_order` IDs all in `items`
- `hotspot`: `blanks.length >= 2`; each blank's `correct` is a valid option id

## Target distribution

| Service | n | `topic` tag | IDs |
|---|---|---|---|
| Azure AI Language | 4 | natural-language | 421-424 |
| Azure AI Speech | 4 | natural-language | 425-428 |
| Azure AI Vision (Image Analysis 4.0) | 4 | computer-vision | 429-432 |
| Azure Document Intelligence | 4 | knowledge-mining | 433-436 |
| Azure AI Search | 5 | knowledge-mining | 437-441 |
| Foundry / Azure OpenAI | 5 | genai-foundry | 442-446 |
| Content Safety | 4 | plan-and-manage | 447-450 |

Type mix across the 30: **14 mc_single · 7 mc_multi · 6 hotspot · 3 sequence**. REST/Python split: **15 / 15**. Within each service block, distribute types and REST/Python so the totals match — recommended per-service distribution:

| Service | mc_single | mc_multi | hotspot | sequence | REST | Python |
|---|---|---|---|---|---|---|
| Language (4) | 2 | 1 | 1 | 0 | 2 | 2 |
| Speech (4) | 2 | 1 | 1 | 0 | 2 | 2 |
| Vision (4) | 2 | 1 | 0 | 1 | 2 | 2 |
| Doc Intelligence (4) | 1 | 1 | 1 | 1 | 2 | 2 |
| AI Search (5) | 3 | 1 | 1 | 0 | 3 | 2 |
| Foundry/AOAI (5) | 2 | 1 | 1 | 1 | 2 | 3 |
| Content Safety (4) | 2 | 1 | 1 | 0 | 2 | 2 |
| **Total** | **14** | **7** | **6** | **3** | **15** | **15** |

## File-touch plan

Only `practice2.html` changes. Five edits:

1. **Append 30 question objects** to `RAW_QUESTIONS`, just before the closing `];` (currently line 2754; re-verify with grep before each insert).
2. **Add `pythonRestCard`** definition after the `test3Card` block (currently ends ~line 2987).
3. **Update `root.innerHTML`** to include `pythonRestCard` in the concatenation (currently line 2989).
4. **Add `addEventListener`** for `[data-mode="python-rest"]` after the `test3` listener (currently line 2997).
5. **Add `startPythonRest()`** function after `startTest3()` (currently ends ~line 3058).
6. **Extend the completion-message switch** (currently lines 3326-3332) with a `python-rest` arm.

(That's six edits, not five — the spec said "five" but I missed counting the completion-label arm. Plan supersedes spec on this count.)

---

## Task 1: Verify the seven anchor Learn URLs are live

**Files:** none yet (research only)

The spec listed seven anchor URLs but module slugs can be renamed on Microsoft Learn. Before authoring any questions, confirm each anchor resolves and find the closest replacement for any that 404.

- [ ] **Step 1: Curl each anchor**

Run, expecting `HTTP/2 200` for each:

```bash
for u in \
  https://learn.microsoft.com/en-us/training/modules/analyze-text-ai-language/ \
  https://learn.microsoft.com/en-us/training/modules/recognize-synthesize-speech/ \
  https://learn.microsoft.com/en-us/training/modules/analyze-images/ \
  https://learn.microsoft.com/en-us/training/modules/analyze-receipts-form-recognizer/ \
  https://learn.microsoft.com/en-us/training/modules/create-azure-ai-custom-skill/ \
  https://learn.microsoft.com/en-us/training/modules/get-started-openai/ \
  https://learn.microsoft.com/en-us/training/modules/responsible-generative-ai/ \
; do
  printf '%s -> ' "$u"
  curl -s -o /dev/null -w '%{http_code}\n' -L "$u"
done
```

Expected: each line ends in `200`.

- [ ] **Step 2: For any URL that returns 4xx, find a replacement**

Use the Microsoft Learn AI-102 learning-path index as the entry point:

```bash
curl -s -L 'https://learn.microsoft.com/en-us/training/courses/ai-102t00' | grep -oE 'modules/[a-z0-9-]+' | sort -u
```

Pick the module that most closely covers the same service. Record the substitution at the top of your scratchpad — every later `source.url` for that service must use the new slug.

- [ ] **Step 3: Note any substitutions in the spec**

If you substituted any URL, edit `docs/superpowers/specs/2026-05-22-ai102-python-rest-focus-design.md` (the "Anchor URLs" table) to reflect the live slug, then `git add` + `git commit -m "Spec: update <service> anchor URL after Learn slug change"`. If all seven are live, skip this commit.

---

## Task 2: Harvest Python and REST samples from the Learn pages

**Files:** scratch notes only (do not commit)

For each service, gather the **concrete** Python and REST examples you'll convert into questions. Goal: end Task 2 holding ~15 real REST samples (URL + headers + body) and ~15 real Python samples (imports + client constructor + method call) drawn directly from Learn.

- [ ] **Step 1: Fetch each anchor with WebFetch and follow into its unit pages**

For each anchor URL from Task 1, run:

```
WebFetch(url=<anchor>, prompt="List the unit URLs in this module and which units contain a Python code sample or a REST request example. Return the unit URLs and a one-sentence summary of each sample.")
```

Then WebFetch each unit URL that the summary flags as containing a code sample, with prompt:

```
"Extract the verbatim Python code samples and verbatim REST request examples from this page. For REST: include the full URL with any api-version, all headers, and the request body. For Python: include the import statement, the client constructor, and the method call. Do not paraphrase. If multiple language tabs exist, only return the Python tab."
```

- [ ] **Step 2: Capture into scratch notes — one section per service**

Use a temp file (e.g., `/tmp/python-rest-samples.md`, not committed) with structure:

```
## Azure AI Language
### REST sample 1 — analyze sentiment (from <unit url>)
POST https://<endpoint>/language/:analyze-text?api-version=2023-04-01
Headers:
  Ocp-Apim-Subscription-Key: <key>
  Content-Type: application/json
Body: { "kind": "SentimentAnalysis", "analysisInput": { "documents": [...] } }

### Python sample 1 — analyze sentiment (from <unit url>)
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
client = TextAnalyticsClient(endpoint=..., credential=AzureKeyCredential(...))
result = client.analyze_sentiment(documents=[...])

### Question seeds
- Q (mc_single, REST): which api-version segment is required?
- Q (hotspot, Python): fill in import + client constructor blanks
- Q (mc_multi, REST): which TWO headers are required?
- Q (...): ...
```

Repeat for all 7 services. **Every sample must have a Learn URL** — if you can't find a concrete sample on Learn for a particular question idea, drop the question idea, don't invent.

- [ ] **Step 3: Verify counts**

You should have collected enough material for the 30 questions:
- Language: ≥4 question seeds (2 REST, 2 Python)
- Speech: ≥4 (2 REST, 2 Python)
- Vision: ≥4 (2 REST, 2 Python)
- Doc Intelligence: ≥4 (2 REST, 2 Python)
- AI Search: ≥5 (3 REST, 2 Python)
- Foundry/AOAI: ≥5 (2 REST, 3 Python)
- Content Safety: ≥4 (2 REST, 2 Python)

If a service is short, fetch one more unit from that module or fall back to the service-reference docs at `learn.microsoft.com/en-us/azure/ai-services/<service>/` (still inside the Learn domain, still acceptable per the spec).

**No commit at end of Task 2 — scratch notes only.**

---

## Task 3: Author the 30 question objects

**Files:**
- Write: `/tmp/python-rest-questions.json` (intermediate, not committed)

You have your harvested samples from Task 2. Now write the 30 question objects.

- [ ] **Step 1: Write the 30 questions into `/tmp/python-rest-questions.json`**

Format: one JSON array with 30 objects. IDs 421-450 in order. Use the schema in the plan header. Each question MUST have:
- `category: "python-rest"`
- `topic` set per the §Target distribution table
- `source` filled with the exact Learn URL the sample came from
- `explanation` that quotes the relevant phrase from Learn ("The X unit states ...") so the answer is defensible from the source

Stylistic conventions to match the existing 420 questions (verify by reading IDs 380-420 in `practice2.html`):
- Question stems use `**bold**` for emphasis sparingly; do not over-format
- Code in stems uses fenced blocks when multiple lines, inline backticks for single tokens
- Hotspot blanks marked `[BLANK]`, `[BLANK_1]`, `[BLANK_2]`, etc.
- `explanation` is 2-4 sentences, ends without a period before the source citation

Concrete example (use as template, do not include this exact text):

```jsonc
{
  "id": 421,
  "topic": "natural-language",
  "category": "python-rest",
  "type": "mc_single",
  "question": "Which Azure AI Language REST endpoint path POSTs a sentiment-analysis request against the current synchronous text API?",
  "options": [
    {"id": "A", "text": "POST /text/analytics/v3.1/sentiment"},
    {"id": "B", "text": "POST /language/:analyze-text"},
    {"id": "C", "text": "POST /language/analyze"},
    {"id": "D", "text": "POST /textanalytics/sentiment"}
  ],
  "correct": ["B"],
  "explanation": "The current Azure AI Language synchronous text API uses the unified path `POST {endpoint}/language/:analyze-text?api-version=2023-04-01` with the request body discriminator `kind: SentimentAnalysis`. The older `/text/analytics/v3.1/sentiment` path was Text Analytics v3.1 and is superseded.",
  "source": {
    "path": "Azure AI Language documentation",
    "module": "Analyze text with Azure Language in Foundry Tools",
    "unit": "Sentiment analysis",
    "url": "https://learn.microsoft.com/en-us/training/modules/analyze-text-ai-language/4-perform-sentiment-analysis?pivots=text"
  }
}
```

- [ ] **Step 2: Validate the JSON syntactically**

Run:

```bash
python3 -c "import json,sys; d=json.load(open('/tmp/python-rest-questions.json')); assert isinstance(d,list) and len(d)==30, f'expected 30, got {len(d)}'; ids=[q[\"id\"] for q in d]; assert ids==list(range(421,451)), f'ids not 421..450: {ids[:5]}…{ids[-3:]}'; print('OK 30 questions, IDs 421-450')"
```

Expected: `OK 30 questions, IDs 421-450`

- [ ] **Step 3: Validate against the practice2.html schema using the same logic the browser uses**

Run this one-shot Node script (no install needed if Node ≥ 18 is available; otherwise use Python equivalent):

```bash
node -e "
const fs = require('fs');
const qs = JSON.parse(fs.readFileSync('/tmp/python-rest-questions.json','utf8'));
const ALLOWED_TOPICS = new Set(['agentic','genai-foundry','computer-vision','plan-and-manage','knowledge-mining','natural-language']);
const ALLOWED_TYPES = new Set(['mc_single','mc_multi','sequence','hotspot']);
let bad = 0;
for (const q of qs) {
  const errs = [];
  if (typeof q.id !== 'number') errs.push('missing id');
  if (!ALLOWED_TOPICS.has(q.topic)) errs.push('bad topic ' + q.topic);
  if (!ALLOWED_TYPES.has(q.type)) errs.push('bad type ' + q.type);
  if (q.category !== 'python-rest') errs.push('category must be python-rest');
  if (!q.source || !q.source.path || !q.source.module || !q.source.unit || !q.source.url) errs.push('missing source field');
  if (q.type === 'mc_single' || q.type === 'mc_multi') {
    if (!Array.isArray(q.options) || q.options.length < 2) errs.push('options must be 2+');
    if (!Array.isArray(q.correct) || q.correct.length === 0) errs.push('correct must be non-empty');
    if (q.type === 'mc_single' && q.correct && q.correct.length !== 1) errs.push('mc_single needs exactly 1 correct');
    if (q.type === 'mc_multi' && q.correct && q.correct.length < 2) errs.push('mc_multi needs 2+ correct');
    const ids = new Set((q.options || []).map(o => o.id));
    for (const c of (q.correct || [])) if (!ids.has(c)) errs.push('correct id not in options: ' + c);
  } else if (q.type === 'sequence') {
    if (!Array.isArray(q.items) || q.items.length < 3) errs.push('items must be 3+');
    if (!Array.isArray(q.correct_order)) errs.push('correct_order missing');
    if (q.items && q.correct_order && q.items.length !== q.correct_order.length) errs.push('items/correct_order length mismatch');
    const ids = new Set((q.items || []).map(i => i.id));
    for (const c of (q.correct_order || [])) if (!ids.has(c)) errs.push('correct_order id not in items: ' + c);
  } else if (q.type === 'hotspot') {
    if (!Array.isArray(q.blanks) || q.blanks.length < 2) errs.push('blanks must be 2+');
    for (const b of (q.blanks || [])) {
      if (!b || !b.id || !b.prompt || !Array.isArray(b.options) || b.options.length < 2 || b.correct == null) { errs.push('blank malformed'); break; }
      const ids = new Set(b.options.map(o => o.id));
      if (!ids.has(b.correct)) { errs.push('blank correct not in options ' + b.correct); break; }
    }
  }
  if (errs.length) { console.log('Q' + q.id + ': ' + errs.join('; ')); bad++; }
}
console.log(bad === 0 ? 'OK all 30 valid' : ('FAIL ' + bad + ' invalid'));
process.exit(bad === 0 ? 0 : 1);
"
```

Expected: `OK all 30 valid` and exit code 0. If anything fails, fix the JSON and rerun.

- [ ] **Step 4: Verify the type-mix and REST/Python totals match the §Target distribution**

```bash
node -e "
const qs = JSON.parse(require('fs').readFileSync('/tmp/python-rest-questions.json','utf8'));
const c = {mc_single:0,mc_multi:0,hotspot:0,sequence:0};
for (const q of qs) c[q.type]++;
console.log(c);
"
```

Expected: `{ mc_single: 14, mc_multi: 7, hotspot: 6, sequence: 3 }`. If off, rebalance.

**No commit at end of Task 3 — the file is still in `/tmp`.**

---

## Task 4: Insert the 30 questions into `RAW_QUESTIONS`

**Files:**
- Modify: `practice2.html` (insert before the closing `];` of `RAW_QUESTIONS`)

- [ ] **Step 1: Locate the closing `];` of the questions array**

```bash
grep -n '^];$' practice2.html
```

Expected: a single match like `2754: ];`. Note the line number; it may have shifted if any prior task edited the file.

- [ ] **Step 2: Insert the 30 questions**

Use Edit to replace the last question (id 420) line + `];` boundary. Read lines (closing-line-minus-1) through (closing-line+1) first so the `old_string` is unique. Then `new_string` is the same last question, followed by `,`, followed by the 30 new question objects (one per line, comma-separated except the final), followed by `];`.

Example minimal pattern:

```
old_string:
  …trailing characters of q420…}
];

new_string:
  …trailing characters of q420…},
  {"id": 421, …},
  {"id": 422, …},
  …
  {"id": 450, …}
];
```

Each question stays on one line (matching the existing pack style — see lines 2750-2753 for the test3 questions).

- [ ] **Step 3: Verify the insertion**

```bash
grep -c '"category": "python-rest"' practice2.html
grep -nE '"id": (421|450)' practice2.html
```

Expected:
- First command: `30`
- Second command: two matches — one for id 421, one for id 450, both with `"category": "python-rest"` nearby

- [ ] **Step 4: Open the page in a browser and confirm the validator accepts all 30**

```bash
xdg-open practice2.html  # or: open practice2.html on macOS
```

Then in the browser's DevTools console:

```js
QUESTIONS.filter(q => q.category === 'python-rest').length
```

Expected: `30`. Also check:

```js
RAW_QUESTIONS.length - QUESTIONS.length
```

Expected: `0` (no rejections). If non-zero, scroll the console for the `Rejected … invalid questions:` warning, fix the offending JSON, and reload.

- [ ] **Step 5: Commit**

```bash
git add practice2.html
git commit -m "$(cat <<'EOF'
Add 30 Python & REST focus questions (IDs 421-450)

Sourced from Microsoft Learn AI-102 training modules. Covers Python SDK
and REST endpoint mechanics across 7 services: Azure AI Language (4),
Speech (4), Vision/Image Analysis (4), Document Intelligence (4),
AI Search (5), Foundry/Azure OpenAI (5), Content Safety (4).

Mix: 14 mc_single, 7 mc_multi, 6 hotspot, 3 sequence. 15 REST + 15
Python. All questions tagged category="python-rest" so they are
excluded from topic drills and Mixed mode by the existing
!q.category filter. Card wiring follows in the next commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add the emerald home-screen card

**Files:**
- Modify: `practice2.html` (insert a `pythonRestCard` block after the `test3Card` definition)

- [ ] **Step 1: Locate the end of `test3Card`**

```bash
grep -n "const test3Card" practice2.html
```

Expected: one match around line 2976. Read the test3Card block (it ends with `: '';` ~10 lines later).

- [ ] **Step 2: Insert `pythonRestCard` immediately after the `test3Card` block**

Use Edit with `old_string` = the closing `: '';` of test3Card (with enough context to be unique — include the `${t3.answered === 0 ? '' : ...}</button>` line above it). Append the new block on the line(s) after.

Insert exactly:

```javascript

      const tpr = categoryStats('python-rest', state);
      const pythonRestCard = tpr.total > 0 ? `
        <button class="w-full text-left bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg p-4 mb-3 hover:border-emerald-500" data-mode="python-rest">
          <div class="flex justify-between items-start gap-2">
            <div class="font-semibold text-emerald-800 dark:text-emerald-200">Python & REST — Focus</div>
            <div class="text-sm text-emerald-700 dark:text-emerald-300 whitespace-nowrap">${tpr.total} Q</div>
          </div>
          <div class="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Endpoints, headers, request bodies, SDK clients across Language, Speech, Vision, Document Intelligence, AI Search, Foundry/AOAI, Content Safety</div>
          <div class="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
            ${tpr.answered === 0 ? 'not started' : `${tpr.answered} / ${tpr.total} answered · ${tpr.pct}% correct`}
          </div>
          ${tpr.answered === 0 ? '' : `<div class="mt-2 h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded overflow-hidden"><div class="h-full bg-emerald-600" style="width:${Math.round((tpr.answered/tpr.total)*100)}%"></div></div>`}
        </button>` : '';
```

(Note: backticks are intentional — they're template-literal strings. Preserve `${...}` interpolations as written.)

- [ ] **Step 3: Verify**

```bash
grep -c 'pythonRestCard' practice2.html
```

Expected: `1` (only the declaration so far — wiring comes in Task 6).

**No commit yet — Task 5 ends mid-edit so the UI is non-functional. Continue to Task 6.**

---

## Task 6: Wire the card into the home view

**Files:**
- Modify: `practice2.html` line ~2989 (`root.innerHTML = …`) and ~2997 (`addEventListener`)

- [ ] **Step 1: Add `pythonRestCard` to the `innerHTML` concatenation**

Find:

```javascript
root.innerHTML = cards + test1Card + test2Card + test3Card + mixedCard + queueCard;
```

Replace with:

```javascript
root.innerHTML = cards + test1Card + test2Card + test3Card + pythonRestCard + mixedCard + queueCard;
```

(Card order: test1 / test2 / test3 / python-rest above the divider, mixed + queue below. This keeps the focus packs visually grouped.)

- [ ] **Step 2: Add the click listener**

Find:

```javascript
root.querySelector('[data-mode="test3"]')?.addEventListener('click', startTest3);
```

Insert immediately after it:

```javascript
root.querySelector('[data-mode="python-rest"]')?.addEventListener('click', startPythonRest);
```

- [ ] **Step 3: Verify**

```bash
grep -c 'pythonRestCard' practice2.html        # expect 2 (declaration + use)
grep -c 'data-mode="python-rest"' practice2.html  # expect 2 (button + listener)
```

(`startPythonRest` is referenced here but not yet defined — that's Task 7. Don't reload the browser yet; you'll get a ReferenceError.)

**No commit yet — continue to Task 7.**

---

## Task 7: Add the `startPythonRest` handler

**Files:**
- Modify: `practice2.html` (insert after the `startTest3` function, ~line 3058)

- [ ] **Step 1: Locate `startTest3`**

```bash
grep -n "function startTest3" practice2.html
```

- [ ] **Step 2: Insert `startPythonRest` immediately after the closing `}` of `startTest3`**

```javascript

    function startPythonRest() {
      const qs = questionsForCategory('python-rest');
      if (qs.length === 0) return;
      session = { mode: 'python-rest', topicId: null, queue: shuffle(qs.map(q => q.id)), cursor: 0, score: { right: 0, wrong: 0 } };
      showView('practice'); renderPractice();
    }
```

- [ ] **Step 3: Verify**

```bash
grep -c "function startPythonRest" practice2.html
```

Expected: `1`. **No commit yet — continue to Task 8.**

---

## Task 8: Add the completion-message arm

**Files:**
- Modify: `practice2.html` (extend the `heading` switch ~lines 3326-3332)

- [ ] **Step 1: Find the existing arms**

Read lines ~3326-3332. The current chain:

```javascript
const heading = session.mode === 'topic'
  ? `Topic complete — ${TOPICS.find(t => t.id === session.topicId)?.title || ''}`
  : session.mode === 'mixed' ? 'Mixed session complete'
  : session.mode === 'test1' ? 'Test 1 — Retake focus complete'
  : session.mode === 'test2' ? 'Test 2 — Retake focus complete'
  : session.mode === 'test3' ? 'Test 3 — Retake focus complete'
  : 'Wrong-queue session complete';
```

- [ ] **Step 2: Insert the `python-rest` arm immediately after the `test3` arm**

Use Edit to change:

```javascript
  : session.mode === 'test3' ? 'Test 3 — Retake focus complete'
  : 'Wrong-queue session complete';
```

into:

```javascript
  : session.mode === 'test3' ? 'Test 3 — Retake focus complete'
  : session.mode === 'python-rest' ? 'Python & REST — Focus complete'
  : 'Wrong-queue session complete';
```

- [ ] **Step 3: Verify**

```bash
grep -c "Python & REST — Focus complete" practice2.html
```

Expected: `1`.

---

## Task 9: Browser smoke test

**Files:** none modified — manual verification only

- [ ] **Step 1: Open `practice2.html`**

```bash
xdg-open practice2.html
```

(Or `open practice2.html` on macOS, or paste the absolute path into your browser.)

- [ ] **Step 2: Verify the home screen**

Confirm visually:
- An emerald-colored card titled "Python & REST — Focus" appears below the rose `Test 3` card and above the white `Mixed` card
- It shows "30 Q" in the top-right
- It shows "not started" (since no answers yet)

In DevTools console, run:

```js
document.querySelectorAll('[data-mode]').length
```

Expected: ≥ 5 (mixed + test1 + test2 + test3 + python-rest, plus possibly wrong-queue).

- [ ] **Step 3: Verify no validator rejections**

In console:

```js
RAW_QUESTIONS.length - QUESTIONS.length
```

Expected: `0`. If non-zero, find the warning printed earlier and fix the offending question (you'll likely need to fix in `/tmp/python-rest-questions.json` first and re-insert).

- [ ] **Step 4: Verify the existing pools are intact**

In console:

```js
({
  agentic: QUESTIONS.filter(q => q.topic === 'agentic' && !q.category).length,
  genai: QUESTIONS.filter(q => q.topic === 'genai-foundry' && !q.category).length,
  cv: QUESTIONS.filter(q => q.topic === 'computer-vision' && !q.category).length,
  pm: QUESTIONS.filter(q => q.topic === 'plan-and-manage' && !q.category).length,
  km: QUESTIONS.filter(q => q.topic === 'knowledge-mining' && !q.category).length,
  nlp: QUESTIONS.filter(q => q.topic === 'natural-language' && !q.category).length,
  total: QUESTIONS.length
})
```

Expected: `agentic: 50, genai: 50, cv: 50, pm: 50, km: 50, nlp: 50, total: 450`. The six topic pools stay at 50 each (the new 30 are excluded by `!q.category`); total goes from 420 → 450.

- [ ] **Step 5: End-to-end run**

Click the emerald card. Verify:
- Practice view opens with `Question 1 / 30`
- The first question's `Q #` is in the range 421-450
- Answering a question reveals the explanation with the Learn URL
- Clicking through all 30 lands on a results page titled "Python & REST — Focus complete"
- The "Back to topics" button returns to the home and the card now shows `30 / 30 answered · XX% correct`

If any of these fails, stop and fix before committing.

---

## Task 10: Commit the UI wiring

**Files:** none new — staging Tasks 5-8

- [ ] **Step 1: Stage and commit**

```bash
git add practice2.html
git commit -m "$(cat <<'EOF'
Wire Python & REST focus card into the home screen

Adds the emerald 'Python & REST — Focus' card (data-mode="python-rest"),
its click handler startPythonRest(), and the matching completion-message
arm. Card sits between Test 3 and Mixed in the home stack, matching the
established focus-pack visual hierarchy (amber/violet/rose/emerald).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 2: Confirm clean tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

---

## Task 11: Merge to develop, fast-forward main, tag release10

**Files:** none — git operations

- [ ] **Step 1: Merge feature → develop**

```bash
git checkout develop
git merge --no-ff feature/python-rest-focus -m "Merge feature/python-rest-focus: Python & REST focus pack (+30 questions)"
```

- [ ] **Step 2: Fast-forward main**

```bash
git checkout main
git merge --ff-only develop
```

Expected: a fast-forward (no merge commit on main). If git refuses, stop and ask the user — main may have diverged.

- [ ] **Step 3: Tag release10**

```bash
git tag -a release10 -m "release10: Python & REST focus pack (+30 questions, IDs 421-450)"
```

- [ ] **Step 4: Push everything**

```bash
git push origin main develop feature/python-rest-focus release10
```

- [ ] **Step 5: Final smoke check on `main`**

```bash
git checkout main
grep -c '"category": "python-rest"' practice2.html
```

Expected: `30`.

---

## Done criteria

All of the following must hold after Task 11:

- [ ] `practice2.html` contains exactly 30 questions with `"category": "python-rest"`, IDs 421-450 contiguous
- [ ] Browser DevTools shows `QUESTIONS.length === 450` and `RAW_QUESTIONS.length === 450` (zero validator rejections)
- [ ] The six per-topic pools (excluding categorized questions) still total 300 (50 each)
- [ ] Home screen displays the emerald `Python & REST — Focus` card with `30 Q`
- [ ] End-to-end pack run returns to home with the correct progress chip
- [ ] `main` is at the new merge, `release10` tag is pushed
