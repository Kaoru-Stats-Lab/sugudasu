#!/usr/bin/env node
/**
 * Graph Spec Contract Tests
 * Spec: docs/graph/GRAPH_SPEC_CONTRACT.md
 * Run: npm run test:graph-spec
 *
 * Renderer HOLD — Spec generation only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractObservableFromTsv } from '../assets/graph-observable-extractor.js';
import { createGraphDecisionEngine } from '../assets/graph-decision-engine.js';
import {
  buildGraphSpec,
  hasGraphSpec,
  stableStringify,
} from '../assets/graph-spec-builder.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDoc = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'graph', 'GRAPH_RULES.json'), 'utf8'));
const engine = createGraphDecisionEngine(rulesDoc);

function pipeline(tsv, intent, confirmation_choice_id = undefined) {
  const extracted = extractObservableFromTsv(tsv);
  const decision = engine.decide({
    observable: extracted.observable,
    intent,
    measures: extracted.measures,
  });
  const payload = buildGraphSpec(decision, {
    intent,
    observable: extracted.observable,
    table: extracted.table,
    measures: extracted.measures,
    confirmation_choice_id,
    rulesDoc,
  });
  return { extracted, decision, payload };
}

// --- MATCH → Graph Spec exists ---
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const { decision, payload } = pipeline(tsv, 'TREND');
  assert.equal(decision.state, 'MATCH');
  assert.equal(hasGraphSpec(payload), true);
  assert.equal(payload.graph_spec.chart.type, 'Line');
  assert.equal(payload.graph_spec.source.matched_rule_id, 'RLE-001');
  assert.equal(payload.graph_spec.data.preserve_raw, true);
  assert.equal(payload.graph_spec.constraints.allow_3d, false);
  assert.equal(payload.graph_spec.constraints.zero_baseline, true);
  assert.ok(payload.graph_spec.data.series[0].values.every((v) => 'raw' in v && 'display' in v));
}

// --- CONVERTIBLE → transformation reflected + Spec exists ---
{
  const tsv =
    '事業部\t2022\t2023\t2024\t2025\n営業\t100\t110\t120\t130\n開発\t80\t90\t95\t100\n管理\t50\t55\t60\t65\n製造\t70\t75\t80\t85\n';
  const { decision, payload } = pipeline(tsv, 'MIX_SHIFT');
  assert.equal(decision.state, 'CONVERTIBLE');
  assert.equal(hasGraphSpec(payload), true);
  assert.equal(payload.graph_spec.chart.type, '100pct_Stacked_Column');
  assert.equal(payload.graph_spec.transform.id, 'normalize_to_percentage');
  assert.equal(payload.graph_spec.transform.applied, true);
  const col0 = payload.graph_spec.data.series.map((s) => s.values[0]);
  const sumDisplay = col0.reduce((a, v) => a + v.display, 0);
  assert.ok(Math.abs(sumDisplay - 100) < 1e-6, `normalized col should sum ~100, got ${sumDisplay}`);
  assert.ok(col0.every((v) => v.raw !== v.display || v.raw === 0));
}

// --- CONDITIONAL no answer → Spec does not exist ---
{
  const tsv = '月\t売上（円）\t利益率（%）\n1月\t1000\t12\n2月\t1200\t14\n3月\t1400\t13\n4月\t1300\t11\n';
  const { decision, payload } = pipeline(tsv, 'MULTI_METRIC');
  assert.equal(decision.state, 'CONDITIONAL');
  assert.equal(payload.spec_kind, 'confirmation_required');
  assert.equal(payload.graph_spec, null);
  assert.equal(hasGraphSpec(payload), false);
}

// --- CONDITIONAL + answer → Spec exists ---
{
  const tsv = '月\t売上（円）\t利益率（%）\n1月\t1000\t12\n2月\t1200\t14\n3月\t1400\t13\n4月\t1300\t11\n';
  const a = pipeline(tsv, 'MULTI_METRIC', 'small_multiples');
  assert.equal(a.decision.state, 'CONDITIONAL');
  assert.equal(hasGraphSpec(a.payload), true);
  assert.equal(a.payload.graph_spec.chart.type, 'Small_Multiples');
  assert.equal(a.payload.graph_spec.source.confirmation_choice_id, 'small_multiples');

  const b = pipeline(tsv, 'MULTI_METRIC', 'dual_axis_combo');
  assert.equal(hasGraphSpec(b.payload), true);
  assert.equal(b.payload.graph_spec.chart.type, 'Combination_Column_Line');
  assert.equal(b.payload.graph_spec.constraints.synchronize_zero_line, true);
}

// --- MISMATCH → Spec does not exist ---
{
  const tsv = '月\t売上（円）\t利益率（%）\n1月\t1000\t12\n2月\t1200\t14\n3月\t1400\t13\n';
  const { decision, payload } = pipeline(tsv, 'BREAKDOWN');
  assert.equal(decision.state, 'MISMATCH');
  assert.equal(payload.spec_kind, 'mismatch_explanation');
  assert.equal(payload.graph_spec, null);
  assert.equal(hasGraphSpec(payload), false);
}

// --- NO_MATCH → Spec does not exist ---
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const { decision, payload } = pipeline(tsv, 'DISTRIBUTION');
  assert.equal(decision.state, 'NO_MATCH');
  assert.equal(payload.spec_kind, 'uncovered');
  assert.equal(payload.graph_spec, null);
  assert.equal(hasGraphSpec(payload), false);
}

// --- unknown intent → Spec does not exist ---
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const { payload } = pipeline(tsv, null);
  assert.equal(payload.spec_kind, 'intent_required');
  assert.equal(payload.graph_spec, null);
}

// --- same input → same Decision → same Graph Spec (determinism) ---
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const a = pipeline(tsv, 'TREND');
  const b = pipeline(tsv, 'TREND');
  assert.equal(a.decision.matched_rule_id, b.decision.matched_rule_id);
  assert.equal(a.decision.state, b.decision.state);
  assert.equal(stableStringify(a.payload.graph_spec), stableStringify(b.payload.graph_spec));
}

{
  const tsv =
    '事業部\t2022\t2023\t2024\t2025\n営業\t100\t110\t120\t130\n開発\t80\t90\t95\t100\n管理\t50\t55\t60\t65\n製造\t70\t75\t80\t85\n';
  const a = pipeline(tsv, 'MIX_SHIFT');
  const b = pipeline(tsv, 'MIX_SHIFT');
  assert.equal(stableStringify(a.payload.graph_spec), stableStringify(b.payload.graph_spec));
}

{
  const tsv = '月\t売上（円）\t利益率（%）\n1月\t1000\t12\n2月\t1200\t14\n3月\t1400\t13\n4月\t1300\t11\n';
  const a = pipeline(tsv, 'MULTI_METRIC', 'small_multiples');
  const b = pipeline(tsv, 'MULTI_METRIC', 'small_multiples');
  assert.equal(stableStringify(a.payload.graph_spec), stableStringify(b.payload.graph_spec));
}

// --- observed alternatives copied, not auto-promoted ---
{
  const tsv = '事業部\t売上\nA\t100\nB\t200\nC\t300\n合計\t600\n';
  const { payload } = pipeline(tsv, 'PROPORTION', 'accuracy');
  assert.equal(hasGraphSpec(payload), true);
  assert.equal(payload.graph_spec.chart.type, 'Bar');
  assert.deepEqual(payload.graph_spec.chart.observed_alternative_types, ['Donut', 'Pie']);
}

// --- Bar sort descending when decision.sort set ---
{
  const tsv = '事業部\t売上\n営業本部\t100\n開発本部\t120\n管理本部\t80\n製造本部\t90\n販売本部\t70\n';
  const { decision, payload } = pipeline(tsv, 'RANKING');
  assert.equal(decision.sort, 'descending');
  assert.equal(hasGraphSpec(payload), true);
  const cats = payload.graph_spec.data.categories;
  const vals = payload.graph_spec.data.series[0].values.map((v) => v.display);
  for (let i = 1; i < vals.length; i++) {
    assert.ok(vals[i - 1] >= vals[i], 'categories should be sorted by display desc');
  }
  assert.equal(cats[0], payload.graph_spec.data.series[0].values[0].category);
}

// --- Spec must not require network/LLM ---
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const { decision, payload } = pipeline(tsv, 'TREND');
  assert.equal(decision.network_required, false);
  assert.equal(decision.llm_required, false);
  assert.equal(hasGraphSpec(payload), true);
  assert.equal(payload.graph_spec.style_ref.theme, 'sugudasu-default');
}

console.log('graph-spec-builder: OK');
