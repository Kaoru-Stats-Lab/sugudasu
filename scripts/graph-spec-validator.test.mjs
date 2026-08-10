#!/usr/bin/env node
/**
 * Graph Spec Validator Contract Tests
 * Run: npm run test:graph-spec-validator
 *
 * Validator NEVER auto-fixes. Invalid → REJECT + reason_code.
 * Renderer HOLD.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractObservableFromTsv } from '../assets/graph-observable-extractor.js';
import { createGraphDecisionEngine } from '../assets/graph-decision-engine.js';
import { buildGraphSpec, hasGraphSpec } from '../assets/graph-spec-builder.js';
import {
  validateGraphSpecPayload,
  validateGraphSpec,
  assertDeterministicSpecs,
} from '../assets/graph-spec-validator.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDoc = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'graph', 'GRAPH_RULES.json'), 'utf8'));
const engine = createGraphDecisionEngine(rulesDoc);

function pipeline(tsv, intent, confirmation_choice_id) {
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
  return { decision, payload, extracted };
}

function assertReject(result, code) {
  assert.equal(result.ok, false, `expected reject ${code}, got ok`);
  assert.ok(
    result.reason_codes.includes(code),
    `expected reason_code ${code}, got ${result.reason_codes.join(',')}`
  );
}

// --- Valid MATCH passes ---
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const { payload } = pipeline(tsv, 'TREND');
  const v = validateGraphSpecPayload(payload, { rulesDoc });
  assert.equal(v.ok, true, v.reason_codes.join(','));
  assert.equal(hasGraphSpec(payload), true);
}

// --- Valid CONVERTIBLE passes ---
{
  const tsv =
    '事業部\t2022\t2023\t2024\t2025\n営業\t100\t110\t120\t130\n開発\t80\t90\t95\t100\n管理\t50\t55\t60\t65\n製造\t70\t75\t80\t85\n';
  const { payload } = pipeline(tsv, 'MIX_SHIFT');
  const v = validateGraphSpecPayload(payload, { rulesDoc });
  assert.equal(v.ok, true, v.reason_codes.join(','));
  assert.equal(payload.graph_spec.transform.applied, true);
}

// --- CONDITIONAL unanswered: no spec, validator ok ---
{
  const tsv = '月\t売上（円）\t利益率（%）\n1月\t1000\t12\n2月\t1200\t14\n3月\t1400\t13\n4月\t1300\t11\n';
  const { payload } = pipeline(tsv, 'MULTI_METRIC');
  assert.equal(payload.graph_spec, null);
  const v = validateGraphSpecPayload(payload);
  assert.equal(v.ok, true, v.reason_codes.join(','));
}

// --- CONDITIONAL answered: spec valid ---
{
  const tsv = '月\t売上（円）\t利益率（%）\n1月\t1000\t12\n2月\t1200\t14\n3月\t1400\t13\n4月\t1300\t11\n';
  const { payload } = pipeline(tsv, 'MULTI_METRIC', 'small_multiples');
  const v = validateGraphSpecPayload(payload, { rulesDoc });
  assert.equal(v.ok, true, v.reason_codes.join(','));
}

// --- MISMATCH / NO_MATCH: no spec ---
{
  const a = pipeline(
    '月\t売上（円）\t利益率（%）\n1月\t1000\t12\n2月\t1200\t14\n3月\t1400\t13\n',
    'BREAKDOWN'
  );
  assert.equal(a.payload.spec_kind, 'mismatch_explanation');
  assert.equal(validateGraphSpecPayload(a.payload).ok, true);

  const b = pipeline('年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n', 'DISTRIBUTION');
  assert.equal(b.payload.spec_kind, 'uncovered');
  assert.equal(validateGraphSpecPayload(b.payload).ok, true);
}

// --- Reject: MISMATCH payload illegally carrying graph_spec ---
{
  const bad = {
    spec_kind: 'mismatch_explanation',
    state: 'MISMATCH',
    reason_code: 'x',
    graph_spec: { chart: { type: 'Line' } },
  };
  assertReject(validateGraphSpecPayload(bad), 'spec_forbidden_for_terminal_state');
}

// --- Reject: NO_MATCH carrying spec ---
{
  const bad = {
    spec_kind: 'uncovered',
    state: 'NO_MATCH',
    graph_spec: { chart: { type: 'Bar' } },
  };
  assertReject(validateGraphSpecPayload(bad), 'spec_forbidden_for_terminal_state');
}

// --- Reject: confirmation_required carrying spec ---
{
  const bad = {
    spec_kind: 'confirmation_required',
    state: 'CONDITIONAL',
    confirmation_id: 'CND-001',
    graph_spec: { chart: { type: 'Line' } },
  };
  assertReject(validateGraphSpecPayload(bad), 'spec_forbidden_for_terminal_state');
}

// --- Reject: undefined type ---
{
  const v = validateGraphSpec({
    chart: { type: 'RadarFantasy' },
    encoding: { x: { field: 'category' }, y: { field: 'display' } },
    data: {
      preserve_raw: true,
      categories: ['a'],
      series: [{ id: 's', label: 's', unit: 'UNKNOWN', values: [{ category: 'a', raw: 1, display: 1 }] }],
    },
    constraints: { allow_3d: false, zero_baseline: true },
    transform: { id: null, applied: false },
  });
  assertReject(v, 'undefined_graph_type');
}

// --- Reject: missing axis ---
{
  const v = validateGraphSpec({
    chart: { type: 'Line' },
    encoding: { x: null, y: null },
    data: {
      preserve_raw: true,
      categories: ['2022'],
      series: [{ id: 's', values: [{ category: '2022', raw: 1, display: 1 }] }],
    },
    constraints: { allow_3d: false, zero_baseline: true },
    transform: { id: null, applied: false },
  });
  assertReject(v, 'axis_required_missing');
}

// --- Reject: series/values integrity ---
{
  const v = validateGraphSpec({
    chart: { type: 'Column' },
    encoding: {
      x: { field: 'category', type: 'nominal' },
      y: { field: 'display', type: 'quantitative', zero_baseline: true },
    },
    data: {
      preserve_raw: true,
      categories: ['A'],
      series: [{ id: 's', values: [{ category: 'A', raw: 1 }] }],
    },
    constraints: { allow_3d: false, zero_baseline: true },
    transform: { id: null, applied: false },
  });
  assertReject(v, 'value_raw_display_missing');
}

// --- Reject: stacking % + absolute mixed ---
{
  const v = validateGraphSpec({
    chart: { type: 'Stacked_Column' },
    encoding: {
      x: { field: 'category', type: 'temporal' },
      y: { field: 'display', type: 'quantitative', zero_baseline: true },
      stack: 'absolute',
    },
    data: {
      preserve_raw: true,
      categories: ['2022'],
      series: [
        {
          id: 'yen',
          unit: '円',
          values: [{ category: '2022', raw: 100, display: 100 }],
        },
        {
          id: 'pct',
          unit: '%',
          values: [{ category: '2022', raw: 10, display: 10 }],
        },
      ],
    },
    constraints: { allow_3d: false, zero_baseline: true },
    transform: { id: null, applied: false },
  });
  assertReject(v, 'stacking_percent_absolute_mixed');
}

// --- Reject: zero baseline violation ---
{
  const v = validateGraphSpec({
    chart: { type: 'Line' },
    encoding: {
      x: { field: 'category', type: 'temporal' },
      y: { field: 'display', type: 'quantitative', zero_baseline: false },
    },
    data: {
      preserve_raw: true,
      categories: ['2022'],
      series: [{ id: 's', unit: 'UNKNOWN', values: [{ category: '2022', raw: 1, display: 1 }] }],
    },
    constraints: { allow_3d: false, zero_baseline: true },
    axis: { zero_baseline: true },
    transform: { id: null, applied: false },
  });
  assertReject(v, 'zero_baseline_violation');
}

// --- Reject: Bullet without target ---
{
  const v = validateGraphSpec({
    chart: { type: 'Bullet' },
    encoding: {
      x: { field: 'category', type: 'temporal' },
      y: { field: 'display', type: 'quantitative', zero_baseline: true },
    },
    data: {
      preserve_raw: true,
      categories: ['2022'],
      series: [{ id: '実績', label: '実績', unit: 'UNKNOWN', values: [{ category: '2022', raw: 1, display: 1 }] }],
    },
    constraints: { allow_3d: false, zero_baseline: true },
    transform: { id: null, applied: false },
  });
  assertReject(v, 'target_missing_on_bullet');
}

// --- Reject: normalize specified but not applied / no transformed data ---
{
  const v = validateGraphSpec({
    chart: { type: '100pct_Stacked_Column' },
    encoding: {
      x: { field: 'category', type: 'temporal' },
      y: { field: 'display', type: 'quantitative', zero_baseline: true },
      stack: 'normalize',
    },
    data: {
      preserve_raw: true,
      categories: ['2022'],
      series: [
        { id: 'A', unit: '%', values: [{ category: '2022', raw: 50, display: 50 }] },
        { id: 'B', unit: '%', values: [{ category: '2022', raw: 50, display: 50 }] },
      ],
    },
    constraints: { allow_3d: false, zero_baseline: true },
    transform: { id: 'normalize_to_percentage', applied: false },
  });
  assertReject(v, 'normalize_flag_false');
}

// --- Determinism: same input → same valid Spec ---
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const a = pipeline(tsv, 'TREND');
  const b = pipeline(tsv, 'TREND');
  const d = assertDeterministicSpecs(a.payload, b.payload);
  assert.equal(d.ok, true, d.reason_codes?.join(','));
}

// --- Validator does not mutate payload ---
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const { payload } = pipeline(tsv, 'TREND');
  const before = JSON.stringify(payload);
  validateGraphSpecPayload(payload, { rulesDoc });
  assert.equal(JSON.stringify(payload), before, 'validator must not mutate payload');
}

console.log('graph-spec-validator: OK');
