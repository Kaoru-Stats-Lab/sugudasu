/**
 * SUGUDASU Graph — buildGraphSpec
 *
 * Freezes Decision Result into a declarative Graph Spec intermediate contract.
 * Spec: docs/graph/GRAPH_SPEC_CONTRACT.md
 *
 * MUST NOT: re-run rules, infer Intent, pick "better" charts, use LLM,
 * or branch rendering on matched_rule_id.
 * Renderer HOLD — this module only builds the contract object.
 */
'use strict';

import { isTargetHeaderToken, isActualHeaderToken } from './graph-observable-extractor.js';

const SPEC_VERSION = '1.0.0';

const ENCODING_BY_TYPE = {
  Line: {
    x: { field: 'category', type: 'temporal' },
    y: { field: 'display', type: 'quantitative', zero_baseline: true },
    color: null,
    series_field: null,
    mark: 'line',
  },
  Column: {
    x: { field: 'category', type: 'nominal' },
    y: { field: 'display', type: 'quantitative', zero_baseline: true },
    color: null,
    series_field: null,
    mark: 'bar',
    orientation: 'vertical',
  },
  Bar: {
    x: { field: 'display', type: 'quantitative', zero_baseline: true },
    y: { field: 'category', type: 'nominal' },
    color: null,
    series_field: null,
    mark: 'bar',
    orientation: 'horizontal',
  },
  Grouped_Bar: {
    x: { field: 'display', type: 'quantitative', zero_baseline: true },
    y: { field: 'category', type: 'nominal' },
    color: { field: 'series' },
    series_field: 'series',
    mark: 'bar',
    orientation: 'horizontal',
    grouping: 'grouped',
  },
  Grouped_Column: {
    x: { field: 'category', type: 'nominal' },
    y: { field: 'display', type: 'quantitative', zero_baseline: true },
    color: { field: 'series' },
    series_field: 'series',
    mark: 'bar',
    orientation: 'vertical',
    grouping: 'grouped',
  },
  Stacked_Column: {
    x: { field: 'category', type: 'temporal' },
    y: { field: 'display', type: 'quantitative', zero_baseline: true },
    color: { field: 'series' },
    series_field: 'series',
    mark: 'bar',
    stack: 'absolute',
  },
  '100pct_Stacked_Column': {
    x: { field: 'category', type: 'temporal' },
    y: { field: 'display', type: 'quantitative', zero_baseline: true, unit_hint: '%' },
    color: { field: 'series' },
    series_field: 'series',
    mark: 'bar',
    stack: 'normalize',
  },
  Waterfall: {
    x: { field: 'category', type: 'nominal' },
    y: { field: 'display', type: 'quantitative', zero_baseline: true },
    color: { field: 'sign' },
    series_field: null,
    mark: 'waterfall',
  },
  Small_Multiples: {
    x: { field: 'category', type: 'temporal' },
    y: { field: 'display', type: 'quantitative', zero_baseline: true },
    color: null,
    series_field: 'series',
    mark: 'line',
    facet: 'series',
  },
  Combination_Column_Line: {
    x: { field: 'category', type: 'temporal' },
    y: { field: 'display', type: 'quantitative', zero_baseline: true },
    color: { field: 'series' },
    series_field: 'series',
    mark: 'combo',
    synchronize_zero_line: true,
  },
  Bullet: {
    x: { field: 'display', type: 'quantitative', zero_baseline: true },
    y: { field: 'category', type: 'nominal' },
    color: null,
    series_field: null,
    mark: 'bullet',
    orientation: 'horizontal',
    target: { field: 'target', encoding: 'marker' },
  },
  Scatter: {
    x: { field: 'measure0', type: 'quantitative', zero_baseline: true },
    y: { field: 'measure1', type: 'quantitative', zero_baseline: true },
    color: null,
    series_field: null,
    mark: 'point',
  },
  Donut: {
    x: null,
    y: null,
    color: { field: 'category' },
    series_field: null,
    mark: 'arc',
    theta: { field: 'display' },
  },
  Pie: {
    x: null,
    y: null,
    color: { field: 'category' },
    series_field: null,
    mark: 'arc',
    theta: { field: 'display' },
  },
};

/**
 * @param {object} decision — output of createGraphDecisionEngine().decide
 * @param {object} ctx
 * @param {string|null} [ctx.intent]
 * @param {object} [ctx.observable]
 * @param {object} [ctx.table] — { headers, rows }
 * @param {object[]} [ctx.measures]
 * @param {string|null} [ctx.confirmation_choice_id] — required to materialize CONDITIONAL
 * @param {object} [ctx.rulesDoc] — optional; for validation/constraint defaults
 */
