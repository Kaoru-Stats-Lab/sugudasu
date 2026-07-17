/**
 * SUGUDASU 検索式ビルダー — 組み立てロジック
 * SSOT: docs/notes/SEARCH_QUERY_BUILDER_SPEC.md
 */

export const LS_EXCLUDES_KEY = 'sg-search-query-excludes';
export const LS_EXCLUDES_MAX = 10;
export const EXCLUDE_MAX = 3;
export const KEYWORD_MAX = 500;

/** @typedef {'pdf_gather'|'gov_jp'|'exclude_noise'|'free'} SearchPresetId */

/** @type {Record<SearchPresetId, { label: string, hint: string, filetype: string, site: string }>} */
export const SEARCH_PRESETS = {
  pdf_gather: {
    label: 'PDFだけ集める',
    hint: '資料・料金表を PDF に絞る',
    filetype: 'pdf',
    site: '',
  },
  gov_jp: {
    label: '官公庁・自治体寄り',
    hint: 'まず go.jp。lg.jp / ac.jp はワンタッチで変更可',
    filetype: '',
    site: 'go.jp',
  },
  exclude_noise: {
    label: 'まとめを除いて探す',
    hint: '除くサイト欄を使います。直近の除外が候補に出ます',
    filetype: '',
    site: '',
  },
  free: {
    label: '自由に組み立て',
    hint: 'すべて手動。キーワードは保持されます',
    filetype: '',
    site: '',
  },
};

/**
 * URL / ホスト文字列 → site: 用ホスト
 * @param {string} raw
 * @returns {{ host: string, ok: boolean, warning: string }}
 */
export function normalizeHost(raw) {
  let s = String(raw ?? '').trim();
  if (!s) return { host: '', ok: true, warning: '' };

  s = s.replace(/^https?:\/\//i, '');
  const cut = s.search(/[/?#]/);
  if (cut >= 0) s = s.slice(0, cut);
  s = s.replace(/^www\./i, '');
  s = s.trim().toLowerCase();

  if (!s) return { host: '', ok: false, warning: 'ドメインを入力してください' };
  if (!s.includes('.')) {
    return { host: '', ok: false, warning: 'ドメイン形式を確認してください（例: example.co.jp）' };
  }
  return { host: s, ok: true, warning: '' };
}

/**
 * 全角スペース → 半角
 * @param {string} raw
 */
export function toHalfWidthSpace(raw) {
  return String(raw ?? '').replace(/\u3000/g, ' ');
}

/**
 * @param {{
 *   keywords?: string,
 *   phrase?: string,
 *   filetype?: string,
 *   site?: string,
 *   excludes?: string[],
 *   intitle?: string,
 * }} input
 * @returns {{ query: string, conflict: boolean, siteWarning: string, excludeWarnings: string[] }}
 */
export function buildSearchQuery(input) {
  const keywords = toHalfWidthSpace(input.keywords || '').trim().slice(0, KEYWORD_MAX);
  const phrase = toHalfWidthSpace(input.phrase || '').trim();
  const filetype = String(input.filetype || '').trim().toLowerCase();
  const intitle = toHalfWidthSpace(input.intitle || '').trim();

  const siteNorm = normalizeHost(input.site || '');
  const excludeWarnings = [];
  /** @type {string[]} */
  const hostsEx = [];
  const rawEx = Array.isArray(input.excludes) ? input.excludes : [];
  for (const raw of rawEx.slice(0, EXCLUDE_MAX)) {
    const n = normalizeHost(raw);
    if (!String(raw || '').trim()) continue;
    if (!n.ok) {
      excludeWarnings.push(n.warning || '除外ドメインを確認してください');
      continue;
    }
    if (n.host && !hostsEx.includes(n.host)) hostsEx.push(n.host);
  }

  const conflict =
    Boolean(siteNorm.host) && hostsEx.includes(siteNorm.host);

  /** @type {string[]} */
  const parts = [];
  if (phrase) parts.push(`"${phrase}"`);
  if (keywords) parts.push(keywords);
  if (filetype) parts.push(`filetype:${filetype}`);
  if (!conflict && siteNorm.ok && siteNorm.host) {
    parts.push(`site:${siteNorm.host}`);
  }
  if (!conflict) {
    for (const h of hostsEx) parts.push(`-site:${h}`);
  }
  if (intitle) parts.push(`intitle:${intitle}`);

  return {
    query: parts.join(' '),
    conflict,
    siteWarning: siteNorm.warning,
    excludeWarnings,
  };
}

/**
 * @param {string} query
 */
export function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * @returns {string[]}
 */
export function loadRecentExcludes() {
  try {
    const raw = localStorage.getItem(LS_EXCLUDES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => String(x)).filter(Boolean).slice(0, LS_EXCLUDES_MAX);
  } catch {
    return [];
  }
}

/**
 * @param {string} host
 */
export function rememberExclude(host) {
  const h = String(host || '').trim().toLowerCase();
  if (!h) return;
  const prev = loadRecentExcludes().filter((x) => x !== h);
  const next = [h, ...prev].slice(0, LS_EXCLUDES_MAX);
  try {
    localStorage.setItem(LS_EXCLUDES_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

/**
 * @param {string[]} hosts
 */
export function rememberExcludes(hosts) {
  for (const h of [...hosts].reverse()) rememberExclude(h);
}
