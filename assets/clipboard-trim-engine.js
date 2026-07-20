/**
 * clipboard-trim — 余白検出（依存ゼロ）
 */

/**
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
 * 四隅の平均色を背景とみなし、色差が閾値超の領域を返す。
 * @param {ImageData} imageData
 * @param {number} [colorTol]
 * @param {number} [alphaThreshold]
 * @returns {{ sx: number, sy: number, sw: number, sh: number }|null}
 */
export function findContentBoundsByCornerBg(imageData, colorTol = 28, alphaThreshold = 8) {
  const { data, width, height } = imageData;
  if (width < 1 || height < 1) return null;

  const sample = (x, y) => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const corners = [
    sample(0, 0),
    sample(width - 1, 0),
    sample(0, height - 1),
    sample(width - 1, height - 1),
  ];
  let br = 0;
  let bg = 0;
  let bb = 0;
  let n = 0;
  for (const c of corners) {
    if (c[3] <= alphaThreshold) continue;
    br += c[0];
    bg += c[1];
    bb += c[2];
    n += 1;
  }
  if (n === 0) return null;
  br = Math.round(br / n);
  bg = Math.round(bg / n);
  bb = Math.round(bb / n);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const tol2 = colorTol * colorTol;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a <= alphaThreshold) continue;
      const dr = data[i] - br;
      const dg = data[i + 1] - bg;
      const db = data[i + 2] - bb;
      if (dr * dr + dg * dg + db * db > tol2) {
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
 * @param {ImageData} imageData
 * @returns {{ sx: number, sy: number, sw: number, sh: number }|null}
 */
export function findTrimBounds(imageData) {
  const opaque = findOpaqueBounds(imageData);
  if (!opaque) return null;

  // DECISION: スクショは全面不透明が多い。透明余白が無ければ四隅色で余白を落とす（PPT用途のため）。
  const fullW = imageData.width;
  const fullH = imageData.height;
  const isFullOpaque =
    opaque.sx === 0 && opaque.sy === 0 && opaque.sw === fullW && opaque.sh === fullH;
  if (!isFullOpaque) return opaque;

  const byColor = findContentBoundsByCornerBg(imageData);
  return byColor || opaque;
}

/**
 * @param {CanvasImageSource} source
 * @param {number} natW
 * @param {number} natH
 * @returns {HTMLCanvasElement}
 */
export function trimToCanvas(source, natW, natH) {
  const srcW = Math.max(1, Math.floor(natW) || 1);
  const srcH = Math.max(1, Math.floor(natH) || 1);
  const scratch = document.createElement('canvas');
  scratch.width = srcW;
  scratch.height = srcH;
  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!sctx) throw new Error('no-2d');
  sctx.clearRect(0, 0, srcW, srcH);
  sctx.drawImage(source, 0, 0);

  let bounds = null;
  try {
    bounds = findTrimBounds(sctx.getImageData(0, 0, srcW, srcH));
  } catch {
    bounds = null;
  }
  if (!bounds) return scratch;

  const out = document.createElement('canvas');
  out.width = bounds.sw;
  out.height = bounds.sh;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('no-2d');
  octx.drawImage(
    scratch,
    bounds.sx,
    bounds.sy,
    bounds.sw,
    bounds.sh,
    0,
    0,
    bounds.sw,
    bounds.sh
  );
  return out;
}

/**
 * @param {Blob|File} file
 * @returns {Promise<ImageBitmap|HTMLImageElement>}
 */
export async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
export function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/png');
  });
}
