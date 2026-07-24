/**
 * SUGUDASU 仮置き — 分類 · 表示 · コピー
 * docs/products/clip-stash/specification.md
 */

/** @typedef {'text'|'table'|'url'|'image'|'color'} ClipStashType */

/** @typedef {{
 *   id: string,
 *   type: ClipStashType,
 *   order: number,
 *   createdAt: string,
 *   text?: string,
 *   tableTsv?: string,
 *   tableRows?: number,
 *   tableCols?: number,
 *   url?: string,
 *   urlTitle?: string,
 *   urlOgImage?: string,
 *   imageMime?: string,
 *   imageData?: ArrayBuffer,
 *   imageWidth?: number,
 *   imageHeight?: number,
 *   imageBytes?: number,
 *   colorHex?: string,
 * }} ClipStashCard */

export const TEXT_PREVIEW_CHARS = 300;
export const TEXT_PREVIEW_LINES = 12;
export const TABLE_PREVIEW_ROWS = 4;

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;

/**
 * @param {string} s
 */
export function isHexColor(s) {
  return HEX_COLOR_RE.test(String(s).trim());
}

/**
 * @param {string} s
 */
export function isSingleUrl(s) {
  const t = String(s).trim();
  if (!t || t.includes('\n') || t.includes('\t')) return false;
  return URL_RE.test(t);
}

/**
 * @param {string} text
 */
export function isTablePaste(text) {
  const raw = String(text ?? '');
  if (!raw.trim()) return false;
  if (raw.includes('\t')) return true;
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return false;
  const cols = lines.map((l) => l.split(/\s{2,}|\t|,/).length);
  const first = cols[0];
  return first >= 2 && cols.every((c) => c === first);
}

/**
 * Excel 貼付を TSV 値のみに正規化（関数は保持しない — text/plain 前提）
 * @param {string} text
 */
export function normalizeTableTsv(text) {
  const lines = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const normalized = lines.map((line) => {
    if (line.includes('\t')) return line.split('\t').join('\t');
    if (line.includes(',')) return line.split(',').join('\t');
    return line.trim().split(/\s{2,}/).join('\t');
  });
  const tsv = normalized.join('\n');
  const rows = normalized.filter((l) => l.trim()).length;
  const cols = rows ? normalized[0].split('\t').length : 0;
  return { tsv, rows, cols };
}

/**
 * @param {string} text
 */
export function textPreview(text) {
  const src = String(text ?? '');
  const lines = src.split('\n');
  const shownLines = lines.slice(0, TEXT_PREVIEW_LINES);
  let body = shownLines.join('\n');
  if (body.length > TEXT_PREVIEW_CHARS) {
    body = `${body.slice(0, TEXT_PREVIEW_CHARS)}…`;
  }
  return {
    body,
    charCount: src.length,
    lineCount: lines.length,
  };
}

/**
 * @param {string} tsv
 */
export function tablePreview(tsv) {
  const lines = String(tsv ?? '').split('\n').filter((l) => l.length);
  const previewLines = lines.slice(0, TABLE_PREVIEW_ROWS);
  const cols = lines[0] ? lines[0].split('\t').length : 0;
  return {
    body: previewLines.join('\n'),
    rows: lines.length,
    cols,
  };
}

/**
 * @param {string} url
 */
export function urlDisplayTitle(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 40);
  }
}

/**
 * CORS により多くのサイトでは失敗する。失敗時は hostname のみ。
 * @param {string} url
 */
export async function fetchUrlMeta(url) {
  const title = urlDisplayTitle(url);
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit', redirect: 'follow' });
    if (!res.ok) return { title, ogImage: null };
    const html = await res.text();
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return {
      title: ogTitle?.[1]?.trim() || title,
      ogImage: ogImage?.[1]?.trim() || null,
    };
  } catch {
    return { title, ogImage: null };
  }
}

/**
 * GIF はスコープ外（貼り先で静止画になるため仮置き対象外）
 * @param {string} mime
 */
export function isSupportedImageMime(mime) {
  const m = String(mime || '').toLowerCase();
  return m.startsWith('image/') && m !== 'image/gif';
}

/**
 * @param {import('./clip-stash-engine.js').ClipStashCard[]} cards
 */
export function nextSlotIndex(cards) {
  if (!cards.length) return 0;
  const maxOrder = Math.max(...cards.map((c) => c.order));
  for (let i = 0; i <= maxOrder; i += 1) {
    if (!cards.some((c) => c.order === i)) return i;
  }
  return maxOrder + 1;
}

/**
 * @param {import('./clip-stash-engine.js').ClipStashCard[]} cards
 */
