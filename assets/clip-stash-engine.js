/**
 * SUGUDASU 仮置き — 分類 · 表示 · コピー
 * docs/products/clip-stash/specification.md
 */

/** @typedef {'text'|'table'|'url'|'image'|'color'|'pdf'} ClipStashType */

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
 *   pdfData?: ArrayBuffer,
 *   pdfBytes?: number,
 *   pdfName?: string,
 *   pdfPreviewData?: ArrayBuffer,
 *   pdfPageCount?: number,
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
 * 画像は元 Blob を保持（再エンコードしない）。GIF 含む。
 * @param {string} mime
 */
export function isSupportedImageMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (!m.startsWith('image/')) return false;
  return (
    m === 'image/png' ||
    m === 'image/jpeg' ||
    m === 'image/jpg' ||
    m === 'image/webp' ||
    m === 'image/gif' ||
    m === 'image/svg+xml'
  );
}

/**
 * @param {string} name
 * @param {string} [mime]
 */
export function isPdfFile(name, mime = '') {
  const m = String(mime || '').toLowerCase();
  if (m === 'application/pdf') return true;
  return /\.pdf$/i.test(String(name || ''));
}

/**
 * ローカル投入で受け付けるか（Word/Excel/動画等は拒否）。
 * @param {File|Blob & { name?: string }} file
 */
export function isAcceptedLocalFile(file) {
  if (!file) return false;
  const mime = String(file.type || '').toLowerCase();
  const name = file.name || '';
  if (isPdfFile(name, mime)) return true;
  if (isSupportedImageMime(mime)) return true;
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(name)) return true;
  return false;
}

/**
 * ADR-CS-001 Input Bridge
 * 拡張子で落とさず、アプリ名で Clipboard へ橋渡しする。
 * @typedef {'excel'|'word'|'powerpoint'|'zip'|'folder'|'generic'} InputBridgeKind
 */

/** @type {Record<InputBridgeKind, string>} */
export const INPUT_BRIDGE_MESSAGES = {
  excel: 'Excelはセルをコピーすると表として置けます。',
  word: 'Wordは文章をコピーするとそのまま置けます。',
  powerpoint: 'PowerPointは画像や文字をコピーすると置けます。',
  zip: 'ZIPは解凍して画像やPDFを置いてください。',
  folder: 'フォルダではなく中のファイルを置いてください。',
  generic: '画像やPDFを置くか、セル・文章をコピーすると置けます。',
};

const BRIDGE_PRIORITY = /** @type {const} */ ([
  'folder',
  'excel',
  'word',
  'powerpoint',
  'zip',
  'generic',
]);

/**
 * @param {{ name?: string, type?: string, isDirectory?: boolean }} file
 * @returns {InputBridgeKind|null} 受け付け可能なら null
 */
export function classifyInputBridge(file) {
  if (!file) return 'generic';
  if (file.isDirectory) return 'folder';
  const mime = String(file.type || '').toLowerCase();
  const name = String(file.name || '');
  const lower = name.toLowerCase();

  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime === 'text/csv' ||
    /\.(xlsx?|xlsm|xlsb|csv)$/i.test(lower)
  ) {
    return 'excel';
  }
  if (
    mime.includes('wordprocessing') ||
    mime === 'application/msword' ||
    /\.(docx?|rtf)$/i.test(lower)
  ) {
    return 'word';
  }
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    /\.(pptx?|ppsx?)$/i.test(lower)
  ) {
    return 'powerpoint';
  }
  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime === 'application/x-7z-compressed' ||
    mime === 'application/vnd.rar' ||
    /\.(zip|7z|rar)$/i.test(lower)
  ) {
    return 'zip';
  }

  if (isAcceptedLocalFile({ name, type: mime })) return null;
  return 'generic';
}

/**
 * @param {Iterable<InputBridgeKind|null|undefined>} kinds
 * @returns {InputBridgeKind|null}
 */
export function primaryInputBridge(kinds) {
  const set = new Set([...kinds].filter(Boolean));
  if (!set.size) return null;
  for (const k of BRIDGE_PRIORITY) {
    if (set.has(k)) return k;
  }
  return 'generic';
}

/**
 * @param {InputBridgeKind|null|undefined} kind
 */
export function inputBridgeMessage(kind) {
  if (!kind) return '';
  return INPUT_BRIDGE_MESSAGES[kind] || INPUT_BRIDGE_MESSAGES.generic;
}