export function buildGraphSpec(decision, ctx = {}) {
  if (!decision || typeof decision !== 'object') {
    throw new Error('decision is required');
  }

  const intent = ctx.intent ?? null;
  const observable = ctx.observable || {};
  const rulesDoc = ctx.rulesDoc || null;

  if (decision.reason_code === 'unknown_intent' || decision.state == null && decision.action === 'ask_user') {
    return freezePayload({
      schema_version: SPEC_VERSION,
      spec_kind: 'intent_required',
      state: null,
      reason_code: decision.reason_code || 'unknown_intent',
      message: decision.message || '何を伝えたいですか？',
      options: decision.options || null,
      graph_spec: null,
    });
  }

  if (decision.state === 'MISMATCH') {
    return freezePayload({
      schema_version: SPEC_VERSION,
      spec_kind: 'mismatch_explanation',
      state: 'MISMATCH',
      reason_code: decision.reason_code,
      message: decision.message || '',
      graph_spec: null,
    });
  }

  if (decision.state === 'NO_MATCH') {
    return freezePayload({
      schema_version: SPEC_VERSION,
      spec_kind: 'uncovered',
      state: 'NO_MATCH',
      reason_code: decision.reason_code || 'no_matching_rule',
      message: decision.message || '',
      graph_spec: null,
    });
  }

  if (decision.state === 'CONDITIONAL') {
    const choiceId = ctx.confirmation_choice_id;
    if (choiceId == null || choiceId === '') {
      return freezePayload({
        schema_version: SPEC_VERSION,
        spec_kind: 'confirmation_required',
        state: 'CONDITIONAL',
        confirmation_id: decision.confirmation_id,
        options: decision.confirmation_options || [],
        default: decision.confirmation_default ?? null,
        graph_spec: null,
      });
    }
    const option = (decision.confirmation_options || []).find((o) => o.id === choiceId);
    if (!option) {
      return freezePayload({
        schema_version: SPEC_VERSION,
        spec_kind: 'confirmation_required',
        state: 'CONDITIONAL',
        confirmation_id: decision.confirmation_id,
        options: decision.confirmation_options || [],
        default: decision.confirmation_default ?? null,
        error: 'unknown_confirmation_choice',
        graph_spec: null,
      });
    }
    return materializeSpec(decision, ctx, {
      chartType: option.recommended_graph,
      confirmation_choice_id: choiceId,
      intent,
      observable,
      rulesDoc,
    });
  }

  if (decision.state === 'MATCH' || decision.state === 'CONVERTIBLE') {
    return materializeSpec(decision, ctx, {
      chartType: decision.recommended_graph,
      confirmation_choice_id: null,
      intent,
      observable,
      rulesDoc,
    });
  }

  return freezePayload({
    schema_version: SPEC_VERSION,
    spec_kind: 'uncovered',
    state: decision.state || 'NO_MATCH',
    reason_code: decision.reason_code || 'unsupported_decision_state',
    message: 'Graph Spec を生成できない Decision 状態です。',
    graph_spec: null,
  });
}

