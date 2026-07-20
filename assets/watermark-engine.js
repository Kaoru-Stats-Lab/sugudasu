/**
 * SUGUDASU 透かし — 純ロジック（Canvas / ZIP）
 * docs/notes/WATERMARK_TOOL_SPEC.md
 *
 * 事故防止制約（要約）:
 * - Promise.all 禁止 · for...of + await のみ
 * - Canvas 使い回し · 終了後 width/height = 1
 * - ImageBitmap.close · ObjectURL.revoke 必須
 * - toDataURL 禁止 · toBlob のみ
 * - ZIP は STORE（無圧縮）
 * - createImageBitmap 時 imageOrientation: "from-image"
 * - 文字描画前に document.fonts.ready
 * - ロゴは透明余白除去後にスケール
 * - imageSmoothingQuality = "high"
 * - fontSize = min(long×ratio, short×limit) + measureText 縮小
 * - DOM / alert / confirm 禁止
 */

export const MAX_FILES = 20;
export const MAX_EDGE = 4096;
export const SUFFIX_MAX_LEN = 30;
export const TEXT_RATIO_LONG = 0.045;
export const TEXT_RATIO_SHORT = 0.12;
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

/** @type {HTMLCanvasElement|null} */
let sharedCanvas = null;
/** @type {HTMLCanvasElement|null} */
let auxCanvas = null;

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
 * @returns {HTMLCanvasElement}
 */
export function acquireCanvas() {
  if (typeof document === 'undefined') {
    throw new Error('canvas-unavailable');
  }
  if (!sharedCanvas) sharedCanvas = document.createElement('canvas');
  return sharedCanvas;
}

/**
 * @param {HTMLCanvasElement} [canvas]
 */
export function releaseCanvas(canvas) {
  const c = canvas || sharedCanvas;
  if (!c) return;
  try {
    c.width = 1;
    c.height = 1;
  } catch {
    /* ignore */
  }
}

/**
 * @returns {HTMLCanvasElement}
 */
function acquireAuxCanvas() {
  if (typeof document === 'undefined') throw new Error('canvas-unavailable');
  if (!auxCanvas) auxCanvas = document.createElement('canvas');
  return auxCanvas;
}

/**
 * @param {string} name
 * @returns {string}
 */
export function sanitizeBaseName(name) {
  let s = String(name || '')
    .normalize('NFKC')
    .replace(/\.[^.\\/]+$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\t\r\n]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (!s || /^[._-]+$/.test(s)) s = 'image';
  if (s.length > 80) s = s.slice(0, 80);
  return s;
}

/**
 * 接尾辞用サニタイズ（約 30 文字上限）
 * @param {string} raw
 * @param {number} [maxLen]
 * @returns {string}
 */
export function sanitizeSuffix(raw, maxLen = SUFFIX_MAX_LEN) {
  let s = String(raw || '')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  if (s.length > maxLen) {
    // 自然な切れ目（空白・句読点）を優先
    const cut = s.slice(0, maxLen);
    const breakAt = Math.max(
      cut.lastIndexOf(' '),
      cut.lastIndexOf('、'),
      cut.lastIndexOf('。'),
      cut.lastIndexOf('_'),
      cut.lastIndexOf('-')
    );
    s = (breakAt >= Math.floor(maxLen * 0.5) ? cut.slice(0, breakAt) : cut).trim();
  }
  s = s.replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return s;
}

/**
 * @param {string} fileName
 * @param {Set<string>|null|undefined} usedNames
 * @returns {string}
 */
export function uniquifyFileName(fileName, usedNames) {
  const name = String(fileName || 'image.png');
  if (!usedNames) return name;
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }
  const m = name.match(/^(.*?)(\.[^.]+)$/);
  const stem = m ? m[1] : name;
  const ext = m ? m[2] : '';
  let i = 1;
  let candidate;
  do {
    candidate = `${stem} (${i})${ext}`;
    i += 1;
  } while (usedNames.has(candidate));
  usedNames.add(candidate);
  return candidate;
}

/**
 * @param {{
 *   sourceName: string,
 *   appendWatermarkToName?: boolean,
 *   mode?: 'text'|'logo',
 *   text?: string,
 *   logoFileName?: string,
 *   usedNames?: Set<string>|null,
 * }} opts
 * @returns {string}
 */
