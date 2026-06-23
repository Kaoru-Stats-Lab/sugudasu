/**
 * 電子印鑑 — Canvas 描画（認印のみ · 透過 PNG）
 * SSOT: docs/notes/STAMP_TOOL_SPEC.md
 */

/** @typedef {'mincho' | 'gyosho'} StampFontStyle */

export const SIZE_PRESETS = [
  { id: 'invoice-user', label: '請求書・担当者印（42px）', px: 42 },
  { id: 'hd', label: '高解像度（400px）', px: 400 },
];

export const STAMP_GYOSHO_FAMILY = '"Yuji Boku", "HGP行書体", "HG行書体", "YuKyokasho Yoko", cursive';

const YUJI_BOKU_CSS = 'https://fonts.googleapis.com/css2?family=Yuji+Boku&display=swap';
let gyoshoFontPromise = null;

const DEFAULT_COLOR = '#c41e3a';
const FONT_MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';

/**
 * @param {string} text
 */
export function sanitizeStampText(text) {
  return String(text ?? '').trim().replace(/\s+/g, '').slice(0, 4);
}

/**
 * @param {StampFontStyle} style
 */
export function stampFontFamily(style) {
  return style === 'gyosho' ? STAMP_GYOSHO_FAMILY : FONT_MINCHO;
}

/**
 * @param {StampFontStyle} style
 */
export function stampFontWeight(style) {
  return style === 'gyosho' ? '400' : '700';
}

/**
 * @param {StampFontStyle} style
 */
export async function ensureStampFonts(style) {
  if (style !== 'gyosho') return;
  if (!gyoshoFontPromise) {
    gyoshoFontPromise = (async () => {
      const linkId = 'sg-stamp-yuji-boku';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = YUJI_BOKU_CSS;
        document.head.appendChild(link);
        await new Promise((resolve) => {
          link.addEventListener('load', resolve, { once: true });
          link.addEventListener('error', resolve, { once: true });
          window.setTimeout(resolve, 4000);
        });
      }
      if (document.fonts?.load) {
        await document.fonts.load(`400 48px ${STAMP_GYOSHO_FAMILY}`);
        await document.fonts.ready;
      }
    })();
  }
  await gyoshoFontPromise;
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function splitRoundChars(text) {
  return [...sanitizeStampText(text)];
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} fontFamily
 * @param {string[]} chars
 * @param {number} maxFont
 * @param {number} maxWidth
 * @param {number} maxHeight
 */
function fitRoundFontSize(ctx, fontFamily, fontWeight, chars, maxFont, maxWidth, maxHeight) {
  let lo = 8;
  let hi = maxFont;
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `${fontWeight} ${mid}px ${fontFamily}`;
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const maxW = Math.max(...widths, 0);
    const totalH = mid * chars.length * 1.08;
    if (maxW <= maxWidth && totalH <= maxHeight) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/**
 * 描画直前に物理・論理座標の両方で clearRect（Safari 透過 PNG 黒塗り対策）
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {number} logicalSize
 * @param {number} dpr
 */
function clearTransparentSurface(ctx, canvas, logicalSize, dpr) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, logicalSize, logicalSize);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   text: string,
 *   color?: string,
 *   fontStyle?: StampFontStyle,
 *   tiltDeg?: number,
 *   sizePx?: number,
 * }} opts
 */
export function renderStamp(canvas, opts) {
  const text = sanitizeStampText(opts.text);
  const color = opts.color || DEFAULT_COLOR;
  const fontStyle = opts.fontStyle === 'gyosho' ? 'gyosho' : 'mincho';
  const tiltDeg = Number(opts.tiltDeg) || 0;
  const sizePx = Math.max(32, Math.min(800, Number(opts.sizePx) || 400));

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const bitmapW = Math.round(sizePx * dpr);
  const bitmapH = Math.round(sizePx * dpr);
  canvas.width = bitmapW;
  canvas.height = bitmapH;
  canvas.style.width = `${sizePx}px`;
  canvas.style.height = `${sizePx}px`;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;

  clearTransparentSurface(ctx, canvas, sizePx, dpr);

  ctx.save();
  ctx.translate(sizePx / 2, sizePx / 2);
  ctx.rotate((tiltDeg * Math.PI) / 180);
  ctx.translate(-sizePx / 2, -sizePx / 2);

  drawRoundStamp(ctx, sizePx, text, color, fontStyle);

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

  const family = stampFontFamily(fontStyle);
  const fontWeight = stampFontWeight(fontStyle);
  const innerW = radius * 1.35;
  const innerH = radius * 1.55;
  const maxFont = Math.round(radius * (chars.length <= 2 ? 0.78 : chars.length === 3 ? 0.62 : 0.52));
  const fontPx = fitRoundFontSize(ctx, family, fontWeight, chars, maxFont, innerW, innerH);

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${fontWeight} ${fontPx}px ${family}`;

  if (chars.length === 1) {
    ctx.fillText(chars[0], cx, cy);
    return;
  }

  const lineH = fontPx * 1.08;
  const totalH = lineH * chars.length;
  let y = cy - totalH / 2 + lineH / 2;
  for (const ch of chars) {
    ctx.fillText(ch, cx, y);
    y += lineH;
  }
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
  a.download = filename || 'sugudasu-ninin.png';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function defaultFilename() {
  return 'sugudasu-ninin-user.png';
}

export const STAMP_DEFAULT_COLOR = DEFAULT_COLOR;
