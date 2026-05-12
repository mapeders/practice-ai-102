# AI-102 practice — +20 CV / +20 plan-and-manage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 20 questions to `computer-vision` (ids 161-180) and 20 questions to `plan-and-manage` (ids 181-200) in `practice2.html`, taking the pool from 160 to 200. Reinforces the two thin-coverage weak topics without disturbing `agentic` and `genai-foundry`.

**Architecture:** Top-up build over the existing static HTML file. Generate +40 questions via 2 parallel subagents (one per topic), each briefed with a pre-flight dedup summary of the topic's existing 30 questions and a URL list biased toward Learn units the prior round under-used. Validate against schema + assigned-URL allowlist + floor counts + near-duplicate scan, then append to the existing `RAW_QUESTIONS` array. No code changes outside the array — `TOPICS`, `TOPIC_WEIGHTS`, the validator whitelist, and the renderer template are all already in place from the prior round.

**Tech Stack:** Plain HTML + inline JavaScript, Tailwind via CDN, `localStorage` for state, `WebFetch` for Microsoft Learn unit pages, parallel `general-purpose` subagents for question generation.

**Spec:** `docs/superpowers/specs/2026-05-12-ai102-practice-cv-pm-plus20-design.md`

---

## File Structure

**Modified:**
- `practice2.html` — single source-of-truth file:
  - line 54: `RAW_QUESTIONS` array (append +40 entries before the closing `];`)

**Created (build artifacts, not shipped):**
- `build/url-list-v3.json` — enumerated Learn-unit URLs for CV and PM
- `build/dedup-cv.json` — concept summary of existing 30 CV questions
- `build/dedup-pm.json` — concept summary of existing 30 PM questions
- `build/chunk-cv-v3.json` — agent C2 output (computer-vision)
- `build/chunk-pm-v3.json` — agent D2 output (plan-and-manage)
- `build/merged-v3.json` — validated merged delta before injection

**Reference (read only):**
- `docs/superpowers/specs/2026-05-12-ai102-practice-cv-pm-plus20-design.md` — spec
- `build/validate-v2.js` — existing chunk validator (reuse as-is)
- `build/url-list-v2.json` — prior URL list (read to identify under-used units)

---

## Task 1: Pre-flight — verify existing pool integrity

**Files:**
- Read: `practice2.html` (RAW_QUESTIONS block)

- [ ] **Step 1: Confirm 160 questions, ids 1..160 unique, four topics with expected counts**

Run:
```bash
grep -c '"id":' practice2.html
grep -oE '"topic":\s*"[^"]+"' practice2.html | sort | uniq -c
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | uniq -c | awk '$1 > 1'
```

Expected:
- First command: `160`
- Second: `50 agentic`, `50 genai-foundry`, `30 computer-vision`, `30 plan-and-manage`
- Third: empty output (no duplicate ids)

If any of these don't match, stop. The id-range allocation below assumes a clean 1..160 starting point.

- [ ] **Step 2: Confirm max(id) = 160**

Run:
```bash
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | tail -1
```

Expected: `160`. New ids will start at 161.

- [ ] **Step 3: Confirm `TOPICS`, `TOPIC_WEIGHTS`, and validator whitelist already accept the two target topics**

Run:
```bash
grep -nE '"computer-vision"|"plan-and-manage"' practice2.html | grep -vE '"topic":'
```

Expected: at least 5 hits — one each in `TOPICS` (×2 entries reference each), `TOPIC_WEIGHTS` (×2), and the validator whitelist (one line with both ids). If any of these are missing, stop — the plan assumes the prior round's structural changes are already in place.

- [ ] **Step 4: Commit nothing** — read-only verification.

---

## Task 2: Build the dedup briefing for both topics

**Files:**
- Create: `build/dedup-cv.json`, `build/dedup-pm.json`

The briefing summarises what concepts the existing 30 questions per topic already cover, so each subagent knows what NOT to re-cover.

- [ ] **Step 1: Extract existing questions per topic**

