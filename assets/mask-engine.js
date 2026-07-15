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

/** 注釈（固定色 · 白フチ · 影）— 本家 Skitch 型の塗り矢印 */
export const ANNOTATE_MAGENTA = '#FF007F';
export const ANNOTATE_WHITE = '#ffffff';
/** @deprecated 実描画は annotateStrokeWidths / skitch パスを使う */
export const ANNOTATE_STROKE_INNER = 12;
/** @deprecated */
export const ANNOTATE_STROKE_OUTER = 22;
export const ANNOTATE_HIT_PAD = 32;
export const ANNOTATE_HANDLE_R = 14;

/**
 * @param {CanvasRenderingContext2D} ctx
 */
export function annotateStrokeWidths(ctx) {
  const base = Math.min(ctx.canvas.width, ctx.canvas.height) || 900;
  const s = Math.max(1, Math.min(2.6, base / 700));
  return {
    inner: Math.round(10 * s),
    outer: Math.round(18 * s),
    scale: s,
  };
}

/**
 * @typedef {{ id: string, type: 'arrow', x0: number, y0: number, x1: number, y1: number }} ArrowShape
 * @typedef {{ id: string, type: 'rect', x: number, y: number, w: number, h: number }} RectShape
 * @typedef {ArrowShape|RectShape} AnnotateShape
 */

/**
 * Skitch 型矢印のローカル座標パス（原点=始点 · +X=先端方向）。
 * DECISION: PinkArrows の平行シャフトではなく、尾が尖りヘッドでフレアする
 * PureMark Annotate 系の 6 点シルエット（+ わずかなバーブ）に白フチと影を足す。
 * @param {number} len
 * @param {number} unit  太さの単位（画像短辺連動）
 * @returns {Path2D}
 */
