/**
 * スクショ機密消し（Canvas · 非送信）
 * T09b · mask.html
 */

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_DIMENSION = 8192;
export const MAX_HISTORY = 20;

const ACCEPT_EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
const ACCEPT_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
]);

/** @param {File} file */
export function guessImageMime(file) {
  if (file.type && file.type.startsWith('image/')) return file.type;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const map = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
  };
  return map[ext] || '';
}

/** @param {File} file */
export function validateMaskInput(file) {
  const mime = guessImageMime(file);
  if (!mime || !ACCEPT_MIME.has(mime)) {
    return {
      ok: false,
      code: 'bad_type',
      message: 'PNG / JPEG / WebP / GIF 画像のみ対応です。',
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      code: 'too_large',
      message: `1ファイル ${Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB までです。`,
    };
  }
  return { ok: true, mime };
}

/**
 * @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1
 * @param {number} maxW @param {number} maxH
 */
export function normalizeRect(x0, y0, x1, y1, maxW, maxH) {
  let x = Math.min(x0, x1);
  let y = Math.min(y0, y1);
  let w = Math.abs(x1 - x0);
  let h = Math.abs(y1 - y0);
  x = Math.max(0, Math.min(x, maxW - 1));
  y = Math.max(0, Math.min(y, maxH - 1));
  w = Math.max(1, Math.min(w, maxW - x));
  h = Math.max(1, Math.min(h, maxH - y));
  return { x, y, w, h };
}

/** @param {CanvasRenderingContext2D} ctx */
export function applyBlackRect(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** @param {CanvasRenderingContext2D} ctx @param {HTMLCanvasElement} canvas */
export function applyBlurRect(ctx, canvas, x, y, w, h, radius = 8) {
  const amount = Math.max(2, Math.round(radius));
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext('2d');
  if (!tctx) return;
  tctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
  ctx.save();
  ctx.filter = `blur(${amount}px)`;
  ctx.drawImage(tmp, x, y);
  ctx.restore();
}

/** @param {CanvasRenderingContext2D} ctx @param {string} color */
export function applyColorRect(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color || '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} blockSize
 */
export function applyMosaicRect(ctx, x, y, w, h, blockSize = 12) {
  const imageData = ctx.getImageData(x, y, w, h);
  const { data } = imageData;
  const bs = Math.max(4, blockSize);
  for (let by = 0; by < h; by += bs) {
    for (let bx = 0; bx < w; bx += bs) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;
      const bh = Math.min(bs, h - by);
      const bw = Math.min(bs, w - bx);
      for (let py = 0; py < bh; py += 1) {
        for (let px = 0; px < bw; px += 1) {
          const i = ((by + py) * w + (bx + px)) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          a += data[i + 3];
          count += 1;
        }
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      a = Math.round(a / count);
      for (let py = 0; py < bh; py += 1) {
        for (let px = 0; px < bw; px += 1) {
          const i = ((by + py) * w + (bx + px)) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = a;
        }
      }
    }
  }
  ctx.putImageData(imageData, x, y);
}

/** @param {CanvasRenderingContext2D} ctx @param {string} text */
export function applyStampRect(ctx, x, y, w, h, text) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 214, 0, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(120, 90, 0, 0.9)';
  ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) / 80));
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const fontSize = Math.max(12, Math.min(48, Math.round(Math.min(w, h) * 0.35)));
  ctx.fillStyle = '#1e293b';
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
}

/** @param {HTMLCanvasElement} canvas */
export function snapshotCanvas(canvas) {
  return canvas.toDataURL('image/png');
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} dataUrl
 */
export function restoreSnapshot(canvas, ctx, dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = () => reject(new Error('履歴の復元に失敗しました。'));
    img.src = dataUrl;
  });
}

/** @param {File} file */
export function loadImageFromFile(file) {
  const check = validateMaskInput(file);
  if (!check.ok) {
    const err = new Error(check.message);
    err.code = check.code;
    throw err;
  }
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      let scaled = false;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        scaled = true;
      }
      resolve({ img, width, height, scaled, sourceName: file.name || 'screenshot.png' });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました。'));
    };
    img.src = url;
  });
}

/** @param {DataTransfer|null|undefined} dt */
export function imageFileFromClipboard(dt) {
  if (!dt) return null;
  const items = Array.from(dt.items || []);
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

/** @param {string} sourceName */
export function outputFilename(sourceName) {
  const base = (sourceName || 'screenshot').split(/[/\\]/).pop() || 'screenshot';
  const stem = base.replace(/\.[^.]+$/, '') || 'screenshot';
  return `${stem}-masked.png`;
}

/** @param {HTMLCanvasElement} canvas */
export function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('PNG の生成に失敗しました。'));
        else resolve(blob);
      },
      'image/png',
    );
  });
}

/** @param {HTMLCanvasElement} canvas */
export async function copyCanvasPng(canvas) {
  const blob = await canvasToPngBlob(canvas);
  if (!navigator.clipboard || !window.ClipboardItem) {
    const err = new Error('このブラウザではクリップボードへの画像コピーに未対応です。PNGダウンロードをご利用ください。');
    err.code = 'clipboard_unsupported';
    throw err;
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export { ACCEPT_EXT };
