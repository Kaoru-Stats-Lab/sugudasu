/**
 * 表データ相互コンバータ — コアロジック（PoC / Q3）
 * SSOT: docs/notes/TABLE_CONV_TOOL_SPEC.md
 */

import { parseCsvText, normalizeNewlines, countReplacementChars } from './sg-csv-import.js';
import { parseTableText } from './group-split-columns.js';

export const ROW_LIMIT = 5000;
export const SIZE_LIMIT_BYTES = 2 * 1024 * 1024;

/**
 * @param {string} text
 * @param {{ hasHeader?: boolean }} [opts]
 */
export function parseInputTable(text, opts = {}) {
  const normalized = normalizeNewlines(text);
  const wantHeader = opts.hasHeader !== false;
  if (!normalized.trim()) {
    return {
      headers: [],
      rows: [],
      hasHeader: false,
      delimiter: 'tab',
      skippedRowNumbers: [],
      singleColumn: true,
    };
  }

  const delimiterHint = normalized.includes('\t') ? 'tab' : 'comma';
  let table;

  if (delimiterHint === 'tab') {
    table = parseTableText(normalized);
    if (!wantHeader && table.hasHeader) {
      const firstRow = table.headers.map((h, i) => h || `列${i + 1}`);
      table = {
        headers: firstRow.map((_, i) => `列${i + 1}`),
        rows: [firstRow, ...table.rows],
        hasHeader: false,
        delimiter: 'tab',
      };
    }
    if (wantHeader && !table.hasHeader && table.rows.length) {
      const first = table.rows[0];
      table = {
        headers: first.map((h, i) => h || `列${i + 1}`),
        rows: table.rows.slice(1),
        hasHeader: true,
        delimiter: 'tab',
      };
    }
  } else {
    const csv = parseCsvText(normalized, {
      hasHeader: wantHeader,
    });
    table = { ...csv, delimiter: csv.delimiter === '\t' ? 'tab' : 'comma' };
  }

  const singleColumn = table.headers.length <= 1 && table.rows.every((r) => r.length <= 1);
  return { ...table, singleColumn, skippedRowNumbers: table.skippedRowNumbers || [] };
}

/**
 * @param {string} cell
 */
function escapeMdCell(cell) {
  return String(cell ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

/**
 * @param {{ headers: string[], rows: string[][] }} table
 */
export function toMarkdownTable(table) {
  const { headers, rows } = table;
  if (!headers.length) return '';
  const head = `| ${headers.map(escapeMdCell).join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${headers.map((_, i) => escapeMdCell(r[i])).join(' | ')} |`);
  return [head, sep, ...body].join('\n');
}

/**
 * @param {{ headers: string[], rows: string[][], hasHeader?: boolean }} table
 */
export function toJsonArray(table) {
  const { headers, rows, hasHeader } = table;
  if (hasHeader === false) {
    return JSON.stringify(rows, null, 2);
  }
  const objs = rows.map((row) => {
    /** @type {Record<string, string>} */
    const o = {};
    headers.forEach((h, i) => {
      o[h || `列${i + 1}`] = String(row[i] ?? '');
    });
    return o;
  });
  return JSON.stringify(objs, null, 2);
}

/**
 * @param {string[][]} rows
 * @param {string} delimiter
 */
function joinDelimited(rows, delimiter) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          if (s.includes('"') || s.includes(delimiter) || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(delimiter),
    )
    .join('\n');
}

/**
 * @param {{ headers: string[], rows: string[][], hasHeader?: boolean }} table
 */
export function toCsvText(table, withBom = false) {
  const lines = table.hasHeader !== false
    ? [table.headers, ...table.rows]
    : table.rows;
  const body = joinDelimited(lines, ',');
  return withBom ? `\uFEFF${body}` : body;
}

/**
 * @param {{ headers: string[], rows: string[][], hasHeader?: boolean }} table
 */
export function toTsvText(table) {
  const lines = table.hasHeader !== false
    ? [table.headers, ...table.rows]
    : table.rows;
  return joinDelimited(lines, '\t');
}

/**
 * @param {{ rows: string[][] }} table
 * @param {number} [limit]
 */
export function assessTableLimits(table, limit = ROW_LIMIT) {
  const rowCount = table.rows.length;
  return {
    rowCount,
    columnCount: table.headers?.length || 0,
    overRowLimit: rowCount > limit,
    limit,
  };
}

/**
 * @param {string} text
 */
export function scanEncodingIssues(text) {
  const rep = countReplacementChars(text);
  return {
    replacementCharCount: rep,
    hasIssue: rep > 0,
    message: rep > 0 ? `置換文字（）が ${rep} 箇所あります。Shift-JIS で再読み込みするか、元データを確認してください。` : '',
  };
}
