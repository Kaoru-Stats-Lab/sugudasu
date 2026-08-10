#!/usr/bin/env node
/**
 * R1 Output Acceptance — SVG/PNG export for slide paste tests.
 * Does not change Decision/Spec/Validator. R2 types are skipped if they appear.
 *
 * Usage:
 *   node scripts/graph-r1-acceptance-export.mjs
 *   npm run graph:r1-acceptance-export
 *
 * Output: docs/graph/fixtures/acceptance/out/{id}.svg (+ .png if sharp available)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractObservableFromTsv } from '../assets/graph-observable-extractor.js';
import { createGraphDecisionEngine } from '../assets/graph-decision-engine.js';
import { buildGraphSpec } from '../assets/graph-spec-builder.js';
import { renderGraph } from '../assets/graph-renderer.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixDir = path.join(root, 'docs', 'graph', 'fixtures', 'acceptance');
const outDir = path.join(fixDir, 'out');
const rulesDoc = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'graph', 'GRAPH_RULES.json'), 'utf8'));
const engine = createGraphDecisionEngine(rulesDoc);

fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(fixDir)
  .filter((f) => f.startsWith('OA-') && f.endsWith('.json'))
  .sort();

const summary = [];

for (const file of files) {
  const fx = JSON.parse(fs.readFileSync(path.join(fixDir, file), 'utf8'));
  const extracted = extractObservableFromTsv(fx.tsv);
  const decision = engine.decide({
    observable: extracted.observable,
    intent: fx.intent,
    measures: extracted.measures,
  });
  const payload = buildGraphSpec(decision, {
    intent: fx.intent,
    observable: extracted.observable,
    table: extracted.table,
    measures: extracted.measures,
    rulesDoc,
  });

  const svg = await renderGraph(payload, { format: 'svg', width: 640, height: 360 });
  const row = {
    id: fx.id,
    scenario: fx.scenario,
    intent: fx.intent,
    expected_r1_type: fx.expected_r1_type,
    decision_state: decision.state,
    matched_rule_id: decision.matched_rule_id || null,
    chart_type: svg.chart_type || payload.graph_spec?.chart?.type || null,
    ok: svg.ok,
    reason_codes: svg.reason_codes || [],
  };

  if (!svg.ok) {
    summary.push(row);
    console.error(`[FAIL] ${fx.id}: ${svg.reason_codes?.join(',')}`);
    continue;
  }

  if (fx.expected_r1_type && svg.chart_type !== fx.expected_r1_type) {
    row.type_mismatch = true;
    console.warn(`[WARN] ${fx.id}: expected ${fx.expected_r1_type}, got ${svg.chart_type}`);
  }

  const svgPath = path.join(outDir, `${fx.id}.svg`);
  fs.writeFileSync(svgPath, svg.body, 'utf8');

  const png = await renderGraph(payload, { format: 'png', width: 640, height: 360 });
  if (png.ok && Buffer.isBuffer(png.body)) {
    fs.writeFileSync(path.join(outDir, `${fx.id}.png`), png.body);
  }

  summary.push(row);
  console.log(`[OK] ${fx.id} → ${svg.chart_type} (${svgPath})`);
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
const failed = summary.filter((s) => !s.ok);
console.log(`\nExported ${summary.length - failed.length}/${summary.length} · out=${outDir}`);
if (failed.length) process.exitCode = 1;