Run:
```bash
python3 - <<'PY'
import json, re
src = open('practice2.html').read()
# Extract the RAW_QUESTIONS array source between its opening and the next "^    ];"
start = src.index('const RAW_QUESTIONS = [') + len('const RAW_QUESTIONS = ')
# Find the matching "];" at column 4 (i.e., line "    ];")
m = re.search(r'\n    \];\n', src[start:])
end = start + m.start() + 1  # include up to the newline before "    ];"
arr_text = src[start:end].rstrip().rstrip(',') + ']'  # array literal
arr = json.loads(arr_text)
print(f'parsed {len(arr)} questions')

cv = [q for q in arr if q['topic'] == 'computer-vision']
pm = [q for q in arr if q['topic'] == 'plan-and-manage']
print(f'cv: {len(cv)}, pm: {len(pm)}')

def summarize(q):
    # Take first ~140 chars of question stem; strip newlines.
    stem = ' '.join(q['question'].split())[:140]
    return {
        'id': q['id'],
        'type': q['type'],
        'stem_fragment': stem,
        'unit': q['source']['unit'],
        'url': q['source']['url'],
    }

json.dump([summarize(q) for q in cv], open('build/dedup-cv.json','w'), indent=2)
json.dump([summarize(q) for q in pm], open('build/dedup-pm.json','w'), indent=2)
print('wrote build/dedup-cv.json and build/dedup-pm.json')
PY
```

Expected output:
- `parsed 160 questions`
- `cv: 30, pm: 30`
- `wrote build/dedup-cv.json and build/dedup-pm.json`

If the parser fails because the array text isn't valid JSON (e.g., trailing commas), fall back to scanning per-entry: locate each `{ ... "topic": "computer-vision" ... }` block and extract fields with regex. Note this fallback inline so you don't get stuck.

- [ ] **Step 2: Hand-skim each dedup file**

Open `build/dedup-cv.json` and `build/dedup-pm.json`. For each, jot a mental note: which sub-areas dominate, which are thin or absent? (E.g., for CV: is Video Indexer well-covered? Face liveness? OCR? Custom Vision?) Identifying the thin areas guides the URL-list bias in Task 3.

There is no programmatic check here — this is a 2-minute read.

- [ ] **Step 3: Commit**

```bash
git add build/dedup-cv.json build/dedup-pm.json
git commit -m "Dedup brief: concept summaries of existing 30 CV and 30 PM questions"
```

---

## Task 3: Build URL list biased toward under-used Learn units

**Files:**
- Read: `build/url-list-v2.json`, `build/dedup-cv.json`, `build/dedup-pm.json`
- Create: `build/url-list-v3.json`

- [ ] **Step 1: Identify under-used URLs in the prior round**

Run:
```bash
python3 - <<'PY'
import json
from collections import Counter
v2 = json.load(open('build/url-list-v2.json'))
cv_dedup = json.load(open('build/dedup-cv.json'))
pm_dedup = json.load(open('build/dedup-pm.json'))

def hits_by_url(dedup):
    return Counter(q['url'] for q in dedup)

cv_hits = hits_by_url(cv_dedup)
pm_hits = hits_by_url(pm_dedup)

def show(topic, hits):
    urls = [u['url'] for u in v2.get(topic, [])]
    print(f'\n=== {topic} ===')
    for u in urls:
        print(f'  hits={hits.get(u,0):2d}  {u}')

show('computer-vision', cv_hits)
show('plan-and-manage', pm_hits)
PY
```

Expected: prints each URL from the prior round's `computer-vision` and `plan-and-manage` lists with a hit count from the existing 30 questions. URLs with hit count 0-1 are under-used and should be prioritised in the new list. URLs with hit count ≥4 should be deprioritised (they've already produced their share).

- [ ] **Step 2: Compose `build/url-list-v3.json`**

Build a list per topic with these properties:
- Start from the prior `url-list-v2.json` entries for the topic.
- Prioritise (move to front of list) any URL with hit count 0-1.
- Optionally add new URLs from the Learn paths if the prior list left obvious units uncovered.

Use WebFetch to verify any newly-added URLs return 200 and that the `?pivots=text` form works.

For computer-vision, ensure the Video Indexer doc URLs from the prior round are present (`video-indexer-overview`, `concepts-content-models`, `analyze-video-using-rest-api`, `customize-language-model-with-api`, `cognitive-search`). Add 1-2 additional Video Indexer doc URLs if the prior list under-covered video.

