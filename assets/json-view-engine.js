/**
 * json-view — parse · tree flatten · search (no DOM)
 * V1: 仮想スクロールなし · 遅延展開のみ
 */

/** @typedef {'string'|'number'|'boolean'|'null'|'array'|'object'} JsonValueType */

/**
 * @param {unknown} val
 * @returns {JsonValueType}
 */
export function getValueType(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return /** @type {JsonValueType} */ (typeof val);
}

/** @param {JsonValueType|string} type */
export function typeLabel(type) {
  switch (type) {
    case 'string': return '文字';
    case 'number': return '数値';
    case 'boolean': return '真偽';
    case 'null': return '空';
    case 'array': return '配列';
    case 'object': return 'オブジェクト';
    case 'notice': return '';
    default: return String(type);
  }
}

/**
 * 内部キー（展開集合用）
 * @param {Array<string|number>} segments
 * @returns {string}
 */
export function pathToString(segments) {
  if (!segments.length) return '';
  let out = '';
  for (const seg of segments) {
    if (typeof seg === 'number') {
      out += `[${seg}]`;
    } else if (!out) {
      out = seg;
    } else {
      out += `.${seg}`;
    }
  }
  return out;
}

/**
 * 人間向け PathBar 表示: data > users[5] > email
 * @param {Array<string|number>} segments
 * @returns {string}
 */
export function pathToBreadcrumb(segments) {
  if (!segments.length) return '(ルート)';
  const parts = [];
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    if (typeof seg === 'number') {
      if (!parts.length) parts.push(`[${seg}]`);
      else parts[parts.length - 1] += `[${seg}]`;
    } else {
      parts.push(seg);
    }
  }
  return parts.join(' > ');
}

/**
 * 機械向けコピー: $.data.users[5].email
 * @param {Array<string|number>} segments
 * @returns {string}
 */
export function toJsonPath(segments) {
  if (!segments.length) return '$';
  return `$.${pathToString(segments)}`;
}

/**
 * @param {Array<string|number>} segments
 * @returns {Set<string>}
 */
export function expandPathsForSegments(segments) {
  const next = new Set(['']);
  let acc = '';
  for (const seg of segments) {
    if (typeof seg === 'number') acc += `[${seg}]`;
    else acc = acc ? `${acc}.${seg}` : seg;
    next.add(acc);
  }
  return next;
}

/**
 * @param {unknown} val
 * @param {JsonValueType} type
 * @param {number} [maxLen]
 */
export function formatPreview(val, type, maxLen = 80) {
  if (type === 'null') return '空';
  if (type === 'string') {
    const s = String(val);
    const quoted = `"${s}"`;
    return quoted.length > maxLen ? `${quoted.slice(0, maxLen - 1)}…` : quoted;
  }
  if (type === 'number' || type === 'boolean') return String(val);
  if (type === 'array') return `[${/** @type {unknown[]} */ (val).length}件]`;
  if (type === 'object') {
    const n = Object.keys(/** @type {Record<string, unknown>} */ (val)).length;
    return `{${n}件}`;
  }
  return String(val);
}

/**
 * @param {string} text
 * @param {unknown} err
 * @returns {{ line: number|null, message: string }}
 */
export function formatParseError(text, err) {
  const msg = err instanceof Error ? err.message : String(err);
  let line = null;
  const m = msg.match(/position\s+(\d+)/i) || msg.match(/at position\s+(\d+)/i);
  if (m) {
    const pos = Number(m[1]);
    if (Number.isFinite(pos) && pos >= 0) {
      line = text.slice(0, pos).split(/\r\n|\r|\n/).length;
    }
  }
  const lineMatch = msg.match(/line\s+(\d+)/i);
  if (line == null && lineMatch) line = Number(lineMatch[1]);

  const short = msg.replace(/^JSON\.parse:\s*/i, '').slice(0, 80);
  if (line != null) {
    return {
      line,
      message: `${line}行目: ${short}\nこの付近を確認してください。`,
    };
  }
  return {
    line: null,
    message: `${short || 'JSONとして読み取れません。'}\nこの付近を確認してください。`,
  };
}

/**
 * @param {string} text
 * @returns {{ ok: true, value: unknown } | { ok: false, error: string, line: number|null }}
 */
export function parseJson(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: 'JSONを貼り付けてください。', line: null };
  }
  try {
    const value = JSON.parse(trimmed);
    return { ok: true, value };
  } catch (err) {
    const formatted = formatParseError(trimmed, err);
    return { ok: false, error: formatted.message, line: formatted.line };
  }
}

/**
 * @typedef {object} SearchMatch
 * @property {Array<string|number>} segments
 * @property {string} path
 * @property {string|null} key
 * @property {JsonValueType} type
 * @property {'key'|'value'} kind
 */

/**
 * キー・値の両方を部分一致（DFS順）
 * @param {unknown} value
 * @param {string} query
 * @returns {SearchMatch[]}
 */
export function collectSearchMatches(value, query) {
  const q = query.trim().toLowerCase();
  /** @type {SearchMatch[]} */
  const out = [];
  if (!q) return out;

  /**
   * @param {unknown} val
   * @param {Array<string|number>} segments
   * @param {string|null} key
   */
  function walk(val, segments, key) {
    const type = getValueType(val);
    if (key != null && key.toLowerCase().includes(q)) {
      out.push({
        segments: [...segments],
        path: pathToString(segments),
        key,
        type,
        kind: 'key',
      });
    }
    if (type !== 'object' && type !== 'array') {
      const raw = type === 'string' ? String(val) : JSON.stringify(val);
      if (raw.toLowerCase().includes(q)) {
        out.push({
          segments: [...segments],
          path: pathToString(segments),
          key,
          type,
          kind: 'value',
        });
      }
    }

    if (type === 'object') {
      for (const [k, child] of Object.entries(/** @type {Record<string, unknown>} */ (val))) {
        walk(child, [...segments, k], k);
      }
    } else if (type === 'array') {
      /** @type {unknown[]} */ (val).forEach((child, i) => {
        walk(child, [...segments, i], String(i));
      });
    }
  }

  walk(value, [], null);
  return out;
}

