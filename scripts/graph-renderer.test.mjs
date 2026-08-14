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
import { renderGraph, R1_TYPES, DEFAULT_PRESENTATION, DECK_SLOTS, wrapDeckHalfLeftPreview } from '../assets/graph-renderer.js';

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

// Line: category band centers (not flush to Y-axis endpoints)
{
  const tsv = '月\t来場者\n6月\t1000\n7月\t1100\n8月\t1400\n9月\t1300\n';
  const payload = buildPayload(tsv, 'TREND');
  const r = await renderGraph(payload, { format: 'svg', width: 640, height: 360 });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.equal(r.chart_type, 'Line');
  const axisX = Number(r.body.match(/sg-axis-y" x1="([0-9.]+)"/)[1]);
  const firstCx = Number(r.body.match(/sg-mark-point" cx="([0-9.]+)"/)[1]);
  const points = [...r.body.matchAll(/sg-mark-point" cx="([0-9.]+)"/g)].map((m) => Number(m[1]));
  assert.equal(points.length, 4);
  assert.ok(firstCx > axisX + 8, `first point too flush to Y-axis: cx=${firstCx} axis=${axisX}`);
  const step = points[1] - points[0];
  assert.ok(Math.abs(points[2] - points[1] - step) < 0.01);
  assert.ok(Math.abs(points[3] - points[2] - step) < 0.01);
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

// Palette defaults
{
  assert.equal(DEFAULT_PRESENTATION.series_color, '#1D4ED8');
  assert.equal(DEFAULT_PRESENTATION.accent_color, '#EA580C');
  assert.ok(DECK_SLOTS.half_left);
}

// Long category labels fit (OA-05 style)
{
  const tsv =
    '部門\t売上（億円）\n第一営業\t85\n第二営業\t72\n第三営業\t64\n海外事業\t58\nコーポレート\t41\n';
  const payload = buildPayload(tsv, 'RANKING');
  const r = await renderGraph(payload, { format: 'svg', deck_slot: 'half_left' });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.match(r.body, /コーポレート/);
  assert.equal(r.deck_slot, 'half_left');
  // left pad must exceed legacy 56 for long JP labels
  assert.match(r.body, /sg-label-category" x="([0-9.]+)"/);
  const x = Number(r.body.match(/sg-label-category" x="([0-9.]+)"/)[1]);
  assert.ok(x >= 48, `label x too small: ${x}`);
}

// Accent category fill
{
  const tsv = '月\t来場者\n6月\t1000\n7月\t1100\n8月\t1400\n12月\t1600\n';
  const payload = buildPayload(tsv, 'TREND');
  const r = await renderGraph(payload, {
    format: 'svg',
    presentation: { accent_categories: ['12月'] },
  });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.match(r.body, /#EA580C/);
  assert.match(r.body, /#93C5FD/);
}

// Unit label on chart (OA-05 S0 gap)
{
  const tsv =
    '部門\t売上（億円）\n第一営業\t85\n第二営業\t72\n第三営業\t64\n海外事業\t58\nコーポレート\t41\n';
  const payload = buildPayload(tsv, 'RANKING');
  const r = await renderGraph(payload, { format: 'svg' });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.match(r.body, /sg-label-unit/);
  assert.match(r.body, /億円/);
  assert.equal(r.body.includes('sg-label-mark-value'), false);
}

// Value labels opt-in
{
  const tsv = '年度\t売上\n2022\t100\n2023\t120\n2024\t150\n';
  const payload = buildPayload(tsv, 'TREND');
  const off = await renderGraph(payload, { format: 'svg' });
  const on = await renderGraph(payload, {
    format: 'svg',
    presentation: { show_value_labels: true },
  });
  assert.equal(off.body.includes('sg-label-mark-value'), false);
  assert.equal(on.ok, true, on.reason_codes?.join(','));
  assert.match(on.body, /sg-label-mark-value/);
  assert.match(on.body, />150</);
}

// Deck half-left preview (S2)
{
  const tsv =
    '部門\t売上（億円）\n第一営業\t85\n第二営業\t72\n第三営業\t64\n';
  const payload = buildPayload(tsv, 'RANKING');
  const chart = await renderGraph(payload, { format: 'svg', deck_slot: 'half_left' });
  assert.equal(chart.ok, true);
  const prev = wrapDeckHalfLeftPreview(chart.body, {
    chartWidth: chart.width,
    chartHeight: chart.height,
  });
  assert.equal(prev.ok, true);
  assert.equal(prev.preview, 'deck_half_left');
  assert.match(prev.body, /data-sg-preview="deck_half_left"/);
  assert.match(prev.body, /sg-comment-pane/);
  assert.match(prev.body, /コメント/);
  assert.equal(DEFAULT_PRESENTATION.show_value_labels, false);
  assert.ok(DECK_SLOTS.half_left);
}

// Bullet: actual bar + target marker (dept × 実績 × 目標)
{
  const tsv =
    '部門\t実績\t目標\n第一営業\t85\t90\n第二営業\t72\t70\n第三営業\t64\t80\n';
  const payload = buildPayload(tsv, 'TARGET_VS_ACTUAL', 'target_as_marker');
  assert.equal(payload.graph_spec?.chart?.type, 'Bullet');
  assert.ok(
    payload.graph_spec.data.series[0].values.every((v) => v.target != null),
    'target must be on values'
  );
  const r = await renderGraph(payload, { format: 'svg' });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.equal(r.chart_type, 'Bullet');
  assert.match(r.body, /sg-mark-bullet-actual/);
  assert.match(r.body, /sg-mark-target/);
  assert.equal(R1_TYPES.has('Bullet'), true);
}

// Grouped_Column: actual | target side-by-side
{
  const tsv =
    '部門\t実績\t目標\n第一営業\t85\t90\n第二営業\t72\t70\n第三営業\t64\t80\n';
  const payload = buildPayload(tsv, 'TARGET_VS_ACTUAL', 'target_as_series');
  assert.equal(payload.graph_spec?.chart?.type, 'Grouped_Column');
  assert.equal(payload.graph_spec.data.series.length, 2);
  const r = await renderGraph(payload, { format: 'svg' });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.equal(r.chart_type, 'Grouped_Column');
  assert.match(r.body, /sg-mark-actual/);
  assert.match(r.body, /sg-mark-target/);
  assert.match(r.body, /#64748B/);
}

// Grouped_Column: accent_categories paints the actual bar for that category
{
  const tsv =
    '部門\t実績\t目標\n第一営業\t85\t90\n第二営業\t72\t70\n第三営業\t64\t80\n';
  const payload = buildPayload(tsv, 'TARGET_VS_ACTUAL', 'target_as_series');
  const r = await renderGraph(payload, {
    format: 'svg',
    presentation: { accent_categories: ['第二営業'], accent_color: '#EA580C' },
  });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.match(r.body, /#EA580C/);
}

// Small_Multiples: dual-unit measures as stacked panels
{
  const tsv =
    '年度\t売上（円）\t利益率（%）\n2022\t1000\t10\n2023\t1200\t12\n2024\t1400\t11\n2025\t1500\t13\n';
  const payload = buildPayload(tsv, 'MULTI_METRIC', 'small_multiples');
  assert.equal(payload.graph_spec?.chart?.type, 'Small_Multiples');
  assert.equal(payload.graph_spec.data.series.length, 2);
  const r = await renderGraph(payload, {
    format: 'svg',
    presentation: { show_category_labels: false },
  });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.equal(r.chart_type, 'Small_Multiples');
  assert.match(r.body, /売上/);
  assert.match(r.body, /利益率/);
  assert.match(r.body, /sg-label-panel/);
  assert.doesNotMatch(r.body, />2022</);
  const withCats = await renderGraph(payload, {
    format: 'svg',
    presentation: { show_category_labels: true, show_value_axis_labels: false },
  });
  assert.match(withCats.body, />2022</);
  assert.doesNotMatch(withCats.body, /sg-label-value/);
}

// Column + constant target line (T-line)
{
  const tsv =
    '月\t売上\t目標\n4月\t56912\t80000\n5月\t50693\t80000\n6月\t91569\t80000\n7月\t65478\t80000\n8月\t76951\t80000\n9月\t85631\t80000\n';
  const payload = buildPayload(tsv, 'TARGET_VS_ACTUAL', 'target_as_line');
  assert.equal(payload.graph_spec?.chart?.type, 'Column');
  assert.equal(payload.graph_spec.data.target?.constant, true);
  assert.equal(payload.graph_spec.encoding?.target?.encoding, 'line');
  const r = await renderGraph(payload, { format: 'svg' });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.equal(r.chart_type, 'Column');
  assert.match(r.body, /sg-mark-column/);
  assert.match(r.body, /sg-mark-target-line/);
  assert.match(r.body, /#EA580C/);
}

// Column + varying target → polyline (not a fake flat line)
{
  const tsv =
    '月\t売上\t目標\n4月\t50\t60\n5月\t55\t70\n6月\t80\t75\n';
  const payload = buildPayload(tsv, 'TARGET_VS_ACTUAL', 'target_as_line');
  assert.equal(payload.graph_spec.data.target?.constant, false);
  const r = await renderGraph(payload, { format: 'svg' });
  assert.equal(r.ok, true, r.reason_codes?.join(','));
  assert.match(r.body, /sg-mark-target-line/);
  assert.match(r.body, /polyline class="sg-mark-target-line"/);
}

console.log('graph-renderer: OK');
