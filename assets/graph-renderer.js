/**
 * SUGUDASU Graph — Renderer (R1: Bar / Column / Line)
 *
 * Constitution: docs/graph/PRESENTATION_OUTPUT_CONSTITUTION.md
 * API: docs/graph/GRAPH_RENDERER_API.md
 *
 * Thinks nothing. Does not read Rule / Intent / matched_rule_id for branching.
 * Invalid Spec → REJECT (no auto-fix, no draw).
 */
'use strict';

import { validateGraphSpecPayload } from './graph-spec-validator.js';

const R1_TYPES = new Set(['Bar', 'Column', 'Line']);

const DEFAULT_PRESENTATION = Object.freeze({
  series_color: '#2F6FED',
  grid_color: '#E6E8EC',
  axis_color: '#6B7280',
  baseline_color: '#111827',
  text_color: '#374151',
  grid: true,
  show_category_labels: true,
  show_value_axis_labels: true,
  line_width: 2,
  bar_gap: 0.25,
});

/**
 * @param {object} payload — buildGraphSpec result
 * @param {object} [options]
 * @param {'svg'|'png'} [options.format]
 * @param {object} [options.presentation]
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @param {object} [options.rulesDoc]
 */
export async function renderGraph(payload, options = {}) {
  const format = options.format === 'png' ? 'png' : 'svg';
  const width = Number(options.width) > 0 ? Number(options.width) : 640;
  const height = Number(options.height) > 0 ? Number(options.height) : 360;
  const presentation = { ...DEFAULT_PRESENTATION, ...(options.presentation || {}) };

  const validation = validateGraphSpecPayload(payload, { rulesDoc: options.rulesDoc });
  if (!validation.ok) {
    return fail(['validator_reject', ...validation.reason_codes], validation.errors);
  }

  // Terminal / non-spec payloads validate as OK but must never be drawn
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
      [{ reason_code: 'renderer_type_not_in_r1', message: `R1 supports Bar/Column/Line only; got ${type}` }]
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
    });
  } catch (err) {
    return fail(
      ['png_export_failed'],
      [{ reason_code: 'png_export_failed', message: String(err?.message || err) }]
    );
  }
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
  return renderLine(spec, ctx);
}

function layout(width, height) {
  const pad = { top: 24, right: 24, bottom: 48, left: 56 };
  return {
    pad,
    plotX: pad.left,
    plotY: pad.top,
    plotW: width - pad.left - pad.right,
    plotH: height - pad.top - pad.bottom,
    width,
    height,
  };
}

