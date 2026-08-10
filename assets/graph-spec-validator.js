/**
 * SUGUDASU Graph — Graph Spec Validator
 *
 * Validates Graph Spec payloads before Renderer.
 * NEVER auto-fixes. Invalid → REJECT + reason_code.
 *
 * Spec: docs/graph/GRAPH_SPEC_CONTRACT.md
 * Gate: Spec Validator GO → Contract Test GO → Renderer HOLD解除可
 */
'use strict';

import { ENCODING_BY_TYPE, hasGraphSpec, stableStringify } from './graph-spec-builder.js';

const KNOWN_TYPES = new Set(Object.keys(ENCODING_BY_TYPE));

/**
 * @param {object} payload — buildGraphSpec() result
 * @param {object} [opts]
 * @param {object} [opts.rulesDoc]
 * @param {object} [opts.decision] — optional original decision for cross-checks
 * @returns {{ ok: boolean, reason_codes: string[], errors: { reason_code: string, message: string }[] }}
 */
export function validateGraphSpecPayload(payload, opts = {}) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return reject(errors, 'payload_missing', 'Validator payload is required');
  }

  const kind = payload.spec_kind;

  // --- Terminal / non-spec kinds: must NOT carry a graph_spec ---
  if (
    kind === 'mismatch_explanation' ||
    kind === 'uncovered' ||
    kind === 'confirmation_required' ||
    kind === 'intent_required' ||
    kind === 'invalid_chart_type'
  ) {
    if (payload.graph_spec != null) {
      push(errors, 'spec_forbidden_for_terminal_state', `${kind} must not include graph_spec`);
    }
    if (kind === 'mismatch_explanation' && payload.state !== 'MISMATCH') {
      push(errors, 'mismatch_state_inconsistent', 'mismatch_explanation requires state=MISMATCH');
    }
    if (kind === 'uncovered' && payload.state !== 'NO_MATCH' && payload.state != null) {
      // uncovered is primarily NO_MATCH
      if (payload.state !== 'NO_MATCH') {
        push(errors, 'uncovered_state_inconsistent', 'uncovered should use state=NO_MATCH');
      }
    }
    if (kind === 'confirmation_required') {
      if (payload.state !== 'CONDITIONAL') {
        push(errors, 'conditional_state_inconsistent', 'confirmation_required requires state=CONDITIONAL');
      }
      if (!payload.confirmation_id) {
        push(errors, 'confirmation_id_missing', 'confirmation_required needs confirmation_id');
      }
    }
    return finish(errors);
  }

  // --- graph_spec kind ---
  if (kind !== 'graph_spec') {
    push(errors, 'unknown_spec_kind', `Unknown spec_kind: ${kind}`);
    return finish(errors);
  }

  if (!hasGraphSpec(payload)) {
    push(errors, 'graph_spec_missing', 'spec_kind=graph_spec requires graph_spec object');
    return finish(errors);
  }

  const decision = opts.decision;
  if (decision) {
    if (decision.state === 'CONDITIONAL' && !payload.graph_spec?.source?.confirmation_choice_id) {
      push(
        errors,
        'conditional_unanswered_has_spec',
        'CONDITIONAL without confirmation_choice_id must not produce graph_spec'
      );
    }
    if (decision.state === 'MISMATCH' || decision.state === 'NO_MATCH') {
      push(
        errors,
        'terminal_decision_has_spec',
        `${decision.state} decision must not produce graph_spec`
      );
    }
  }

  validateSpecObject(payload.graph_spec, errors, opts);
  return finish(errors);
}

/**
 * Validate the inner graph_spec object only.
 */
export function validateGraphSpec(spec, opts = {}) {
  const errors = [];
  if (!spec || typeof spec !== 'object') {
    return reject(errors, 'graph_spec_missing', 'graph_spec object is required');
  }
  validateSpecObject(spec, errors, opts);
  return finish(errors);
}