For plan-and-manage, ensure URLs covering each AI-services bucket (provisioning, RBAC/managed identity, networking, monitoring, content safety) appear.

Write the file:
```json
{
  "computer-vision":  [{ "url": "...?pivots=text", "module": "...", "unit": "..." }, ...],
  "plan-and-manage":  [...]
}
```

- [ ] **Step 3: Sanity-check the counts and basic shape**

Run:
```bash
python3 -c "import json; d=json.load(open('build/url-list-v3.json')); [print(k, len(v)) for k,v in d.items()]"
```

Expected: each topic has ≥8 URLs (provides enough variety for 20 questions while allowing some doubling-up).

If a topic has <8, expand the list before continuing.

- [ ] **Step 4: Commit**

```bash
git add build/url-list-v3.json
git commit -m "v3 URL lists biased to under-used Learn units for CV and PM"
```

---

## Task 4: Dispatch 2 parallel subagents to generate +20 each

**Files:**
- Create: `build/chunk-cv-v3.json`, `build/chunk-pm-v3.json`

This task uses one message with two `Agent` tool-uses (subagent_type `general-purpose`) so both run concurrently.

- [ ] **Step 1: Prepare the shared question schema text**

Schema (copy verbatim into each agent prompt — same as prior round so behaviour is consistent):
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
- DEDUP RULE: A dedup brief is provided listing concepts already covered by the existing 30 questions for your topic. Do NOT produce questions whose stem fragment overlaps closely with any entry in the brief, or that test the same concept at the same depth. Aim for new sub-areas, new angles, or deeper coverage of concepts the brief touches only superficially.
- Output: a single JSON array (no markdown fences, no commentary). The array contains your N questions.
```

- [ ] **Step 2: Dispatch both agents in a single message**

Use one assistant message containing two `Agent` tool-uses (this runs them concurrently). Per-agent parameters:

**Agent C2 — computer-vision (+20, video-biased)**
- subagent_type: `general-purpose`
- description: `Generate 20 CV questions (video-biased, dedup-aware)`
- prompt content:
  - Shared schema block above
  - "Your topic: `computer-vision`. Your URL list: <list from url-list-v3.json key 'computer-vision', verbatim>"
  - "Your id range: 161..180 inclusive. Use each id exactly once. Produce ~20 questions."
  - "Type mix target: ~12 mc_single, ~1 mc_multi, ~4 sequence, ~3 hotspot."
  - "Video bias: 6 to 7 of your 20 questions MUST target video analysis — Azure AI Video Indexer, video frame extraction, custom vision on video frames, video moderation, spatial analysis on video. Use the video-indexer URLs in your list for these."
  - "Coverage: the remaining 13-14 should cover image analysis 4.0, Face API (incl. liveness), OCR/Read API, custom vision / image classification — favoring sub-areas the dedup brief shows as thin."
  - "DEDUP BRIEF (existing 30 CV questions — do not re-cover these concepts at the same depth): <paste contents of build/dedup-cv.json>"
  - "Write your final output as a JSON array to `build/chunk-cv-v3.json` using the Write tool, then return a one-line confirmation."

**Agent D2 — plan-and-manage (+20, AI-services-disciplined)**
- subagent_type: `general-purpose`
- description: `Generate 20 PM questions (AI-services-only, dedup-aware)`
- prompt content:
  - Shared schema block above
  - "Your topic: `plan-and-manage`. Your URL list: <list from url-list-v3.json key 'plan-and-manage', verbatim>"
  - "Your id range: 181..200 inclusive. Use each id exactly once. Produce ~20 questions."
  - "Type mix target: ~12 mc_single, ~1 mc_multi, ~4 sequence, ~3 hotspot."
  - "DISCIPLINE: every question must be specifically about **Azure AI services** concerns, not generic Azure. Acceptable: multi-service vs single-service AI-services account, AI-services SKU/region selection, endpoints/keys for AI services, managed identity for an AI workload, private endpoints for AI services, customer-managed keys for AI services, diagnostic settings / Application Insights for AI services, Azure AI Content Safety configuration, responsible AI tooling. Not acceptable: generic Azure RBAC mechanics, generic VNet design, generic Azure Monitor not scoped to AI workloads — questions like that would belong on AZ-104, not AI-102. Reject any draft that could appear on a non-AI Azure exam."
  - "Coverage: spread across provisioning, RBAC + managed identity, networking, monitoring, content safety. No hard per-bucket quotas, but the dedup brief shows which buckets are already covered — favor the thinner ones."
  - "DEDUP BRIEF (existing 30 PM questions — do not re-cover these concepts at the same depth): <paste contents of build/dedup-pm.json>"
  - "Write your final output as a JSON array to `build/chunk-pm-v3.json` using the Write tool, then return a one-line confirmation."

- [ ] **Step 3: After both agents return, confirm files exist and are non-empty**

Run:
```bash
ls -la build/chunk-cv-v3.json build/chunk-pm-v3.json
python3 -c "import json; print('cv:', len(json.load(open('build/chunk-cv-v3.json')))); print('pm:', len(json.load(open('build/chunk-pm-v3.json'))))"
```

Expected: both files present, each printing a count ~20.

- [ ] **Step 4: Commit the raw chunk outputs**

```bash
git add build/chunk-cv-v3.json build/chunk-pm-v3.json
git commit -m "Raw v3 question chunks (+20 CV, +20 PM) from parallel subagents"
```

---

## Task 5: Validate each chunk

**Files:**
- Read: `build/chunk-cv-v3.json`, `build/chunk-pm-v3.json`, `build/url-list-v3.json`, `build/validate-v2.js`

The existing `build/validate-v2.js` validator works as-is — it takes the chunk file, topic, id-min, and id-max as arguments, and checks all schema constraints plus URL allowlist. We extend its URL-list source by passing the v3 file path via an env var so we don't have to fork the script.

- [ ] **Step 1: Run the validator on both chunks**

The existing validator hardcodes `build/url-list-v2.json` (line 457 in `validate-v2.js`). Since we want to validate against the v3 URL list, temporarily symlink or copy:

```bash
cp build/url-list-v2.json build/url-list-v2.json.bak
cp build/url-list-v3.json build/url-list-v2.json
```

Then run:
```bash
node build/validate-v2.js build/chunk-cv-v3.json computer-vision 161 180
node build/validate-v2.js build/chunk-pm-v3.json plan-and-manage 181 200
```

Expected on each: zero-exit, summary JSON printed.

Floors (post-validation):
- computer-vision: count ≥18
- plan-and-manage: count ≥18

Type-mix tolerance: each `typeCounts.*` within ±2 of its per-topic target from Task 4 step 2.

Then restore:
```bash
mv build/url-list-v2.json.bak build/url-list-v2.json
```

(If the validator reports the chunk has cited URLs from outside its assigned list, those entries are rejected — exit code is non-zero and the chunk fails. Re-dispatch handles it in Task 6.)

- [ ] **Step 2: Verify CV video bias**

Run:
```bash
python3 -c "
import json
d = json.load(open('build/chunk-cv-v3.json'))
v = [q for q in d if 'video' in (q.get('question','') + q.get('source',{}).get('url','')).lower()]
print(f'video-related: {len(v)} / {len(d)}')
"
```

Expected: 6-7. If under 6, this triggers Task 6 (re-dispatch) targeting more video questions.

- [ ] **Step 3: Spot-check PM AI-services discipline**

Open `build/chunk-pm-v3.json`. Read all 20 questions and flag any that would be at home on AZ-104 (generic Azure trivia not scoped to AI services). Maximum acceptable cross-over: 1 of 20. If more than 1 look generic-Azure, this triggers Task 6 for the PM chunk.

- [ ] **Step 4: Near-duplicate scan against existing pool**

Run:
```bash
python3 - <<'PY'
import json, re