function materializeSpec(decision, ctx, opts) {
  const chartType = opts.chartType;
  if (!chartType || !ENCODING_BY_TYPE[chartType]) {
    return freezePayload({
      schema_version: SPEC_VERSION,
      spec_kind: 'invalid_chart_type',
      state: decision.state,
      reason_code: 'unknown_chart_type',
      message: `Unsupported chart type for Spec: ${chartType}`,
      graph_spec: null,
    });
  }

  const encoding = clone(ENCODING_BY_TYPE[chartType]);
  const categoryRole = categoryRoleFromObservable(opts.observable, chartType);
  if (encoding.x && encoding.x.field === 'category') encoding.x.type = categoryRole;
  if (encoding.y && encoding.y.field === 'category') encoding.y.type = categoryRole;

  const data = buildDataPayload(decision, ctx, chartType, opts.observable);
  const transformId = decision.transformation || null;
  const transformApplied =
    decision.state === 'CONVERTIBLE' ||
    Boolean(transformId) ||
    data.series.some((s) => s.values.some((v) => v.raw !== v.display));

  const constraints = buildConstraints(decision, opts.rulesDoc);
  if (encoding.y && encoding.y.zero_baseline != null) {
    encoding.y.zero_baseline = constraints.zero_baseline;
  }
  if (encoding.x && encoding.x.zero_baseline != null) {
    encoding.x.zero_baseline = constraints.zero_baseline;
  }

  // Attach target encoding when Spec data carries targets (CND-004 paths)
  if (dataHasTarget(data) && !encoding.target) {
    encoding.target = {
      field: 'target',
      encoding: chartType === 'Bullet' ? 'marker' : chartType === 'Grouped_Column' ? 'series' : 'line',
    };
  }

  const sort = decision.sort || null;
  if (sort === 'descending' && (chartType === 'Bar' || chartType === 'Grouped_Bar')) {
    data.categories = sortCategoriesByPrimarySeries(data, 'desc');
    reorderSeriesValues(data);
  }

  const accessibility = {
    do_not_rely_on_color_alone: constraints.do_not_rely_on_color_alone,
    pattern_or_label_required_for_sign: chartType === 'Waterfall',
    text_contrast_ref: 'provisional_wcag_aa',
  };

  const spec = {
    schema_version: SPEC_VERSION,
    spec_kind: 'graph_spec',
    source: {
      matched_rule_id: decision.matched_rule_id,
      decision_state: decision.state,
      intent: opts.intent,
      reason_code: decision.reason_code,
      deterministic_kind: decision.deterministic_kind || null,
      confirmation_id: decision.confirmation_id || null,
      confirmation_choice_id: opts.confirmation_choice_id,
    },
    chart: {
      type: chartType,
      observed_alternative_types: Array.isArray(decision.observed_graphs)
        ? decision.observed_graphs.slice()
        : [],
    },
    data,
    encoding,
    transform: {
      id: transformId,
      applied: Boolean(transformApplied && transformId),
    },
    axis: {
      zero_baseline: constraints.zero_baseline,
      synchronize_zero_line: constraints.synchronize_zero_line,
    },
    constraints,
    accessibility,
    style_ref: {
      theme: 'sugudasu-default',
      note: 'Style is outside Decision. Renderer/theme owns colors/fonts.',
    },
  };

  return freezePayload({
    schema_version: SPEC_VERSION,
    spec_kind: 'graph_spec',
    state: decision.state,
    graph_spec: freezeDeep(spec),
  });
}

