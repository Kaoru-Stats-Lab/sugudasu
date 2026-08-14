/**
 * SUGUDASU Graph — Renderer (R1 + R1.x target)
 *
 * Constitution: docs/graph/PRESENTATION_OUTPUT_CONSTITUTION.md
 * Palette: docs/graph/GRAPH_DEFAULT_PALETTE.md
 * API: docs/graph/GRAPH_RENDERER_API.md
 *
 * Thinks nothing. Does not read Rule / Intent / matched_rule_id for branching.
 * Invalid Spec → REJECT (no auto-fix, no draw).
 * R1.x: Column+目標線 · Bullet · Grouped_Column（GRAPH_TARGET_REPRESENTATION）。
 * R1.x+: Waterfall（GRAPH_WATERFALL_SPEC · BRIDGE）。達成色の自動発明はしない。
 */
'use strict';

import { validateGraphSpecPayload } from './graph-spec-validator.js';

const R1_TYPES = new Set([
  'Bar',
  'Column',
  'Line',
  'Bullet',
  'Grouped_Column',
  'Small_Multiples',
  'Waterfall',
]);

/** @see docs/graph/GRAPH_DEFAULT_PALETTE.md · GRAPH_TARGET_REPRESENTATION.md · GRAPH_WATERFALL_SPEC.md */
const DEFAULT_PRESENTATION = Object.freeze({
  series_color: '#1D4ED8',
  series_muted_color: '#93C5FD',
  accent_color: '#EA580C',
  accent_categories: Object.freeze([]),
  series_stroke: '#0F172A',
  mark_stroke_width: 0,
  target_marker_color: '#0F172A',
  target_line_color: '#EA580C',
  target_line_width: 2,
  target_series_color: '#64748B',
  waterfall_total_color: '#1E3A5F',
  waterfall_positive_color: '#1D4ED8',
  waterfall_negative_color: '#EA580C',
  grid_color: '#E2E8F0',
  axis_color: '#334155',
  baseline_color: '#0F172A',
  text_color: '#0F172A',
  grid: true,
  show_category_labels: true,
  show_value_axis_labels: true,
  show_unit_label: true,
  show_value_labels: false,
  line_width: 3,
  bar_gap: 0.25,
  category_font_size: 13,
  value_font_size: 12,
  deck_slot: 'generic',
});

/** Deck placement presets — Roundtrip S1 */
const DECK_SLOTS = Object.freeze({
  generic: Object.freeze({ width: 640, height: 360, category_font_size: 13, value_font_size: 12 }),
  full: Object.freeze({ width: 960, height: 540, category_font_size: 15, value_font_size: 13 }),
  half_left: Object.freeze({ width: 560, height: 420, category_font_size: 14, value_font_size: 12 }),
});

/**
 * @param {object} payload — buildGraphSpec result
 * @param {object} [options]
 * @param {'svg'|'png'} [options.format]
 * @param {object} [options.presentation]
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @param {'generic'|'full'|'half_left'} [options.deck_slot]
 * @param {object} [options.rulesDoc]
 */
export async function renderGraph(payload, options = {}) {
  const format = options.format === 'png' ? 'png' : 'svg';
  const presentation = resolvePresentation(options);
  const { width, height } = resolveSize(options, presentation);

  const validation = validateGraphSpecPayload(payload, { rulesDoc: options.rulesDoc });
  if (!validation.ok) {
    return fail(['validator_reject', ...validation.reason_codes], validation.errors);
  }

  if (payload.spec_kind !== 'graph_spec' || !payload.graph_spec) {
    return fail(
      ['terminal_payload_no_render', payload.spec_kind || 'unknown_kind'],
      [
        {
          reason_code: 'terminal_payload_no_render',
          message: `Renderer draws only validated graph_spec; got ${payload.spec_kind}`,
        },
      ]
    );
  }

  const spec = payload.graph_spec;
  const type = spec.chart?.type;
  if (!R1_TYPES.has(type)) {
    return fail(
      ['renderer_type_not_in_r1'],
      [
        {
          reason_code: 'renderer_type_not_in_r1',
          message: `R1 supports Bar/Column/Line/Bullet/Grouped_Column/Small_Multiples/Waterfall; got ${type}`,
        },
      ]
    );
  }

  // Intentionally ignore matched_rule_id / intent — POC-001
  const svg = renderSvgByType(type, spec, { width, height, presentation });

  if (format === 'svg') {
    return Object.freeze({
      ok: true,
      format: 'svg',
      mime: 'image/svg+xml',
      body: svg,
      chart_type: type,
      network_required: false,
      deck_slot: presentation.deck_slot,
      width,
      height,
    });
  }

  try {
    const { default: sharp } = await import('sharp');
    const png = await sharp(Buffer.from(svg, 'utf8')).png().toBuffer();
    return Object.freeze({
      ok: true,
      format: 'png',
      mime: 'image/png',
      body: png,
      chart_type: type,
      network_required: false,
      deck_slot: presentation.deck_slot,
      width,
      height,
    });
  } catch (err) {
    return fail(
      ['png_export_failed'],
      [{ reason_code: 'png_export_failed', message: String(err?.message || err) }]
    );
  }
}

function resolvePresentation(options) {
  const slotId = options.deck_slot || options.presentation?.deck_slot || 'generic';
  const slot = DECK_SLOTS[slotId] || DECK_SLOTS.generic;
  const raw = { ...DEFAULT_PRESENTATION, ...(options.presentation || {}) };
  const accent_categories = Array.isArray(raw.accent_categories)
    ? raw.accent_categories.map(String)
    : [];
  return {
    ...raw,
    deck_slot: DECK_SLOTS[slotId] ? slotId : 'generic',
    accent_categories,
    category_font_size: Number(raw.category_font_size) > 0 ? Number(raw.category_font_size) : slot.category_font_size,
    value_font_size: Number(raw.value_font_size) > 0 ? Number(raw.value_font_size) : slot.value_font_size,
  };
}

