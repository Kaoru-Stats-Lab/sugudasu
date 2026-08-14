/**
 * SUGUDASU Graph — Presentation color settings helpers (Color Must)
 *
 * Spec: docs/graph/GRAPH_R1_COLOR_MUST_JUDGMENT.md
 * No Decision / Rule branching. Pure Settings normalization for Renderer.
 */
'use strict';

const HEX_RE = /^#?[0-9A-Fa-f]{6}$/;

/** Normalize user HEX (with/without #) → #RRGGBB or null. */
export function normalizeHex(input) {
  const s = String(input ?? '').trim();
  if (!HEX_RE.test(s)) return null;
  return s.startsWith('#') ? s.toUpperCase() : `#${s.toUpperCase()}`;
}

/**
 * Build presentation object for renderGraph from UI state.
 * @param {object} state
 * @param {string} [state.series_color]
 * @param {string} [state.accent_color]
 * @param {string[]} [state.accent_categories]
 * @param {boolean} [state.show_value_labels]
 * @param {boolean} [state.show_unit_label]
 * @param {string} [state.deck_slot]
 * @param {string} [state.target_line_color]
 * @param {string} [state.target_series_color]
 */
export function buildPresentationFromSettings(state = {}) {
  const series = normalizeHex(state.series_color);
  const accent = normalizeHex(state.accent_color);
  const targetLine = normalizeHex(state.target_line_color);
  const targetSeries = normalizeHex(state.target_series_color);
  const accents = Array.isArray(state.accent_categories)
    ? [...new Set(state.accent_categories.map(String).filter(Boolean))]
    : [];

  const presentation = {
    accent_categories: accents,
  };
  if (series) presentation.series_color = series;
  if (accent) presentation.accent_color = accent;
  if (targetLine) presentation.target_line_color = targetLine;
  if (targetSeries) presentation.target_series_color = targetSeries;
  if (typeof state.show_value_labels === 'boolean') {
    presentation.show_value_labels = state.show_value_labels;
  }
  if (typeof state.show_unit_label === 'boolean') {
    presentation.show_unit_label = state.show_unit_label;
  }
  return presentation;
}

/** Categories from a graph_spec (for accent checkboxes). */
export function listSpecCategories(graphSpec) {
  if (!graphSpec?.data) return [];
  if (Array.isArray(graphSpec.data.categories) && graphSpec.data.categories.length) {
    return graphSpec.data.categories.map(String);
  }
  const series = graphSpec.data.series?.[0];
  return (series?.values || []).map((v) => String(v.category));
}

export { HEX_RE };