export function slotIndices(cards) {
  if (!cards.length) return [];
  const maxOrder = Math.max(...cards.map((c) => c.order));
  return Array.from({ length: maxOrder + 1 }, (_, i) => i);
}

/**
 * @param {DataTransfer|null} dt
 */
export async function readClipboardPaste(dt) {
  if (!dt) return null;
  const items = dt.items ? Array.from(dt.items) : [];
  for (const item of items) {
    if (!isSupportedImageMime(item.type)) continue;
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      if (blob) {
        const ab = await blob.arrayBuffer();
        const dims = await imageDimensions(blob);
        return {
          kind: /** @type {const} */ ('image'),
          imageMime: blob.type || 'image/png',
          imageData: ab,
          imageBytes: ab.byteLength,
          imageWidth: dims.width,
          imageHeight: dims.height,
        };
      }
    }
  }
  const text = dt.getData('text/plain') || '';
  if (!text.trim()) return null;
  if (isHexColor(text.trim())) {
    return { kind: /** @type {const} */ ('color'), colorHex: text.trim().toLowerCase() };
  }
  if (isSingleUrl(text)) {
    const meta = await fetchUrlMeta(text.trim());
    return {
      kind: /** @type {const} */ ('url'),
      url: text.trim(),
      urlTitle: meta.title,
      urlOgImage: meta.ogImage,
    };
  }
  if (isTablePaste(text)) {
    const { tsv, rows, cols } = normalizeTableTsv(text);
    return { kind: /** @type {const} */ ('table'), tableTsv: tsv, tableRows: rows, tableCols: cols };
  }
  return { kind: /** @type {const} */ ('text'), text };
}

/**
 * @param {Blob} blob
 */
function imageDimensions(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * @param {ClipStashCard} card
 * @param {number} order
 */
export function buildCardFromPaste(paste, order) {
  const id = crypto.randomUUID();
  const base = { id, order, createdAt: new Date().toISOString() };
  if (paste.kind === 'image') {
    return {
      ...base,
      type: 'image',
      imageMime: paste.imageMime,
      imageData: paste.imageData,
      imageBytes: paste.imageBytes,
      imageWidth: paste.imageWidth,
      imageHeight: paste.imageHeight,
    };
  }
  if (paste.kind === 'color') {
    return { ...base, type: 'color', colorHex: paste.colorHex };
  }
  if (paste.kind === 'url') {
    return {
      ...base,
      type: 'url',
      url: paste.url,
      urlTitle: paste.urlTitle,
      urlOgImage: paste.urlOgImage || undefined,
    };
  }
  if (paste.kind === 'table') {
    return {
      ...base,
      type: 'table',
      tableTsv: paste.tableTsv,
      tableRows: paste.tableRows,
      tableCols: paste.tableCols,
    };
  }
  return { ...base, type: 'text', text: paste.text };
}

/**
 * @param {ClipStashCard} card
 */
export function copyPayload(card) {
  if (card.type === 'text') return card.text || '';
  if (card.type === 'table') return card.tableTsv || '';
  if (card.type === 'url') return card.url || '';
  if (card.type === 'color') return card.colorHex || '';
  return '';
}

/**
 * @param {string} mime
 */
export function imageFormatLabel(mime) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/png') return 'PNG';
  if (m === 'image/jpeg' || m === 'image/jpg') return 'JPG';
  if (m === 'image/webp') return 'WebP';
  if (m === 'image/svg+xml') return 'SVG';
  return 'Image';
}

/**
 * @param {ClipStashCard} card
 */
export function imageCardMeta(card) {
  return { format: imageFormatLabel(card.imageMime) };
}

/**
 * @param {ClipStashCard} card
 */
export function imageBlob(card) {
  if (card.type !== 'image' || !card.imageData) return null;
  return new Blob([card.imageData], { type: card.imageMime || 'image/png' });
}

/**
 * @param {ClipStashCard} card
 */
export async function copyCard(card) {
  if (card.type === 'image') {
    const blob = imageBlob(card);
    if (!blob) throw new Error('empty');
    if (navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      return;
    }
    throw new Error('clipboard-image');
  }
  const text = copyPayload(card);
  if (!text) throw new Error('empty');
  await navigator.clipboard.writeText(text);
}

/**
 * @param {number} n
 */
export function formatBytes(n) {
  if (!n || n < 1024) return `${n || 0} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {string} iso
 */
export function formatTimestamp(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const TYPE_LABELS = {
  text: 'Text',
  table: 'Table',
  url: 'URL',
  image: 'Image',
  color: 'Color',
};