function skitchArrowPath(len, unit) {
  const headHalf = unit * 10;
  const shaftHalf = unit * 3.5;
  const headLen = Math.min(len * 0.4, unit * 12);
  const shaftLen = Math.max(1, len - headLen);
  // わずかにバーブを後ろへ（垂直エッジの「安い三角」感を避ける）
  const wingX = Math.max(shaftLen * 0.55, shaftLen - headLen * 0.12);
  const path = new Path2D();
  path.moveTo(0, 0);
  path.lineTo(shaftLen, shaftHalf);
  path.lineTo(wingX, headHalf);
  path.lineTo(len, 0);
  path.lineTo(wingX, -headHalf);
  path.lineTo(shaftLen, -shaftHalf);
  path.closePath();
  return path;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1
 * @param {boolean} [selected]
 */
export function drawArrow(ctx, x0, y0, x1, y1, selected = false) {
  const { scale } = annotateStrokeWidths(ctx);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  // 短すぎても「極細線」に落ちない下限、長すぎてもヘッドが暴走しない上限
  const unit = Math.max(2.8, Math.min(6.5, 3.4 * scale, len * 0.028));
  const path = skitchArrowPath(len, unit);
  const whiteW = Math.max(2.5, 2.8 * scale);

  ctx.save();
  ctx.translate(x0, y0);
  ctx.rotate(angle);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // ドロップシャドウ（本体の下にうっすら）
  ctx.save();
  ctx.translate(2.5 * scale, 4 * scale);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  try {
    ctx.filter = `blur(${Math.max(3, 5 * scale)}px)`;
  } catch {
    /* filter 非対応はオフセット塗りだけ */
  }
  ctx.fill(path);
  ctx.restore();
  ctx.filter = 'none';

  ctx.fillStyle = ANNOTATE_MAGENTA;
  ctx.fill(path);
  ctx.strokeStyle = ANNOTATE_WHITE;
  ctx.lineWidth = whiteW;
  ctx.stroke(path);
  ctx.restore();

  if (selected) {
    const hr = Math.max(7, 7 * scale);
    ctx.save();
    ctx.fillStyle = ANNOTATE_WHITE;
    ctx.strokeStyle = ANNOTATE_MAGENTA;
    ctx.lineWidth = Math.max(2, Math.round(2.5 * scale));
    for (const [x, y] of [[x0, y0], [x1, y1]]) {
      ctx.beginPath();
      ctx.arc(x, y, hr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x @param {number} y @param {number} w @param {number} h
 * @param {boolean} [selected]
 */
export function drawRoundedFrame(ctx, x, y, w, h, selected = false) {
  const { scale } = annotateStrokeWidths(ctx);
  // Skitch 枠: マゼンタ太線 + 白フチ（見える白帯は片側≒2–3px · 本体の約20–30%）
  // DECISION: 白16–20はステッカー過多。白 = マゼンタ + 4〜5（片側2〜2.5）が2020年代の読みやすさ上限。
  const magentaW = Math.max(10, Math.round(12 * scale));
  const whiteW = magentaW + Math.max(4, Math.round(5 * scale));
  const r = Math.min(14 * scale, Math.max(6, Math.min(w, h) * 0.1));
  const strokeOnce = (color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.stroke();
  };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = Math.max(4, 6 * scale);
  ctx.shadowOffsetX = 2 * scale;
  ctx.shadowOffsetY = 3 * scale;
  strokeOnce(ANNOTATE_WHITE, whiteW);
  ctx.shadowColor = 'transparent';
  strokeOnce(ANNOTATE_MAGENTA, magentaW);
  if (selected) {
    const hr = Math.max(7, 7 * scale);
    ctx.fillStyle = ANNOTATE_WHITE;
    ctx.strokeStyle = ANNOTATE_MAGENTA;
    ctx.lineWidth = Math.max(2, Math.round(2.5 * scale));
    for (const [cx, cy] of [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h],
    ]) {
      ctx.beginPath();
      ctx.arc(cx, cy, hr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** @param {AnnotateShape} shape @param {boolean} [selected] */
export function drawAnnotateShape(ctx, shape, selected = false) {
  if (shape.type === 'arrow') {
    drawArrow(ctx, shape.x0, shape.y0, shape.x1, shape.y1, selected);
  } else {
    drawRoundedFrame(ctx, shape.x, shape.y, shape.w, shape.h, selected);
  }
}

function distToSegment(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x0, py - y0);
  let t = ((px - x0) * dx + (py - y0) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

/** @param {ArrowShape} shape */
export function hitTestArrow(shape, px, py, pad = ANNOTATE_HIT_PAD) {
  const strokePad = Math.max(pad, ANNOTATE_STROKE_OUTER);
  if (Math.hypot(px - shape.x0, py - shape.y0) <= ANNOTATE_HANDLE_R) return 'start';
  if (Math.hypot(px - shape.x1, py - shape.y1) <= ANNOTATE_HANDLE_R) return 'end';
  if (distToSegment(px, py, shape.x0, shape.y0, shape.x1, shape.y1) <= strokePad) return 'body';
  return null;
}

/** @param {RectShape} shape */
export function hitTestRoundedFrame(shape, px, py, pad = ANNOTATE_HIT_PAD) {
  const { x, y, w, h } = shape;
  const corners = [
    ['nw', x, y],
    ['ne', x + w, y],
    ['sw', x, y + h],
    ['se', x + w, y + h],
  ];
  for (const [name, cx, cy] of corners) {
    if (Math.hypot(px - cx, py - cy) <= ANNOTATE_HANDLE_R) return name;
  }
  const nearLeft = Math.abs(px - x) <= pad && py >= y - pad && py <= y + h + pad;
  const nearRight = Math.abs(px - (x + w)) <= pad && py >= y - pad && py <= y + h + pad;
  const nearTop = Math.abs(py - y) <= pad && px >= x - pad && px <= x + w + pad;
  const nearBottom = Math.abs(py - (y + h)) <= pad && px >= x - pad && px <= x + w + pad;
  const inside = px >= x && px <= x + w && py >= y && py <= y + h;
  const inRim = inside && (nearLeft || nearRight || nearTop || nearBottom
    || px <= x + pad || px >= x + w - pad || py <= y + pad || py >= y + h - pad);
  if (nearLeft || nearRight || nearTop || nearBottom || inRim) return 'body';
  return null;
}

/**
 * @param {AnnotateShape[]} shapes
 * @param {number} px @param {number} py
 * @returns {{ shape: AnnotateShape, handle: string }|null}
 */
export function hitTestShapes(shapes, px, py) {
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    const s = shapes[i];
    const handle = s.type === 'arrow' ? hitTestArrow(s, px, py) : hitTestRoundedFrame(s, px, py);
    if (handle) return { shape: s, handle };
  }
  return null;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {AnnotateShape[]} shapes
 */
export function snapshotState(canvas, shapes) {
  return {
    png: snapshotCanvas(canvas),
    shapesJson: JSON.stringify(shapes || []),
  };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ png?: string, shapesJson?: string }|string} entry
 */
export async function restoreState(canvas, ctx, entry) {
  const png = typeof entry === 'string' ? entry : entry.png;
  const shapesJson = typeof entry === 'string' ? '[]' : (entry.shapesJson || '[]');
  await restoreSnapshot(canvas, ctx, png);
  let shapes = [];
  try {
    shapes = JSON.parse(shapesJson);
    if (!Array.isArray(shapes)) shapes = [];
  } catch {
    shapes = [];
  }
  return shapes;
}

export { ACCEPT_EXT };