function resolveSize(options, presentation) {
  const slot = DECK_SLOTS[presentation.deck_slot] || DECK_SLOTS.generic;
  const width = Number(options.width) > 0 ? Number(options.width) : slot.width;
  const height = Number(options.height) > 0 ? Number(options.height) : slot.height;
  return { width, height };
}

function fail(reason_codes, errors) {
  return Object.freeze({
    ok: false,
    format: null,
    mime: null,
    body: null,
    chart_type: null,
    network_required: false,
    reason_codes: [...new Set(reason_codes)],
    errors: (errors || []).map((e) => Object.freeze({ ...e })),
  });
}

function renderSvgByType(type, spec, ctx) {
  if (type === 'Bar') return renderBar(spec, ctx);
  if (type === 'Column') return renderColumn(spec, ctx);
  if (type === 'Bullet') return renderBullet(spec, ctx);
  if (type === 'Grouped_Column') return renderGroupedColumn(spec, ctx);
  if (type === 'Small_Multiples') return renderSmallMultiples(spec, ctx);
  if (type === 'Waterfall') return renderWaterfall(spec, ctx);
  return renderLine(spec, ctx);
}

function estimateLabelWidthPx(label, fontSize) {
  const s = String(label ?? '');
  let units = 0;
  for (const ch of s) {
    units += /[\u3000-\u9FFF\uFF00-\uFFEF]/.test(ch) ? 1 : 0.55;
  }
  return Math.ceil(units * fontSize * 1.05) + 16;
}

function layout(width, height, padLeft) {
  const pad = {
    top: 24,
    right: 24,
    bottom: 52,
    left: Math.max(56, Math.min(padLeft || 56, Math.floor(width * 0.45))),
  };
  return {
    pad,
    plotX: pad.left,
    plotY: pad.top,
    plotW: Math.max(40, width - pad.left - pad.right),
    plotH: Math.max(40, height - pad.top - pad.bottom),
    width,
    height,
  };
}

function primarySeries(spec) {
  return (spec.data?.series && spec.data.series[0]) || { values: [], unit: 'UNKNOWN' };
}

function seriesUnit(series) {
  const u = series?.unit;
  if (u == null || u === '' || u === 'UNKNOWN') return null;
  return String(u);
}

/** S0: unit on chart when Observable/Spec has it (Roundtrip · OA-05 gap). */
function appendUnitAnnotation(textParts, series, L, p) {
  if (p.show_unit_label === false) return;
  const unit = seriesUnit(series);
  if (!unit) return;
  const fs = Math.max(11, Number(p.value_font_size) - 1);
  textParts.push(
    `<text class="sg-label-unit" x="${fmt(L.plotX + L.plotW)}" y="${fmt(Math.max(12, L.plotY - 6))}" text-anchor="end" font-size="${fmt(fs)}" fill="${esc(p.text_color)}">${esc(`（${unit}）`)}</text>`
  );
}

function markValueLabel(textParts, p, x, y, value, anchor = 'middle') {
  if (!p.show_value_labels) return;
  const fs = Math.max(10, Number(p.value_font_size) - 1);
  textParts.push(
    `<text class="sg-label-mark-value" x="${fmt(x)}" y="${fmt(y)}" text-anchor="${esc(anchor)}" font-size="${fmt(fs)}" fill="${esc(p.text_color)}">${esc(fmt(value))}</text>`
  );
}

function categories(spec, series) {
  if (Array.isArray(spec.data?.categories) && spec.data.categories.length) {
    return spec.data.categories.map(String);
  }
  return (series.values || []).map((v) => String(v.category));
}

function valuesInCategoryOrder(series, cats) {
  const map = new Map((series.values || []).map((v) => [String(v.category), v]));
  return cats.map((c) => {
    const v = map.get(c);
    return v ? Number(v.display) : 0;
  });
}

function targetsInCategoryOrder(series, cats) {
  const map = new Map((series.values || []).map((v) => [String(v.category), v]));
  return cats.map((c) => {
    const v = map.get(c);
    if (!v || v.target == null || v.target === '') return null;
    const n = Number(v.target);
    return Number.isFinite(n) ? n : null;
  });
}

function accentSet(p) {
  return new Set((p.accent_categories || []).map(String));
}

function hasAccent(p) {
  return accentSet(p).size > 0;
}

function fillForCategory(category, p) {
  if (accentSet(p).has(String(category))) return p.accent_color;
  if (hasAccent(p)) return p.series_muted_color;
  return p.series_color;
}

function markStrokeAttrs(p) {
  const w = Number(p.mark_stroke_width);
  if (!(w > 0) || !p.series_stroke) return '';
  return ` stroke="${esc(p.series_stroke)}" stroke-width="${fmt(w)}"`;
}

function yDomain(values, zeroBaseline) {
  let min = Math.min(...values, 0);
  let max = Math.max(...values, 0);
  if (zeroBaseline) min = Math.min(min, 0);
  if (min === max) max = min + 1;
  return { min, max };
}

function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const step = niceStep(span / count);
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let t = start; t <= max + step * 1e-9; t += step) ticks.push(Number(t.toFixed(10)));
  if (!ticks.includes(0) && min <= 0 && max >= 0) ticks.push(0);
  return [...new Set(ticks)].sort((a, b) => a - b);
}

function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / pow;
  let nice = 1;
  if (n > 5) nice = 10;
  else if (n > 2) nice = 5;
  else if (n > 1) nice = 2;
  return nice * pow;
}

