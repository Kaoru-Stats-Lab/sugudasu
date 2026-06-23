/**
 * 電子印鑑 — Canvas 描画（透過 PNG）
 * SSOT: docs/notes/STAMP_TOOL_SPEC.md
 */

/** @typedef {'round' | 'square'} StampType */
/** @typedef {'mincho' | 'kointai'} StampFontStyle */

export const SIZE_PRESETS = [
  { id: 'invoice-user', label: '請求書・担当者印（42px）', px: 42, slot: 'user' },
  { id: 'invoice-comp', label: '請求書・社印（62px）', px: 62, slot: 'comp' },
  { id: 'hd', label: '高解像度（400px）', px: 400, slot: null },
];

const DEFAULT_COLOR = '#c41e3a';

const FONT_MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
const FONT_KOINTAI = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';

/**
 * @param {string} text
 * @param {StampType} type
 */
export function sanitizeStampText(text, type) {
  const raw = String(text ?? '').trim();
  if (type === 'round') {
    return raw.replace(/\s+/g, '').slice(0, 4);
  }
  return raw.replace(/\r/g, '').slice(0, 24);
}

/**
 * @param {StampFontStyle} style
 */
function fontFamily(style) {
  return style === 'kointai' ? FONT_KOINTAI : FONT_MINCHO;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {StampFontStyle} style
 */
function applyFontStyle(ctx, style) {
  if (style === 'kointai') {
    ctx.font = ctx.font.replace(/(\d+px)/, (_, px) => `${Math.round(Number(px) * 1.05)}px`);
    ctx.letterSpacing = '0.12em';
  }
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function splitSquareLines(text) {
  if (text.includes('\n')) {
    return text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4);
  }
  const flat = text.replace(/\s+/g, '');
  if (flat.length <= 4) return [flat];
  if (flat.length <= 8) {
    const mid = Math.ceil(flat.length / 2);
    return [flat.slice(0, mid), flat.slice(mid)];
  }
  const lines = [];
  for (let i = 0; i < flat.length && lines.length < 4; i += 3) {
    lines.push(flat.slice(i, i + 3));
  }
  return lines;
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function splitRoundChars(text) {
  return [...text.replace(/\s+/g, '')].slice(0, 4);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   type: StampType,
 *   text: string,
 *   color?: string,
 *   fontStyle?: StampFontStyle,
 *   tiltDeg?: number,
 *   sizePx?: number,
 * }} opts
 */
export function renderStamp(canvas, opts) {
  const type = opts.type === 'square' ? 'square' : 'round';
  const text = sanitizeStampText(opts.text, type);
  const color = opts.color || DEFAULT_COLOR;
  const fontStyle = opts.fontStyle === 'kointai' ? 'kointai' : 'mincho';
  const tiltDeg = Number(opts.tiltDeg) || 0;
  const sizePx = Math.max(32, Math.min(800, Number(opts.sizePx) || 400));

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  canvas.width = Math.round(sizePx * dpr);
  canvas.height = Math.round(sizePx * dpr);
  canvas.style.width = `${sizePx}px`;
  canvas.style.height = `${sizePx}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, sizePx, sizePx);

  ctx.save();
  ctx.translate(sizePx / 2, sizePx / 2);
  ctx.rotate((tiltDeg * Math.PI) / 180);
  ctx.translate(-sizePx / 2, -sizePx / 2);

  if (type === 'round') {
    drawRoundStamp(ctx, sizePx, text, color, fontStyle);
  } else {
    drawSquareStamp(ctx, sizePx, text, color, fontStyle);
  }

  ctx.restore();
  return canvas.toDataURL('image/png');
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size
 * @param {string} text
 * @param {string} color
 * @param {StampFontStyle} fontStyle
 */
function drawRoundStamp(ctx, size, text, color, fontStyle) {
  const pad = size * 0.08;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - pad;

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.035);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  const chars = splitRoundChars(text);
  if (!chars.length) return;

  const count = chars.length;
  const baseFont = Math.round(radius * (count <= 2 ? 0.72 : count === 3 ? 0.58 : 0.48));
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${baseFont}px ${fontFamily(fontStyle)}`;
  applyFontStyle(ctx, fontStyle);

  if (count === 1) {
    ctx.fillText(chars[0], cx, cy);
    return;
  }

  const lineH = baseFont * 1.05;
  const totalH = lineH * count;
  let y = cy - totalH / 2 + lineH / 2;
  for (const ch of chars) {
    ctx.fillText(ch, cx, y);
    y += lineH;
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size
 * @param {string} text
 * @param {string} color
 * @param {StampFontStyle} fontStyle
 */
function drawSquareStamp(ctx, size, text, color, fontStyle) {
  const pad = size * 0.1;
  const w = size - pad * 2;
  const h = size - pad * 2;
  const x = pad;
  const y = pad;

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.028);
  ctx.strokeRect(x, y, w, h);

  const inner = size * 0.04;
  ctx.lineWidth = Math.max(1, size * 0.012);
  ctx.strokeRect(x + inner, y + inner, w - inner * 2, h - inner * 2);

  const lines = splitSquareLines(text);
  if (!lines.length) return;

  const lineCount = lines.length;
  const baseFont = Math.round((h / lineCount) * 0.55);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${baseFont}px ${fontFamily(fontStyle)}`;
  applyFontStyle(ctx, fontStyle);

  const lineH = h / lineCount;
  lines.forEach((line, i) => {
    const cy = y + lineH * i + lineH / 2;
    ctx.fillText(line, x + w / 2, cy);
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('blob'));
    }, 'image/png');
  });
}

/**
 * @param {string} dataUrl
 * @param {string} filename
 */
export function downloadPngDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || 'sugudasu-stamp.png';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * @param {StampType} type
 * @param {StampSlot|null} slotHint
 */
export function defaultFilename(type, slotHint) {
  const kind = type === 'square' ? 'kakuin' : 'ninin';
  const slot = slotHint === 'comp' ? 'comp' : slotHint === 'user' ? 'user' : 'export';
  return `sugudasu-${kind}-${slot}.png`;
}

/** @typedef {'user' | 'comp'} StampSlot */

/**
 * @param {StampType} type
 * @returns {StampSlot}
 */
export function typeToDefaultSlot(type) {
  return type === 'square' ? 'comp' : 'user';
}

export const STAMP_DEFAULT_COLOR = DEFAULT_COLOR;
