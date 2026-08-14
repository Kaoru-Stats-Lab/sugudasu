#!/usr/bin/env node
/**
 * Presentation settings helpers + Color Must smoke
 * Run: node scripts/graph-presentation-settings.test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeHex,
  buildPresentationFromSettings,
  listSpecCategories,
} from '../assets/graph-presentation-settings.js';
import { extractObservableFromTsv } from '../assets/graph-observable-extractor.js';
import { createGraphDecisionEngine } from '../assets/graph-decision-engine.js';
import { buildGraphSpec } from '../assets/graph-spec-builder.js';
import { renderGraph } from '../assets/graph-renderer.js';

assert.equal(normalizeHex('1d4ed8'), '#1D4ED8');
assert.equal(normalizeHex('#ea580c'), '#EA580C');
assert.equal(normalizeHex('zzz'), null);

const p = buildPresentationFromSettings({
  series_color: '#1D4ED8',
  accent_color: 'ea580c',
  accent_categories: ['12月', '12月', ''],
  show_value_labels: true,
});
assert.equal(p.series_color, '#1D4ED8');
assert.equal(p.accent_color, '#EA580C');
assert.deepEqual(p.accent_categories, ['12月']);
assert.equal(p.show_value_labels, true);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDoc = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'graph', 'GRAPH_RULES.json'), 'utf8'));
const engine = createGraphDecisionEngine(rulesDoc);
const tsv = '月\t来場者\n6月\t1000\n7月\t1100\n8月\t1400\n12月\t1600\n';
const extracted = extractObservableFromTsv(tsv);
const decision = engine.decide({
  observable: extracted.observable,
  intent: 'TREND',
  measures: extracted.measures,
});
const payload = buildGraphSpec(decision, {
  intent: 'TREND',
  observable: extracted.observable,
  table: extracted.table,
  measures: extracted.measures,
  rulesDoc,
});
const cats = listSpecCategories(payload.graph_spec);
assert.ok(cats.includes('12月'));

const rendered = await renderGraph(payload, {
  format: 'svg',
  presentation: buildPresentationFromSettings({
    series_color: '#1D4ED8',
    accent_color: '#EA580C',
    accent_categories: ['12月'],
  }),
});
assert.equal(rendered.ok, true, rendered.reason_codes?.join(','));
assert.match(rendered.body, /#EA580C/);
assert.match(rendered.body, /#93C5FD/);

console.log('graph-presentation-settings: OK');
