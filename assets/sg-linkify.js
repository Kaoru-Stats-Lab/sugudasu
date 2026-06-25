/**
 * プレーンテキスト内の http(s) URL を安全にリンク化（表示専用）
 *
 * - 先に分割してからエスケープ（XSS 防止）
 * - プロトコルは http / https のみ
 * - 保存・コピー・印刷には使わない（timeline note プレビュー等）
 */

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} s
 */
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

/** http(s) のみ · 空白・括弧手前で切る */
const HTTP_URL_RE = /https?:\/\/[^\s<>"']+/gi;

const TRAILING_PUNCT_RE = /^((?:https?:\/\/)[^\s<>"']+?)([.,;:!?)】」』\]]*)$/;

/**
 * 表示用 HTML — innerHTML 代入前提
 * @param {string} raw
 * @returns {string}
 */
export function linkifyHttpHtml(raw) {
  const text = String(raw ?? '');
  if (!text) return '';

  const parts = [];
  let last = 0;
  HTTP_URL_RE.lastIndex = 0;
  let match = HTTP_URL_RE.exec(text);
  while (match) {
    const idx = match.index;
    if (idx > last) parts.push(escapeHtml(text.slice(last, idx)));

    let url = match[0];
    let suffix = '';
    const trimmed = url.match(TRAILING_PUNCT_RE);
    if (trimmed) {
      url = trimmed[1];
      suffix = trimmed[2];
    }

    parts.push(
      `<a href="${escapeAttr(url)}" class="sg-linkify text-emerald-700 underline underline-offset-2 break-all" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`,
    );
    if (suffix) parts.push(escapeHtml(suffix));

    last = idx + match[0].length;
    match = HTTP_URL_RE.exec(text);
  }

  if (last < text.length) parts.push(escapeHtml(text.slice(last)));
  return parts.join('');
}

/**
 * URL を含むときだけ linkify、なければエスケープのみ
 * @param {string} raw
 */
export function linkifyHttpHtmlIfPresent(raw) {
  const text = String(raw ?? '');
  if (!HTTP_URL_RE.test(text)) return escapeHtml(text);
  HTTP_URL_RE.lastIndex = 0;
  return linkifyHttpHtml(text);
}