function fmt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  return (Math.round(x * 1000) / 1000).toString();
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderColumn(spec, ctx) {
  const { width, height, presentation: p } = ctx;
  const series = primarySeries(spec);
  const cats = categories(spec, series);
  const vals = valuesInCategoryOrder(series, cats);
  const targets = targetsInCategoryOrder(series, cats);
  const domainVals = [...vals, ...targets.filter((t) => t != null)];
  const leftForValues = estimateLabelWidthPx(
    String(Math.max(...domainVals.map(Math.abs), 1)),
    p.value_font_size
  );
  const L = layout(width, height, Math.max(48, leftForValues));
  const zeroBaseline = spec.constraints?.zero_baseline !== false;
  const { min, max } = yDomain(domainVals.length ? domainVals : [0], zeroBaseline);
  const ticks = niceTicks(min, max);
  const yScale = (v) => L.plotY + L.plotH - ((v - min) / (max - min)) * L.plotH;
  const band = L.plotW / Math.max(cats.length, 1);
  const gap = band * p.bar_gap;
  const barW = Math.max(band - gap, 1);
  const zeroY = yScale(0);
  const stroke = markStrokeAttrs(p);

  const graphic = [];
  const text = [];

  if (p.grid) {
    for (const t of ticks) {
      const y = yScale(t);
      graphic.push(
        `<line class="sg-grid" x1="${fmt(L.plotX)}" y1="${fmt(y)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(y)}" stroke="${esc(p.grid_color)}" stroke-width="1"/>`
      );
    }
  }
  graphic.push(
    `<line class="sg-axis-x" x1="${fmt(L.plotX)}" y1="${fmt(zeroY)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(zeroY)}" stroke="${esc(p.baseline_color)}" stroke-width="1.5"/>`
  );
  graphic.push(
    `<line class="sg-axis-y" x1="${fmt(L.plotX)}" y1="${fmt(L.plotY)}" x2="${fmt(L.plotX)}" y2="${fmt(L.plotY + L.plotH)}" stroke="${esc(p.axis_color)}" stroke-width="1"/>`
  );

  cats.forEach((c, i) => {
    const v = vals[i];
    const x = L.plotX + i * band + gap / 2;
    const y = Math.min(yScale(v), zeroY);
    const h = Math.abs(yScale(v) - zeroY);
    graphic.push(
      `<rect class="sg-mark-column" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(barW)}" height="${fmt(h)}" fill="${esc(fillForCategory(c, p))}"${stroke}/>`
    );
    markValueLabel(text, p, x + barW / 2, Math.min(y, zeroY) - 4, v, 'middle');
    if (p.show_category_labels) {
      text.push(
        `<text class="sg-label-category" x="${fmt(x + barW / 2)}" y="${fmt(L.plotY + L.plotH + 18)}" text-anchor="middle" font-size="${fmt(p.category_font_size)}" fill="${esc(p.text_color)}">${esc(c)}</text>`
      );
    }
  });

  appendTargetLine(graphic, {
    cats,
    targets,
    band,
    gap,
    barW,
    plotX: L.plotX,
    plotW: L.plotW,
    yScale,
    color: p.target_line_color,
    width: p.target_line_width,
  });

  if (p.show_value_axis_labels) {
    for (const t of ticks) {
      text.push(
        `<text class="sg-label-value" x="${fmt(L.plotX - 8)}" y="${fmt(yScale(t) + 4)}" text-anchor="end" font-size="${fmt(p.value_font_size)}" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
      );
    }
  }

  appendUnitAnnotation(text, series, L, p);
  return wrapSvg(width, height, graphic, text, 'Column');
}

/**
 * Target reference on Column (T-line): constant → full-width; varying → polyline.
 * Does not invent achievement colors.
 */
function appendTargetLine(graphic, opts) {
  const finite = opts.targets.map((t, i) => (t == null ? null : { i, t })).filter(Boolean);
  if (!finite.length) return;
  const allSame = finite.every((x) => Object.is(x.t, finite[0].t));
  const y0 = opts.yScale(finite[0].t);
  const sw = opts.width > 0 ? opts.width : 2;
  if (allSame) {
    graphic.push(
      `<line class="sg-mark-target-line" x1="${fmt(opts.plotX)}" y1="${fmt(y0)}" x2="${fmt(opts.plotX + opts.plotW)}" y2="${fmt(y0)}" stroke="${esc(opts.color)}" stroke-width="${fmt(sw)}"/>`
    );
    return;
  }
  const pts = finite
    .map(({ i, t }) => {
      const x = opts.plotX + i * opts.band + opts.gap / 2 + opts.barW / 2;
      return `${fmt(x)},${fmt(opts.yScale(t))}`;
    })
    .join(' ');
  graphic.push(
    `<polyline class="sg-mark-target-line" fill="none" stroke="${esc(opts.color)}" stroke-width="${fmt(sw)}" points="${pts}"/>`
  );
}

function renderBar(spec, ctx) {
  const { width, height, presentation: p } = ctx;
  const series = primarySeries(spec);
  const cats = categories(spec, series);
  const maxLabelPx = Math.max(
    56,
    ...cats.map((c) => estimateLabelWidthPx(c, p.category_font_size))
  );
  const L = layout(width, height, maxLabelPx);
  const vals = valuesInCategoryOrder(series, cats);
  const zeroBaseline = spec.constraints?.zero_baseline !== false;
  const { min, max } = yDomain(vals, zeroBaseline);
  const ticks = niceTicks(min, max);
  const xScale = (v) => L.plotX + ((v - min) / (max - min)) * L.plotW;
  const band = L.plotH / Math.max(cats.length, 1);
  const gap = band * p.bar_gap;
  const barH = Math.max(band - gap, 1);
  const zeroX = xScale(0);
  const stroke = markStrokeAttrs(p);

  const graphic = [];
  const text = [];

  if (p.grid) {
    for (const t of ticks) {
      const x = xScale(t);
      graphic.push(
        `<line class="sg-grid" x1="${fmt(x)}" y1="${fmt(L.plotY)}" x2="${fmt(x)}" y2="${fmt(L.plotY + L.plotH)}" stroke="${esc(p.grid_color)}" stroke-width="1"/>`
      );
    }
  }
  graphic.push(
    `<line class="sg-baseline" x1="${fmt(zeroX)}" y1="${fmt(L.plotY)}" x2="${fmt(zeroX)}" y2="${fmt(L.plotY + L.plotH)}" stroke="${esc(p.baseline_color)}" stroke-width="1.5"/>`
  );

  cats.forEach((c, i) => {
    const v = vals[i];
    const y = L.plotY + i * band + gap / 2;
    const x = Math.min(xScale(v), zeroX);
    const w = Math.abs(xScale(v) - zeroX);
    graphic.push(
      `<rect class="sg-mark-bar" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(barH)}" fill="${esc(fillForCategory(c, p))}"${stroke}/>`
    );
    const tipX = v >= 0 ? x + w + 4 : x - 4;
    markValueLabel(text, p, tipX, y + barH / 2 + p.value_font_size * 0.35, v, v >= 0 ? 'start' : 'end');
    if (p.show_category_labels) {
      text.push(
        `<text class="sg-label-category" x="${fmt(L.plotX - 8)}" y="${fmt(y + barH / 2 + p.category_font_size * 0.35)}" text-anchor="end" font-size="${fmt(p.category_font_size)}" fill="${esc(p.text_color)}">${esc(c)}</text>`
      );
    }
  });

  if (p.show_value_axis_labels) {
    for (const t of ticks) {
      text.push(
        `<text class="sg-label-value" x="${fmt(xScale(t))}" y="${fmt(L.plotY + L.plotH + 18)}" text-anchor="middle" font-size="${fmt(p.value_font_size)}" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
      );
    }
  }

  appendUnitAnnotation(text, series, L, p);
  return wrapSvg(width, height, graphic, text, 'Bar');
}

function renderLine(spec, ctx) {
  const { width, height, presentation: p } = ctx;
  const series = primarySeries(spec);
  const cats = categories(spec, series);
  const vals = valuesInCategoryOrder(series, cats);
  const leftForValues = estimateLabelWidthPx(String(Math.max(...vals.map(Math.abs), 1)), p.value_font_size);
  const L = layout(width, height, Math.max(48, leftForValues));
  const zeroBaseline = spec.constraints?.zero_baseline !== false;
  const { min, max } = yDomain(vals, zeroBaseline);
  const ticks = niceTicks(min, max);
  const yScale = (v) => L.plotY + L.plotH - ((v - min) / (max - min)) * L.plotH;
  // カテゴリ帯の中央（端点合わせ禁止）— 月ラベル付き資料用折れ線は棒と同流儀
  const band = L.plotW / Math.max(cats.length, 1);
  const xAt = (i) => L.plotX + i * band + band / 2;
  const zeroY = yScale(0);

  const graphic = [];
  const text = [];

  if (p.grid) {
    for (const t of ticks) {
      const y = yScale(t);
      graphic.push(
        `<line class="sg-grid" x1="${fmt(L.plotX)}" y1="${fmt(y)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(y)}" stroke="${esc(p.grid_color)}" stroke-width="1"/>`
      );
    }
  }
  graphic.push(
    `<line class="sg-baseline" x1="${fmt(L.plotX)}" y1="${fmt(zeroY)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(zeroY)}" stroke="${esc(p.baseline_color)}" stroke-width="1.5"/>`
  );
  graphic.push(
    `<line class="sg-axis-y" x1="${fmt(L.plotX)}" y1="${fmt(L.plotY)}" x2="${fmt(L.plotX)}" y2="${fmt(L.plotY + L.plotH)}" stroke="${esc(p.axis_color)}" stroke-width="1"/>`
  );

  const points = cats.map((_, i) => `${fmt(xAt(i))},${fmt(yScale(vals[i]))}`).join(' ');
  graphic.push(
    `<polyline class="sg-mark-line" fill="none" stroke="${esc(p.series_color)}" stroke-width="${fmt(p.line_width)}" points="${points}"/>`
  );
  cats.forEach((c, i) => {
    const fill = fillForCategory(c, p);
    graphic.push(
      `<circle class="sg-mark-point" cx="${fmt(xAt(i))}" cy="${fmt(yScale(vals[i]))}" r="3.5" fill="${esc(fill)}"/>`
    );
    markValueLabel(text, p, xAt(i), yScale(vals[i]) - 8, vals[i], 'middle');
    if (p.show_category_labels) {
      text.push(
        `<text class="sg-label-category" x="${fmt(xAt(i))}" y="${fmt(L.plotY + L.plotH + 18)}" text-anchor="middle" font-size="${fmt(p.category_font_size)}" fill="${esc(p.text_color)}">${esc(c)}</text>`
      );
    }
  });

  if (p.show_value_axis_labels) {
    for (const t of ticks) {
      text.push(
        `<text class="sg-label-value" x="${fmt(L.plotX - 8)}" y="${fmt(yScale(t) + 4)}" text-anchor="end" font-size="${fmt(p.value_font_size)}" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
      );
    }
  }

  appendUnitAnnotation(text, series, L, p);
  return wrapSvg(width, height, graphic, text, 'Line');
}

