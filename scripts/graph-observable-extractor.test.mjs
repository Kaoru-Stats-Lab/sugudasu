#!/usr/bin/env node
/**
 * Observable Extraction + Regression fixtures
 * Spec: docs/graph/OBSERVABLE_EXTRACTION_SPEC.md
 * Run: npm run test:graph-observable
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractObservableFromTsv, isTemporalToken, parseNumber } from '../assets/graph-observable-extractor.js';
import { createGraphDecisionEngine } from '../assets/graph-decision-engine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDoc = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'graph', 'GRAPH_RULES.json'), 'utf8'));
const engine = createGraphDecisionEngine(rulesDoc);

const oxDir = path.join(root, 'docs', 'graph', 'fixtures', 'observable');
const rgDir = path.join(root, 'docs', 'graph', 'fixtures', 'regression');

function loadFixtures(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

function assertSubset(actual, expected, label) {
  for (const [k, v] of Object.entries(expected)) {
    assert.deepEqual(
      actual[k],
      v,
      `${label}: observable.${k} expected ${JSON.stringify(v)} got ${JSON.stringify(actual[k])}`
    );
  }
}

{
  assert.equal(isTemporalToken('2024'), true);
  assert.equal(isTemporalToken('2024年4月'), true);
  assert.equal(isTemporalToken('4月'), true);
  assert.equal(isTemporalToken('営業'), false);
  assert.equal(parseNumber('1,200'), 1200);
  assert.equal(parseNumber('１２'), 12);
}

const oxFixtures = loadFixtures(oxDir);
assert.ok(oxFixtures.length >= 10, 'expected observable fixtures');

for (const fx of oxFixtures) {
  const { observable } = extractObservableFromTsv(fx.tsv);
  assertSubset(observable, fx.expected_observable, fx.id);
}

const rgFixtures = loadFixtures(rgDir);
assert.ok(rgFixtures.length >= 10, 'expected regression fixtures');

for (const fx of rgFixtures) {
  const extracted = extractObservableFromTsv(fx.tsv);
  const decision = engine.decide({
    observable: extracted.observable,
    intent: fx.intent,
    measures: extracted.measures,
  });
  for (const [k, v] of Object.entries(fx.expected_decision)) {
    assert.equal(
      decision[k],
      v,
      `${fx.id}: decision.${k} expected ${JSON.stringify(v)} got ${JSON.stringify(decision[k])}`
    );
  }
}

// Reproducibility: same TSV twice
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n2025\t170\n';
  const a = extractObservableFromTsv(tsv);
  const b = extractObservableFromTsv(tsv);
  assert.deepEqual(a.observable, b.observable);
  const d1 = engine.decide({ observable: a.observable, intent: 'TREND', measures: a.measures });
  const d2 = engine.decide({ observable: b.observable, intent: 'TREND', measures: b.measures });
  assert.equal(d1.matched_rule_id, d2.matched_rule_id);
  assert.equal(d1.recommended_graph, d2.recommended_graph);
}

// A/B/C must NOT become Ordinal dimension
{
  const { observable, evidence } = extractObservableFromTsv('ランク\t件数\nA\t30\nB\t20\nC\t10\n');
  assert.equal(observable.dimension, 'Nominal');
  assert.notEqual(observable.dimension, 'Ordinal');
}

console.log(`graph-observable: OK (ox=${oxFixtures.length}, rg=${rgFixtures.length})`);
