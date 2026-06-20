/**
 * group-split Phase C — 複数列名簿パース · 列マッピング
 * SSOT: docs/notes/GROUP_SPLIT_TOOL_SPEC.md §4 Phase C
 */

export const PHASE_C_ATTR_MAX = 3;

/** @typedef {'spread' | 'requireEach'} AttrRuleMode */

/**
 * @typedef {Object} AttrColumnRule
 * @property {number} columnIndex
 * @property {string} label
 * @property {boolean} spread
 * @property {string[]} requiredEach
 */

/**
 * @typedef {Object} ColumnMapping
 * @property {number} nameColumnIndex
 * @property {AttrColumnRule[]} attrRules
 */

/**
 * @typedef {Object} ParsedTable
 * @property {string[]} headers
 * @property {string[][]} rows
 * @property {boolean} hasHeader
 * @property {'tab' | 'comma'} delimiter
 */

/**
 * @param {string} line
 * @param {'tab' | 'comma'} delimiter
 */
function splitRow(line, delimiter) {
  if (delimiter === 'tab') {
    return String(line).split('\t').map((s) => s.trim());
  }
  return String(line).split(',').map((s) => s.trim());
}

/**
 * @param {string} line
 */
function detectDelimiter(line) {
  const tabs = (line.match(/\t/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  return tabs >= commas && tabs > 0 ? 'tab' : 'comma';
}

/**
 * @param {string[]} headers
 */
function looksLikeHeader(headers) {
  if (headers.length < 2) return false;
  const joined = headers.join(' ');
  return /氏名|名前|name|参加者|所属|部署|性別|年齢|部門|チーム|役職|クラス|グループ|メンバー/i.test(joined);
}

/**
 * @param {string} text
 * @returns {ParsedTable}
 */
export function parseTableText(text) {
  const raw = String(text ?? '').split(/\r?\n/);
  const nonEmpty = raw.map((l) => l.trim()).filter(Boolean);
  if (!nonEmpty.length) {
    return { headers: [], rows: [], hasHeader: false, delimiter: 'tab' };
  }

  const delimiter = detectDelimiter(nonEmpty[0]);
  const firstCells = splitRow(nonEmpty[0], delimiter);
  const hasHeader = looksLikeHeader(firstCells);
  const headers = hasHeader
    ? firstCells.map((h, i) => h || `列${i + 1}`)
    : firstCells.map((_, i) => `列${i + 1}`);
  const start = hasHeader ? 1 : 0;

  /** @type {string[][]} */
  const rows = [];
  for (let i = start; i < nonEmpty.length; i++) {
    const cells = splitRow(nonEmpty[i], delimiter);
    if (!cells.some(Boolean)) continue;
    while (cells.length < headers.length) cells.push('');
    rows.push(cells.slice(0, headers.length));
  }

  return { headers, rows, hasHeader, delimiter };
}

/**
 * @param {ParsedTable} table
 */
export function isMultiColumnTable(table) {
  return table.headers.length > 1 && table.rows.length > 0;
}

const NAME_HEADER_RE = /氏名|名前|参加者|メンバー|name/i;
const SKIP_ATTR_RE = /ひらがな|カタカナ|ふりがな|年齢|age|id|番号|no\.?$/i;

/**
 * @param {ParsedTable} table
 * @returns {ColumnMapping}
 */
export function guessColumnMapping(table) {
  const { headers } = table;
  let nameColumnIndex = 0;
  const nameIdx = headers.findIndex((h) => NAME_HEADER_RE.test(h));
  if (nameIdx >= 0) nameColumnIndex = nameIdx;

  /** @type {AttrColumnRule[]} */
  const attrRules = [];
  for (let i = 0; i < headers.length && attrRules.length < PHASE_C_ATTR_MAX; i++) {
    if (i === nameColumnIndex) continue;
    const label = headers[i];
    if (!label || SKIP_ATTR_RE.test(label)) continue;
    attrRules.push({
      columnIndex: i,
      label,
      spread: /所属|部署|性別|部門|チーム|department|gender/i.test(label),
      requiredEach: [],
    });
  }

  return { nameColumnIndex, attrRules };
}

/**
 * @param {ParsedTable} table
 * @param {ColumnMapping} mapping
 */
export function buildEntriesFromTable(table, mapping) {
  /** @type {import('./group-split-constraints.js').RosterEntry[]} */
  const entries = [];
  const dupMap = new Map();

  for (let ri = 0; ri < table.rows.length; ri++) {
    const cells = table.rows[ri];
    const name = String(cells[mapping.nameColumnIndex] ?? '').trim();
    if (!name) continue;

    /** @type {Record<string, string>} */
    const attrs = {};
    for (const rule of mapping.attrRules) {
      const v = String(cells[rule.columnIndex] ?? '').trim();
      if (v) attrs[rule.label] = v;
    }

    const legacyTag = mapping.attrRules.length ? (attrs[mapping.attrRules[0].label] || '') : '';
    entries.push({
      name,
      tag: legacyTag,
      attrs,
      line: ri + (table.hasHeader ? 2 : 1),
    });
    dupMap.set(name, (dupMap.get(name) || 0) + 1);
  }

  const duplicates = [...dupMap.entries()].filter(([, c]) => c > 1).map(([n]) => n);
  return { entries, duplicates, rawLineCount: table.rows.length };
}

/**
 * @param {string} text
 * @param {ColumnMapping | null} [mapping]
 */
export function parseRosterPhaseC(text, mapping = null) {
  const table = parseTableText(text);
  if (!isMultiColumnTable(table)) {
    return null;
  }
  const map = mapping || guessColumnMapping(table);
  const built = buildEntriesFromTable(table, map);
  return { table, mapping: map, ...built };
}

/**
 * @param {AttrColumnRule[]} attrRules
 */
export function attrRulesActive(attrRules) {
  return (attrRules || []).some((r) => r.spread || (r.requiredEach && r.requiredEach.length > 0));
}

/**
 * @param {import('./group-split-constraints.js').RosterEntry[]} entries
 * @param {AttrColumnRule[]} attrRules
 */
export function collectAttrValues(entries, attrRules) {
  /** @type {Record<string, string[]>} */
  const byLabel = {};
  for (const rule of attrRules) {
    const set = new Set();
    for (const e of entries) {
      const v = e.attrs?.[rule.label];
      if (v) set.add(v);
    }
    byLabel[rule.label] = [...set].sort();
  }
  return byLabel;
}

/**
 * UI からの属性ルール正規化
 * @param {Array<{ columnIndex: number, label: string, spread?: boolean, requiredEachText?: string }>} raw
 */
export function normalizeAttrRules(raw) {
  return (raw || [])
    .filter((r) => r && Number.isFinite(r.columnIndex) && r.label)
    .slice(0, PHASE_C_ATTR_MAX)
    .map((r) => {
      let requiredEach = [];
      if (Array.isArray(r.requiredEach)) {
        requiredEach = r.requiredEach.map((s) => String(s).trim()).filter(Boolean);
      } else {
        requiredEach = String(r.requiredEachText || '')
          .split(/[,、]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return {
        columnIndex: r.columnIndex,
        label: String(r.label).trim(),
        spread: !!r.spread,
        requiredEach,
      };
    });
}
