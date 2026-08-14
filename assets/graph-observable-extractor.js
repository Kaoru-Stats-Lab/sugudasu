/**
 * SUGUDASU Graph — Observable Structure Extractor (U-06 v1)
 *
 * Spec: docs/graph/OBSERVABLE_EXTRACTION_SPEC.md
 * Deterministic. No Intent inference. No LLM. No network.
 */
'use strict';

const TEMPORAL_HEADER = /^(年度|年月|月|四半期|期間|年|日付|date|year|month|quarter)$/i;
const TARGET_RE = /目標|計画|予算|見込み|target|plan|budget|forecast/i;
const ACTUAL_RE = /実績|actual|売上|成績|結果|結果値/i;

/** Header/label is a target/plan/budget token (Observable §4.10). */
export function isTargetHeaderToken(s) {
  return TARGET_RE.test(String(s ?? ''));
}

/** Prefer as actual measure when pairing with a target column. */
export function isActualHeaderToken(s) {
  return ACTUAL_RE.test(String(s ?? ''));
}
const TOTAL_RE = /^(合計|計|小計|総計|total|sum)$/i;
const TOTAL_HEADER_RE = /合計|総計|total/i;
const START_RE = /^(開始|始点|期首|期初|start|beginning|期初残高)$/i;
const END_RE = /^(終了|終点|期末|end|ending|期末残高)$/i;
const MONTH_JP = /^([1-9]|1[0-2])月$/;
const MONTH_EN = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*$/i;
const YEAR = /^(19|20)\d{2}$/;
const YEAR_MONTH = /^(19|20)\d{2}[-/年]([1-9]|1[0-2])(月)?$/;
const YEAR_Q = /^(19|20)\d{2}\s*Q[1-4]$/i;
const Q_ONLY = /^Q[1-4]$/i;
const FY = /^(19|20)\d{2}\s*FY$/i;
const FY2 = /^FY(19|20)\d{2}$/i;
const ORDINAL_LIKE = /^(第?[1-9]\d*位)$|^[1-9]\d*(st|nd|rd|th)$/i;

const UNIT_RULES = [
  { type: 'Percentage', unit: '%', re: /%|％|百分比|percent/i },
  { type: 'Percentage', unit: '%', re: /率/ },
  { type: 'Currency', unit: '円', re: /円|千円|百万円|億円|¥|yen/i },
  { type: 'Currency', unit: 'USD', re: /\busd\b|\$/i },
  { type: 'Count', unit: '件', re: /件|人|個|回|社/ },
  { type: 'Rate', unit: 'x', re: /倍率|\b倍\b|\brate\b/i },
  { type: 'Net_Change', unit: 'UNKNOWN', re: /増減|差分|変化額|差額|net\s*change/i },
];

/**
 * @param {string} text
 * @returns {{ observable: object, measures: object[], table: object, evidence: object }}
 */
export function extractObservableFromTsv(text) {
  const table = parseTable(text);
  const evidence = { parse: { delimiter: table.delimiter, hasHeader: table.hasHeader } };

  if (!table.rows.length && !table.headers.length) {
    return emptyResult(evidence);
  }

  const colCount = Math.max(
    table.headers.length,
    ...table.rows.map((r) => r.length),
    0
  );
  const headers = padHeaders(table.headers, colCount, table.hasHeader);

  const roles = classifyColumns(headers, table.rows, evidence);
  const layout = detectLayout(headers, table.rows, roles, evidence);

  const flags = detectFlags(headers, table.rows, layout, evidence);
  const measureMeta = detectMeasureMeta(headers, roles, layout, evidence);
  const signFlags = detectSigns(table.rows, roles, layout);

  let measure_type = measureMeta.measure_type;
  if (
    measure_type !== 'Net_Change' &&
    signFlags.positive_negative_mixed &&
    flags.has_start_end &&
    layout.measure_count === 1
  ) {
    measure_type = 'Net_Change';
    evidence.net_change_via = 'mixed_signs_and_start_end';
  }

  const measures = buildMeasures(table.rows, roles, layout, headers);

  const observable = {
    dimension: layout.dimension,
    cardinality: layout.cardinality,
    nominal_cardinality: layout.nominal_cardinality,
    measure_count: layout.measure_count,
    measure_type,
    unit: measureMeta.unit,
    positive_only: signFlags.positive_only,
    positive_negative_mixed: signFlags.positive_negative_mixed,
    zero_included: signFlags.zero_included,
    has_total: flags.has_total,
    has_start_end: flags.has_start_end,
    has_target: flags.has_target,
    values_have_different_units: measureMeta.values_have_different_units,
    values_share_common_unit: measureMeta.values_share_common_unit,
    temporal_equal_interval: layout.temporal_equal_interval,
    max_label_length: layout.max_label_length,
    measure_type_mixed_percentage_absolute: measureMeta.measure_type_mixed_percentage_absolute,
  };

  return {
    observable,
    measures,
    table: { headers, rows: table.rows, hasHeader: table.hasHeader },
    evidence,
  };
}

