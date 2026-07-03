/**
 * 文字列正規化 — 純関数（T03 Phase A+ · Phase C 行整理）
 * SSOT: docs/notes/NORMALIZE_TEXT_TOOL_SPEC.md
 */

export const LINE_LIMIT = 500;

/** @typedef {{ enabled?: boolean, direction?: 'asc'|'desc', numeric?: boolean }} LineSortOps */
/** @typedef {{ enabled?: boolean, ignoreCaseWidth?: boolean }} LineDedupeOps */
/** @typedef {{ enabled?: boolean, keyword?: string, mode?: 'include'|'exclude' }} LineFilterOps */
/** @typedef {{ enabled?: boolean }} LineTrimOps */
/** @typedef {{ enabled?: boolean }} LineRemoveEmptyOps */
/** @typedef {{ sort?: LineSortOps, dedupe?: LineDedupeOps, filter?: LineFilterOps, trim?: LineTrimOps, removeEmpty?: LineRemoveEmptyOps }} LineOps */

/** @type {Record<string, { mode?: string, ascii: boolean, space: boolean, hyphen: boolean, toFullwidth?: boolean }>} */
export const PRESET_DEFAULTS = {
  ec_form: { mode: 'line', ascii: true, space: true, hyphen: false },
  csv_roster: { mode: 'line', ascii: true, space: true, hyphen: true },
  fullwidth_ascii: { mode: 'line', ascii: true, space: false, hyphen: false, toFullwidth: true },
  comma_join: { mode: 'comma_join', ascii: false, space: true, hyphen: false },
  sql_in: { mode: 'sql_in', ascii: true, space: true, hyphen: false },
  tab_to_comma: { mode: 'tab_to_comma', ascii: true, space: true, hyphen: false },
  name_trim: { mode: 'name_trim', ascii: true, space: false, hyphen: false },
  mask_email: { mode: 'mask_email', ascii: false, space: false, hyphen: false },
  mask_phone: { mode: 'mask_phone', ascii: false, space: false, hyphen: false },
  mask_name: { mode: 'mask_name', ascii: false, space: false, hyphen: false },
};

/** @typedef {{ email?: boolean, phone?: boolean, name?: boolean }} MaskOps */

/** @type {Set<string>} */
export const MASK_PRESETS = new Set(['mask_email', 'mask_phone', 'mask_name']);

const EMAIL_TOKEN_RE = /[A-Za-z0-9._%+\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\u30FC-]+@[A-Za-z0-9.\uFF10-\uFF19\uFF0E-]+\.[A-Za-z\uFF21-\uFF3A]{2,}/gi;

const PHONE_HYPHENATED_RE = /(\d{2,4})([-\u2010\u2212\uFF0D\s]?)(\d{4})([-\u2010\u2212\uFF0D\s]?)(\d{4})/g;

const HYPHEN_CHARS = new Set([
  '\u2010', '\u2011', '\u2012', '\u2013', '\u2014', '\u2015', '\u2212', '\uFF0D',
]);

const WHITESPACE_RE = /[\u3000\s]/g;

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
 * @param {string} line
 * @param {{ ascii: boolean, toFullwidth: boolean }} opts
 */