function validateSpecObject(spec, errors, opts) {
  const type = spec.chart?.type;
  if (!type || !KNOWN_TYPES.has(type)) {
    push(errors, 'undefined_graph_type', `Undefined or unsupported chart.type: ${type}`);
  }

  const encoding = spec.encoding;
  if (!encoding || typeof encoding !== 'object') {
    push(errors, 'encoding_missing', 'encoding is required');
  } else if (type && KNOWN_TYPES.has(type)) {
    validateAxes(type, encoding, errors);
  }

  const data = spec.data;
  if (!data || typeof data !== 'object') {
    push(errors, 'data_missing', 'data is required');
  } else {
    validateData(data, type, errors);
  }

  validateUnits(spec, errors);
  validateStacking(spec, errors);
  validateBaseline(spec, errors);
  validateTarget(spec, errors);
  validateTransformation(spec, errors);

  if (spec.constraints?.allow_3d === true) {
    push(errors, 'allow_3d_forbidden', 'allow_3d must be false');
  }

  if (opts.rulesDoc?.graph_types?.[type]?.v1 === false) {
    push(errors, 'graph_type_not_v1', `chart.type ${type} is not enabled for v1`);
  }
}

function validateAxes(type, encoding, errors) {
  const needsXY = !['Donut', 'Pie'].includes(type);
  if (needsXY) {
    if (type === 'Scatter') {
      if (!encoding.x || !encoding.y) {
        push(errors, 'axis_required_missing', 'Scatter requires x and y encodings');
      }
    } else if (type === 'Bar' || type === 'Grouped_Bar') {
      if (!encoding.x || !encoding.y) {
        push(errors, 'axis_required_missing', `${type} requires x (measure) and y (category)`);
      }
    } else {
      if (!encoding.x || encoding.x.field == null) {
        push(errors, 'axis_required_missing', `${type} requires x encoding`);
      }
      if (!encoding.y || encoding.y.field == null) {
        push(errors, 'axis_required_missing', `${type} requires y encoding`);
      }
    }
  } else {
    if (!encoding.theta && !encoding.color) {
      push(errors, 'axis_required_missing', `${type} requires theta/color encoding`);
    }
  }
}

function validateData(data, type, errors) {
  if (!Array.isArray(data.series) || data.series.length === 0) {
    push(errors, 'series_missing', 'data.series must be a non-empty array');
    return;
  }
  if (!Array.isArray(data.categories)) {
    push(errors, 'categories_missing', 'data.categories must be an array');
  }
  if (data.preserve_raw !== true) {
    push(errors, 'preserve_raw_required', 'data.preserve_raw must be true');
  }

  for (const s of data.series) {
    if (!s || typeof s !== 'object') {
      push(errors, 'series_invalid', 'series entry must be an object');
      continue;
    }
    if (!Array.isArray(s.values)) {
      push(errors, 'series_values_missing', `series ${s.id} values must be an array`);
      continue;
    }
    for (const v of s.values) {
      if (v == null || typeof v !== 'object') {
        push(errors, 'value_invalid', `series ${s.id} has invalid value entry`);
        continue;
      }
      if (!('raw' in v) || !('display' in v)) {
        push(errors, 'value_raw_display_missing', `series ${s.id} values need raw and display`);
      }
      if (typeof v.display === 'number' && Number.isNaN(v.display)) {
        push(errors, 'value_display_nan', `series ${s.id} display is NaN`);
      }
    }
    if (Array.isArray(data.categories) && data.categories.length && s.values.length) {
      const cats = new Set(data.categories.map(String));
      for (const v of s.values) {
        if (v.category != null && !cats.has(String(v.category))) {
          push(
            errors,
            'series_category_mismatch',
            `series ${s.id} category ${v.category} not in data.categories`
          );
          break;
        }
      }
    }
  }

  if (type === 'Scatter' && data.series.length < 2) {
    push(errors, 'scatter_needs_two_measures', 'Scatter requires at least two series');
  }
}

function validateUnits(spec, errors) {
  const series = spec.data?.series || [];
  if (series.length < 2) return;
  const units = series.map((s) => s.unit || 'UNKNOWN');
  const unique = [...new Set(units)];
  const stacked = spec.encoding?.stack === 'absolute' || spec.chart?.type === 'Stacked_Column';
  if (stacked && unique.length > 1) {
    push(errors, 'unit_mismatch_on_stack', 'Stacked chart cannot mix different series units');
  }
}