function emptyResult(evidence) {
  return {
    observable: {
      dimension: 'Nominal',
      cardinality: 0,
      nominal_cardinality: null,
      measure_count: 0,
      measure_type: 'Unknown',
      unit: 'UNKNOWN',
      positive_only: false,
      positive_negative_mixed: false,
      zero_included: false,
      has_total: false,
      has_start_end: false,
      has_target: false,
      values_have_different_units: false,
      values_share_common_unit: false,
      temporal_equal_interval: false,
      max_label_length: 0,
      measure_type_mixed_percentage_absolute: false,
    },
    measures: [],
    table: { headers: [], rows: [], hasHeader: false },
    evidence: { ...evidence, empty: true },
  };
}

export function parseTable(text) {
  const raw = String(text ?? '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim() !== '');
  if (!lines.length) {
    return { headers: [], rows: [], hasHeader: false, delimiter: '\t' };
  }

  const delimiter = lines.some((l) => l.includes('\t')) ? '\t' : ',';
  const matrix = lines.map((l) => splitRow(l, delimiter));

  const first = matrix[0];
  const rest = matrix.slice(1);
  let hasHeader = false;
  if (rest.length === 0) {
    hasHeader = first.some((c) => !isNumericCell(c));
  } else {
    const firstNonNumeric = first.some((c) => c !== '' && !isNumericCell(c));
    const bodyNumericRatio = numericRatio(rest.flat());
    const headerToken = first.some((c) => looksHeaderToken(c));
    hasHeader = (firstNonNumeric && bodyNumericRatio >= 0.3) || headerToken;
  }

  if (hasHeader) {
    return { headers: first, rows: rest, hasHeader: true, delimiter };
  }
  return { headers: [], rows: matrix, hasHeader: false, delimiter };
}

function splitRow(line, delimiter) {
  if (delimiter === '\t') return line.split('\t').map((c) => c.trim());
  // minimal CSV split (no nested quotes complexity beyond paired quotes)
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function padHeaders(headers, colCount, hasHeader) {
  const h = headers.slice();
  while (h.length < colCount) h.push(hasHeader ? `col_${h.length}` : `col_${h.length}`);
  return h.slice(0, colCount);
}

function classifyColumns(headers, rows, evidence) {
  const roles = headers.map((h, i) => {
    const cells = rows.map((r) => r[i] ?? '');
    const ratio = numericRatio(cells);
    const headerTemporal = isTemporalToken(h) || TEMPORAL_HEADER.test(h);
    const valuesTemporal = temporalRatio(cells) >= 0.7;
    let role = 'measure';
    if (headerTemporal || valuesTemporal) role = 'dimension';
    else if (ratio < 0.8) role = 'dimension';
    return { index: i, header: h, role, numeric_ratio: ratio, valuesTemporal, headerTemporal };
  });
  evidence.roles = roles.map((r) => ({ i: r.index, role: r.role, nr: r.numeric_ratio }));
  return roles;
}

function detectLayout(headers, rows, roles, evidence) {
  const dimCols = roles.filter((r) => r.role === 'dimension');
  const measureCols = roles.filter((r) => r.role === 'measure');

  // Wide: first col nominal dimension, remaining headers all temporal, body numeric
  if (headers.length >= 3 && rows.length >= 1) {
    const firstRole = roles[0];
    const restHeaders = headers.slice(1);
    const restTemporal = restHeaders.every((h) => isTemporalToken(h));
    const restNumeric = roles.slice(1).every((r) => r.numeric_ratio >= 0.8 || r.role === 'measure');
    if (firstRole.role === 'dimension' && !firstRole.valuesTemporal && restTemporal && restNumeric) {
      const labels = rows.map((r) => r[0] ?? '').filter((x) => x !== '');
      const max_label_length = Math.max(0, ...labels.map((s) => s.length), ...restHeaders.map((s) => s.length));
      evidence.layout = 'wide_temporal_nominal';
      return {
        dimension: 'Temporal+Nominal',
        cardinality: restHeaders.length,
        nominal_cardinality: uniqueCount(labels),
        measure_count: 1,
        temporal_equal_interval: yearsEqualInterval(restHeaders),
        max_label_length,
        wide: true,
        dimIndexes: [0],
        measureIndexes: roles.slice(1).map((r) => r.index),
      };
    }
  }

  const temporalDims = dimCols.filter((c) => c.valuesTemporal || c.headerTemporal || temporalRatio(rows.map((r) => r[c.index] ?? '')) >= 0.7);
  const nominalDims = dimCols.filter((c) => !temporalDims.includes(c));

  let dimension = 'Nominal';
  let cardinality = 0;
  let nominal_cardinality = null;
  let temporal_equal_interval = false;
  let unsupported_layout = false;

  if (temporalDims.length === 1 && nominalDims.length === 1 && measureCols.length >= 1) {
    dimension = 'Temporal+Nominal';
    const tCells = rows.map((r) => r[temporalDims[0].index] ?? '').filter(Boolean);
    const nCells = rows.map((r) => r[nominalDims[0].index] ?? '').filter(Boolean);
    cardinality = uniqueCount(tCells);
    nominal_cardinality = uniqueCount(nCells);
    temporal_equal_interval = yearsEqualInterval(tCells);
  } else if (temporalDims.length === 1 && nominalDims.length === 0) {
    dimension = 'Temporal';
    const tCells = rows.map((r) => r[temporalDims[0].index] ?? '').filter(Boolean);
    cardinality = uniqueCount(tCells);
    temporal_equal_interval = yearsEqualInterval(tCells);
  } else if (nominalDims.length >= 1 && temporalDims.length === 0) {
    dimension = 'Nominal';
    const nCells = rows.map((r) => r[nominalDims[0].index] ?? '').filter(Boolean);
    cardinality = uniqueCount(nCells);
    if (nominalDims.length > 1) unsupported_layout = true;
  } else if (temporalDims.length === 0 && nominalDims.length === 0 && measureCols.length > 0) {
    dimension = 'Nominal';
    cardinality = rows.length;
    unsupported_layout = true;
  } else {
    dimension = temporalDims.length ? 'Temporal' : 'Nominal';
    const primary = temporalDims[0] || nominalDims[0] || dimCols[0];
    if (primary) {
      const cells = rows.map((r) => r[primary.index] ?? '').filter(Boolean);
      cardinality = uniqueCount(cells);
      if (temporalDims.length) temporal_equal_interval = yearsEqualInterval(cells);
    }
    unsupported_layout = true;
  }

  const labelCells = [];
  for (const dcol of dimCols) {
    for (const r of rows) labelCells.push(String(r[dcol.index] ?? ''));
  }
  for (const h of headers) labelCells.push(h);
  const max_label_length = Math.max(0, ...labelCells.map((s) => s.length));

  evidence.layout = dimension;
  evidence.unsupported_layout = unsupported_layout;
  evidence.ordinal_like = labelCells.some((s) => ORDINAL_LIKE.test(s));

  return {
    dimension,
    cardinality,
    nominal_cardinality,
    measure_count: measureCols.length,
    temporal_equal_interval,
    max_label_length,
    wide: false,
    dimIndexes: dimCols.map((c) => c.index),
    measureIndexes: measureCols.map((c) => c.index),
    temporalDimIndex: temporalDims[0]?.index ?? null,
    nominalDimIndex: nominalDims[0]?.index ?? null,
  };
}

function detectFlags(headers, rows, layout, evidence) {
  const labels = [];
  for (const idx of layout.dimIndexes || []) {
    for (const r of rows) labels.push(String(r[idx] ?? '').trim());
  }
  const headerJoined = headers.join(' ');

  const has_total =
    labels.some((l) => TOTAL_RE.test(l)) || TOTAL_HEADER_RE.test(headerJoined);
  const hasStart = labels.some((l) => START_RE.test(l));
  const hasEnd = labels.some((l) => END_RE.test(l));
  const has_start_end = hasStart && hasEnd;
  const has_target =
    TARGET_RE.test(headerJoined) || labels.some((l) => TARGET_RE.test(l));

  evidence.flags = { has_total, has_start_end, has_target };
  return { has_total, has_start_end, has_target };
}

function detectMeasureMeta(headers, roles, layout, evidence) {
  const measureRoles = roles.filter((r) => layout.measureIndexes.includes(r.index));
  if (layout.wide) {
    // one logical measure across temporal columns
    const types = headers.slice(1).map((h) => detectUnitFromHeader(h));
    // headers are years — Absolute / UNKNOWN
    return {
      measure_type: 'Absolute',
      unit: 'UNKNOWN',
      values_have_different_units: false,
      values_share_common_unit: false,
      measure_type_mixed_percentage_absolute: false,
    };
  }

  const metas = measureRoles.map((r) => detectUnitFromHeader(r.header));
  if (!metas.length) {
    return {
      measure_type: 'Unknown',
      unit: 'UNKNOWN',
      values_have_different_units: false,
      values_share_common_unit: false,
      measure_type_mixed_percentage_absolute: false,
    };
  }

  const types = metas.map((m) => m.type);
  const units = metas.map((m) => m.unit);
  const uniqueTypes = [...new Set(types)];
  const uniqueUnits = [...new Set(units)];

  const values_have_different_units =
    metas.length >= 2 && (uniqueTypes.length > 1 || uniqueUnits.length > 1);
  const values_share_common_unit =
    metas.length >= 2 &&
    uniqueTypes.length === 1 &&
    uniqueUnits.length === 1 &&
    uniqueTypes[0] !== 'Unknown' &&
    uniqueUnits[0] !== 'UNKNOWN';

  const hasPct = types.includes('Percentage');
  const hasAbsLike = types.some((t) => t === 'Absolute' || t === 'Currency' || t === 'Count');
  const measure_type_mixed_percentage_absolute = hasPct && hasAbsLike;

  let measure_type = uniqueTypes.length === 1 ? uniqueTypes[0] : 'Unknown';
  let unit = uniqueUnits.length === 1 ? uniqueUnits[0] : 'UNKNOWN';
  if (measure_type === 'Absolute' && unit === 'UNKNOWN') {
    // keep Absolute
  }

  evidence.measure_meta = metas;
  return {
    measure_type,
    unit,
    values_have_different_units,
    values_share_common_unit,
    measure_type_mixed_percentage_absolute,
  };
}

function detectUnitFromHeader(header) {
  const h = String(header || '');
  for (const rule of UNIT_RULES) {
    if (rule.re.test(h)) {
      if (rule.type === 'Percentage') return { type: 'Percentage', unit: '%' };
      if (rule.type === 'Currency') {
        if (/億円/.test(h)) return { type: 'Currency', unit: '億円' };
        if (/百万円/.test(h)) return { type: 'Currency', unit: '百万円' };
        if (/千円/.test(h)) return { type: 'Currency', unit: '千円' };
        if (/\$|usd/i.test(h)) return { type: 'Currency', unit: 'USD' };
        return { type: 'Currency', unit: '円' };
      }
      return { type: rule.type, unit: rule.unit };
    }
  }
  if (h.trim() === '') return { type: 'Unknown', unit: 'UNKNOWN' };
  return { type: 'Absolute', unit: 'UNKNOWN' };
}

function detectSigns(rows, roles, layout) {
  const idxs = layout.wide ? layout.measureIndexes : layout.measureIndexes;
  const nums = [];
  for (const r of rows) {
    for (const i of idxs) {
      const n = parseNumber(r[i]);
      if (n != null) nums.push(n);
    }
  }
  if (!nums.length) {
    return { positive_only: false, positive_negative_mixed: false, zero_included: false };
  }
  const hasPos = nums.some((n) => n > 0);
  const hasNeg = nums.some((n) => n < 0);
  const zero_included = nums.some((n) => n === 0);
  const positive_negative_mixed = hasPos && hasNeg;
  const positive_only = hasPos && !hasNeg;
  return { positive_only, positive_negative_mixed, zero_included };
}

function buildMeasures(rows, roles, layout, headers) {
  if (layout.wide) {
    // For CONVERTIBLE / display tests: flatten first data column series? Spec: optional.
    // Provide row totals as Absolute vector for evidence only — Decision MIX_SHIFT needs structure flags.
    return rows.map((r, i) => {
      const vals = layout.measureIndexes.map((idx) => parseNumber(r[idx])).filter((n) => n != null);
      const sum = vals.reduce((a, b) => a + b, 0);
      return { id: String(r[0] ?? `row_${i}`), value: sum, raw: sum };
    });
  }
  if (!layout.measureIndexes.length) return [];
  const primary = layout.measureIndexes[0];
  const dimIdx = layout.dimIndexes[0];
  return rows.map((r, i) => {
    const value = parseNumber(r[primary]);
    const id = dimIdx != null ? String(r[dimIdx] ?? `row_${i}`) : String(headers[primary] || `m_${i}`);
    return { id, value: value ?? 0, raw: value ?? 0 };
  });
}

export function isTemporalToken(s) {
  const t = String(s ?? '').trim();
  if (!t) return false;
  if (TEMPORAL_HEADER.test(t)) return true;
  if (YEAR.test(t)) return true;
  if (YEAR_MONTH.test(t)) return true;
  if (YEAR_Q.test(t) || Q_ONLY.test(t)) return true;
  if (FY.test(t) || FY2.test(t)) return true;
  if (MONTH_JP.test(t)) return true;
  if (MONTH_EN.test(t)) return true;
  return false;
}

function temporalRatio(cells) {
  const nonEmpty = cells.map((c) => String(c ?? '').trim()).filter(Boolean);
  if (!nonEmpty.length) return 0;
  const hit = nonEmpty.filter((c) => isTemporalToken(c)).length;
  return hit / nonEmpty.length;
}

function yearsEqualInterval(labels) {
  const years = labels.map((l) => String(l).trim()).filter((l) => YEAR.test(l)).map(Number);
  if (years.length < 2) return false;
  const sorted = [...years].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) return false;
  }
  return uniqueCount(sorted.map(String)) === sorted.length;
}

function uniqueCount(arr) {
  return new Set(arr.map((x) => String(x))).size;
}

function numericRatio(cells) {
  const nonEmpty = cells.map((c) => String(c ?? '').trim()).filter((c) => c !== '');
  if (!nonEmpty.length) return 0;
  const ok = nonEmpty.filter((c) => isNumericCell(c)).length;
  return ok / nonEmpty.length;
}

function looksHeaderToken(c) {
  const s = String(c);
  return (
    TEMPORAL_HEADER.test(s) ||
    TARGET_RE.test(s) ||
    TOTAL_HEADER_RE.test(s) ||
    /円|%|％|売上|実績|利益|件数|人数|増減/.test(s)
  );
}

export function isNumericCell(raw) {
  return parseNumber(raw) != null;
}

export function parseNumber(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (s === '' || s === '-' || s === '—') return null;
  s = s.replace(/,/g, '');
  s = s.replace(/[０-９．－＋]/g, (ch) => {
    const map = {
      '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
      '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
      '．': '.', '－': '-', '＋': '+',
    };
    return map[ch] || ch;
  });
  s = s.replace(/%$/, '');
  if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
