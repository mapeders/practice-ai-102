# AI-102 practice: Python & REST focus pack (30 questions)

**Date:** 2026-05-22
**Goal:** Add a fourth focus pack to `practice2.html` that drills the Python SDKs and REST endpoints behind Azure AI services — the exact URLs, query parameters, headers, request-body fields, package names, client constructors, and SDK method signatures the AI-102 exam tests.

## Why this pack

The existing 420-question pool tests *concepts* (when to use service X, which model fits which workload). Mads' three practice exams confirm conceptual coverage is now strong, but the score report and post-mortems indicate weakness on the mechanical detail of *invoking* the services — which URL segment, which `api-version`, which header, which Python import. A dedicated focus pack drills that layer.

## Where it fits

The pack is a peer of the three retake-focus packs (`test1`, `test2`, `test3`). It uses the same `category` mechanism: questions are tagged `category="python-rest"`, surfaced via a dedicated home-screen card, and excluded from topic drills + Mixed mode by the existing `!q.category` filter in `questionsForTopic`.

It is **not** a topic expansion (no new `topic` value) — every question is still tagged with one of the six existing topics (`agentic`, `genai-foundry`, `computer-vision`, `plan-and-manage`, `knowledge-mining`, `natural-language`) so the schema validator passes unchanged.

## Pack inventory

- **Category:** `python-rest`
- **Display name:** Python & REST — Focus
- **Subtitle:** Endpoints, headers, request bodies, SDK clients
- **Card color:** emerald (test1=amber, test2=violet, test3=rose, python-rest=emerald)
- **Size:** 30 questions
- **ID range:** 421–450 (test3 ended at 420; next free id is 421)

## Service coverage (30 = 4+4+4+4+4+5+5)

| Service | n | `topic` tag |
|---|---|---|
| Azure AI Language | 4 | natural-language |
| Azure AI Speech | 4 | natural-language |
| Azure AI Vision (Image Analysis 4.0) | 4 | computer-vision |
| Azure Document Intelligence | 4 | knowledge-mining |
| Azure AI Search | 5 | knowledge-mining |
| Foundry / Azure OpenAI | 5 | genai-foundry |
| Content Safety | 4 | plan-and-manage |

Foundry/AOAI and AI Search get the +1 each because they map to the heaviest-weighted exam objectives and Mads' two weakest score-report bars (genai-foundry, knowledge-mining).

Translator is intentionally folded into Language for this pack — exam questions on Translator usually concern translation **policy** (regional routing, multi-target), not the URL/SDK mechanics the pack drills.

## Code vs REST balance

- **15 REST** + **15 Python** (50/50)
- REST questions target: URL path segments, `api-version` query parameter, required request headers (`Ocp-Apim-Subscription-Key`, `Content-Type`, `x-ms-region`, AAD `Authorization: Bearer …`), and request-body field names/values
- Python questions target: package + import paths (`azure-ai-language-conversations`, `openai.AzureOpenAI`, `azure-ai-documentintelligence`, etc.), client constructor arguments (`endpoint`, `credential`, `api_version`), method names + parameters (`begin_analyze_document`, `features=`, `analyze_text(...)`)

## Question type mix (matches test3 ratio scaled to 30)

| Type | n |
|---|---|
| mc_single | 14 |
| mc_multi | 7 |
| hotspot | 6 |
| sequence | 3 |
| **Total** | **30** |

Hotspots are concentrated on the highest-value drills: filling missing URL segments, missing `api-version`, missing header names, missing SDK method args. Sequence questions cover end-to-end invocation flows (e.g., "place the steps to call Document Intelligence prebuilt-layout via REST in order: build URL → set headers → POST → poll → GET result").

## Sourcing policy

All examples are sourced from **learn.microsoft.com** AI-102 training modules, fetched online at authoring time. Each question's `source` object cites the specific module + unit + URL the example came from. This mirrors the source-attribution requirement already enforced for all 420 existing questions.

Anchor URLs (one per service) — each is the unit that contains the canonical Python or REST sample for that service:

| Service | Anchor Learn URL |
|---|---|
| Azure AI Language | `https://learn.microsoft.com/en-us/training/modules/analyze-text-ai-language/` |
| Azure AI Speech | `https://learn.microsoft.com/en-us/training/modules/recognize-synthesize-speech/` |
| Azure AI Vision | `https://learn.microsoft.com/en-us/training/modules/analyze-images/` |
| Azure Document Intelligence | `https://learn.microsoft.com/en-us/training/modules/analyze-receipts-form-recognizer/` |
| Azure AI Search | `https://learn.microsoft.com/en-us/training/modules/create-azure-ai-custom-skill/` |
| Foundry / Azure OpenAI | `https://learn.microsoft.com/en-us/training/modules/get-started-openai/` |
| Content Safety | `https://learn.microsoft.com/en-us/training/modules/responsible-generative-ai/` |

(The implementation plan will fetch each URL and any sibling units that contain code samples; the spec just records the entry points.)

**Risk:** these are anchor slugs known to exist on learn.microsoft.com but module slugs can be renamed. Implementation must verify each URL returns 200 before citing it in a question; if any anchor 404s, substitute the closest still-live module covering the same service and update this spec.

Where a Learn page shows the same example in multiple languages (C#, JS, Python), only the **Python** form is used — matching prior precedent commit `b650e5c` ("Make practice Python-focused").

## App plumbing

Only one source file changes: `practice2.html`. Five edits within it:

1. **Question array** — append 30 new objects (IDs 421–450) inside `RAW_QUESTIONS`, each with `category: "python-rest"` and a `source` object.
2. **Home-screen card** — insert a new emerald-colored card after `test3Card`, gated on `categoryStats('python-rest').total > 0`, with `data-mode="python-rest"`.
3. **Card wiring** — `root.innerHTML = cards + test1Card + test2Card + test3Card + pythonRestCard + mixedCard + queueCard;` and an `addEventListener('click', startPythonRest)` line.
4. **Start handler** — `startPythonRest()` analogous to `startTest3()`, calling `questionsForCategory('python-rest')`.
5. **Completion label** — extend the session-end mode switch (~line 3329) with `: session.mode === 'python-rest' ? 'Python & REST — Focus complete'`.

No changes to the question-schema validator are needed: `category` is a free-form string and the validator already permits any value there.

## Schema (per question, unchanged)

Each question follows the existing schema. Example skeleton:

```json
{
  "id": 421,
  "topic": "genai-foundry",
  "category": "python-rest",
  "type": "hotspot",
  "question": "Complete the Azure OpenAI chat completions REST call ...",
  "blanks": [ /* … */ ],
  "explanation": "…",
  "source": {
    "path": "Develop generative AI solutions with Azure OpenAI",
    "module": "Get started with Azure OpenAI Service",
    "unit": "Use Azure OpenAI REST API",
    "url": "https://learn.microsoft.com/…"
  }
}
```

## Out of scope (YAGNI)

- No new `topic` value (would break the validator's allow-list and skew the topic-drill weights).
- No changes to the chunk-pipeline (`build/chunk-*.json`, `validate.js`). Direct authoring is the right scale for a 30-question pack, matching the three retake-focus precedents.
- No CSV/Markdown export of the question pack — the static HTML file is the authoritative store.
- No tracking of "REST vs Python" as a stat on the home screen. The pack is a unified focus mode; you don't need a sub-score.

## Git workflow

- Feature branch: `feature/python-rest-focus` (off `develop`)
- Commits: (1) spec, (2) plan, (3) question pack + UI wiring
- Merge `feature/python-rest-focus` → `develop` → fast-forward `main` → tag `release10`
- All branches pushed

## Success criteria

- All 30 questions pass `validateQuestions` (no rejections logged in browser console)
- Mixed mode + every topic drill still show their existing question counts (the `!q.category` filter must work)
- Home screen shows the new emerald "Python & REST — Focus" card with the correct progress chip
- Each question's `source.url` resolves to a live Microsoft Learn AI-102 training page
- The pack runs end-to-end (start → answer → review → completion message → return to home)