function buildDataPayload(decision, ctx, chartType, observable) {
  const unit = decision.unit || observable.unit || 'UNKNOWN';
  const measures = Array.isArray(decision.measures)
    ? decision.measures
    : Array.isArray(ctx.measures)
      ? ctx.measures
      : [];
  const table = ctx.table || { headers: [], rows: [] };

  if (
    (chartType === 'Bullet' ||
      chartType === 'Grouped_Column' ||
      chartType === 'Grouped_Bar' ||
      chartType === 'Column') &&
    table.headers?.length >= 3 &&
    table.rows?.length
  ) {
    const paired = buildActualTargetFromTable(table, unit, chartType, observable);
    if (paired) return paired;
  }

  if (
    (chartType === 'Small_Multiples' || chartType === 'Combination_Column_Line') &&
    table.headers?.length >= 3 &&
    table.rows?.length
  ) {
    const multi = buildMultiMeasureFromTable(table, unit, observable, chartType);
    if (multi) return multi;
  }

  if (chartType === 'Scatter' && table.headers?.length >= 3 && table.rows?.length) {
    const catIdx = 0;
    const m0 = 1;
    const m1 = 2;
    const points = table.rows.map((r) => ({
      category: String(r[catIdx] ?? ''),
      raw0: Number(r[m0]),
      raw1: Number(r[m1]),
      display0: Number(r[m0]),
      display1: Number(r[m1]),
    }));
    return {
      series: [
        {
          id: String(table.headers[m0] || 'measure0'),
          label: String(table.headers[m0] || 'measure0'),
          unit,
          role: 'measure',
          values: points.map((p) => ({
            category: p.category,
            raw: p.raw0,
            display: p.display0,
            pair: p.display1,
          })),
        },
        {
          id: String(table.headers[m1] || 'measure1'),
          label: String(table.headers[m1] || 'measure1'),
          unit,
          role: 'measure',
          values: points.map((p) => ({
            category: p.category,
            raw: p.raw1,
            display: p.display1,
            pair: p.display0,
          })),
        },
      ],
      categories: points.map((p) => p.category),
      category_role: 'nominal',
      preserve_raw: true,
    };
  }

  // Wide Temporal+Nominal: first col nominal, rest temporal measures
  if (
    (chartType === 'Stacked_Column' || chartType === '100pct_Stacked_Column') &&
    table.headers?.length >= 3 &&
    table.rows?.length
  ) {
    const temporalHeaders = table.headers.slice(1);
    const series = table.rows.map((r, i) => {
      const label = String(r[0] ?? `series_${i}`);
      const values = temporalHeaders.map((h, hi) => {
        const raw = Number(r[hi + 1]);
        let display = raw;
        if (chartType === '100pct_Stacked_Column') {
          // display filled later via column normalize if needed; use measure display if present
          display = raw;
        }
        return { category: String(h), raw, display };
      });
      return {
        id: label,
        label,
        unit: chartType === '100pct_Stacked_Column' ? '%' : unit,
        role: 'measure',
        values,
      };
    });

    if (chartType === '100pct_Stacked_Column') {
      for (let ci = 0; ci < temporalHeaders.length; ci++) {
        const colSum = series.reduce((acc, s) => acc + Number(s.values[ci].raw || 0), 0);
        for (const s of series) {
          const raw = s.values[ci].raw;
          s.values[ci].display = colSum === 0 ? 0 : (raw / colSum) * 100;
        }
      }
    }

    return {
      series,
      categories: temporalHeaders.map(String),
      category_role: 'temporal',
      preserve_raw: true,
    };
  }

  // Default: single series from measures vector
  const categories = measures.map((m) => String(m.id));
  const applyPct =
    decision.transformation === 'normalize_to_percentage' || chartType === '100pct_Stacked_Column';
  let values = measures.map((m) => {
    const raw = m.raw ?? m.value;
    let display = m.display ?? m.value ?? raw;
    if (applyPct && m.display == null) {
      display = raw;
    }
    return { category: String(m.id), raw, display };
  });

  if (applyPct && values.every((v) => v.display === v.raw)) {
    const sum = values.reduce((a, v) => a + Number(v.raw || 0), 0);
    values = values.map((v) => ({
      ...v,
      display: sum === 0 ? 0 : (Number(v.raw) / sum) * 100,
    }));
  }

  if (chartType === 'Waterfall') {
    const START_RE = /^(開始|始点|期首|期初|start|beginning|期初残高)$/i;
    const END_RE = /^(終了|終点|期末|end|ending|期末残高)$/i;
    values = values.map((v) => {
      const cat = String(v.category ?? '');
      let step_role = 'delta';
      if (START_RE.test(cat)) step_role = 'start';
      else if (END_RE.test(cat)) step_role = 'end';
      const n = Number(v.raw);
      return {
        ...v,
        step_role,
        sign: n < 0 ? 'negative' : n > 0 ? 'positive' : 'zero',
      };
    });
  }

  const seriesLabel =
    (table.headers && table.headers.length > 1 && table.headers[1]) || 'value';

  return {
    series: [
      {
        id: 'primary',
        label: String(seriesLabel),
        unit: applyPct ? '%' : unit,
        role: 'measure',
        values,
      },
    ],
    categories,
    category_role: categoryRoleFromObservable(observable, chartType),
    preserve_raw: true,
  };
}

/**
 * Temporal (or nominal) × 2+ measure columns — Small_Multiples / Combination.
 * One series per measure column (not flattened to primary only).
 */
function buildMultiMeasureFromTable(table, unit, observable, chartType) {
  const headers = table.headers.map(String);
  const rows = table.rows;
  if (headers.length < 3 || !rows?.length) return null;
  const dimIdx = 0;
  const measureIdxs = [];
  for (let i = 1; i < headers.length; i++) measureIdxs.push(i);
  if (measureIdxs.length < 2) return null;

  const categories = rows.map((r, i) => String(r[dimIdx] ?? `row_${i}`));
  const category_role = categoryRoleFromObservable(observable, chartType);
  const series = measureIdxs.map((mi) => {
    const label = headers[mi] || `measure_${mi}`;
    return {
      id: label,
      label,
      unit,
      role: 'measure',
      values: rows.map((r, i) => {
        const raw = Number(r[mi]);
        const n = Number.isFinite(raw) ? raw : 0;
        return { category: categories[i], raw: n, display: n };
      }),
    };
  });
  return {
    series,
    categories,
    category_role,
    preserve_raw: true,
  };
}