/**
 * File / Blob → Clipboard Paste と同型の入力。圧縮・再エンコードなし。
 * @param {File} file
 */
export async function readLocalFile(file) {
  if (!isAcceptedLocalFile(file)) return null;
  const mime = String(file.type || '').toLowerCase();
  const name = file.name || 'file';

  if (isPdfFile(name, mime)) {
    const ab = await file.arrayBuffer();
    return {
      kind: /** @type {const} */ ('pdf'),
      pdfData: ab,
      pdfBytes: ab.byteLength,
      pdfName: name.replace(/\.pdf$/i, '') || 'PDF',
    };
  }

  const imageMime =
    isSupportedImageMime(mime)
      ? mime === 'image/jpg'
        ? 'image/jpeg'
        : mime
      : guessImageMimeFromName(name);
  if (!imageMime) return null;
  const ab = await file.arrayBuffer();
  const blob = new Blob([ab], { type: imageMime });
  const dims = await imageDimensions(blob);
  return {
    kind: /** @type {const} */ ('image'),
    imageMime,
    imageData: ab,
    imageBytes: ab.byteLength,
    imageWidth: dims.width,
    imageHeight: dims.height,
  };
}

/**
 * @param {string} name
 */
function guessImageMimeFromName(name) {
  const n = String(name || '').toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.svg')) return 'image/svg+xml';
  return '';
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
 * 空白セルを通常インデックスとして扱い、targetSlot へそのまま置く。
 * 空きなら移動のみ（元位置は空白のまま）。占有なら入れ替え。
 * 他カードの自動詰め・圧縮はしない（空白に意味を与えない）。
 * @param {import('./clip-stash-engine.js').ClipStashCard[]} cards
 * @param {string} fromId
 * @param {number} targetSlot
 * @returns {{ id: string, order: number }[]}
 */
export function planMoveToSlot(cards, fromId, targetSlot) {
  if (!cards.length || !Number.isFinite(targetSlot) || targetSlot < 0) {
    return cards.map((c) => ({ id: c.id, order: c.order }));
  }
  const fromCard = cards.find((c) => c.id === fromId);
  if (!fromCard || fromCard.order === targetSlot) {
    return cards.map((c) => ({ id: c.id, order: c.order }));
  }
  const other = cards.find((c) => c.order === targetSlot);
  const fromSlot = fromCard.order;
  return cards.map((c) => {
    if (c.id === fromId) return { id: c.id, order: targetSlot };
    if (other && c.id === other.id) return { id: c.id, order: fromSlot };
    return { id: c.id, order: c.order };
  });
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
  if (paste.kind === 'pdf') {
    return {
      ...base,
      type: 'pdf',
      pdfData: paste.pdfData,
      pdfBytes: paste.pdfBytes,
      pdfName: paste.pdfName || 'PDF',
      pdfPreviewData: paste.pdfPreviewData,
      pdfPageCount: paste.pdfPageCount,
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
  if (m === 'image/gif') return 'GIF';
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
export function pdfBlob(card) {
  if (card.type !== 'pdf' || !card.pdfData) return null;
  return new Blob([card.pdfData], { type: 'application/pdf' });
}

/**
 * PDF 1ページ目プレビュー用（元 PDF は変更しない）。
 * @param {ClipStashCard} card
 */
export function pdfPreviewBlob(card) {
  if (card.type !== 'pdf' || !card.pdfPreviewData) return null;
  return new Blob([card.pdfPreviewData], { type: 'image/png' });
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
  if (card.type === 'pdf') {
    const blob = pdfBlob(card);
    if (!blob) throw new Error('empty');
    if (navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'application/pdf': blob })]);
        return;
      } catch {
        throw new Error('clipboard-pdf');
      }
    }
    throw new Error('clipboard-pdf');
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
 * 相対時間（描画時算出）。履歴ツール感を弱める。
 * @param {string} iso
 * @param {Date} [now]
 */
export function formatTimestamp(iso, now = new Date()) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'たった今';
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return 'たった今';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}分前`;

    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayDiff = Math.round((startToday - startThat) / 86400000);
    if (dayDiff === 0) {
      const hour = Math.floor(min / 60);
      return `${Math.max(1, hour)}時間前`;
    }
    if (dayDiff === 1) return '昨日';
    if (dayDiff > 1 && dayDiff < 7) return `${dayDiff}日前`;
    return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
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
  pdf: 'PDF',
};
