#!/usr/bin/env node
/**
 * Graph Renderer R1 Contract Tests
 * Run: npm run test:graph-renderer
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractObservableFromTsv } from '../assets/graph-observable-extractor.js';
import { createGraphDecisionEngine } from '../assets/graph-decision-engine.js';
import { buildGraphSpec } from '../assets/graph-spec-builder.js';
import { renderGraph, R1_TYPES } from '../assets/graph-renderer.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDoc = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'graph', 'GRAPH_RULES.json'), 'utf8'));
const engine = createGraphDecisionEngine(rulesDoc);
const rendererSrc = fs.readFileSync(path.join(root, 'assets', 'graph-renderer.js'), 'utf8');

function buildPayload(tsv, intent, choice) {
  const extracted = extractObservableFromTsv(tsv);
  const decision = engine.decide({
    observable: extracted.observable,
    intent,
    measures: extracted.measures,
  });
  return buildGraphSpec(decision, {
    intent,
    observable: extracted.observable,
    table: extracted.table,
    measures: extracted.measures,
    confirmation_choice_id: choice,
    rulesDoc,
  });
}

// No decision leakage in source
{
  assert.equal(/matched_rule_id\s*===/.test(rendererSrc), false);
  assert.equal(/if\s*\(\s*intent/.test(rendererSrc), false);
  assert.equal(/RLE-\d+/.test(rendererSrc), false);
}

// Line determinism
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const payload = buildPayload(tsv, 'TREND');
  const a = await renderGraph(payload, { format: 'svg', width: 640, height: 360 });
  const b = await renderGraph(payload, { format: 'svg', width: 640, height: 360 });
  assert.equal(a.ok, true, a.reason_codes?.join(','));
  assert.equal(a.chart_type, 'Line');
  assert.equal(a.network_required, false);
  assert.match(a.body, /viewBox=/);
  assert.match(a.body, /sg-graphic/);
  assert.match(a.body, /sg-text/);
  assert.match(a.body, /sg-mark-line/);
  assert.equal(a.body, b.body);
}

// Column
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n';
  const payload = buildPayload(tsv, 'TREND');
  const r = await renderGraph(payload, { format: 'svg' });
  assert.equal(r.ok, true);
  assert.equal(r.chart_type, 'Column');
  assert.match(r.body, /sg-mark-column/);
}

// Bar
{
  const tsv = '事業部\t売上\n営業本部\t100\n開発本部\t120\n管理本部\t80\n製造本部\t90\n販売本部\t70\n';
  const payload = buildPayload(tsv, 'RANKING');
  const r = await renderGraph(payload, { format: 'svg' });
  assert.equal(r.ok, true);
  assert.equal(r.chart_type, 'Bar');
  assert.match(r.body, /sg-mark-bar/);
}

// Invalid / terminal → REJECT, no draw
{
  const payload = buildPayload(
    '月\t売上（円）\t利益率（%）\n1月\t1000\t12\n2月\t1200\t14\n3月\t1400\t13\n',
    'BREAKDOWN'
  );
  const r = await renderGraph(payload, { format: 'svg' });
  assert.equal(r.ok, false);
  assert.equal(r.body, null);
  assert.ok(r.reason_codes.includes('terminal_payload_no_render'));
}

// R2 type not drawn (Waterfall via BRIDGE)
{
  const payload = buildPayload(
    '要因\t増減\n開始\t100\n価格\t20\n数量\t-5\n終了\t115\n',
    'BRIDGE'
  );
  assert.equal(payload.graph_spec?.chart?.type, 'Waterfall');
  const r = await renderGraph(payload, { format: 'svg' });
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes('renderer_type_not_in_r1'));
  assert.equal(R1_TYPES.has('Waterfall'), false);
}

// PNG from same Spec
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const payload = buildPayload(tsv, 'TREND');
  const r = await renderGraph(payload, { format: 'png', width: 320, height: 180 });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.equal(r.format, 'png');
  assert.ok(Buffer.isBuffer(r.body));
  assert.ok(r.body.length > 100);
  // PNG magic
  assert.equal(r.body[0], 0x89);
  assert.equal(r.body[1], 0x50);
}

console.log('graph-renderer: OK');
