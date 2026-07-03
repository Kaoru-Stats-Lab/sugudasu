/**
 * リンク集QR — エンコード / 正規化（非送信 · #fragment）
 * SSOT: docs/notes/LINK_QR_TOOL_SPEC.md
 */

export const HASH_PREFIX = 'p=';
export const MAX_UTF8_BYTES = 1200;
export const MAX_NAME_LEN = 40;

/** @type {ReadonlyArray<{ id: string, label: string, placeholder: string }>} */
export const LINK_SLOTS = [
  { id: 'x', label: 'X', placeholder: '@handle または https://x.com/...' },
  { id: 'gh', label: 'GitHub', placeholder: 'username または https://github.com/...' },
  { id: 'zn', label: 'Zenn', placeholder: '@user または https://zenn.dev/...' },
  { id: 'qt', label: 'Qiita', placeholder: '@user または https://qiita.com/...' },
  { id: 'web', label: 'Web / Portfolio', placeholder: 'https://example.com' },
  { id: 'misc', label: 'その他', placeholder: 'https://...' },
];

const SLOT_LABEL = Object.fromEntries(LINK_SLOTS.map((s) => [s.id, s.label]));

/**
 * @param {string} raw
 * @param {string} slotId
 * @returns {{ url: string, error?: string }}
 */
export function normalizeLinkInput(raw, slotId) {
  let s = String(raw ?? '').trim();
  if (!s) return { url: '' };

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { url: '', error: 'http または https の URL のみ' };
      }
      return { url: u.href };
    } catch {
      return { url: '', error: 'URL の形式が不正です' };
    }
  }

  const handle = s.replace(/^@/, '');
  if (!handle || /\s/.test(handle)) {
    return { url: '', error: 'スペースなしで入力するか、https:// から始めてください' };
  }

  /** @type {Record<string, string>} */
  const built = {
    x: `https://x.com/${handle}`,
    gh: `https://github.com/${handle}`,
    zn: `https://zenn.dev/${handle}`,
    qt: `https://qiita.com/${handle}`,
  };

  if (built[slotId]) return { url: built[slotId] };
  return { url: '', error: 'https:// から始まる URL を入力してください' };
}

/**
 * @param {string} name
 * @param {Record<string, string>} linksBySlot — slotId → normalized url
 */
export function buildPayload(name, linksBySlot) {
  const n = String(name ?? '').trim().slice(0, MAX_NAME_LEN);
  /** @type {[string, string][]} */
  const l = [];
  for (const slot of LINK_SLOTS) {
    const url = String(linksBySlot[slot.id] ?? '').trim();
    if (url) l.push([slot.id, url]);
  }
  if (!n && l.length === 0) return null;
  return { v: 1, n, l };
}

/**
 * @param {Uint8Array} bytes
 */
function utf8ByteLength(str) {
  return new TextEncoder().encode(str).length;
}

/**
 * @param {{ v: number, n: string, l: [string, string][] }} payload
 */
export function encodePayload(payload) {
  const json = JSON.stringify(payload);
  if (utf8ByteLength(json) > MAX_UTF8_BYTES) {
    return { error: `データが長すぎます（${MAX_UTF8_BYTES} バイト以内）。リンク数を減らしてください。` };
  }
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  const encoded = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { hash: `${HASH_PREFIX}${encoded}`, encoded, jsonBytes: bytes.length };
}

/**
 * @param {string} hash — location.hash（先頭 # あり可）
 */
export function decodeHash(hash) {
  let h = String(hash ?? '').trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (!h.startsWith(HASH_PREFIX)) return { error: 'リンクデータがありません' };
  const encoded = h.slice(HASH_PREFIX.length);
  if (!encoded) return { error: 'リンクデータが空です' };
  try {
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json);
    if (!data || data.v !== 1 || !Array.isArray(data.l)) {
      return { error: 'データ形式が不正です' };
    }
    const name = String(data.n ?? '').slice(0, MAX_NAME_LEN);
    /** @type {{ id: string, label: string, url: string }[]} */
    const links = [];
    for (const item of data.l) {
      if (!Array.isArray(item) || item.length < 2) continue;
      const id = String(item[0]);
      const url = String(item[1]);
      if (!SLOT_LABEL[id] && id !== 'misc') continue;
      if (!/^https?:\/\//i.test(url)) continue;
      links.push({
        id,
        label: SLOT_LABEL[id] || 'その他',
        url,
      });
    }
    if (!name && links.length === 0) return { error: '表示するリンクがありません' };
    return { payload: { v: 1, n: name, l: data.l }, name, links };
  } catch {
    return { error: 'リンクデータを読み取れませんでした' };
  }
}

/**
 * @param {string} pathname
 */
export function canonicalLinkQrPath(pathname) {
  let p = String(pathname ?? '/link-qr')
    .replace(/\/index\.html$/i, '')
    .replace(/\.html$/i, '');
  if (!p || p === '/') return '/link-qr';
  if (!p.startsWith('/')) p = `/${p}`;
  return p;
}

/**
 * @param {string} origin
 * @param {string} pathname
 * @param {{ v: number, n: string, l: [string, string][] }} payload
 */
export function buildShareUrl(origin, pathname, payload) {
  const enc = encodePayload(payload);
  if (enc.error) return enc;
  const base = `${origin}${canonicalLinkQrPath(pathname)}`;
  return { url: `${base}#${enc.hash}`, ...enc };
}

/**
 * @param {Record<string, string>} rawInputs — slotId → form value
 */
export function parseFormInputs(name, rawInputs) {
  /** @type {Record<string, string>} */
  const links = {};
  /** @type {string[]} */
  const errors = [];
  for (const slot of LINK_SLOTS) {
    const raw = rawInputs[slot.id];
    if (!raw || !String(raw).trim()) continue;
    const { url, error } = normalizeLinkInput(raw, slot.id);
    if (error) errors.push(`${slot.label}: ${error}`);
    else if (url) links[slot.id] = url;
  }
  const payload = buildPayload(name, links);
  if (!payload) errors.push('表示名かリンクを1つ以上入力してください');
  else if (payload.l.length === 0) errors.push('有効なリンクを1つ以上入力してください');
  return { payload, links, errors };
}
