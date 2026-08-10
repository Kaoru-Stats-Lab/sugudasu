#!/usr/bin/env node
/**
 * SUGUDASU Graph — Decision Engine Contract / Boundary / Negative Tests
 * Gate: docs/graph/GRAPH_RULES_IMPLEMENTATION_GATE.md
 * Run: npm run test:graph-decision
 *
 * Renderer / SVG is OUT OF SCOPE.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGraphDecisionEngine } from '../assets/graph-decision-engine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesPath = path.join(root, 'docs', 'graph', 'GRAPH_RULES.json');
const rulesDoc = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

assert.equal(rulesDoc.engine.llm_required, false);
assert.equal(rulesDoc.engine.llm_slot, false);
assert.equal(rulesDoc.engine.non_send, true);
assert.ok(rulesDoc.resolution_states.NO_MATCH, 'NO_MATCH state required');
assert.notEqual(
  rulesDoc.fallback.no_matching_rule.state,
  'MISMATCH',
  'empty match must not be MISMATCH'
);

const engine = createGraphDecisionEngine(rulesDoc);
const active = engine.getActiveRules();

assert.ok(active.every((r) => r.status === 'active' || r.status === 'active_provisional'));
assert.equal(
  active.some((r) => r.id === 'RLE-014'),
  false,
  'RLE-014 deferred must not be active'
);

{
  for (let i = 1; i < active.length; i++) {
    const prev = active[i - 1];
    const cur = active[i];
    assert.ok(
      prev.priority > cur.priority ||
        (prev.priority === cur.priority && String(prev.id) <= String(cur.id)),
      `sort broken at ${prev.id} vs ${cur.id}`
    );
  }
}

function d(observable, intent, measures) {
  return engine.decide({ observable, intent, measures });
}

// --- T01–T12 contract ---

{
  const r = d(
    { dimension: 'Temporal', cardinality: 5, measure_count: 1 },
    'TREND'
  );
  assert.equal(r.matched_rule_id, 'RLE-001');
  assert.equal(r.state, 'MATCH');
  assert.equal(r.recommended_graph, 'Line');
  assert.equal(r.network_required, false);
  assert.equal(r.llm_required, false);
}

{
  const r = d(
    { dimension: 'Temporal', cardinality: 3, measure_count: 1 },
    'TREND'
  );
  assert.equal(r.matched_rule_id, 'RLE-002');
  assert.equal(r.state, 'MATCH');
  assert.equal(r.recommended_graph, 'Column');
}

{
  const r = d(
    { dimension: 'Nominal', cardinality: 5, measure_count: 1 },
    'RANKING'
  );
  assert.equal(r.matched_rule_id, 'RLE-003');
  assert.equal(r.state, 'MATCH');
  assert.equal(r.recommended_graph, 'Bar');
}

{
  const r = d(
    {
      measure_type: 'Net_Change',
      positive_negative_mixed: true,
      has_start_end: true,
      measure_count: 1,
    },
    'BRIDGE'
  );
  assert.equal(r.matched_rule_id, 'RLE-004');
  assert.equal(r.state, 'MATCH');
  assert.equal(r.recommended_graph, 'Waterfall');
}

{
  const measures = [
    { id: 'A', value: 100 },
    { id: 'B', value: 300 },
  ];
  const r = d(
    {
      dimension: 'Temporal+Nominal',
      nominal_cardinality: 4,
      measure_type: 'Absolute',
      measure_count: 1,
      positive_negative_mixed: false,
    },
    'MIX_SHIFT',
    measures
  );
  assert.equal(r.matched_rule_id, 'RLE-005');
  assert.equal(r.state, 'CONVERTIBLE');
  assert.equal(r.recommended_graph, '100pct_Stacked_Column');
  assert.equal(r.transformation, 'normalize_to_percentage');
  assert.equal(r.requires_confirmation, false);
  assert.equal(r.measures[0].raw, 100);
  assert.equal(r.measures[0].value, 100);
  assert.ok(Math.abs(r.measures[0].display - 25) < 1e-9);
  assert.ok(Math.abs(r.measures[1].display - 75) < 1e-9);
}

{
  const r = d(
    {
      dimension: 'Temporal+Nominal',
      nominal_cardinality: 4,
      measure_type: 'Absolute',
      measure_count: 1,
      positive_negative_mixed: false,
    },
    'BREAKDOWN'
  );
  assert.equal(r.matched_rule_id, 'RLE-006');
  assert.equal(r.state, 'MATCH');
  assert.equal(r.recommended_graph, 'Stacked_Column');
}

{
  const r = d(
    {
      dimension: 'Temporal',
      measure_count: 2,
      values_have_different_units: true,
      cardinality: 6,
    },
    'MULTI_METRIC'
  );
  assert.equal(r.matched_rule_id, 'RLE-007');
  assert.equal(r.state, 'CONDITIONAL');
  assert.equal(r.requires_confirmation, true);
  assert.equal(r.confirmation_id, 'CND-001');
  assert.equal(r.confirmation_default, 'small_multiples');
  assert.equal(r.recommended_graph, 'Small_Multiples');
}

{
  const r = d(
    {
      dimension: 'Nominal',
      cardinality: 3,
      has_total: true,
      measure_count: 1,
    },
    'PROPORTION'
  );
  assert.equal(r.matched_rule_id, 'RLE-008');
  assert.equal(r.state, 'CONDITIONAL');
  assert.equal(r.confirmation_id, 'CND-002');
  assert.equal(r.recommended_graph, 'Bar');
  assert.deepEqual(r.observed_graphs, ['Donut', 'Pie']);
}

{
  const r = d(
    {
      dimension: 'Temporal',
      measure_count: 1,
      has_target: true,
      cardinality: 4,
    },
    'TARGET_VS_ACTUAL'
  );
  assert.equal(r.matched_rule_id, 'RLE-009');
  assert.equal(r.state, 'CONDITIONAL');
  assert.equal(r.confirmation_id, 'CND-004');
  assert.equal(r.recommended_graph, 'Bullet');
  const graphs = (r.confirmation_options || []).map((o) => o.recommended_graph);
  assert.ok(graphs.includes('Bullet'));
  assert.ok(graphs.includes('Grouped_Column'));
  assert.equal(graphs.includes('Column') && !graphs.includes('Grouped_Column'), false);
  assert.ok(
    (r.confirmation_options || []).every((o) => o.encodes_target === true),
    'CND-004 options must encode target'
  );
}

{
  const r = d(
    { dimension: 'Nominal', cardinality: 20, measure_count: 1 },
    'RANKING'
  );
  assert.equal(r.matched_rule_id, 'RLE-012');
  assert.equal(r.state, 'CONDITIONAL');
  assert.equal(r.confirmation_id, 'CND-005');
}

{
  const r = d(
    {
      dimension: 'Nominal',
      measure_count: 2,
      values_share_common_unit: true,
      cardinality: 4,
    },
    'COMPARISON'
  );
  assert.equal(r.matched_rule_id, 'RLE-013');
  assert.equal(r.state, 'MATCH');
  assert.equal(r.recommended_graph, 'Grouped_Bar');
  assert.equal(r.deterministic_kind, 'priority_fixed');
}

{
  const r = d(
    { dimension: 'Nominal', measure_count: 2, cardinality: 8 },
    'RELATIONSHIP'
  );
  assert.equal(r.matched_rule_id, 'RLE-015');
  assert.equal(r.state, 'MATCH');
  assert.equal(r.recommended_graph, 'Scatter');
  assert.equal(r.rule_status, 'active_provisional');
}

// --- T13–T14 MISMATCH negatives ---

{
  const r = d(
    {
      dimension: 'Temporal+Nominal',
      nominal_cardinality: 3,
      measure_count: 2,
      values_have_different_units: true,
      measure_type: 'Absolute',
      positive_negative_mixed: false,
    },
    'BREAKDOWN'
  );
  assert.equal(r.state, 'MISMATCH');
  assert.equal(r.reason_code, 'stacking_reject_mixed_units');
  assert.equal(r.recommended_graph, null);
}

{
  const r = d(
    {
      dimension: 'Temporal+Nominal',
      nominal_cardinality: 3,
      measure_count: 1,
      measure_type: 'Absolute',
      positive_negative_mixed: true,
    },
    'BREAKDOWN'
  );
  assert.equal(r.state, 'MISMATCH');
  assert.equal(r.reason_code, 'stacking_reject_positive_negative_mixed');
  assert.equal(r.recommended_graph, null);
}

{
  const r = d(
    {
      dimension: 'Temporal',
      measure_count: 2,
      values_have_different_units: true,
      cardinality: 6,
    },
    'MULTI_METRIC'
  );
  assert.equal(r.state, 'CONDITIONAL');
  assert.notEqual(r.recommended_graph, 'Dual_Axis');
  assert.equal(r.confirmation_default, 'small_multiples');
}

// --- T15 Unknown unit ---

{
  const measures = [{ id: 'x', value: 42 }];
  const r = d(
    { dimension: 'Temporal', cardinality: 5, measure_count: 1, unit: 'UNKNOWN' },
    'TREND',
    measures
  );
  assert.equal(r.unit, 'UNKNOWN');
  assert.equal(r.measures[0].value, 42);
  assert.equal(r.state, 'MATCH');
}

{
  const measures = [{ id: 'x', value: 7 }];
  const r = d(
    { dimension: 'Temporal', cardinality: 5, measure_count: 1 },
    'TREND',
    measures
  );
  assert.equal(r.unit, 'UNKNOWN');
  assert.equal(r.measures[0].value, 7);
}

// --- T16 Unknown intent ---

{
  const r = d({ dimension: 'Temporal', cardinality: 5, measure_count: 1 }, null);
  assert.equal(r.reason_code, 'unknown_intent');
  assert.equal(r.action, 'ask_user');
  assert.equal(r.state, null);
  assert.equal(r.recommended_graph, null);
}

{
  const r = d({ dimension: 'Temporal', cardinality: 5, measure_count: 1 }, 'UNKNOWN');
  assert.equal(r.reason_code, 'unknown_intent');
}

// --- T17 NO_MATCH (not MISMATCH) ---

{
  const r = d(
    { dimension: 'Temporal', cardinality: 5, measure_count: 1 },
    'DISTRIBUTION'
  );
  assert.equal(r.state, 'NO_MATCH');
  assert.notEqual(r.state, 'MISMATCH');
  assert.equal(r.reason_code, 'no_matching_rule');
  assert.equal(r.recommended_graph, null);
}

// --- Boundary: Temporal cardinality 1..5 ---

{
  assert.equal(d({ dimension: 'Temporal', cardinality: 1, measure_count: 1 }, 'TREND').state, 'NO_MATCH');
  assert.equal(d({ dimension: 'Temporal', cardinality: 2, measure_count: 1 }, 'TREND').matched_rule_id, 'RLE-002');
  assert.equal(d({ dimension: 'Temporal', cardinality: 3, measure_count: 1 }, 'TREND').matched_rule_id, 'RLE-002');
  assert.equal(d({ dimension: 'Temporal', cardinality: 4, measure_count: 1 }, 'TREND').matched_rule_id, 'RLE-001');
  assert.equal(d({ dimension: 'Temporal', cardinality: 5, measure_count: 1 }, 'TREND').matched_rule_id, 'RLE-001');
}

// --- Boundary: RLE-012 vs RLE-003 ---

{
  assert.equal(
    d({ dimension: 'Nominal', cardinality: 10, measure_count: 1 }, 'RANKING').matched_rule_id,
    'RLE-003'
  );
  assert.equal(
    d({ dimension: 'Nominal', cardinality: 15, measure_count: 1 }, 'RANKING').matched_rule_id,
    'RLE-012'
  );
}

// --- Reproducibility ---

{
  const input = {
    observable: { dimension: 'Temporal', cardinality: 5, measure_count: 1 },
    intent: 'TREND',
  };
  const a = engine.decide(input);
  const b = engine.decide(input);
  assert.deepEqual(
    {
      matched_rule_id: a.matched_rule_id,
      state: a.state,
      recommended_graph: a.recommended_graph,
    },
    {
      matched_rule_id: b.matched_rule_id,
      state: b.state,
      recommended_graph: b.recommended_graph,
    }
  );
}

// --- CND-003 unwired existence only ---

{
  const cnd = rulesDoc.conditional_rules['CND-003'];
  assert.ok(cnd);
  assert.equal(cnd.status, 'defined_unwired');
  assert.equal(
    active.some((r) => r.then?.requires_confirmation === 'CND-003'),
    false,
    'CND-003 must not be wired to active rules in v1'
  );
}

// --- U-11 must not hard-reject ---

{
  const thr = rulesDoc.observable_features.thresholds.dual_axis_scale_ratio;
  assert.equal(thr.use_for_hard_reject, false);
}

// --- Percentage + Currency stacking ---

{
  const r = d(
    {
      dimension: 'Temporal+Nominal',
      nominal_cardinality: 3,
      measure_count: 2,
      values_have_different_units: true,
      measure_type_mixed_percentage_absolute: true,
      positive_negative_mixed: false,
    },
    'BREAKDOWN'
  );
  assert.equal(r.state, 'MISMATCH');
}

console.log('graph-decision-engine: OK');
