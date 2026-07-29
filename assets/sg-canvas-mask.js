/**
 * SUGUDASU — キャンバス秘匿（黒・ぼかし・モザイク・色・スタンプ帯）
 * 正本（annotate 側の安全な mosaic）。mask-engine / annotate-engine から re-export。
 */

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
  x = Math.floor(x);
  y = Math.floor(y);
  w = Math.floor(w);
  h = Math.floor(h);
  if (w < 1 || h < 1) return;
  let imageData;
  try {
    imageData = ctx.getImageData(x, y, w, h);
  } catch {
    return;
  }
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