/**
 * Waterfall (R1.x+): start → deltas → end on shared zero baseline.
 * Sign colors identify +/- steps — not achievement green/red.
 * @see docs/graph/GRAPH_WATERFALL_SPEC.md
 */
function renderWaterfall(spec, ctx) {
  const { width, height, presentation: p } = ctx;
  const series = primarySeries(spec);
  const cats = categories(spec, series);
  const valueMap = new Map((series.values || []).map((v) => [String(v.category), v]));
  const steps = cats.map((c) => {
    const v = valueMap.get(c) || { raw: 0, display: 0, sign: 'zero', step_role: 'delta' };
    const raw = Number(v.raw ?? v.display ?? 0);
    const role = v.step_role || 'delta';
    return {
      category: c,
      raw: Number.isFinite(raw) ? raw : 0,
      role,
      sign: v.sign || (raw < 0 ? 'negative' : raw > 0 ? 'positive' : 'zero'),
    };
  });

  let running = 0;
  const segments = [];
  for (const s of steps) {
    if (s.role === 'start') {
      const top = s.raw;
      const bottom = 0;
      running = top;
      segments.push({ ...s, bottom, top, labelValue: s.raw, isTotal: true });
    } else if (s.role === 'end') {
      const top = s.raw;
      const bottom = 0;
      running = top;
      segments.push({ ...s, bottom, top, labelValue: s.raw, isTotal: true });
    } else {
      const prev = running;
      const next = prev + s.raw;
      const bottom = Math.min(prev, next);
      const top = Math.max(prev, next);
      running = next;
      segments.push({ ...s, bottom, top, labelValue: s.raw, isTotal: false });
    }
  }

  const domainVals = segments.flatMap((seg) => [seg.bottom, seg.top]);
  const leftForValues = estimateLabelWidthPx(
    String(Math.max(...domainVals.map(Math.abs), 1)),
    p.value_font_size
  );
  const L = layout(width, height, Math.max(48, leftForValues));
  const zeroBaseline = spec.constraints?.zero_baseline !== false;
  let { min, max } = yDomain(domainVals.length ? domainVals : [0], zeroBaseline);
  const pad = (max - min) * 0.1 || 1;
  max = max + pad;
  const ticks = niceTicks(min, max);
  const yScale = (v) => L.plotY + L.plotH - ((v - min) / (max - min)) * L.plotH;
  const band = L.plotW / Math.max(cats.length, 1);
  const gap = band * p.bar_gap;
  const barW = Math.max(band - gap, 1);
  const zeroY = yScale(0);
  const stroke = markStrokeAttrs(p);
  const showLabels = true; // Waterfall narrative: direct labels are part of the mark (GRAPH_WATERFALL_SPEC)

  const graphic = [];
  const text = [];

  if (p.grid) {
    for (const t of ticks) {
      const y = yScale(t);
      graphic.push(
        `<line class="sg-grid" x1="${fmt(L.plotX)}" y1="${fmt(y)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(y)}" stroke="${esc(p.grid_color)}" stroke-width="1"/>`
      );
    }
  }
  graphic.push(
    `<line class="sg-baseline" x1="${fmt(L.plotX)}" y1="${fmt(zeroY)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(zeroY)}" stroke="${esc(p.baseline_color)}" stroke-width="1.5"/>`
  );
  graphic.push(
    `<line class="sg-axis-y" x1="${fmt(L.plotX)}" y1="${fmt(L.plotY)}" x2="${fmt(L.plotX)}" y2="${fmt(L.plotY + L.plotH)}" stroke="${esc(p.axis_color)}" stroke-width="1"/>`
  );

  let prevTopX = null;
  let prevTopY = null;
  segments.forEach((seg, i) => {
    const x = L.plotX + i * band + gap / 2;
    const yTop = yScale(seg.top);
    const yBot = yScale(seg.bottom);
    const h = Math.max(Math.abs(yBot - yTop), 1);
    const y = Math.min(yTop, yBot);
    let fill = p.waterfall_positive_color || p.series_color;
    if (seg.isTotal) fill = p.waterfall_total_color || '#1E3A5F';
    else if (seg.sign === 'negative') fill = p.waterfall_negative_color || p.accent_color;
    else if (seg.sign === 'zero') fill = p.series_muted_color || fill;

    if (prevTopX != null && !seg.isTotal) {
      graphic.push(
        `<line class="sg-mark-waterfall-connector" x1="${fmt(prevTopX)}" y1="${fmt(prevTopY)}" x2="${fmt(x)}" y2="${fmt(yScale(seg.sign === 'negative' ? seg.top : seg.bottom))}" stroke="${esc(p.axis_color)}" stroke-width="1" stroke-dasharray="3 2"/>`
      );
    } else if (prevTopX != null && seg.isTotal && seg.role === 'end') {
      graphic.push(
        `<line class="sg-mark-waterfall-connector" x1="${fmt(prevTopX)}" y1="${fmt(prevTopY)}" x2="${fmt(x)}" y2="${fmt(yTop)}" stroke="${esc(p.axis_color)}" stroke-width="1" stroke-dasharray="3 2"/>`
      );
    }

    graphic.push(
      `<rect class="sg-mark-waterfall" data-role="${esc(seg.role)}" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(barW)}" height="${fmt(h)}" fill="${esc(fill)}"${stroke}/>`
    );

    if (showLabels) {
      const fs = Math.max(10, Number(p.value_font_size) - 1);
      text.push(
        `<text class="sg-label-mark-value" x="${fmt(x + barW / 2)}" y="${fmt(yTop - 6)}" text-anchor="middle" font-size="${fmt(fs)}" fill="${esc(p.text_color)}">${esc(fmt(seg.labelValue))}</text>`
      );
    }

    if (p.show_category_labels) {
      text.push(
        `<text class="sg-label-category" x="${fmt(x + barW / 2)}" y="${fmt(L.plotY + L.plotH + 18)}" text-anchor="middle" font-size="${fmt(p.category_font_size)}" fill="${esc(p.text_color)}">${esc(seg.category)}</text>`
      );
    }

    prevTopX = x + barW;
    prevTopY = yTop;
  });

  if (p.show_value_axis_labels) {
    for (const t of ticks) {
      text.push(
        `<text class="sg-label-value" x="${fmt(L.plotX - 8)}" y="${fmt(yScale(t) + 4)}" text-anchor="end" font-size="${fmt(p.value_font_size)}" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
      );
    }
  }

  appendUnitAnnotation(text, series, L, p);
  return wrapSvg(width, height, graphic, text, 'Waterfall');
}

/**
 * Bullet (R1.x): horizontal actual bars + per-category target tick.
 * GAP is length/position vs marker — never invent achievement green/red.
 */
function renderBullet(spec, ctx) {
  const { width, height, presentation: p } = ctx;
  const series = primarySeries(spec);
  const cats = categories(spec, series);
  const maxLabelPx = Math.max(
    56,
    ...cats.map((c) => estimateLabelWidthPx(c, p.category_font_size))
  );
  const L = layout(width, height, maxLabelPx);
  const vals = valuesInCategoryOrder(series, cats);
  const targets = targetsInCategoryOrder(series, cats);
  const domainVals = [...vals, ...targets.filter((t) => t != null)];
  const zeroBaseline = spec.constraints?.zero_baseline !== false;
  const { min, max } = yDomain(domainVals.length ? domainVals : [0], zeroBaseline);
  const ticks = niceTicks(min, max);
  const xScale = (v) => L.plotX + ((v - min) / (max - min)) * L.plotW;
  const band = L.plotH / Math.max(cats.length, 1);
  const gap = band * p.bar_gap;
  const barH = Math.max(band - gap, 1);
  const zeroX = xScale(0);
  const stroke = markStrokeAttrs(p);
  const markerW = Math.max(2, Math.min(4, barH * 0.35));

  const graphic = [];
  const text = [];

  if (p.grid) {
    for (const t of ticks) {
      const x = xScale(t);
      graphic.push(
        `<line class="sg-grid" x1="${fmt(x)}" y1="${fmt(L.plotY)}" x2="${fmt(x)}" y2="${fmt(L.plotY + L.plotH)}" stroke="${esc(p.grid_color)}" stroke-width="1"/>`
      );
    }
  }
  graphic.push(
    `<line class="sg-baseline" x1="${fmt(zeroX)}" y1="${fmt(L.plotY)}" x2="${fmt(zeroX)}" y2="${fmt(L.plotY + L.plotH)}" stroke="${esc(p.baseline_color)}" stroke-width="1.5"/>`
  );

  cats.forEach((c, i) => {
    const v = vals[i];
    const y = L.plotY + i * band + gap / 2;
    const x = Math.min(xScale(v), zeroX);
    const w = Math.abs(xScale(v) - zeroX);
    graphic.push(
      `<rect class="sg-mark-bar sg-mark-bullet-actual" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(barH)}" fill="${esc(fillForCategory(c, p))}"${stroke}/>`
    );
    const tipX = v >= 0 ? x + w + 4 : x - 4;
    markValueLabel(text, p, tipX, y + barH / 2 + p.value_font_size * 0.35, v, v >= 0 ? 'start' : 'end');
    const t = targets[i];
    if (t != null) {
      const tx = xScale(t);
      const tickTop = y - barH * 0.15;
      const tickBot = y + barH * 1.15;
      graphic.push(
        `<line class="sg-mark-target" x1="${fmt(tx)}" y1="${fmt(tickTop)}" x2="${fmt(tx)}" y2="${fmt(tickBot)}" stroke="${esc(p.target_marker_color)}" stroke-width="${fmt(markerW)}"/>`
      );
    }
    if (p.show_category_labels) {
      text.push(
        `<text class="sg-label-category" x="${fmt(L.plotX - 8)}" y="${fmt(y + barH / 2 + p.category_font_size * 0.35)}" text-anchor="end" font-size="${fmt(p.category_font_size)}" fill="${esc(p.text_color)}">${esc(c)}</text>`
      );
    }
  });

  if (p.show_value_axis_labels) {
    for (const t of ticks) {
      text.push(
        `<text class="sg-label-value" x="${fmt(xScale(t))}" y="${fmt(L.plotY + L.plotH + 18)}" text-anchor="middle" font-size="${fmt(p.value_font_size)}" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
      );
    }
  }

  appendUnitAnnotation(text, series, L, p);
  return wrapSvg(width, height, graphic, text, 'Bullet');
}

/**
 * Grouped_Column (R1.x target path): actual + target side-by-side.
 * Uses series_color / target_series_color — not achievement green/red.
 */
function renderGroupedColumn(spec, ctx) {
  const { width, height, presentation: p } = ctx;
  const seriesList = Array.isArray(spec.data?.series) ? spec.data.series : [];
  const actual = seriesList.find((s) => s.role === 'actual') || seriesList[0] || { values: [] };
  const target = seriesList.find((s) => s.role === 'target') || seriesList[1] || null;
  const cats = categories(spec, actual);
  const actualVals = valuesInCategoryOrder(actual, cats);
  const targetVals = target ? valuesInCategoryOrder(target, cats) : cats.map(() => null);
  const domainVals = [...actualVals, ...targetVals.filter((t) => t != null)];
  const leftForValues = estimateLabelWidthPx(
    String(Math.max(...domainVals.map(Math.abs), 1)),
    p.value_font_size
  );
  const L = layout(width, height, Math.max(48, leftForValues));
  const zeroBaseline = spec.constraints?.zero_baseline !== false;
  const { min, max } = yDomain(domainVals.length ? domainVals : [0], zeroBaseline);
  const ticks = niceTicks(min, max);
  const yScale = (v) => L.plotY + L.plotH - ((v - min) / (max - min)) * L.plotH;
  const band = L.plotW / Math.max(cats.length, 1);
  const gap = band * p.bar_gap;
  const inner = Math.max(band - gap, 2);
  const barW = target ? Math.max(inner / 2 - 1, 1) : Math.max(inner, 1);
  const zeroY = yScale(0);
  const stroke = markStrokeAttrs(p);

  const graphic = [];
  const text = [];

  if (p.grid) {
    for (const t of ticks) {
      const y = yScale(t);
      graphic.push(
        `<line class="sg-grid" x1="${fmt(L.plotX)}" y1="${fmt(y)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(y)}" stroke="${esc(p.grid_color)}" stroke-width="1"/>`
      );
    }
  }
  graphic.push(
    `<line class="sg-axis-x" x1="${fmt(L.plotX)}" y1="${fmt(zeroY)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(zeroY)}" stroke="${esc(p.baseline_color)}" stroke-width="1.5"/>`
  );
  graphic.push(
    `<line class="sg-axis-y" x1="${fmt(L.plotX)}" y1="${fmt(L.plotY)}" x2="${fmt(L.plotX)}" y2="${fmt(L.plotY + L.plotH)}" stroke="${esc(p.axis_color)}" stroke-width="1"/>`
  );

  cats.forEach((c, i) => {
    const baseX = L.plotX + i * band + gap / 2;
    const v = actualVals[i];
    const y = Math.min(yScale(v), zeroY);
    const h = Math.abs(yScale(v) - zeroY);
    graphic.push(
      `<rect class="sg-mark-column sg-mark-actual" x="${fmt(baseX)}" y="${fmt(y)}" width="${fmt(barW)}" height="${fmt(h)}" fill="${esc(fillForCategory(c, p))}"${stroke}/>`
    );
    markValueLabel(text, p, baseX + barW / 2, Math.min(y, zeroY) - 4, v, 'middle');
    if (target && targetVals[i] != null) {
      const tv = targetVals[i];
      const ty = Math.min(yScale(tv), zeroY);
      const th = Math.abs(yScale(tv) - zeroY);
      graphic.push(
        `<rect class="sg-mark-column sg-mark-target" x="${fmt(baseX + barW + 2)}" y="${fmt(ty)}" width="${fmt(barW)}" height="${fmt(th)}" fill="${esc(p.target_series_color)}"${stroke}/>`
      );
    }
    if (p.show_category_labels) {
      text.push(
        `<text class="sg-label-category" x="${fmt(baseX + (target ? barW + 1 : barW / 2))}" y="${fmt(L.plotY + L.plotH + 18)}" text-anchor="middle" font-size="${fmt(p.category_font_size)}" fill="${esc(p.text_color)}">${esc(c)}</text>`
      );
    }
  });

  if (p.show_value_axis_labels) {
    for (const t of ticks) {
      text.push(
        `<text class="sg-label-value" x="${fmt(L.plotX - 8)}" y="${fmt(yScale(t) + 4)}" text-anchor="end" font-size="${fmt(p.value_font_size)}" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
      );
    }
  }

  appendUnitAnnotation(text, actual, L, p);
  return wrapSvg(width, height, graphic, text, 'Grouped_Column');
}

