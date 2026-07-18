/**
 * SUGUDASU 透かし — 純ロジック（Canvas / ZIP）
 * docs/notes/WATERMARK_TOOL_SPEC.md
 */

export const MAX_FILES = 20;
export const MAX_EDGE = 4096;
export const OPACITY_STEPS = Object.freeze([0.2, 0.4, 0.6]);
export const POSITIONS = Object.freeze([
  'tl', 'tc', 'tr',
  'ml', 'mc', 'mr',
  'bl', 'bc', 'br',
]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

/**
 * @param {Uint8Array} data
 * @returns {number}
 */
export function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * @param {string} name
 * @returns {string}
 */
export function sanitizeBaseName(name) {
  let s = String(name || '')
    .replace(/\.[^.\\/]+$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!s || /^[._-]+$/.test(s)) s = 'image';
  if (s.length > 80) s = s.slice(0, 80);
  return s;
}

/**
 * @param {string} sourceName
 * @param {number} index1based
 * @returns {string}
 */
export function buildOutputFileName(sourceName, index1based) {
  const n = Math.max(1, Math.floor(Number(index1based) || 1));
  return `${sanitizeBaseName(sourceName)}_wm_${String(n).padStart(2, '0')}.png`;
}

/**
 * @param {File|Blob} file
 * @returns {boolean}
 */
export function isAcceptedImageFile(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type === 'image/png' || type === 'image/jpeg' || type === 'image/webp') return true;
  const name = String(file.name || '').toLowerCase();
  return /\.(png|jpe?g|webp)$/.test(name);
}

/**
 * @param {number} opacity
 * @returns {number}
 */
export function snapOpacity(opacity) {
  const n = Number(opacity);
  if (!Number.isFinite(n)) return 0.4;
  let best = OPACITY_STEPS[1];
  let bestDist = Infinity;
  for (const step of OPACITY_STEPS) {
    const d = Math.abs(step - n);
    if (d < bestDist) {
      bestDist = d;
      best = step;
    }
  }
  return best;
}

/**
 * @param {string} pos
 * @returns {string}
 */
export function normalizePosition(pos) {
  const p = String(pos || '').toLowerCase();
  return POSITIONS.includes(p) ? p : 'br';
}

/**
 * @param {number} canvasW
 * @param {number} canvasH
 * @param {number} markW
 * @param {number} markH
 * @param {string} position
 * @param {number} [marginRatio]
 * @returns {{ x: number, y: number }}
 */
export function anchorPoint(canvasW, canvasH, markW, markH, position, marginRatio = 0.04) {
  const pos = normalizePosition(position);
  const mx = Math.max(8, canvasW * marginRatio);
  const my = Math.max(8, canvasH * marginRatio);
  const col = pos[1] === 'l' ? 0 : pos[1] === 'c' ? 1 : 2;
  const row = pos[0] === 't' ? 0 : pos[0] === 'm' ? 1 : 2;
  const usableW = Math.max(0, canvasW - markW - mx * 2);
  const usableH = Math.max(0, canvasH - markH - my * 2);
  const x = mx + (col === 0 ? 0 : col === 1 ? usableW / 2 : usableW);
  const y = my + (row === 0 ? 0 : row === 1 ? usableH / 2 : usableH);
  return { x, y };
}

/**
 * @param {number} srcW
 * @param {number} srcH
 * @param {number} [maxEdge]
 * @returns {{ w: number, h: number, scaled: boolean }}
 */
export function fitWithinMaxEdge(srcW, srcH, maxEdge = MAX_EDGE) {
  const w = Math.max(1, Math.floor(srcW) || 1);
  const h = Math.max(1, Math.floor(srcH) || 1);
  const edge = Math.max(w, h);
  if (edge <= maxEdge) return { w, h, scaled: false };
  const scale = maxEdge / edge;
  return {
    w: Math.max(1, Math.round(w * scale)),
    h: Math.max(1, Math.round(h * scale)),
    scaled: true,
  };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} canvasW
 * @returns {{ fontPx: number, markW: number, markH: number }}
 */
export function measureTextMark(ctx, text, canvasW) {
  const raw = String(text || '').trim() || 'CONFIDENTIAL';
  const fontPx = Math.max(14, Math.min(72, Math.round(canvasW * 0.045)));
  ctx.font = `700 ${fontPx}px "Noto Sans JP", "Hiragino Sans", Meiryo, sans-serif`;
  const metrics = ctx.measureText(raw);
  const markW = Math.ceil(metrics.width);
  const markH = Math.ceil(fontPx * 1.35);
  return { fontPx, markW, markH };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   mode: 'text'|'logo',
 *   text?: string,
 *   logo?: CanvasImageSource,
 *   logoNaturalW?: number,
 *   logoNaturalH?: number,
 *   position: string,
 *   opacity: number,
 * }} opts
 */
export function drawWatermark(canvas, opts) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no-2d');
  const opacity = snapOpacity(opts.opacity);
  const position = normalizePosition(opts.position);
  ctx.save();
  ctx.globalAlpha = opacity;

  if (opts.mode === 'logo' && opts.logo) {
    const natW = Math.max(1, opts.logoNaturalW || opts.logo.width || 1);
    const natH = Math.max(1, opts.logoNaturalH || opts.logo.height || 1);
    const targetW = Math.max(24, Math.round(canvas.width * 0.18));
    const scale = targetW / natW;
    const markW = targetW;
    const markH = Math.max(24, Math.round(natH * scale));
    const { x, y } = anchorPoint(canvas.width, canvas.height, markW, markH, position);
    ctx.drawImage(opts.logo, x, y, markW, markH);
  } else {
    const text = String(opts.text || '').trim() || 'CONFIDENTIAL';
    const { fontPx, markW, markH } = measureTextMark(ctx, text, canvas.width);
    const { x, y } = anchorPoint(canvas.width, canvas.height, markW, markH, position);
    ctx.font = `700 ${fontPx}px "Noto Sans JP", "Hiragino Sans", Meiryo, sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  ctx.restore();
}

/**
 * @param {HTMLImageElement} image
 * @param {Parameters<typeof drawWatermark>[1]} opts
 * @returns {HTMLCanvasElement}
 */
export function renderWatermarkedCanvas(image, opts) {
  const fitted = fitWithinMaxEdge(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const canvas = document.createElement('canvas');
  canvas.width = fitted.w;
  canvas.height = fitted.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no-2d');
  ctx.drawImage(image, 0, 0, fitted.w, fitted.h);
  drawWatermark(canvas, opts);
  return canvas;
}

/**
 * Store-method ZIP（無圧縮）— PNG 向け。外部依存なし。
 * @param {{ name: string, data: Uint8Array }[]} files
 * @returns {Uint8Array}
 */
export function buildStoreZip(files) {
  const parts = [];
  const central = [];
  let offset = 0;

  const enc = new TextEncoder();
  for (const file of files) {
    const nameBytes = enc.encode(file.name.replace(/\\/g, '/'));
    const data = file.data;
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cd.set(nameBytes, 46);

    parts.push(local, data);
    central.push(cd);
    offset += local.length + data.length;
  }

  const centralSize = central.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const total = offset + centralSize + end.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of parts) {
    out.set(part, p);
    p += part.length;
  }
  for (const c of central) {
    out.set(c, p);
    p += c.length;
  }
  out.set(end, p);
  return out;
}
