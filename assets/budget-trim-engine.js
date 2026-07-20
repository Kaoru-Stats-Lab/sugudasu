/**
 * SUGUDASU 引き算パレット — 純ロジック
 * docs/notes/BUDGET_TRIM_SPEC.md
 */

export const HASH_PREFIX = 'bt1.';
export const SCHEMA_VERSION = 1;
export const STEP_ARROW = 10000;
export const STEP_SHIFT = 100000;

/**
 * @returns {string}
 */
export function newId() {
  return `bt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {string} s
 * @returns {string}
 */
export function detoxLabel(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .replace(/　/g, ' ')
    .trim();
}

/**
 * 汚れた金額文字列 → 整数円（失敗時 null）
 * DECISION: 浮動小数は使わない。円単位の整数のみ。
 * @param {string|number} raw
 * @returns {number|null}
 */
export function parseYenAmount(raw) {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    return Math.trunc(raw);
  }
  let s = String(raw ?? '')
    .normalize('NFKC')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .trim();
  if (!s) return null;

  // 全角数字・カンマ・円・￥ などを除去して数字と符号だけ残す
  s = s
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[¥￥円圓ｰ−–—―]/g, (ch) => (ch === '−' || ch === '–' || ch === '—' || ch === '―' || ch === '-' ? '-' : ''))
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .replace(/円/g, '')
    .replace(/[^\d.+-]/g, '');

  // 「3000000-」末尾ハイフンだけのノイズ
  s = s.replace(/-+$/g, '');
  if (!s || s === '+' || s === '-' || s === '.') return null;

  // 小数がある場合は切り捨て（円未満は扱わない）
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/**
 * Excel/TSV 貼付 → items
 * @param {string} text
 * @returns {{ id: string, name: string, amount: number, locked: boolean }[]}
 */
export function parseBudgetPaste(text) {
  const raw = String(text ?? '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r\n|\n|\r/);
  /** @type {{ id: string, name: string, amount: number, locked: boolean }[]} */
  const items = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    let namePart;
    let amountPart;

    if (line.includes('\t')) {
      const parts = line.split('\t');
      namePart = detoxLabel(parts[0]);
      amountPart = parts.slice(1).join('\t');
    } else {
      // 末尾の金額っぽい塊を拾う
      const m = line.trim().match(/^(.+?)[\s　]+([^\s　]+)$/);
      if (m) {
        namePart = detoxLabel(m[1]);
        amountPart = m[2];
      } else {
        // 行全体が金額だけならスキップ相当
        const only = parseYenAmount(line);
        if (only != null && !/[^\d¥￥円,.\s-]/.test(line.replace(/[0-9０-９]/g, ''))) {
          continue;
        }
        namePart = detoxLabel(line);
        amountPart = '';
      }
    }

    const amount = parseYenAmount(amountPart);
    if (!namePart || amount == null) continue;
    items.push({ id: newId(), name: namePart, amount, locked: false });
  }
  return items;
}

/**
 * @param {{ amount: number }[]} items
 * @returns {number}
 */
export function sumAmounts(items) {
  let total = 0;
  for (const it of items) {
    const a = Math.trunc(Number(it.amount) || 0);
    total += a;
  }
  return total;
}

/**
 * @param {number} total
 * @param {number|null|undefined} cap
 * @returns {{ kind: 'over'|'under'|'neutral', delta: number }}
 */
export function budgetStatus(total, cap) {
  const t = Math.trunc(Number(total) || 0);
  if (cap == null || cap === '' || !Number.isFinite(Number(cap))) {
    return { kind: 'neutral', delta: 0 };
  }
  const c = Math.trunc(Number(cap));
  if (t > c) return { kind: 'over', delta: t - c };
  return { kind: 'under', delta: c - t };
}

/**
 * @param {number} amount
 * @param {number} delta
 * @returns {number}
 */
export function applyAmountDelta(amount, delta) {
  return Math.trunc(Number(amount) || 0) + Math.trunc(Number(delta) || 0);
}

/**
 * @param {KeyboardEvent|{key:string,shiftKey?:boolean}} e
 * @returns {number|null} 加算delta。対象外キーは null
 */
export function arrowKeyDelta(e) {
  const key = e.key;
  if (key !== 'ArrowUp' && key !== 'ArrowDown') return null;
  const step = e.shiftKey ? STEP_SHIFT : STEP_ARROW;
  return key === 'ArrowUp' ? step : -step;
}

/**
 * @param {string} str
 */
export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * @param {string} b64
 */
export function base64ToUtf8(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/**
 * @param {{ cap: number|null, items: { name: string, amount: number, locked?: boolean }[] }} state
 * @returns {string} hash の # 以降（prefix 含む）
 */
export function encodeHashState(state) {
  const payload = {
    v: SCHEMA_VERSION,
    c: state.cap == null || state.cap === '' ? null : Math.trunc(Number(state.cap)),
    i: (state.items || []).map((it) => [
      String(it.name || ''),
      Math.trunc(Number(it.amount) || 0),
      it.locked ? 1 : 0,
    ]),
  };
  return HASH_PREFIX + utf8ToBase64(JSON.stringify(payload));
}

/**
 * @param {string} hashRaw location.hash または # なし
 * @returns {{ ok: true, state: { cap: number|null, items: { id: string, name: string, amount: number, locked: boolean }[] } } | { ok: false, reason: string }}
 */
export function decodeHashState(hashRaw) {
  let raw = String(hashRaw ?? '').trim();
  if (raw.startsWith('#')) raw = raw.slice(1);
  if (!raw.startsWith(HASH_PREFIX)) return { ok: false, reason: 'prefix' };
  try {
    const json = base64ToUtf8(raw.slice(HASH_PREFIX.length));
    const data = JSON.parse(json);
    if (!data || data.v !== SCHEMA_VERSION || !Array.isArray(data.i)) {
      return { ok: false, reason: 'shape' };
    }
    const cap = data.c == null || data.c === '' ? null : Math.trunc(Number(data.c));
    const items = data.i.map((row) => {
      const name = detoxLabel(Array.isArray(row) ? row[0] : row?.n);
      const amount = Math.trunc(Number(Array.isArray(row) ? row[1] : row?.a) || 0);
      const locked = !!(Array.isArray(row) ? row[2] : row?.l);
      return { id: newId(), name: name || '(無題)', amount, locked };
    });
    return { ok: true, state: { cap: Number.isFinite(cap) ? cap : null, items } };
  } catch {
    return { ok: false, reason: 'decode' };
  }
}

/**
 * @param {{ name: string, amount: number }[]} items
 * @returns {string}
 */
export function buildCleanTsv(items) {
  return (items || [])
    .map((it) => `${String(it.name || '').replace(/\t/g, ' ')}\t${Math.trunc(Number(it.amount) || 0)}`)
    .join('\n');
}

/**
 * 表示用カンマ区切り（計算には使わない）
 * @param {number} n
 */
export function formatYen(n) {
  const v = Math.trunc(Number(n) || 0);
  const sign = v < 0 ? '-' : '';
  return sign + Math.abs(v).toLocaleString('ja-JP');
}
