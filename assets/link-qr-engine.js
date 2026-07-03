/**
 * リンク集QR — エンコード / 正規化（非送信 · #fragment）
 * SSOT: docs/notes/LINK_QR_TOOL_SPEC.md
 */

export const HASH_PREFIX = 'p=';
export const MAX_UTF8_BYTES = 1200;
export const MAX_NAME_LEN = 40;
export const DEFAULT_PRESET = 'event_contact';

/** @type {Record<string, { id: string, label: string, hint: string, slots: ReadonlyArray<{ id: string, label: string, placeholder: string }> }>} */
export const PRESETS = {
  event_contact: {
    id: 'event_contact',
    label: 'イベント連絡',
    hint: 'アイデアソン・勉強会で話した人に、あとから Slack やメールで連絡するとき',
    slots: [
      { id: 'slack', label: 'Slack', placeholder: 'SlackのプロフィールURL（https://...slack.com/...）' },
      { id: 'discord', label: 'Discord（任意）', placeholder: 'https://discord.com/users/...' },
      { id: 'mail', label: 'メール（任意）', placeholder: 'name@example.com' },
      { id: 'x', label: 'X（任意）', placeholder: '@handle' },
      { id: 'gh', label: 'GitHub（任意）', placeholder: 'username' },
      { id: 'misc', label: 'その他', placeholder: 'https://...' },
    ],
  },
  tech_sns: {
    id: 'tech_sns',
    label: 'テックSNS',
    hint: '懇親会で X · GitHub · Zenn をまとめて渡すとき',
    slots: [
      { id: 'x', label: 'X', placeholder: '@handle または https://x.com/...' },
      { id: 'gh', label: 'GitHub', placeholder: 'username または https://github.com/...' },
      { id: 'zn', label: 'Zenn', placeholder: '@user または https://zenn.dev/...' },
      { id: 'qt', label: 'Qiita', placeholder: '@user または https://qiita.com/...' },
      { id: 'web', label: 'Web / Portfolio', placeholder: 'https://example.com' },
      { id: 'misc', label: 'その他', placeholder: 'https://...' },
    ],
  },
};

/** @type {Record<string, string>} */
const SLOT_LABEL = {};
for (const preset of Object.values(PRESETS)) {
  for (const slot of preset.slots) {
    SLOT_LABEL[slot.id] = slot.label.replace(/（任意）$/, '');
  }
}

/**
 * @param {string} [presetId]
 */
export function getPreset(presetId) {
  const id = presetId && PRESETS[presetId] ? presetId : DEFAULT_PRESET;
  return PRESETS[id];
}

/**
 * @param {string} [presetId]
 */
export function getSlotsForPreset(presetId) {
  return getPreset(presetId).slots;
}

/** @deprecated 互換 — tech_sns 相当 */
export const LINK_SLOTS = PRESETS.tech_sns.slots;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} raw
 * @param {string} slotId
 * @returns {{ url: string, error?: string }}
 */
export function normalizeLinkInput(raw, slotId) {
  let s = String(raw ?? '').trim();
  if (!s) return { url: '' };

  if (slotId === 'mail') {
    if (/^mailto:/i.test(s)) {
      const addr = s.replace(/^mailto:/i, '').split('?')[0];
      if (EMAIL_RE.test(addr)) return { url: `mailto:${addr}` };
      return { url: '', error: 'メールアドレスの形式が不正です' };
    }
    if (EMAIL_RE.test(s)) return { url: `mailto:${s}` };
    return { url: '', error: 'メールアドレスを入力するか、mailto: 形式の URL を入力してください' };
  }

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { url: '', error: 'http または https の URL のみ' };
      }
      if (slotId === 'slack' && !/slack\.com/i.test(u.hostname)) {
        return { url: '', error: 'Slack のプロフィール URL（slack.com）を貼ってください' };
      }
      if (slotId === 'discord' && !/discord\.com/i.test(u.hostname)) {
        return { url: '', error: 'Discord のプロフィール URL（discord.com）を貼ってください' };
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

  if (slotId === 'slack' || slotId === 'discord') {
    return { url: '', error: 'https:// から始まるプロフィール URL を貼ってください' };
  }
  return { url: '', error: 'https:// から始まる URL を入力してください' };
}

