/**
 * SUGUDASU Graph — Deterministic Decision Engine
 *
 * Reads docs/graph/GRAPH_RULES.json as the sole rule source.
 * Emits Rule ID → State → Graph Spec. No SVG / Vega-Lite / network / LLM.
 *
 * Pipeline: Observable Structure → Intent → Rule Match → Resolution State → Decision
 */
'use strict';

const ACTIVE_STATUSES = new Set(['active', 'active_provisional']);

/**
 * @param {object} rulesDoc GRAPH_RULES.json
 * @returns {{ decide: Function, getActiveRules: Function, rulesDoc: object }}
 */
export function createGraphDecisionEngine(rulesDoc) {
  if (!rulesDoc || typeof rulesDoc !== 'object') {
    throw new Error('GRAPH_RULES.json document is required');
  }
  if (rulesDoc.engine?.llm_required === true || rulesDoc.engine?.llm_slot === true) {
    throw new Error('Decision Engine forbids LLM-enabled rule documents');
  }

  const activeRules = (rulesDoc.rules || [])
    .filter((r) => ACTIVE_STATUSES.has(r.status))
    .slice()
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return String(a.id).localeCompare(String(b.id));
    });

  function getActiveRules() {
    return activeRules.slice();
  }

  /**
   * @param {{ observable: object, intent: string|null|undefined, measures?: unknown[] }} input
   */
  function decide(input) {
    const observable = input?.observable && typeof input.observable === 'object' ? { ...input.observable } : {};
    const intentRaw = input?.intent;
    const measures = Array.isArray(input?.measures) ? input.measures.map((m) => cloneJson(m)) : undefined;

    if (intentRaw == null || intentRaw === '' || intentRaw === 'UNKNOWN') {
      return freezeDecision({
        matched_rule_id: null,
        state: null,
        recommended_graph: null,
        observed_graphs: null,
        transformation: null,
        requires_confirmation: false,
        deterministic_kind: null,
        reason_code: 'unknown_intent',
        action: rulesDoc.fallback?.unknown_intent?.action || 'ask_user',
        message: rulesDoc.fallback?.unknown_intent?.question || '何を伝えたいですか？',
        options: rulesDoc.fallback?.unknown_intent?.options_ui_hypothesis_not_final || null,
        unit: observable.unit ?? null,
        measures,
        network_required: false,
        llm_required: false,
      });
    }

    const intent = String(intentRaw);

    const stackingConflict = detectStackingConflict(observable, intent, rulesDoc);
    if (stackingConflict) {
      return freezeDecision({
        matched_rule_id: null,
        state: 'MISMATCH',
        recommended_graph: null,
        observed_graphs: null,
        transformation: null,
        requires_confirmation: false,
        deterministic_kind: null,
        reason_code: stackingConflict.reason_code,
        action: rulesDoc.fallback?.structural_conflict?.action || 'reject_with_explanation',
        message: rulesDoc.fallback?.structural_conflict?.message || stackingConflict.message,
        unit: normalizeUnit(observable.unit),
        measures,
        network_required: false,
        llm_required: false,
      });
    }

    for (const rule of activeRules) {
      if (!matchesIf(rule.if, observable, intent)) continue;
      if (matchesRejectWhen(rule.reject_when, observable)) {
        return freezeDecision({
          matched_rule_id: rule.id,
          state: 'MISMATCH',
          recommended_graph: null,
          observed_graphs: null,
          transformation: null,
          requires_confirmation: false,
          deterministic_kind: null,
          reason_code: `reject_when:${rule.id}`,
          action: 'reject_with_explanation',
          message: rulesDoc.fallback?.structural_conflict?.message || '選んだ目的と、表の構造が合いません。',
          unit: normalizeUnit(observable.unit),
          measures,
          network_required: false,
          llm_required: false,
        });
      }

      const then = rule.then || {};
      const cndId = then.requires_confirmation || null;
      const cnd = cndId ? rulesDoc.conditional_rules?.[cndId] : null;

      return freezeDecision({
        matched_rule_id: rule.id,
        state: then.state,
        recommended_graph: then.recommended_graph || then.graph || null,
        observed_graphs: then.observed_graphs || null,
        transformation: then.transformation || null,
        requires_confirmation: Boolean(cndId),
        confirmation_id: cndId,
        confirmation_default: cnd?.default ?? null,
        confirmation_options: cnd?.options ?? null,
        deterministic: then.deterministic ?? null,
        deterministic_kind: then.deterministic_kind || null,
        sort: then.sort || null,
        default_top_n: then.default_top_n ?? null,
        safety: rule.safety || cnd?.safety || null,
        reason_code: `matched:${rule.id}`,
        rule_status: rule.status,
        unit: normalizeUnit(observable.unit),
        measures: applyTransformationPreserveRaw(measures, then.transformation, rulesDoc),
        network_required: false,
        llm_required: false,
      });
    }

    const noMatch = rulesDoc.fallback?.no_matching_rule || {};
    return freezeDecision({
      matched_rule_id: null,
      state: noMatch.state || 'NO_MATCH',
      recommended_graph: null,
      observed_graphs: null,
      transformation: null,
      requires_confirmation: false,
      deterministic_kind: null,
      reason_code: 'no_matching_rule',
      action: noMatch.action || 'report_uncovered',
      message: noMatch.message || '現在のルールセットでは、この入力に対するグラフを自動決定できません。',
      unit: normalizeUnit(observable.unit),
      measures,
      network_required: false,
      llm_required: false,
    });
  }

  return { decide, getActiveRules, rulesDoc };
}