/**
 * Small_Multiples (CND-001 safe default): one panel per measure series, stacked.
 * Dual-axis overlay is not rendered here (HOLD for α).
 */
function renderSmallMultiples(spec, ctx) {
  const { width, height, presentation: p } = ctx;
  const seriesList = Array.isArray(spec.data?.series) ? spec.data.series.filter(Boolean) : [];
  if (!seriesList.length) {
    return wrapSvg(width, height, [], [], 'Small_Multiples');
  }
  const n = seriesList.length;
  const gap = 16;
  const titleH = 18;
  const panelH = Math.max(80, (height - gap * (n - 1) - titleH * n) / n);
  const graphic = [];
  const text = [];

  seriesList.forEach((series, si) => {
    const cats = categories(spec, series);
    const vals = valuesInCategoryOrder(series, cats);
    const zeroBaseline = spec.constraints?.zero_baseline !== false;
    const { min, max } = yDomain(vals.length ? vals : [0], zeroBaseline);
    const ticks = niceTicks(min, max);
    const leftForValues = estimateLabelWidthPx(
      String(Math.max(...vals.map(Math.abs), 1)),
      p.value_font_size
    );
    const top = si * (panelH + titleH + gap);
    const L = {
      plotX: Math.max(48, leftForValues),
      plotY: top + titleH + 4,
      plotW: width - Math.max(48, leftForValues) - 16,
      plotH: panelH - 8,
    };
    const yScale = (v) => L.plotY + L.plotH - ((v - min) / (max - min || 1)) * L.plotH;
    const band = L.plotW / Math.max(cats.length, 1);
    const barGap = band * p.bar_gap;
    const barW = Math.max(band - barGap, 1);
    const zeroY = yScale(0);
    const stroke = markStrokeAttrs(p);
    const seriesFill = si === 0 ? p.series_color : p.accent_color;

    text.push(
      `<text class="sg-label-panel" x="${fmt(L.plotX)}" y="${fmt(top + 12)}" text-anchor="start" font-size="${fmt(Math.max(11, p.category_font_size - 1))}" fill="${esc(p.text_color)}">${esc(series.label || series.id || `系列${si + 1}`)}</text>`
    );

    if (p.grid) {
      for (const t of ticks) {
        const y = yScale(t);
        graphic.push(
          `<line class="sg-grid" x1="${fmt(L.plotX)}" y1="${fmt(y)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(y)}" stroke="${esc(p.grid_color)}" stroke-width="1"/>`
        );
      }
    }
    graphic.push(
      `<line class="sg-axis-x" x1="${fmt(L.plotX)}" y1="${fmt(zeroY)}" x2="${fmt(L.plotX + L.plotW)}" y2="${fmt(zeroY)}" stroke="${esc(p.baseline_color)}" stroke-width="1.5"/>`
    );
    graphic.push(
      `<line class="sg-axis-y" x1="${fmt(L.plotX)}" y1="${fmt(L.plotY)}" x2="${fmt(L.plotX)}" y2="${fmt(L.plotY + L.plotH)}" stroke="${esc(p.axis_color)}" stroke-width="1"/>`
    );

    cats.forEach((c, i) => {
      const v = vals[i];
      const x = L.plotX + i * band + barGap / 2;
      const y = Math.min(yScale(v), zeroY);
      const h = Math.abs(yScale(v) - zeroY);
      const fill = fillForCategory(c, { ...p, series_color: seriesFill });
      graphic.push(
        `<rect class="sg-mark-column" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(barW)}" height="${fmt(h)}" fill="${esc(fill)}"${stroke}/>`
      );
      markValueLabel(text, p, x + barW / 2, Math.min(y, zeroY) - 4, v, 'middle');
      if (p.show_category_labels && si === n - 1) {
        text.push(
          `<text class="sg-label-category" x="${fmt(x + barW / 2)}" y="${fmt(L.plotY + L.plotH + 16)}" text-anchor="middle" font-size="${fmt(p.category_font_size)}" fill="${esc(p.text_color)}">${esc(c)}</text>`
        );
      }
    });

    if (p.show_value_axis_labels) {
      for (const t of ticks) {
        text.push(
          `<text class="sg-label-value" x="${fmt(L.plotX - 8)}" y="${fmt(yScale(t) + 4)}" text-anchor="end" font-size="${fmt(p.value_font_size)}" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
        );
      }
    }
  });

  return wrapSvg(width, height, graphic, text, 'Small_Multiples');
}

function wrapSvg(width, height, graphicParts, textParts, type) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(width)}" height="${fmt(height)}" viewBox="0 0 ${fmt(width)} ${fmt(height)}" data-sg-chart="${esc(type)}">`,
    `<rect class="sg-paper" width="${fmt(width)}" height="${fmt(height)}" fill="#FFFFFF"/>`,
    `<g class="sg-graphic">`,
    ...graphicParts,
    `</g>`,
    `<g class="sg-text">`,
    ...textParts,
    `</g>`,
    `</svg>`,
  ].join('');
}

/**
 * Roundtrip S2 — 16:9 slide frame with chart on left half + comment ghost on right.
 * Does not alter the chart SVG used for copy; preview is a separate artifact.
 *
 * @param {string} chartSvg — renderGraph(...).body
 * @param {{ slideWidth?: number, slideHeight?: number, chartWidth?: number, chartHeight?: number }} [options]
 */
export function wrapDeckHalfLeftPreview(chartSvg, options = {}) {
  if (typeof chartSvg !== 'string' || !chartSvg.includes('<svg')) {
    return Object.freeze({
      ok: false,
      body: null,
      reason_codes: ['preview_requires_chart_svg'],
    });
  }
  const slideW = Number(options.slideWidth) > 0 ? Number(options.slideWidth) : 960;
  const slideH = Number(options.slideHeight) > 0 ? Number(options.slideHeight) : 540;
  const chartW = Number(options.chartWidth) > 0 ? Number(options.chartWidth) : DECK_SLOTS.half_left.width;
  const chartH = Number(options.chartHeight) > 0 ? Number(options.chartHeight) : DECK_SLOTS.half_left.height;
  const leftPaneW = slideW * 0.52;
  const margin = 20;
  const scale = Math.min((leftPaneW - margin * 2) / chartW, (slideH - margin * 2) / chartH);
  const drawW = chartW * scale;
  const drawH = chartH * scale;
  const ox = margin + (leftPaneW - margin * 2 - drawW) / 2;
  const oy = margin + (slideH - margin * 2 - drawH) / 2;
  const rightX = leftPaneW + 12;
  const rightW = slideW - rightX - margin;
  const inner = unwrapSvgInner(chartSvg);

  const body = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(slideW)}" height="${fmt(slideH)}" viewBox="0 0 ${fmt(slideW)} ${fmt(slideH)}" data-sg-preview="deck_half_left">`,
    `<rect class="sg-slide" width="${fmt(slideW)}" height="${fmt(slideH)}" fill="#F8FAFC"/>`,
    `<rect class="sg-slide-frame" x="0.5" y="0.5" width="${fmt(slideW - 1)}" height="${fmt(slideH - 1)}" fill="none" stroke="#CBD5E1" stroke-width="1"/>`,
    `<g class="sg-preview-chart" transform="translate(${fmt(ox)},${fmt(oy)}) scale(${fmt(scale)})">`,
    inner,
    `</g>`,
    `<rect class="sg-comment-pane" x="${fmt(rightX)}" y="${fmt(margin)}" width="${fmt(rightW)}" height="${fmt(slideH - margin * 2)}" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="6 4" rx="4"/>`,
    `<text class="sg-comment-ghost" x="${fmt(rightX + rightW / 2)}" y="${fmt(slideH / 2)}" text-anchor="middle" font-size="14" fill="#94A3B8">コメント</text>`,
    `</svg>`,
  ].join('');

  return Object.freeze({
    ok: true,
    format: 'svg',
    mime: 'image/svg+xml',
    body,
    preview: 'deck_half_left',
    width: slideW,
    height: slideH,
    network_required: false,
  });
}

function unwrapSvgInner(svg) {
  const trimmed = String(svg).trim();
  const open = trimmed.indexOf('>');
  const close = trimmed.lastIndexOf('</svg>');
  if (open < 0 || close < 0) return trimmed;
  return trimmed.slice(open + 1, close);
}

export { R1_TYPES, DEFAULT_PRESENTATION, DECK_SLOTS };
