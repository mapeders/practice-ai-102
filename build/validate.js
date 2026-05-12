#!/usr/bin/env node
// Validates and merges chunk-*.json into questions.json.
// Usage: node validate.js

const fs = require('fs');
const path = require('path');

const BUILD_DIR = __dirname;
const URL_LIST = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'url-list.json'), 'utf8'));
const URL_SET = new Set(URL_LIST.map(u => u.url));

const TYPE_TARGETS = { mc_single: 38, mc_multi: 2, sequence: 12, hotspot: 8 };
const TYPE_TOLERANCE = 2;
const TOPIC_FLOOR = 28;

function validateOne(q) {
  const errs = [];
  if (typeof q.id !== 'number') errs.push('missing id');
  if (!['agentic', 'genai-foundry'].includes(q.topic)) errs.push('bad topic');
  if (!['mc_single', 'mc_multi', 'sequence', 'hotspot'].includes(q.type)) errs.push('bad type');
  if (typeof q.question !== 'string' || !q.question.trim()) errs.push('missing question');
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) errs.push('missing explanation');
  if (!q.source || !q.source.path || !q.source.module || !q.source.unit || !q.source.url) errs.push('incomplete source');
  if (q.source && q.source.url && !URL_SET.has(q.source.url)) errs.push('hallucinated source.url: ' + q.source.url);

  if (q.type === 'mc_single' || q.type === 'mc_multi') {
    if (!Array.isArray(q.options) || q.options.length < 2) errs.push('options missing or <2');
    if (!Array.isArray(q.correct) || q.correct.length === 0) errs.push('correct missing');
    if (q.type === 'mc_single' && q.correct && q.correct.length !== 1) errs.push('mc_single must have exactly 1 correct');
    if (q.type === 'mc_multi' && q.correct && q.correct.length < 2) errs.push('mc_multi must have 2+ correct');
    const ids = new Set((q.options || []).map(o => o.id));
    for (const c of (q.correct || [])) if (!ids.has(c)) errs.push('correct id not in options: ' + c);
  } else if (q.type === 'sequence') {
    if (!Array.isArray(q.items) || q.items.length < 3) errs.push('items missing or <3');
    if (!Array.isArray(q.correct_order)) errs.push('correct_order missing');
    if (q.items && q.correct_order && q.items.length !== q.correct_order.length) errs.push('items/correct_order length mismatch');
    const ids = new Set((q.items || []).map(i => i.id));
    for (const c of (q.correct_order || [])) if (!ids.has(c)) errs.push('correct_order id not in items: ' + c);
  } else if (q.type === 'hotspot') {
    if (!Array.isArray(q.blanks) || q.blanks.length < 2) errs.push('blanks missing or <2');
    for (const b of (q.blanks || [])) {
      if (!b || !b.id || !b.prompt || !Array.isArray(b.options) || b.options.length < 2 || !b.correct) {
        errs.push('blank malformed');
        break;
      }
      const ids = new Set(b.options.map(o => o.id));
      if (!ids.has(b.correct)) errs.push('blank correct not in options: ' + b.correct);
    }
  }
  return errs;
}

const merged = [];
const seenIds = new Set();
const rejected = [];
for (let i = 1; i <= 4; i++) {
  const chunkPath = path.join(BUILD_DIR, `chunk-${i}.json`);
  if (!fs.existsSync(chunkPath)) {
    console.error(`MISSING: ${chunkPath}`);
    process.exit(1);
  }
  let chunk;
  try { chunk = JSON.parse(fs.readFileSync(chunkPath, 'utf8')); }
  catch (e) { console.error(`BAD JSON in chunk-${i}.json:`, e.message); process.exit(1); }
  if (!Array.isArray(chunk)) { console.error(`chunk-${i}.json is not an array`); process.exit(1); }

  for (const q of chunk) {
    const errs = validateOne(q);
    if (q && typeof q.id === 'number' && seenIds.has(q.id)) errs.push('duplicate id ' + q.id);
    if (errs.length) {
      rejected.push({ chunk: i, id: q && q.id, errs });
    } else {
      seenIds.add(q.id);
      merged.push(q);
    }
  }
}

const byTopic = merged.reduce((a, q) => (a[q.topic] = (a[q.topic] || 0) + 1, a), {});
const byType = merged.reduce((a, q) => (a[q.type] = (a[q.type] || 0) + 1, a), {});

console.log('---- VALIDATION REPORT ----');
console.log('total accepted:', merged.length);
console.log('rejected:', rejected.length);
if (rejected.length) console.log(JSON.stringify(rejected, null, 2));
console.log('by topic:', byTopic);
console.log('by type :', byType);

const issues = [];
for (const t of Object.keys(TYPE_TARGETS)) {
  const have = byType[t] || 0;
  if (Math.abs(have - TYPE_TARGETS[t]) > TYPE_TOLERANCE) {
    issues.push(`type ${t}: have ${have}, target ${TYPE_TARGETS[t]} (±${TYPE_TOLERANCE})`);
  }
}
for (const top of ['agentic', 'genai-foundry']) {
  const have = byTopic[top] || 0;
  if (have < TOPIC_FLOOR) issues.push(`topic ${top}: have ${have}, floor ${TOPIC_FLOOR}`);
}

if (issues.length) {
  console.log('---- ISSUES ----');
  for (const i of issues) console.log(' -', i);
  console.log('Re-dispatch the relevant chunk before merging.');
  process.exit(2);
}

merged.sort((a, b) => a.id - b.id);
fs.writeFileSync(path.join(BUILD_DIR, 'questions.json'), JSON.stringify(merged, null, 2));
console.log('wrote', path.join(BUILD_DIR, 'questions.json'));