export function buildOutputFileName(opts) {
  // 互換: 旧 signature buildOutputFileName(sourceName, index1based)
  if (typeof opts === 'string') {
    const sourceName = opts;
    const index1based = arguments[1];
    const n = Math.max(1, Math.floor(Number(index1based) || 1));
    return `${sanitizeBaseName(sourceName)}_wm_${String(n).padStart(2, '0')}.png`;
  }

  const sourceName = opts?.sourceName || 'image.png';
  const base = sanitizeBaseName(sourceName);
  let stem = base;

  if (opts?.appendWatermarkToName) {
    const mode = opts.mode === 'logo' ? 'logo' : 'text';
    let suffix = '';
    if (mode === 'logo') {
      const rawLogo = String(opts.logoFileName || '').trim();
      // ファイル名が取れないときのみ "logo"（sanitizeBaseName('') の "image" に落とさない）
      suffix = rawLogo
        ? sanitizeSuffix(sanitizeBaseName(rawLogo)) || 'logo'
        : 'logo';
    } else {
      suffix = sanitizeSuffix(opts.text || '') || 'CONFIDENTIAL';
    }
    stem = `${base}_${suffix}`;
  }

  return uniquifyFileName(`${stem}.png`, opts?.usedNames);
}

/**
 * @param {File|Blob|{type?:string,name?:string}|null} file
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
 * 透明ピクセル余白を除去したソース矩形。
 * @param {ImageData} imageData
 * @param {number} [alphaThreshold]
 * @returns {{ sx: number, sy: number, sw: number, sh: number }|null}
 */
export function findOpaqueBounds(imageData, alphaThreshold = 8) {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || maxY < 0) return null;
  return {
    sx: minX,
    sy: minY,
    sw: maxX - minX + 1,
    sh: maxY - minY + 1,
  };
}

/**
 * ロゴを透明余白除去して aux canvas に描画。戻り値は描画済み canvas と実寸。
 * @param {CanvasImageSource} logo
 * @param {number} natW
 * @param {number} natH
 * @returns {{ canvas: HTMLCanvasElement, w: number, h: number }}
 */
export function prepareTrimmedLogo(logo, natW, natH) {
  const srcW = Math.max(1, Math.floor(natW) || 1);
  const srcH = Math.max(1, Math.floor(natH) || 1);
  const scratch = acquireAuxCanvas();
  scratch.width = srcW;
  scratch.height = srcH;
  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!sctx) throw new Error('no-2d');
  sctx.clearRect(0, 0, srcW, srcH);
  sctx.drawImage(logo, 0, 0);

  let bounds = null;
  try {
    bounds = findOpaqueBounds(sctx.getImageData(0, 0, srcW, srcH));
  } catch {
    bounds = null;
  }
  if (!bounds) {
    return { canvas: scratch, w: srcW, h: srcH };
  }

  // 同一 canvas を再利用するため、resize 前に裁断面をコピーする
  const cropped = sctx.getImageData(bounds.sx, bounds.sy, bounds.sw, bounds.sh);
  scratch.width = bounds.sw;
  scratch.height = bounds.sh;
  const octx = scratch.getContext('2d');
  if (!octx) throw new Error('no-2d');
  octx.putImageData(cropped, 0, 0);
  return { canvas: scratch, w: bounds.sw, h: bounds.sh };
}

/**
 * fontSize = min(longSide × ratio, shortSide × limit) のあと measureText で収まるまで縮小。
 * DECISION: 省略・折返し禁止。極端な縦長でも shortSide 上限で破綻させない。
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} canvasW
 * @param {number} canvasH
 * @returns {{ fontPx: number, markW: number, markH: number, text: string }}
 */
