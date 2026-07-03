/**
 * CSV / ファイル文字コード — fair-draw · table-conv 共有
 * SSOT: LOTTERY_PRIZE_LAW_TOOL_SPEC.md §4-1b · TABLE_CONV_TOOL_SPEC.md §3-4
 */

export const DEFAULT_ROW_LIMIT = 5000;

const DISPLAY_NAME_HEADERS = /^(表示名|ニックネーム|display\s*name)$/i;
const USERNAME_HEADERS = /^(ユーザー名|user\s*name|username)$/i;
const EMAIL_HEADERS = /^(メールアドレス|e-?mail|mail)$/i;

/**
 * @param {string} text
 */
export function normalizeNewlines(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * @param {string} sample
 */
export function detectDelimiter(sample) {
  const firstLine = normalizeNewlines(sample).split('\n').find((l) => l.trim()) || '';
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  if (tabs > commas) return '\t';
  return ',';
}

/**
 * @param {string} line
 * @param {string} delimiter
 */
export function parseCsvLine(line, delimiter = ',') {
  /** @type {string[]} */
  const result = [];
  let cur = '';
  let inQuotes = false;
  const s = String(line);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map((c) => c.trim());
}

/**
 * @param {string[]} cells
 */
export function looksLikeCsvHeader(cells) {
  if (cells.length < 2) return false;
  const joined = cells.join(' ');
  return /表示名|ユーザー名|メール|受付|ステータス|ニックネーム|名前|氏名|name|email|status|参加者/i.test(joined);
}

/**
 * @typedef {Object} ParsedCsvTable
 * @property {string[]} headers
 * @property {string[][]} rows
 * @property {boolean} hasHeader
 * @property {string} delimiter
 * @property {number[]} skippedRowNumbers 1-based data row numbers skipped (parse issues)
 */

/**
 * @param {string} text
 * @param {{ delimiter?: string, hasHeader?: boolean | null }} [options]
 * @returns {ParsedCsvTable}
 */
export function parseCsvText(text, options = {}) {
  const delimiter = options.delimiter || detectDelimiter(text);
  const lines = normalizeNewlines(text).split('\n').filter((l) => l.length > 0);
  if (!lines.length) {
    return { headers: [], rows: [], hasHeader: false, delimiter, skippedRowNumbers: [] };
  }

  const firstCells = parseCsvLine(lines[0], delimiter);
  const hasHeader = options.hasHeader === false
    ? false
    : (options.hasHeader === true || looksLikeCsvHeader(firstCells));
  const headers = hasHeader
    ? firstCells.map((h, i) => h.trim() || `列${i + 1}`)
    : firstCells.map((_, i) => `列${i + 1}`);
  const start = hasHeader ? 1 : 0;

  /** @type {string[][]} */
  const rows = [];
  /** @type {number[]} */
  const skippedRowNumbers = [];

  for (let i = start; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i], delimiter);
    if (!cells.some((c) => c.trim())) continue;
    if (cells.length > headers.length + 2) {
      skippedRowNumbers.push(i + 1);
      continue;
    }
    while (cells.length < headers.length) cells.push('');
    rows.push(cells.slice(0, headers.length).map((c) => c.trim()));
  }

  return { headers, rows, hasHeader, delimiter, skippedRowNumbers };
}

/**
 * @param {string[]} headers
 */
export function guessDrawColumnIndex(headers) {
  for (let i = 0; i < headers.length; i++) {
    if (DISPLAY_NAME_HEADERS.test(String(headers[i]).trim())) return i;
  }
  for (let i = 0; i < headers.length; i++) {
    if (USERNAME_HEADERS.test(String(headers[i]).trim())) return i;
  }
  for (let i = 0; i < headers.length; i++) {
    if (!EMAIL_HEADERS.test(String(headers[i]).trim())) return i;
  }
  return 0;
}

/**
 * @param {string} header
 */
export function isEmailColumnHeader(header) {
  return EMAIL_HEADERS.test(String(header || '').trim());
}

/**
 * @param {ParsedCsvTable} parsed
 * @param {number} columnIndex
 * @param {number} [limit]
 */
export function extractColumnLines(parsed, columnIndex, limit = DEFAULT_ROW_LIMIT) {
  /** @type {string[]} */
  const all = [];
  for (const row of parsed.rows) {
    const v = String(row[columnIndex] ?? '').trim();
    if (v) all.push(v);
  }
  const truncated = all.length > limit;
  return {
    lines: all.slice(0, limit),
    truncated,
    sourceCount: all.length,
  };
}

/**
 * @param {ArrayBuffer} buf
 * @param {'utf-8' | 'shift-jis'} encoding
 */
export function decodeArrayBuffer(buf, encoding = 'utf-8') {
  const dec = new TextDecoder(encoding === 'shift-jis' ? 'shift-jis' : 'utf-8');
  let text = dec.decode(buf);
  if (encoding === 'utf-8' && text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  return text;
}

/**
 * @param {File} file
 * @param {'utf-8' | 'shift-jis'} encoding
 */
export async function readFileText(file, encoding = 'utf-8') {
  const buf = await file.arrayBuffer();
  return decodeArrayBuffer(buf, encoding);
}

/**
 * @param {string} text
 */
export function looksLikeMojibake(text) {
  const sample = String(text).slice(0, 4000);
  const rep = (sample.match(/\uFFFD/g) || []).length;
  if (rep > 2) return true;
  const bad = (sample.match(/[縺繧繝蜈繧ｯ繝ｼ]/g) || []).length;
  return bad > 4 && bad / Math.max(sample.length, 1) > 0.015;
}

/**
 * @param {string} text
 */
export function countReplacementChars(text) {
  return (String(text).match(/\uFFFD/g) || []).length;
}