def normalize(s):
    s = s.lower()
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def shingles(s, n=8):
    toks = s.split()
    return set(' '.join(toks[i:i+n]) for i in range(len(toks)-n+1))

def jaccard(a, b):
    if not a or not b: return 0.0
    return len(a & b) / len(a | b)

def scan(new_path, existing_summary_path, topic):
    new_qs = json.load(open(new_path))
    existing = json.load(open(existing_summary_path))
    existing_shingles = [(e['id'], shingles(normalize(e['stem_fragment']))) for e in existing]
    hits = []
    for q in new_qs:
        s = shingles(normalize(q['question']))
        for old_id, old_s in existing_shingles:
            j = jaccard(s, old_s)
            if j >= 0.45:
                hits.append((q['id'], old_id, round(j, 2)))
    print(f'{topic}: {len(hits)} possible near-duplicates')
    for h in hits:
        print(f'  new id={h[0]}  ~  old id={h[1]}  jaccard={h[2]}')
    return hits

scan('build/chunk-cv-v3.json', 'build/dedup-cv.json', 'computer-vision')
scan('build/chunk-pm-v3.json', 'build/dedup-pm.json', 'plan-and-manage')
PY
```

Acceptance:
- 0 hits → proceed.
- 1-3 hits → manually inspect each. If the hit is a true near-duplicate (same concept at same depth), remove that entry from the chunk file by deleting its object literal and re-saving. Each removal reduces the chunk count by 1; this is acceptable as long as the floor of 18 still holds.
- ≥4 hits → trigger Task 6 (re-dispatch the topic).

- [ ] **Step 5: Commit validation pass** (no new code; the validator was already committed in the prior round)

```bash
# Nothing new to commit unless near-duplicates were manually pruned in step 4.
# If chunks were edited, commit them:
git add build/chunk-cv-v3.json build/chunk-pm-v3.json 2>/dev/null && git commit -m "Prune near-duplicates from v3 chunks" || echo "no near-dupes pruned"
```

---

## Task 6: Re-dispatch any chunk below floor or with discipline failures (conditional)

Only run this task if Task 5 failed for one or both chunks. If both chunks passed, skip to Task 7.

**Files:**
- Re-create: the offending `build/chunk-*-v3.json`

- [ ] **Step 1: For each failed chunk, identify the failure mode**

Map each chunk's failure to one of:
- **A.** JSON malformed / schema violations → re-dispatch with parse errors in prompt
- **B.** Topic count below floor (18) → re-dispatch asking for `(floor - current)` more questions with new unused ids in the chunk's range; keep validated questions from prior round
- **C.** Type-mix off by >2 → re-dispatch asking specifically for missing types
- **D.** Video bias under 6 (CV only) → re-dispatch agent C2 asking for additional video-only questions
- **E.** PM discipline failures > 1 (PM only) → re-dispatch agent D2 with explicit examples of failing questions and the AI-services-only rule restated
- **F.** Near-duplicates ≥4 → re-dispatch with the offending stems explicitly listed in the prompt as "must not produce questions resembling any of these"

- [ ] **Step 2: Dispatch only the failed agents (in one message if both)**

Reuse the prompt structure from Task 4 step 2 with:
- The original schema block
- Original URL list (or a subset if scoping to a sub-area)
- New id range = unused ids within the original range (if topping up) OR the same range (if regenerating from scratch)
- Explicit "previous attempt had these problems: …" preamble
- The original dedup brief
- Same Write-to-file instruction (overwrite if regenerating; write to a temp file if topping up, then merge by hand)

- [ ] **Step 3: Re-validate**

Re-run the relevant Task 5 commands. **Only one re-dispatch round.** If still below floor after one re-dispatch, accept the lower count and move on (quality-first stance from spec).

- [ ] **Step 4: Commit if changes occurred**

```bash
git add build/chunk-*-v3.json
git commit -m "Re-dispatched <topic> v3 chunk to address <failure mode>"
```

---

## Task 7: Merge validated chunks and inject into `practice2.html`

**Files:**
- Read: `build/chunk-cv-v3.json`, `build/chunk-pm-v3.json`
- Create: `build/merged-v3.json`
- Modify: `practice2.html` (the `RAW_QUESTIONS` array — append before the closing `];`)

- [ ] **Step 1: Build the merged delta**

```bash
python3 - <<'PY'
import json
chunks = ['cv-v3', 'pm-v3']
out = []
for c in chunks:
    out.extend(json.load(open(f'build/chunk-{c}.json')))