/**
 * @param {string} name
 * @param {Record<string, string>} linksBySlot
 * @param {string} [presetId]
 */
export function buildPayload(name, linksBySlot, presetId = DEFAULT_PRESET) {
  const preset = getPreset(presetId);
  const n = String(name ?? '').trim().slice(0, MAX_NAME_LEN);
  /** @type {[string, string][]} */
  const l = [];
  for (const slot of preset.slots) {
    const url = String(linksBySlot[slot.id] ?? '').trim();
    if (url) l.push([slot.id, url]);
  }
  if (!n && l.length === 0) return null;
  return { v: 1, pr: preset.id, n, l };
}

function utf8ByteLength(str) {
  return new TextEncoder().encode(str).length;
}

/**
 * @param {{ v: number, pr?: string, n: string, l: [string, string][] }} payload
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

function isValidLinkUrl(url) {
  return /^https?:\/\//i.test(url) || /^mailto:/i.test(url);
}

/**
 * @param {string} hash
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
    const presetId = data.pr && PRESETS[data.pr] ? data.pr : 'tech_sns';
    const name = String(data.n ?? '').slice(0, MAX_NAME_LEN);
    /** @type {{ id: string, label: string, url: string }[]} */
    const links = [];
    for (const item of data.l) {
      if (!Array.isArray(item) || item.length < 2) continue;
      const id = String(item[0]);
      const url = String(item[1]);
      if (!SLOT_LABEL[id] && id !== 'misc') continue;
      if (!isValidLinkUrl(url)) continue;
      links.push({
        id,
        label: SLOT_LABEL[id] || 'その他',
        url,
      });
    }
    if (!name && links.length === 0) return { error: '表示するリンクがありません' };
    return {
      payload: { v: 1, pr: presetId, n: name, l: data.l },
      presetId,
      name,
      links,
    };
  } catch {
    return { error: 'リンクデータを読み取れませんでした' };
  }
}

export function canonicalLinkQrPath(pathname) {
  let p = String(pathname ?? '/link-qr')
    .replace(/\/index\.html$/i, '')
    .replace(/\.html$/i, '');
  if (!p || p === '/') return '/link-qr';
  if (!p.startsWith('/')) p = `/${p}`;
  return p;
}

export function buildShareUrl(origin, pathname, payload) {
  const enc = encodePayload(payload);
  if (enc.error) return enc;
  const base = `${origin}${canonicalLinkQrPath(pathname)}`;
  return { url: `${base}#${enc.hash}`, ...enc };
}

/**
 * @param {string} name
 * @param {Record<string, string>} rawInputs
 * @param {string} [presetId]
 */
export function parseFormInputs(name, rawInputs, presetId = DEFAULT_PRESET) {
  const preset = getPreset(presetId);
  /** @type {Record<string, string>} */
  const links = {};
  /** @type {string[]} */
  const errors = [];
  for (const slot of preset.slots) {
    const raw = rawInputs[slot.id];
    if (!raw || !String(raw).trim()) continue;
    const { url, error } = normalizeLinkInput(raw, slot.id);
    if (error) errors.push(`${slot.label}: ${error}`);
    else if (url) links[slot.id] = url;
  }
  const payload = buildPayload(name, links, preset.id);
  if (!payload) errors.push('表示名かリンクを1つ以上入力してください');
  else if (payload.l.length === 0) errors.push('有効なリンクを1つ以上入力してください');
  return { payload, links, errors, presetId: preset.id };
}

/** 幹事向けアナウンス文（コピー用） */
export const ORGANIZER_COPY = {
  event_contact: `【懇親会・交流】話した人とあとから連絡できるよう、各自で QR を作ります。

ツール: https://sugudasu.com/link-qr
・登録不要 · サーバーに保存しません
・表示名 + Slack のプロフィール URL（またはメール）を入れるだけ
・できた QR をお互いに読み取り合いましょう

Slack URL の取り方: 自分のアイコン → プロフィール → 「プロフィールリンクをコピー」`,
  tech_sns: `【懇親会】SNS・GitHub をまとめて交換します。

ツール: https://sugudasu.com/link-qr
・「テックSNS」タブを選び、@ID を入れるだけ（登録不要）
・QR を読み取ると X / GitHub / Zenn などが一覧で開きます`,
};