function primarySeries(spec) {
  return (spec.data?.series && spec.data.series[0]) || { values: [], unit: 'UNKNOWN' };
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
  const L = layout(width, height);
  const series = primarySeries(spec);
  const cats = categories(spec, series);
  const vals = valuesInCategoryOrder(series, cats);
  const zeroBaseline = spec.constraints?.zero_baseline !== false;
  const { min, max } = yDomain(vals, zeroBaseline);
  const ticks = niceTicks(min, max);
  const yScale = (v) => L.plotY + L.plotH - ((v - min) / (max - min)) * L.plotH;
  const band = L.plotW / Math.max(cats.length, 1);
  const gap = band * p.bar_gap;
  const barW = Math.max(band - gap, 1);
  const zeroY = yScale(0);

  const graphic = [];
  const text = [];

  // grid + axes
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
      `<rect class="sg-mark-column" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(barW)}" height="${fmt(h)}" fill="${esc(p.series_color)}"/>`
    );
    if (p.show_category_labels) {
      text.push(
        `<text class="sg-label-category" x="${fmt(x + barW / 2)}" y="${fmt(L.plotY + L.plotH + 16)}" text-anchor="middle" font-size="11" fill="${esc(p.text_color)}">${esc(c)}</text>`
      );
    }
  });

  if (p.show_value_axis_labels) {
    for (const t of ticks) {
      text.push(
        `<text class="sg-label-value" x="${fmt(L.plotX - 8)}" y="${fmt(yScale(t) + 4)}" text-anchor="end" font-size="10" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
      );
    }
  }

  return wrapSvg(width, height, graphic, text, 'Column');
}

function renderBar(spec, ctx) {
  const { width, height, presentation: p } = ctx;
  const L = layout(width, height);
  const series = primarySeries(spec);
  const cats = categories(spec, series);
  const vals = valuesInCategoryOrder(series, cats);
  const zeroBaseline = spec.constraints?.zero_baseline !== false;
  const { min, max } = yDomain(vals, zeroBaseline);
  const ticks = niceTicks(min, max);
  const xScale = (v) => L.plotX + ((v - min) / (max - min)) * L.plotW;
  const band = L.plotH / Math.max(cats.length, 1);
  const gap = band * p.bar_gap;
  const barH = Math.max(band - gap, 1);
  const zeroX = xScale(0);

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
      `<rect class="sg-mark-bar" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(barH)}" fill="${esc(p.series_color)}"/>`
    );
    if (p.show_category_labels) {
      text.push(
        `<text class="sg-label-category" x="${fmt(L.plotX - 8)}" y="${fmt(y + barH / 2 + 4)}" text-anchor="end" font-size="11" fill="${esc(p.text_color)}">${esc(c)}</text>`
      );
    }
  });

  if (p.show_value_axis_labels) {
    for (const t of ticks) {
      text.push(
        `<text class="sg-label-value" x="${fmt(xScale(t))}" y="${fmt(L.plotY + L.plotH + 16)}" text-anchor="middle" font-size="10" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
      );
    }
  }

  return wrapSvg(width, height, graphic, text, 'Bar');
}

function renderLine(spec, ctx) {
  const { width, height, presentation: p } = ctx;
  const L = layout(width, height);
  const series = primarySeries(spec);
  const cats = categories(spec, series);
  const vals = valuesInCategoryOrder(series, cats);
  const zeroBaseline = spec.constraints?.zero_baseline !== false;
  const { min, max } = yDomain(vals, zeroBaseline);
  const ticks = niceTicks(min, max);
  const yScale = (v) => L.plotY + L.plotH - ((v - min) / (max - min)) * L.plotH;
  const xAt = (i) => L.plotX + (cats.length <= 1 ? L.plotW / 2 : (i / (cats.length - 1)) * L.plotW);
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
    graphic.push(
      `<circle class="sg-mark-point" cx="${fmt(xAt(i))}" cy="${fmt(yScale(vals[i]))}" r="3" fill="${esc(p.series_color)}"/>`
    );
    if (p.show_category_labels) {
      text.push(
        `<text class="sg-label-category" x="${fmt(xAt(i))}" y="${fmt(L.plotY + L.plotH + 16)}" text-anchor="middle" font-size="11" fill="${esc(p.text_color)}">${esc(c)}</text>`
      );
    }
  });

  if (p.show_value_axis_labels) {
    for (const t of ticks) {
      text.push(
        `<text class="sg-label-value" x="${fmt(L.plotX - 8)}" y="${fmt(yScale(t) + 4)}" text-anchor="end" font-size="10" fill="${esc(p.text_color)}">${esc(fmt(t))}</text>`
      );
    }
  }

  return wrapSvg(width, height, graphic, text, 'Line');
}

function wrapSvg(width, height, graphicParts, textParts, type) {
  // Deterministic element order: graphic then text
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(width)}" height="${fmt(height)}" viewBox="0 0 ${fmt(width)} ${fmt(height)}" data-sg-chart="${esc(type)}">`,
    `<g class="sg-graphic">`,
    ...graphicParts,
    `</g>`,
    `<g class="sg-text">`,
    ...textParts,
    `</g>`,
    `</svg>`,
  ].join('');
}

export { R1_TYPES, DEFAULT_PRESENTATION };