# safety: dedupe ids
ids = [q['id'] for q in out]
assert len(ids) == len(set(ids)), f'duplicate ids in merged delta: {[i for i in ids if ids.count(i) > 1]}'
# safety: all ids in 161..200 (no collision with existing 1..160)
assert min(ids) >= 161, f'new id collides with existing pool: min id is {min(ids)}'
assert max(ids) <= 200, f'new id exceeds reserved range: max id is {max(ids)}'
json.dump(out, open('build/merged-v3.json','w'), indent=2)
print(f'merged: {len(out)} questions, id range {min(ids)}..{max(ids)}')
PY
```

Expected: `merged: 40 questions, id range 161..200` (or fewer if Task 6 accepted under-target — adjust mentally).

- [ ] **Step 2: Find the closing bracket of `RAW_QUESTIONS` in practice2.html**

Run:
```bash
grep -n "^    \];" practice2.html | head -5
```

This finds top-level array closings. The first one after line 54 is the close of `RAW_QUESTIONS`.

- [ ] **Step 3: Insert the merged questions before the close**

Use the same Python insertion approach as the prior round (works generically because it locates the close by string match, not line number):

```bash
python3 - <<'PY'
import json
src = open('practice2.html').read()
delta = json.load(open('build/merged-v3.json'))