/** 展開時に DOM へ出す配列要素の上限（クラッシュ防止 · V1） */
export const ARRAY_CHILD_CAP = 200;

/**
 * @typedef {object} TreeRow
 * @property {Array<string|number>} segments
 * @property {string} path
 * @property {string|null} key
 * @property {unknown} value
 * @property {JsonValueType|'notice'} type
 * @property {number} depth
 * @property {boolean} hasChildren
 * @property {boolean} expanded
 * @property {boolean} match
 * @property {boolean} [isNotice]
 * @property {boolean} [hasSearchExtras]
 */

/**
 * 親配列 path 配下で、展開集合に含まれるインデックスを拾う
 * @param {string} parentPath
 * @param {Set<string>} expandedPaths
 * @returns {Set<number>}
 */
function indicesRequiredByExpand(parentPath, expandedPaths) {
  /** @type {Set<number>} */
  const out = new Set();
  const prefix = parentPath ? `${parentPath}[` : '[';
  for (const p of expandedPaths) {
    if (!p.startsWith(prefix)) continue;
    const rest = p.slice(prefix.length);
    const m = rest.match(/^(\d+)/);
    if (m) out.add(Number(m[1]));
  }
  return out;
}

/**
 * @param {unknown} root
 * @param {Set<string>} expandedPaths
 * @param {string} query
 * @returns {TreeRow[]}
 */
export function flattenVisible(root, expandedPaths, query) {
  const q = query.trim().toLowerCase();
  /** @type {TreeRow[]} */
  const rows = [];

  /**
   * @param {unknown} val
   * @param {Array<string|number>} segments
   * @param {string|null} key
   * @param {number} depth
   */
  function visit(val, segments, key, depth) {
    const type = getValueType(val);
    const path = pathToString(segments);
    const hasChildren = type === 'object' || type === 'array';
    const expanded = hasChildren && expandedPaths.has(path);
    let match = false;

    if (q) {
      if (key != null && key.toLowerCase().includes(q)) match = true;
      if (!hasChildren) {
        const raw = type === 'string' ? String(val) : JSON.stringify(val);
        if (raw.toLowerCase().includes(q)) match = true;
      }
    }

    rows.push({
      segments,
      path,
      key,
      value: val,
      type,
      depth,
      hasChildren,
      expanded,
      match,
    });

    if (!expanded || !hasChildren) return;

    if (type === 'object') {
      for (const [k, child] of Object.entries(/** @type {Record<string, unknown>} */ (val))) {
        visit(child, [...segments, k], k, depth + 1);
      }
      return;
    }

    const arr = /** @type {unknown[]} */ (val);
    /** @type {Set<number>} */
    const show = new Set();
    const head = Math.min(arr.length, ARRAY_CHILD_CAP);
    for (let i = 0; i < head; i += 1) show.add(i);
    for (const i of indicesRequiredByExpand(path, expandedPaths)) {
      if (i >= 0 && i < arr.length) show.add(i);
    }

    const sorted = [...show].sort((a, b) => a - b);
    const hasSearchExtras = sorted.some((i) => i >= ARRAY_CHILD_CAP);
    for (const i of sorted) {
      visit(arr[i], [...segments, i], String(i), depth + 1);
    }

    if (arr.length > ARRAY_CHILD_CAP) {
      rows.push({
        segments,
        path: `${path}__notice`,
        key: null,
        value: arr.length,
        type: 'notice',
        depth: depth + 1,
        hasChildren: false,
        expanded: false,
        match: false,
        isNotice: true,
        hasSearchExtras,
      });
    }
  }

  visit(root, [], null, 0);
  return rows;
}

/**
 * @param {unknown} value
 * @returns {Set<string>}
 */
export function allContainerPaths(value) {
  const paths = new Set(['']);
  /**
   * @param {unknown} val
   * @param {Array<string|number>} segments
   */
  function walk(val, segments) {
    const type = getValueType(val);
    const path = pathToString(segments);
    if (type === 'object') {
      paths.add(path);
      for (const [k, child] of Object.entries(/** @type {Record<string, unknown>} */ (val))) {
        walk(child, [...segments, k]);
      }
    } else if (type === 'array') {
      paths.add(path);
      const arr = /** @type {unknown[]} */ (val);
      const n = Math.min(arr.length, ARRAY_CHILD_CAP);
      for (let i = 0; i < n; i += 1) walk(arr[i], [...segments, i]);
    }
  }
  walk(value, []);
  return paths;
}

/**
 * 巨大配列の注意文
 * @param {number} total
 * @param {boolean} [hasSearchExtras]
 */
export function arrayCapNotice(total, hasSearchExtras = false) {
  const base = `大きな配列です（${total}件）。先頭${ARRAY_CHILD_CAP}件を表示しています。`;
  if (hasSearchExtras) {
    return `${base} 検索対象のみ一時表示しています。`;
  }
  return base;
}

/**
 * 値コピー: stringは生値、object/arrayは整形JSON
 * @param {unknown} val
 * @param {JsonValueType} type
 */
export function valueForCopy(val, type) {
  if (type === 'string') return String(val);
  if (type === 'number' || type === 'boolean') return String(val);
  if (type === 'null') return 'null';
  return JSON.stringify(val, null, 2);
}