function buildActualTargetFromTable(table, unit, chartType, observable) {
  const headers = table.headers.map(String);
  const rows = table.rows;
  const dimIdx = 0;
  const measureIdxs = [];
  for (let i = 1; i < headers.length; i++) measureIdxs.push(i);
  if (measureIdxs.length < 2) return null;

  const targetIdx = measureIdxs.find((i) => isTargetHeaderToken(headers[i]));
  if (targetIdx == null) return null;

  const rest = measureIdxs.filter((i) => i !== targetIdx);
  const actualIdx =
    rest.find((i) => isActualHeaderToken(headers[i])) ?? rest[0] ?? null;
  if (actualIdx == null) return null;

  const categories = rows.map((r, i) => String(r[dimIdx] ?? `row_${i}`));
  const category_role = categoryRoleFromObservable(observable, chartType);

  const actualValues = rows.map((r, i) => {
    const raw = Number(r[actualIdx]);
    const target = Number(r[targetIdx]);
    return {
      category: categories[i],
      raw: Number.isFinite(raw) ? raw : 0,
      display: Number.isFinite(raw) ? raw : 0,
      target: Number.isFinite(target) ? target : null,
    };
  });

  if (chartType === 'Grouped_Column' || chartType === 'Grouped_Bar') {
    return {
      series: [
        {
          id: 'actual',
          label: headers[actualIdx] || '実績',
          unit,
          role: 'actual',
          values: actualValues.map(({ category, raw, display }) => ({ category, raw, display })),
        },
        {
          id: 'target',
          label: headers[targetIdx] || '目標',
          unit,
          role: 'target',
          values: rows.map((r, i) => {
            const raw = Number(r[targetIdx]);
            return {
              category: categories[i],
              raw: Number.isFinite(raw) ? raw : 0,
              display: Number.isFinite(raw) ? raw : 0,
            };
          }),
        },
      ],
      categories,
      category_role,
      preserve_raw: true,
    };
  }

  const targetNums = actualValues.map((v) => v.target).filter((t) => t != null);
  const constant =
    targetNums.length > 0 && targetNums.every((t) => Object.is(t, targetNums[0]));
  const targetEncoding = chartType === 'Bullet' ? 'marker' : 'line';

  // Bullet (marker) or Column (reference line) — no invented achievement color
  return {
    series: [
      {
        id: 'actual',
        label: headers[actualIdx] || '実績',
        unit,
        role: 'actual',
        values: actualValues,
      },
    ],
    categories,
    category_role,
    preserve_raw: true,
    target: {
      field: 'target',
      encoding: targetEncoding,
      constant: Boolean(constant),
      values: actualValues.map((v) => v.target),
    },
  };
}

function dataHasTarget(data) {
  if (!data) return false;
  if (data.target && (Array.isArray(data.target.values) || data.target.field)) return true;
  const series = data.series || [];
  if (series.some((s) => s.role === 'target')) return true;
  return series.some((s) =>
    (s.values || []).some((v) => v != null && v.target != null && Number.isFinite(Number(v.target)))
  );
}

function buildConstraints(decision, rulesDoc) {
  const v = rulesDoc?.validation || {};
  const safety = decision.safety || {};
  return {
    allow_3d: v.chart?.allow_3d === true ? true : false,
    zero_baseline:
      safety.zero_baseline ??
      v.axis?.zero_baseline_default ??
      true,
    synchronize_zero_line:
      safety.synchronize_zero_line ??
      v.axis?.dual_axis_zero_sync ??
      false,
    reject_unsynchronized_dual_axis:
      safety.reject_unsynchronized_dual_axis ??
      v.axis?.reject_unsynchronized_dual_axis ??
      true,
    do_not_rely_on_color_alone: v.accessibility?.do_not_rely_on_color ?? true,
  };
}

function categoryRoleFromObservable(observable, chartType) {
  if (observable?.dimension === 'Temporal' || observable?.dimension === 'Temporal+Nominal') {
    return 'temporal';
  }
  if (chartType === 'Line' || chartType === 'Small_Multiples' || chartType === 'Combination_Column_Line') {
    return 'temporal';
  }
  return 'nominal';
}

function sortCategoriesByPrimarySeries(data, dir) {
  const primary = data.series[0];
  if (!primary) return data.categories;
  const pairs = primary.values.map((v) => ({ c: v.category, d: Number(v.display) }));
  pairs.sort((a, b) => (dir === 'desc' ? b.d - a.d : a.d - b.d));
  return pairs.map((p) => p.c);
}

function reorderSeriesValues(data) {
  const order = new Map(data.categories.map((c, i) => [c, i]));
  for (const s of data.series) {
    s.values.sort((a, b) => (order.get(a.category) ?? 0) - (order.get(b.category) ?? 0));
  }
}

function freezePayload(p) {
  return Object.freeze({ ...p });
}

function freezeDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

/** Stable JSON for determinism asserts (key-sorted). */
export function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
    return out;
  }
  return v;
}

export function hasGraphSpec(payload) {
  return payload?.spec_kind === 'graph_spec' && payload.graph_spec != null;
}

export { ENCODING_BY_TYPE };
