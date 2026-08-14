#!/usr/bin/env node
/**
 * Roadmap hygiene — shipped leftovers · disabled Intent coverage · status hygiene · product keys
 * Spec: docs/notes/DEV_TRANSPARENCY_RULES.md §3 · §5b
 * Run: npm run validate:roadmap
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roadmap = JSON.parse(fs.readFileSync(path.join(root, 'data', 'roadmap.json'), 'utf8'));
const intentMapPath = path.join(root, 'data', 'roadmap-intent-map.json');
const intentMap = fs.existsSync(intentMapPath)
  ? JSON.parse(fs.readFileSync(intentMapPath, 'utf8'))
  : { maps: [] };
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'tool-registry.json'), 'utf8'));
const registryIds = new Set(Object.keys(registry.tools || {}));

const errors = [];
const warnings = [];
const ids = new Set();
const ACTIVE = new Set(['scheduled', 'considering', 'sync_lane']);
const DISPLAY = new Set(['scheduled', 'considering', 'sync_lane', 'out_of_scope']);

const SHIPPED_CLAIM = /実装済み\s*α|v0\.\d\s*実装[。.]|v0\.\d\s*公開済/;
const EXTENSION_OK = /未対応|検討|候補|次段|別チケット|拡張|残り|FAQどおり|準備中/;

const productBuckets = new Map();

for (const item of roadmap.items || []) {
  const id = item.id;
  if (!id) {
    errors.push('roadmap item missing id');
    continue;
  }
  if (ids.has(id)) errors.push(`duplicate roadmap id: ${id}`);
  ids.add(id);

  if (!item.toolLabel) {
    errors.push(`${id}: toolLabel required (product list grouping)`);
  }

  if (item.toolId != null && item.toolId !== '') {
    if (!registryIds.has(item.toolId)) {
      errors.push(`${id}: toolId=${item.toolId} not in tool-registry.json`);
    }
  }

  if (item.status === 'rejected' || item.status === 'done') {
    errors.push(
      `${id}: status=${item.status} must not stay in roadmap.json (remove after ship / reject; see DEV_TRANSPARENCY §3)`
    );
  }

  if (!DISPLAY.has(item.status) && item.status !== 'rejected' && item.status !== 'done') {
    warnings.push(`${id}: unknown status ${item.status}`);
  }

  if (ACTIVE.has(item.status)) {
    const summary = String(item.summary || '');
    if (SHIPPED_CLAIM.test(summary) && !EXTENSION_OK.test(summary)) {
      errors.push(
        `${id}: summary looks shipped but status=${item.status} — remove from roadmap (changelog is SSOT for past)`
      );
    }
  }

  const pKey = item.toolId || item.toolLabel || '(none)';
  if (!productBuckets.has(pKey)) productBuckets.set(pKey, { label: item.toolLabel || pKey, n: 0, active: 0 });
  const bucket = productBuckets.get(pKey);
  bucket.n += 1;
  if (ACTIVE.has(item.status)) bucket.active += 1;
}

// R3: disabled Intent / CND ready:false must map to a roadmap id
for (const entry of intentMap.maps || []) {
  const rid = entry.roadmap_id;
  if (!rid || !ids.has(rid)) {
    errors.push(
      `intent-map: ${entry.tool_id || '?'} ${entry.intent || entry.choice_id || '?'} → roadmap_id=${rid} missing`
    );
    continue;
  }
  const mapped = (roadmap.items || []).find((i) => i.id === rid);
  if (mapped && entry.tool_id && mapped.toolId && mapped.toolId !== entry.tool_id) {
    errors.push(
      `intent-map: ${entry.tool_id} → ${rid} has toolId=${mapped.toolId} (mismatch)`
    );
  }
  if (mapped && !ACTIVE.has(mapped.status) && mapped.status !== 'out_of_scope') {
    errors.push(`intent-map: ${rid} status=${mapped.status} is not active/oos`);
  }
}

// Scan graph-app for previewReady:false / ready:false without map coverage
const graphApp = path.join(root, 'assets', 'graph-app.js');
if (fs.existsSync(graphApp)) {
  const src = fs.readFileSync(graphApp, 'utf8');
  const mappedIntents = new Set(
    (intentMap.maps || []).filter((m) => m.tool_id === 'graph' && m.intent).map((m) => m.intent)
  );
  const mappedChoices = new Set(
    (intentMap.maps || []).filter((m) => m.tool_id === 'graph' && m.choice_id).map((m) => m.choice_id)
  );

  function nearestId(before, pattern) {
    const hits = [...before.matchAll(pattern)];
    return hits.length ? hits[hits.length - 1][1] : null;
  }

  for (const m of src.matchAll(/previewReady:\s*false/g)) {
    const before = src.slice(Math.max(0, m.index - 240), m.index);
    const intent = nearestId(before, /id:\s*'([A-Z0-9_]+)'/g);
    if (intent && !mappedIntents.has(intent)) {
      errors.push(`graph-app: Intent ${intent} is previewReady:false but not in data/roadmap-intent-map.json`);
    }
  }
  for (const m of src.matchAll(/ready:\s*false/g)) {
    const before = src.slice(Math.max(0, m.index - 240), m.index);
    // skip previewReady:false (already handled)
    if (/previewReady:\s*$/.test(before)) continue;
    const choice = nearestId(before, /id:\s*'([a-z0-9_]+)'/g);
    if (choice && !mappedChoices.has(choice)) {
      errors.push(`graph-app: choice ${choice} is ready:false but not in data/roadmap-intent-map.json`);
    }
  }
}

if (errors.length) {
  console.error('[roadmap-guard] FAIL');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

const productSummary = [...productBuckets.entries()]
  .filter(([, b]) => b.active > 0)
  .sort((a, b) => a[1].label.localeCompare(b[1].label, 'ja'))
  .map(([k, b]) => `${b.label || k}:${b.active}`)
  .join(', ');

console.log(
  `[roadmap-guard] OK: items=${roadmap.items.length} · products=${productBuckets.size} · intent-maps=${(intentMap.maps || []).length}` +
    (warnings.length ? ` · warnings=${warnings.length}` : '')
);
console.log(`[roadmap-guard] by-product: ${productSummary}`);
for (const w of warnings) console.warn(' !', w);
assert.ok(roadmap.items.length > 0);
