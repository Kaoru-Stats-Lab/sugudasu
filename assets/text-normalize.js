/**
 * 文字列正規化 — 純関数（T03 Phase A）
 * SSOT: docs/notes/NORMALIZE_TEXT_TOOL_SPEC.md
 */

export const LINE_LIMIT = 500;

/** @type {Record<string, { ascii: boolean, space: boolean, hyphen: boolean, toFullwidth?: boolean }>} */
export const PRESET_DEFAULTS = {
  ec_form: { ascii: true, space: true, hyphen: false },
  csv_roster: { ascii: true, space: true, hyphen: true },
  fullwidth_ascii: { ascii: true, space: false, hyphen: false, toFullwidth: true },
};

const HYPHEN_CHARS = new Set([
  '\u2010', '\u2011', '\u2012', '\u2013', '\u2014', '\u2015', '\u2212', '\uFF0D',
]);

/**
 * @param {string} text
 */
export function countLines(text) {
  if (text == null || text === '') return 0;
  return text.split('\n').length;
}

/**
 * @param {string} text
 */
export function isOverLineLimit(text) {
  return countLines(text) > LINE_LIMIT;
}

/**
 * @param {string} ch
 */
function isKatakana(ch) {
  const c = ch.charCodeAt(0);
  return c >= 0x30a0 && c <= 0x30ff;
}

/**
 * @param {string} ch
 */
function toHalfwidthChar(ch) {
  const code = ch.charCodeAt(0);
  if (code >= 0xff01 && code <= 0xff5e) {
    return String.fromCharCode(code - 0xfee0);
  }
  if (code >= 0xff10 && code <= 0xff19) {
    return String.fromCharCode(code - 0xfee0);
  }
  return ch;
}

/**
 * @param {string} ch
 */
function toFullwidthChar(ch) {
  const code = ch.charCodeAt(0);
  if (code >= 0x21 && code <= 0x7e) {
    return String.fromCharCode(code + 0xfee0);
  }
  return ch;
}

/**
 * @param {string} line
 * @param {{ ascii: boolean, space: boolean, hyphen: boolean, toFullwidth: boolean }} opts
 */
function transformLine(line, opts) {
  let out = '';
  for (let i = 0; i < line.length; i += 1) {
    let ch = line[i];
    if (opts.ascii) {
      ch = opts.toFullwidth ? toFullwidthChar(ch) : toHalfwidthChar(ch);
    }
    if (opts.space && ch === '\u3000') {
      ch = ' ';
    }
    if (opts.hyphen) {
      if (ch === '\u30fc' && i > 0 && isKatakana(line[i - 1])) {
        out += ch;
        continue;
      }
      if (HYPHEN_CHARS.has(ch)) {
        ch = '-';
      }
    }
    out += ch;
  }
  if (opts.space) {
    out = out.trim();
  }
  return out;
}

/**
 * @param {string} before
 * @param {string} after
 */
export function countChanges(before, after) {
  if (before === after) return 0;
  let n = 0;
  const maxLen = Math.max(before.length, after.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (before[i] !== after[i]) n += 1;
  }
  return n;
}

/**
 * @param {string} input
 * @param {{ preset?: string, toggles?: Partial<{ ascii: boolean, space: boolean, hyphen: boolean }> }} [config]
 */
export function normalizeText(input, config = {}) {
  const preset = config.preset && PRESET_DEFAULTS[config.preset]
    ? config.preset
    : 'ec_form';
  const defs = PRESET_DEFAULTS[preset];
  const toggles = config.toggles || {};
  const opts = {
    ascii: toggles.ascii ?? defs.ascii,
    space: toggles.space ?? defs.space,
    hyphen: toggles.hyphen ?? defs.hyphen,
    toFullwidth: defs.toFullwidth ?? false,
  };

  const normalizedInput = String(input ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedInput.split('\n');
  const outLines = lines.map((line) => transformLine(line, opts));
  const output = outLines.join('\n');

  return {
    output,
    inputLines: lines.length,
    outputLines: outLines.length,
    lineCountMatch: lines.length === outLines.length,
    changeCount: countChanges(normalizedInput, output),
    preset,
    opts,
  };
}

/**
 * @param {string} text
 * @param {number} [limit]
 */
export function previewLines(text, limit = 5) {
  const lines = String(text ?? '').split('\n');
  return lines.slice(0, limit);
}

/**
 * @param {string} text
 */
export function hasLeadingZeroCodes(text) {
  return String(text ?? '')
    .split('\n')
    .some((line) => /^0\d/.test(line.trim()));
}