export function measureTextMark(ctx, text, canvasW, canvasH = canvasW) {
  const raw = String(text || '').trim() || 'CONFIDENTIAL';
  const longSide = Math.max(canvasW, canvasH);
  const shortSide = Math.min(canvasW, canvasH);
  let fontPx = Math.max(
    10,
    Math.floor(Math.min(longSide * TEXT_RATIO_LONG, shortSide * TEXT_RATIO_SHORT))
  );

  const maxW = Math.max(16, canvasW * 0.9);
  const fontFamily = '"Noto Sans JP", "Hiragino Sans", Meiryo, sans-serif';

  for (;;) {
    ctx.font = `700 ${fontPx}px ${fontFamily}`;
    const metrics = ctx.measureText(raw);
    const markW = Math.ceil(metrics.width);
    if (markW <= maxW || fontPx <= 10) {
      const markH = Math.ceil(fontPx * 1.35);
      return { fontPx, markW, markH, text: raw };
    }
    fontPx -= 1;
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   mode: 'text'|'logo',
 *   text?: string,
 *   logo?: CanvasImageSource,
 *   logoNaturalW?: number,
 *   logoNaturalH?: number,
 *   logoTrimmed?: { canvas: HTMLCanvasElement, w: number, h: number }|null,
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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = opacity;

  if (opts.mode === 'logo' && (opts.logoTrimmed || opts.logo)) {
    const trimmed =
      opts.logoTrimmed ||
      prepareTrimmedLogo(
        opts.logo,
        opts.logoNaturalW || opts.logo.width || 1,
        opts.logoNaturalH || opts.logo.height || 1
      );
    const natW = Math.max(1, trimmed.w);
    const natH = Math.max(1, trimmed.h);
    const targetW = Math.max(24, Math.round(canvas.width * 0.18));
    const scale = targetW / natW;
    const markW = targetW;
    const markH = Math.max(24, Math.round(natH * scale));
    const { x, y } = anchorPoint(canvas.width, canvas.height, markW, markH, position);
    ctx.drawImage(trimmed.canvas, x, y, markW, markH);
  } else {
    const measured = measureTextMark(ctx, opts.text, canvas.width, canvas.height);
    const { fontPx, markW, markH, text } = measured;
    const { x, y } = anchorPoint(canvas.width, canvas.height, markW, markH, position);
    ctx.font = `700 ${fontPx}px "Noto Sans JP", "Hiragino Sans", Meiryo, sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  ctx.restore();
}

/**
 * @param {File|Blob} file
 * @returns {Promise<{ bitmap: ImageBitmap|HTMLImageElement, width: number, height: number, close: () => void }>}
 */
export async function decodeImageFile(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => {
          try {
            bitmap.close();
          } catch {
            /* ignore */
          }
        },
      };
    } catch {
      /* fallback below */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('load-failed'));
      el.src = url;
    });
    return {
      bitmap: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      close: () => {
        URL.revokeObjectURL(url);
      },
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} [mime]
 * @param {number} [quality]
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, mime = 'image/png', quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob-failed'))),
        mime,
        quality
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 1 枚を逐次処理して PNG Blob を返す。Canvas / bitmap を必ず解放。
 * @param {File|Blob} file
 * @param {{
 *   mode: 'text'|'logo',
 *   text?: string,
 *   logoFile?: File|Blob|null,
 *   logoBitmap?: ImageBitmap|HTMLImageElement|null,
 *   logoNaturalW?: number,
 *   logoNaturalH?: number,
 *   position: string,
 *   opacity: number,
 * }} opts
 * @returns {Promise<{ blob: Blob, width: number, height: number, scaled: boolean }>}
 */
export async function renderOneToPngBlob(file, opts) {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = acquireCanvas();
  let decoded = null;
  let logoDecoded = null;
  let logoTrimmed = null;

  try {
    decoded = await decodeImageFile(file);
    const fitted = fitWithinMaxEdge(decoded.width, decoded.height, MAX_EDGE);
    canvas.width = fitted.w;
    canvas.height = fitted.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no-2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, fitted.w, fitted.h);
    ctx.drawImage(decoded.bitmap, 0, 0, fitted.w, fitted.h);

    if (opts.mode === 'logo') {
      if (opts.logoBitmap) {
        logoTrimmed = prepareTrimmedLogo(
          opts.logoBitmap,
          opts.logoNaturalW || opts.logoBitmap.width || 1,
          opts.logoNaturalH || opts.logoBitmap.height || 1
        );
      } else if (opts.logoFile) {
        logoDecoded = await decodeImageFile(opts.logoFile);
        logoTrimmed = prepareTrimmedLogo(logoDecoded.bitmap, logoDecoded.width, logoDecoded.height);
      } else {
        throw new Error('logo-missing');
      }
    }

    drawWatermark(canvas, {
      mode: opts.mode,
      text: opts.text,
      logoTrimmed,
      position: opts.position,
      opacity: opts.opacity,
    });

    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, width: fitted.w, height: fitted.h, scaled: fitted.scaled };
  } finally {
    if (decoded) decoded.close();
    if (logoDecoded) logoDecoded.close();
    releaseCanvas(canvas);
    if (auxCanvas) {
      try {
        auxCanvas.width = 1;
        auxCanvas.height = 1;
      } catch {
        /* ignore */
      }
    }
  }
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

/**
 * @deprecated UI 互換用 · 新規は renderOneToPngBlob
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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, fitted.w, fitted.h);
  drawWatermark(canvas, opts);
  return canvas;
}
