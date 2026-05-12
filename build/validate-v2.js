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

const ALLOWED_TOPICS = ['agentic','genai-foundry','computer-vision','plan-and-manage','knowledge-mining'];
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