def render(q):
    return '    ' + json.dumps(q, ensure_ascii=False)

block = ',\n'.join(render(q) for q in delta)

# Find the closing of RAW_QUESTIONS: the first "\n    ];\n" after the array opening.
start = src.index('const RAW_QUESTIONS = [')
close_idx = src.index('\n    ];\n', start)
# Insert a comma + newline + our block before the close, so the previous last entry gets a trailing comma.
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
grep -oE '"id":\s*[0-9]+' practice2.html | awk '{print $2}' | sort -n | uniq -c | awk '$1 > 1'
```

Expected (with full delta):
- Total: 200
- Per topic: `50 agentic`, `50 genai-foundry`, `50 computer-vision`, `50 plan-and-manage`
- Duplicate-ids check: empty output

(Adjust expected if Task 6 accepted under-target.)

- [ ] **Step 5: Open `practice2.html` in a browser**

Expected:
- All four topic cards visible and enabled.
- Each card shows the updated `X / Y answered` line — for fresh state, "0 / 50 answered".
- Click each card: practice view opens, first question renders.
- Click "Mixed": 20-question session draws from all four pools.
- Open browser console (F12): no `Rejected N invalid questions` warning, or if present, N is 0.

If the console shows rejections, inspect via the JS console:
```js
JSON.stringify(_vRes.invalid, null, 2)
```
Investigate any rejected entries; if specific entries are bad, remove them from the chunk file and re-run Task 7 step 1 + step 3.

- [ ] **Step 6: Commit the populated file**

```bash
git add practice2.html build/merged-v3.json
git commit -m "Inject +40 v3 questions: +20 CV, +20 plan-and-manage"
```

---

## Task 8: Final smoke-read

**Files:**
- Read: `practice2.html`

- [ ] **Step 1: Sample-read top/middle/bottom of RAW_QUESTIONS**

Read entries at ids 1-3, around id 100, and 198-200. For each:
- Required fields present
- `source.url` is a `learn.microsoft.com/...` URL
- `explanation` makes sense in context of the question

Run a quick automated scan:
```bash
python3 - <<'PY'
import re
src = open('practice2.html').read()
ids = sorted(int(m.group(1)) for m in re.finditer(r'"id":\s*(\d+)', src))
print('total ids:', len(ids), 'min:', min(ids), 'max:', max(ids))
print('gaps:', [i for i in range(min(ids), max(ids)+1) if i not in set(ids)])
bad = re.findall(r'"url":\s*"((?!https://learn\.microsoft\.com)[^"]*)"', src)
print('non-learn URLs:', bad)
PY
```

Expected:
- `total ids: 200` (or close, if Task 6 accepted under-target)
- `min: 1`, `max: 200`
- `gaps: []` (or a small acceptable set if Task 6 accepted under-target — in that case the gaps are the un-filled ids inside 161..200)
- `non-learn URLs: []`

- [ ] **Step 2: Verify video bias still holds in-place**

```bash
python3 - <<'PY'
import re
src = open('practice2.html').read()
cv_block = re.findall(r'\{[^{}]*"topic":\s*"computer-vision"[^{}]*\}', src, flags=re.DOTALL)
print('cv entries scanned:', len(cv_block))
video = [b for b in cv_block if 'video' in b.lower()]
print('video-related cv:', len(video))
PY
```

Expected: total cv entries ~50, video-related ~14-17 (the prior round's 8-10 + this round's 6-7).

- [ ] **Step 3: No commit** — read-only verification.

---

## Task 9: Browser exercise (user-validated)

**Files:** none modified.

This is the human-in-the-loop check. The plan can be considered complete only after this passes.

- [ ] **Step 1: Open `practice2.html` in a real browser**

Verify on the home screen:
- All four topic cards render with subtitles.
- Each card now shows `0 / 50` answered (for fresh state) or carries over prior progress for the existing 30 / 50 / 50 if the user has practiced before.
- Each card is enabled (clickable).

- [ ] **Step 2: Run a 5-question session each in CV and PM**

For both `computer-vision` and `plan-and-manage`:
- Start the topic.
- Answer 5 questions.
- Confirm: question renders, options render, grading works, explanation appears, source attribution links to `learn.microsoft.com`, Next advances.
- Roughly assess: do any of the 5 feel like near-duplicates of questions you remember from the existing 30? (Subjective but useful — flag and remove if so.)

- [ ] **Step 3: Run a 20-question mixed session**

Confirm the distribution feels right (questions from all four topics appear, weighting roughly matches exam %, no crashes).

- [ ] **Step 4: Reset and re-open**

Click reset, reload, confirm in-progress state clears and home view is clean.

- [ ] **Step 5: Commit a marker that the build was user-validated** (optional)

```bash
git commit --allow-empty -m "User-validated v3 expansion: +20 CV, +20 PM, 200 questions total"
```

---

## Self-Review (post-write)

**Spec coverage:**
- "Add 20 to computer-vision (ids 161-180)" → Tasks 4, 7
- "Add 20 to plan-and-manage (ids 181-200)" → Tasks 4, 7
- "No schema, validator, TOPICS, TOPIC_WEIGHTS, or UI changes" → Task 1 step 3 verifies prerequisites; no task modifies any of those
- "Pre-flight dedup briefing" → Task 2
- "URL lists biased toward under-used Learn units" → Task 3
- "Two parallel subagents in one message" → Task 4 step 2
- "Sub-area mix: CV 6-7 video / 13-14 other; PM AI-services-only discipline" → Task 4 step 2 (per-agent prompts), Task 5 steps 2-3 (validation)
- "Type mix ~12/1/4/3 per topic ±2" → Task 4 step 2, Task 5 step 1 (validator)
- "Quality floor ≥18 per topic, one re-dispatch round" → Task 5 step 1 (floors), Task 6 (conditional re-dispatch)
- "Source.url ∈ agent's assigned list" → Task 5 step 1 (existing validator enforces this)
- "Post-hoc near-duplicate scan as backstop" → Task 5 step 4
- "No id collisions with existing 1..160" → Task 1 verifies start, Task 7 step 1 asserts at merge
- "Storage preserved (key ai102-practice-v2)" → no migration in any task
- "Single static HTML file" → only `practice2.html` is modified at Task 7

All spec requirements have at least one task. No gaps.

**Placeholder scan:** No TBDs, no "implement appropriate error handling", no naked "write tests for the above". Each step has either exact code, an exact command, or a concrete verification action.

**Type consistency:** Topic ids used throughout are exactly `computer-vision` and `plan-and-manage`. Id ranges 161..180 and 181..200 do not overlap and sum to 40. The dedup-brief field schema (`id`, `type`, `stem_fragment`, `unit`, `url`) is defined in Task 2 step 1 and consumed in Task 5 step 4 — fields match. The validator hardcoded path workaround (Task 5 step 1) is explicit about the symlink/copy and restore.

No issues to fix.