function transformAsciiOnly(line, opts) {
  if (!opts.ascii) return line;
  let out = '';
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    out += opts.toFullwidth ? toFullwidthChar(ch) : toHalfwidthChar(ch);
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
 * @param {string[]} lines
 * @param {{ ascii: boolean, space: boolean, toFullwidth: boolean }} opts
 * @param {{ splitTabs?: boolean }} [listOpts]
 */
function collectListItems(lines, opts, listOpts = {}) {
  const items = [];
  for (const line of lines) {
    const parts = listOpts.splitTabs && line.includes('\t') ? line.split('\t') : [line];
    for (const part of parts) {
      let t = transformAsciiOnly(part, opts);
      if (opts.space) t = t.trim();
      if (t.length) items.push(t);
    }
  }
  return items;
}

/**
 * @param {string} value
 */
function sqlQuoteLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * @param {string} line
 */
function dedupeKey(line) {
  return String(line).normalize('NFKC').toLowerCase();
}

/**
 * @param {string} line
 */
function parseNumericLine(line) {
  const t = String(line).trim();
  if (!t) return null;
  const n = Number(t.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string} a
 * @param {string} b
 * @param {boolean} numeric
 */
function compareLines(a, b, numeric) {
  if (numeric) {
    const na = parseNumericLine(a);
    const nb = parseNumericLine(b);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
  }
  return a.localeCompare(b, 'ja');
}

/**
 * @param {LineOps} [lineOps]
 */
export function hasLineOps(lineOps) {
  if (!lineOps) return false;
  return !!(
    lineOps.sort?.enabled
    || lineOps.dedupe?.enabled
    || lineOps.filter?.enabled
    || lineOps.trim?.enabled
    || lineOps.removeEmpty?.enabled
  );
}

/**
 * 行フィルタ → 重複削除 → ソート（固定順）
 * @param {string[]} lines
 * @param {LineOps} [lineOps]
 * @returns {{ lines: string[], stats: { filteredRemoved: number, dedupeRemoved: number, emptyRemoved: number } }}
 */
export function applyLineOperations(lines, lineOps) {
  const emptyStats = { filteredRemoved: 0, dedupeRemoved: 0, emptyRemoved: 0 };
  if (!hasLineOps(lineOps)) {
    return { lines, stats: emptyStats };
  }

  let out = [...lines];
  const stats = { filteredRemoved: 0, dedupeRemoved: 0, emptyRemoved: 0 };

  if (lineOps.trim?.enabled) {
    out = out.map((line) => line.trim());
  }

  const filter = lineOps.filter;
  if (filter?.enabled && filter.keyword) {
    const kw = String(filter.keyword);
    const mode = filter.mode === 'exclude' ? 'exclude' : 'include';
    const before = out.length;
    out = out.filter((line) => {
      const has = line.includes(kw);
      return mode === 'include' ? has : !has;
    });
    stats.filteredRemoved = before - out.length;
  }

  if (lineOps.removeEmpty?.enabled) {
    const before = out.length;
    out = out.filter((line) => line.length > 0);
    stats.emptyRemoved = before - out.length;
  }

  const dedupe = lineOps.dedupe;
  if (dedupe?.enabled) {
    const seen = new Set();
    const before = out.length;
    out = out.filter((line) => {
      const key = dedupe.ignoreCaseWidth ? dedupeKey(line) : line;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    stats.dedupeRemoved = before - out.length;
  }

  const sort = lineOps.sort;
  if (sort?.enabled) {
    const dir = sort.direction === 'desc' ? -1 : 1;
    const numeric = !!sort.numeric;
    out = [...out].sort((a, b) => dir * compareLines(a, b, numeric));
  }

  return { lines: out, stats };
}

/**
 * メール伏字 — ローカル部先頭1–2文字 + *** + @domain
 * @param {string} email
 */
export function maskEmailLocal(email) {
  const at = email.lastIndexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const keep = local.length >= 2 ? 2 : 1;
  return `${local.slice(0, keep)}***${domain}`;
}

/**
 * @param {string} line
 */
export function maskEmailInLine(line) {
  EMAIL_TOKEN_RE.lastIndex = 0;
  return line.replace(EMAIL_TOKEN_RE, (m) => maskEmailLocal(m));
}

/**
 * @param {string} line
 */
export function maskPhoneInLine(line) {
  const trimmed = line.trim();
  let out = line.replace(PHONE_HYPHENATED_RE, (full, head, sep1, _mid, sep2, tail) => (
    `${head}${sep1}****${sep2}${tail}`
  ));
  if (out === line && /^\d{10,11}$/.test(trimmed)) {
    if (trimmed.length === 11) return trimmed.slice(0, 3) + '****' + trimmed.slice(7);
    return trimmed.slice(0, 2) + '****' + trimmed.slice(6);
  }
  return out;
}

/**
 * 姓名の2文字目以降を *
 * @param {string} part
 */
export function maskNamePart(part) {
  const chars = [...part];
  if (chars.length <= 1) return part;
  return chars[0] + '*'.repeat(chars.length - 1);
}

/**
 * @param {string} line
 */
export function maskNameInLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return line;
  const parts = trimmed.split(/[\u3000\s]+/);
  if (parts.length >= 2) {
    const masked = parts.map(maskNamePart).join(' ');
    return line.replace(trimmed, masked);
  }
  return line.replace(trimmed, maskNamePart(trimmed));
}

/**
 * @param {string[]} beforeLines
 * @param {string[]} afterLines
 */
export function countMaskedLines(beforeLines, afterLines) {
  let n = 0;
  const len = Math.max(beforeLines.length, afterLines.length);
  for (let i = 0; i < len; i += 1) {
    if ((beforeLines[i] ?? '') !== (afterLines[i] ?? '')) n += 1;
  }
  return n;
}

export function hasMaskOps(maskOps) {
  if (!maskOps) return false;
  return !!(maskOps.email || maskOps.phone || maskOps.name);
}

/**
 * 1行に有効な伏字を順に適用（メール → 電話 → 氏名）
 * @param {string} line
 * @param {MaskOps} maskOps
 */
export function applyMaskInLine(line, maskOps) {
  let out = line;
  if (maskOps.email) out = maskEmailInLine(out);
  if (maskOps.phone) out = maskPhoneInLine(out);
  if (maskOps.name) out = maskNameInLine(out);
  return out;
}

/**
 * @param {{ maskOps?: MaskOps, preset?: string }} config
 * @returns {MaskOps}
 */
export function resolveMaskOps(config) {
  if (config.maskOps && hasMaskOps(config.maskOps)) return config.maskOps;
  const preset = config.preset || '';
  if (MASK_PRESETS.has(preset)) {
    return {
      email: preset === 'mask_email',
      phone: preset === 'mask_phone',
      name: preset === 'mask_name',
    };
  }
  return config.maskOps || {};
}

/**
 * 伏字プリセット id は用途プリセットと別扱い（後方互換）
 * @param {string} preset
 */
export function resolveTransformPreset(preset) {
  if (MASK_PRESETS.has(preset)) return 'ec_form';
  return preset && PRESET_DEFAULTS[preset] ? preset : 'ec_form';
}

/**
 * @param {string[]} lines
 * @param {MaskOps} maskOps
 */
export function applyMaskToLines(lines, maskOps) {
  if (!hasMaskOps(maskOps)) {
    return { lines, maskStats: { maskedLines: 0 } };
  }
  const outLines = lines.map((line) => applyMaskInLine(line, maskOps));
  return {
    lines: outLines,
    maskStats: { maskedLines: countMaskedLines(lines, outLines) },
  };
}

/**
 * @param {{ maskStats?: { maskedLines: number }, maskOpsApplied?: boolean }} result
 */
export function formatMaskBanner(result) {
  const n = result.maskStats?.maskedLines ?? 0;
  if (n <= 0 || !result.maskOpsApplied) return '';
  return `${n} 行に伏字を適用しました（行数は変わりません）`;
}

/**
 * @param {string} input
 * @param {{ preset?: string, toggles?: Partial<{ ascii: boolean, space: boolean, hyphen: boolean }>, lineOps?: LineOps, maskOps?: MaskOps }} [config]
 */
export function normalizeText(input, config = {}) {
  const maskOps = resolveMaskOps(config);
  const preset = resolveTransformPreset(config.preset || 'ec_form');
  const defs = PRESET_DEFAULTS[preset];
  const toggles = config.toggles || {};
  const opts = {
    ascii: toggles.ascii ?? defs.ascii,
    space: toggles.space ?? defs.space,
    hyphen: toggles.hyphen ?? defs.hyphen,
    toFullwidth: defs.toFullwidth ?? false,
  };
  const mode = defs.mode || 'line';

  const normalizedInput = String(input ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalizedInput.split('\n');
  const { lines, stats: lineOpsStats } = applyLineOperations(rawLines, config.lineOps);
  const lineOpsBase = {
    lineOpsStats,
    lineOpsAfterLines: lines.length,
    lineOpsApplied: hasLineOps(config.lineOps),
    maskOpsApplied: hasMaskOps(maskOps),
  };

  if (mode === 'comma_join') {
    const { lines: maskedLines, maskStats } = applyMaskToLines(lines, maskOps);
    const items = collectListItems(maskedLines, opts);
    const output = items.join(',');
    return {
      output,
      inputLines: rawLines.length,
      outputLines: output ? 1 : 0,
      lineCountMatch: rawLines.length === (output ? 1 : 0),
      changeCount: countChanges(normalizedInput, output),
      preset,
      opts,
      mode,
      maskStats,
      ...lineOpsBase,
    };
  }

  if (mode === 'sql_in') {
    const { lines: maskedLines, maskStats } = applyMaskToLines(lines, maskOps);
    const items = collectListItems(maskedLines, opts, { splitTabs: true });
    const output = items.map(sqlQuoteLiteral).join(', ');
    return {
      output,
      inputLines: rawLines.length,
      outputLines: output ? 1 : 0,
      lineCountMatch: rawLines.length === (output ? 1 : 0),
      changeCount: countChanges(normalizedInput, output),
      preset,
      opts,
      mode,
      maskStats,
      ...lineOpsBase,
    };
  }

  if (mode === 'tab_to_comma') {
    const { lines: maskedLines, maskStats } = applyMaskToLines(lines, maskOps);
    const items = collectListItems(maskedLines, opts, { splitTabs: true });
    const output = items.join(',');
    return {
      output,
      inputLines: rawLines.length,
      outputLines: output ? 1 : 0,
      lineCountMatch: rawLines.length === (output ? 1 : 0),
      changeCount: countChanges(normalizedInput, output),
      preset,
      opts,
      mode,
      maskStats,
      ...lineOpsBase,
    };
  }

  if (mode === 'name_trim') {
    const outLines = lines.map((line) => {
      const asciiLine = transformAsciiOnly(line, opts);
      return asciiLine.replace(WHITESPACE_RE, '');
    });
    const { lines: maskedOut, maskStats } = applyMaskToLines(outLines, maskOps);
    const output = maskedOut.join('\n');
    return {
      output,
      inputLines: rawLines.length,
      outputLines: maskedOut.length,
      lineCountMatch: rawLines.length === maskedOut.length,
      changeCount: countChanges(normalizedInput, output),
      preset,
      opts,
      mode,
      maskStats,
      ...lineOpsBase,
    };
  }

  const outLines = lines.map((line) => transformLine(line, opts));
  const { lines: maskedOut, maskStats } = applyMaskToLines(outLines, maskOps);
  const output = maskedOut.join('\n');

  return {
    output,
    inputLines: rawLines.length,
    outputLines: maskedOut.length,
    lineCountMatch: rawLines.length === maskedOut.length,
    changeCount: countChanges(normalizedInput, output),
    preset,
    opts,
    mode,
    maskStats,
    ...lineOpsBase,
  };
}

/**
 * 行整理の黄バナー文案（UI 用）
 * @param {{ inputLines: number, lineOpsAfterLines?: number, lineOpsStats?: { filteredRemoved: number, dedupeRemoved: number, emptyRemoved: number } }} result
 */
export function formatLineOpsBanner(result) {
  const stats = result.lineOpsStats || { filteredRemoved: 0, dedupeRemoved: 0, emptyRemoved: 0 };
  const { filteredRemoved, dedupeRemoved, emptyRemoved } = stats;
  if (filteredRemoved <= 0 && dedupeRemoved <= 0 && emptyRemoved <= 0) return '';

  const parts = [];
  if (filteredRemoved > 0) {
    parts.push(`フィルタで ${filteredRemoved} 行を除外`);
  }
  if (emptyRemoved > 0) {
    parts.push(`空行を ${emptyRemoved} 行削除`);
  }
  if (dedupeRemoved > 0) {
    parts.push(`重複行を ${dedupeRemoved} 件削除`);
  }
  const after = result.lineOpsAfterLines ?? result.inputLines;
  return `${parts.join(' · ')}（${result.inputLines} 行 → ${after} 行）`;
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
 * 先頭 N 行の Before/After ペア（プレビュー差分用）
 * @param {string} beforeText
 * @param {string} afterText
 * @param {number} [limit]
 */
export function buildPreviewDiff(beforeText, afterText, limit = 5) {
  const beforeLines = String(beforeText ?? '').split('\n').slice(0, limit);
  const afterLines = String(afterText ?? '').split('\n').slice(0, limit);
  const count = Math.max(beforeLines.length, afterLines.length);
  /** @type {Array<{ before: string, after: string, changed: boolean }>} */
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const before = beforeLines[i] ?? '';
    const after = afterLines[i] ?? '';
    rows.push({ before, after, changed: before !== after });
  }
  return rows;
}

/**
 * 1行内の変更箇所を <mark> でハイライト（XSS エスケープ済み HTML）
 * @param {string} before
 * @param {string} after
 */
export function highlightLineDiffHtml(before, after) {
  const esc = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  if (before === after) return esc(after);
  const maxLen = Math.max(before.length, after.length);
  let html = '';
  let inMark = false;
  for (let i = 0; i < maxLen; i += 1) {
    const bc = before[i] ?? '';
    const ac = after[i] ?? '';
    const diff = bc !== ac;
    if (diff && !inMark) {
      html += '<mark class="norm-diff-mark">';
      inMark = true;
    } else if (!diff && inMark) {
      html += '</mark>';
      inMark = false;
    }
    if (ac) html += esc(ac);
  }
  if (inMark) html += '</mark>';
  return html || esc(after);
}

/**
 * @param {string} text
 */
export function hasLeadingZeroCodes(text) {
  return String(text ?? '')
    .split('\n')
    .some((line) => /^0\d/.test(line.trim()));
}