function validateStacking(spec, errors) {
  const type = spec.chart?.type;
  const series = spec.data?.series || [];
  if (type === 'Stacked_Column') {
    const hasPct = series.some((s) => s.unit === '%' || /%/.test(String(s.unit)));
    const hasAbs = series.some((s) => s.unit && s.unit !== '%' && s.unit !== 'UNKNOWN');
    // Also detect mixed via display vs absolute without normalize transform
    if (hasPct && hasAbs) {
      push(
        errors,
        'stacking_percent_absolute_mixed',
        'Cannot mix % and absolute units on Stacked_Column without normalize transform'
      );
    }
  }
  if (type === '100pct_Stacked_Column') {
    if (spec.transform?.id !== 'normalize_to_percentage' && spec.encoding?.stack !== 'normalize') {
      // still ok if display values look normalized — require transform.applied
      if (!spec.transform?.applied) {
        push(
          errors,
          'normalize_not_applied',
          '100pct_Stacked_Column requires applied normalize transformation'
        );
      }
    }
  }
}

function validateBaseline(spec, errors) {
  const c = spec.constraints || {};
  const axis = spec.axis || {};
  if (c.zero_baseline === false && axis.zero_baseline === true) {
    push(errors, 'zero_baseline_inconsistent', 'constraints and axis disagree on zero_baseline');
  }
  const y = spec.encoding?.y;
  if (y && y.type === 'quantitative' && c.zero_baseline === true && y.zero_baseline === false) {
    push(errors, 'zero_baseline_violation', 'quantitative y must respect zero_baseline constraint');
  }
  if (c.allow_3d === true) {
    push(errors, 'allow_3d_forbidden', '3D charts are forbidden');
  }
}

function validateTarget(spec, errors) {
  if (spec.chart?.type !== 'Bullet') return;
  const enc = spec.encoding || {};
  if (!enc.target && !spec.data?.target && !hasTargetInSeries(spec)) {
    push(errors, 'target_missing_on_bullet', 'Bullet chart requires target encoding or target data');
  }
}

function hasTargetInSeries(spec) {
  const series = spec.data?.series || [];
  return series.some((s) => /目標|target|plan|budget/i.test(String(s.label || s.id || '')));
}

function validateTransformation(spec, errors) {
  const tid = spec.transform?.id;
  if (!tid) return;
  if (tid === 'normalize_to_percentage') {
    if (!spec.transform.applied) {
      push(errors, 'normalize_flag_false', 'normalize_to_percentage requires transform.applied=true');
    }
    const series = spec.data?.series || [];
    let sawTransformed = false;
    for (const s of series) {
      for (const v of s.values || []) {
        if (v.raw !== v.display) sawTransformed = true;
      }
    }
    if (!sawTransformed && series.length) {
      // all zeros edge case
      const allZero = series.every((s) => (s.values || []).every((v) => Number(v.raw) === 0));
      if (!allZero) {
        push(
          errors,
          'normalize_data_missing',
          'normalize specified but no display values differ from raw'
        );
      }
    }
  }
}

/**
 * Determinism helper: two payloads must stringify equal when both ok.
 */
export function assertDeterministicSpecs(payloadA, payloadB) {
  const va = validateGraphSpecPayload(payloadA);
  const vb = validateGraphSpecPayload(payloadB);
  if (!va.ok || !vb.ok) {
    return {
      ok: false,
      reason_codes: ['determinism_precondition_failed', ...va.reason_codes, ...vb.reason_codes],
    };
  }
  const same = stableStringify(payloadA.graph_spec) === stableStringify(payloadB.graph_spec);
  if (!same) {
    return { ok: false, reason_codes: ['determinism_spec_changed'] };
  }
  return { ok: true, reason_codes: [] };
}

function push(errors, reason_code, message) {
  errors.push({ reason_code, message });
}

function reject(errors, reason_code, message) {
  push(errors, reason_code, message);
  return finish(errors);
}

function finish(errors) {
  const reason_codes = [...new Set(errors.map((e) => e.reason_code))];
  return Object.freeze({
    ok: errors.length === 0,
    reason_codes,
    errors: errors.map((e) => Object.freeze({ ...e })),
  });
}