function detectStackingConflict(observable, intent, rulesDoc) {
  const stacking = rulesDoc.validation?.stacking || {};
  const stackIntents = new Set(['BREAKDOWN', 'MIX_SHIFT']);
  if (!stackIntents.has(intent)) return null;

  if (stacking.reject_mixed_units && observable.values_have_different_units === true) {
    return {
      reason_code: 'stacking_reject_mixed_units',
      message: '単位の異なる系列を積み上げグラフにはできません。',
    };
  }
  if (stacking.reject_positive_negative_mixed && observable.positive_negative_mixed === true) {
    return {
      reason_code: 'stacking_reject_positive_negative_mixed',
      message: '正負が混在する値を通常の積み上げグラフにはできません。',
    };
  }
  if (
    stacking.reject_percentage_with_absolute_without_transform &&
    observable.measure_type_mixed_percentage_absolute === true
  ) {
    return {
      reason_code: 'stacking_reject_percentage_with_absolute',
      message: '割合と実数を変換なしで積み上げることはできません。',
    };
  }
  return null;
}

function matchesIf(cond, observable, intent) {
  if (!cond || typeof cond !== 'object') return false;

  if (Object.prototype.hasOwnProperty.call(cond, 'intent')) {
    if (!intentMatches(cond.intent, intent)) return false;
  }
  if (Object.prototype.hasOwnProperty.call(cond, 'dimension')) {
    if (observable.dimension !== cond.dimension) return false;
  }
  if (Object.prototype.hasOwnProperty.call(cond, 'measure_count')) {
    if (Number(observable.measure_count) !== Number(cond.measure_count)) return false;
  }
  if (Object.prototype.hasOwnProperty.call(cond, 'measure_type')) {
    if (observable.measure_type !== cond.measure_type) return false;
  }
  if (Object.prototype.hasOwnProperty.call(cond, 'cardinality')) {
    if (!inRange(observable.cardinality, cond.cardinality)) return false;
  }
  if (Object.prototype.hasOwnProperty.call(cond, 'nominal_cardinality')) {
    if (!inRange(observable.nominal_cardinality, cond.nominal_cardinality)) return false;
  }

  for (const flag of [
    'positive_negative_mixed',
    'has_total',
    'has_start_end',
    'has_target',
    'values_have_different_units',
    'values_share_common_unit',
  ]) {
    if (Object.prototype.hasOwnProperty.call(cond, flag)) {
      if (Boolean(observable[flag]) !== Boolean(cond[flag])) return false;
    }
  }

  return true;
}

function matchesRejectWhen(rejectWhen, observable) {
  if (!rejectWhen || typeof rejectWhen !== 'object') return false;
  for (const [key, expected] of Object.entries(rejectWhen)) {
    if (Boolean(observable[key]) !== Boolean(expected)) return false;
  }
  return true;
}

function intentMatches(ruleIntent, intent) {
  if (Array.isArray(ruleIntent)) return ruleIntent.includes(intent);
  return ruleIntent === intent;
}

function inRange(value, spec) {
  if (value == null || Number.isNaN(Number(value))) return false;
  const n = Number(value);
  if (!spec || typeof spec !== 'object') return n === Number(spec);
  if (Object.prototype.hasOwnProperty.call(spec, 'min') && n < Number(spec.min)) return false;
  if (Object.prototype.hasOwnProperty.call(spec, 'max') && n > Number(spec.max)) return false;
  if (Object.prototype.hasOwnProperty.call(spec, 'gt') && !(n > Number(spec.gt))) return false;
  if (Object.prototype.hasOwnProperty.call(spec, 'lt') && !(n < Number(spec.lt))) return false;
  return true;
}

function normalizeUnit(unit) {
  if (unit == null || unit === '') return 'UNKNOWN';
  return unit;
}

function applyTransformationPreserveRaw(measures, transformationId, rulesDoc) {
  if (!measures) return measures;
  if (!transformationId) return measures;

  const def = rulesDoc.transformations?.[transformationId];
  if (!def) {
    return measures.map((m) => ({ ...m, display: m.display ?? m.value, raw: m.raw ?? m.value }));
  }

  if (transformationId === 'normalize_to_percentage') {
    const sum = measures.reduce((acc, m) => acc + Number(m.value || 0), 0);
    return measures.map((m) => {
      const raw = m.raw ?? m.value;
      const value = Number(m.value || 0);
      const display = sum === 0 ? 0 : (value / sum) * 100;
      return {
        ...m,
        raw,
        value: raw,
        display,
        unit_display: '%',
        transformation: transformationId,
      };
    });
  }

  if (transformationId === 'top_n_plus_other') {
    return measures.map((m) => ({ ...m, raw: m.raw ?? m.value, display: m.display ?? m.value }));
  }

  return measures.map((m) => ({ ...m, raw: m.raw ?? m.value, display: m.display ?? m.value }));
}

function cloneJson(v) {
  return JSON.parse(JSON.stringify(v));
}

function freezeDecision(d) {
  return Object.freeze({ ...d });
}

/**
 * Load rules from a filesystem path (Node tests / tooling).
 * Browser builds should inject the JSON via createGraphDecisionEngine.
 */
export async function loadGraphRulesFromFile(fileUrlOrPath, readFileSync) {
  const text = readFileSync(fileUrlOrPath, 'utf8');
  return JSON.parse(text);
}
