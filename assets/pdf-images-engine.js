/**
 * SUGUDASU PDF画像抽出 — 純ロジック（フィルタ · ファイル名 · 変換 · ZIP）
 * docs/notes/PDF_IMAGE_EXTRACT_SPEC.md · PDF_IMAGE_EXTRACT_TECH.md
 */
import { buildStoreZip, sanitizeBaseName as wmSanitize } from './watermark-engine.js';

export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_PAGES = 50;
export const MIN_SHORT_EDGE_PX = 16;
export const MIN_AREA_PX = 256;

export { buildStoreZip };

/**
 * @param {string} name
 * @returns {string}
 */
export function sanitizeBaseName(name) {
  return wmSanitize(name);
}

/**
 * @param {number} width
 * @param {number} height
 * @returns {boolean} true = 除外する
 */
export function shouldSkipSmallImage(width, height) {
  const w = Math.max(0, Math.floor(width) || 0);
  const h = Math.max(0, Math.floor(height) || 0);
  const shortEdge = Math.min(w, h);
  const area = w * h;
  return shortEdge < MIN_SHORT_EDGE_PX && area < MIN_AREA_PX;
}

/**
 * @param {string} sourceName
 * @param {number} firstPage1based
 * @param {number} imgIndex1based
 * @param {'png'|'jpg'} ext
 * @returns {string}
 */
export function buildOutputFileName(sourceName, firstPage1based, imgIndex1based, ext) {
  const base = sanitizeBaseName(sourceName);
  const p = String(Math.max(1, Math.floor(firstPage1based) || 1)).padStart(2, '0');
  const i = String(Math.max(1, Math.floor(imgIndex1based) || 1)).padStart(2, '0');
  const e = ext === 'jpg' ? 'jpg' : 'png';
  return `${base}_p${p}_img${i}.${e}`;
}

/**
 * @param {number[]} pages
 * @returns {string}
 */
export function formatPagesLabel(pages) {
  const uniq = [...new Set((pages || []).map((n) => Math.floor(n)).filter((n) => n >= 1))].sort((a, b) => a - b);
  if (!uniq.length) return '';
  return uniq.map((n) => `p.${n}`).join(', ');
}

/**
 * @param {number} fileSize
 * @param {number} pageCount
 * @returns {{ ok: true } | { ok: false, reason: 'file_size'|'page_count' }}
 */
export function checkLimits(fileSize, pageCount) {
  if (fileSize > MAX_FILE_BYTES) return { ok: false, reason: 'file_size' };
  if (pageCount > MAX_PAGES) return { ok: false, reason: 'page_count' };
  return { ok: true };
}

/**
 * @param {object} objs
 * @param {string} name
 * @returns {Promise<any>}
 */
export function getPdfObject(objs, name) {
  return new Promise((resolve, reject) => {
    try {
      if (!objs || typeof objs.get !== 'function') {
        reject(new Error('no-objs'));
        return;
      }
      let settled = false;
      const done = (v) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };
      objs.get(name, done);
      setTimeout(() => {
        if (!settled) reject(new Error('obj-timeout'));
      }, 15000);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * @param {any} page
 * @param {string} objId
 * @returns {Promise<any>}
 */
export async function resolveImageObject(page, objId) {
  const id = String(objId || '');
  if (!id) throw new Error('empty-id');
  if (id.startsWith('g_') && page.commonObjs) {
    return getPdfObject(page.commonObjs, id);
  }
  try {
    return await getPdfObject(page.objs, id);
  } catch {
    if (page.commonObjs) return getPdfObject(page.commonObjs, id);
    throw new Error('resolve-failed');
  }
}

/**
 * @param {Uint8ClampedArray|Uint8Array} data
 * @param {number} width
 * @param {number} height
 * @returns {ImageData|null}
 */
export function rawPixelsToImageData(data, width, height) {
  const w = width | 0;
  const h = height | 0;
  if (!data || w < 1 || h < 1) return null;
  const len = data.length;
  const rgba = new Uint8ClampedArray(w * h * 4);
  if (len === w * h * 4) {
    rgba.set(data);
  } else if (len === w * h * 3) {
    let i = 0;
    let k = 0;
    while (k < rgba.length) {
      rgba[k++] = data[i++];
      rgba[k++] = data[i++];
      rgba[k++] = data[i++];
      rgba[k++] = 255;
    }
  } else if (len === w * h) {
    let i = 0;
    let k = 0;
    while (k < rgba.length) {
      const g = data[i++];
      rgba[k++] = g;
      rgba[k++] = g;
      rgba[k++] = g;
      rgba[k++] = 255;
    }
  } else {
    return null;
  }
  return new ImageData(rgba, w, h);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} mime
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, mime = 'image/png') {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), mime);
  });
}

/**
 * @param {any} imgData pdf.js image object
 * @returns {Promise<{ blob: Blob, format: 'png'|'jpg', width: number, height: number }|null>}
 */
export async function imageObjectToBlob(imgData) {
  if (!imgData || !imgData.width || !imgData.height) return null;
  const width = imgData.width | 0;
  const height = imgData.height | 0;
  if (shouldSkipSmallImage(width, height)) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (imgData.bitmap) {
    ctx.drawImage(imgData.bitmap, 0, 0);
    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, format: 'png', width, height };
  }

  if (imgData.data) {
    const imageData = rawPixelsToImageData(imgData.data, width, height);
    if (!imageData) return null;
    ctx.putImageData(imageData, 0, 0);
    const blob = await canvasToBlob(canvas, 'image/png');
    return { blob, format: 'png', width, height };
  }

  return null;
}

/**
 * @param {string} key
 * @param {number} width
 * @param {number} height
 * @param {number} byteLength
 * @returns {string}
 */
export function contentFingerprint(key, width, height, byteLength) {
  return `${key}|${width}x${height}|${byteLength}`;
}

/**
 * @typedef {{
 *   id: string,
 *   pages: number[],
 *   width: number,
 *   height: number,
 *   format: 'png'|'jpg',
 *   blob: Blob,
 *   thumbUrl: string,
 *   fileName: string,
 * }} ExtractedImage
 */

/**
 * @param {typeof import('../vendor/pdfjs/pdf.mjs')} pdfjsLib
 * @param {ArrayBuffer} data
 * @param {{
 *   sourceName: string,
 *   workerSrc: string,
 *   wasmUrl?: string,
 * }} opts
 * @returns {Promise<{ images: ExtractedImage[], skippedSmall: number, pageCount: number }>}
 */
export async function extractEmbeddedImages(pdfjsLib, data, opts) {
  if (!pdfjsLib?.getDocument) throw new Error('no-pdfjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = opts.workerSrc;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    wasmUrl: opts.wasmUrl,
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages | 0;
  const limit = checkLimits(data.byteLength, pageCount);
  if (!limit.ok) {
    const err = new Error(limit.reason);
    err.code = limit.reason;
    throw err;
  }

  const OPS = pdfjsLib.OPS;
  const paintOps = new Set([
    OPS.paintImageXObject,
    OPS.paintInlineImageXObject,
    OPS.paintImageXObjectRepeat,
  ].filter((n) => typeof n === 'number'));

  /** @type {Map<string, { pages: number[], width: number, height: number, format: 'png'|'jpg', blob: Blob, key: string }>} */
  const byFp = new Map();
  let skippedSmall = 0;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const ops = await page.getOperatorList();
    const { fnArray, argsArray } = ops;

    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      if (!paintOps.has(fn)) continue;

      try {
        let converted = null;
        let objKey = '';

        if (fn === OPS.paintInlineImageXObject) {
          const inline = argsArray[i]?.[0];
          if (!inline) continue;
          if (shouldSkipSmallImage(inline.width, inline.height)) {
            skippedSmall += 1;
            continue;
          }
          converted = await imageObjectToBlob(inline);
          objKey = `inline_p${pageNum}_${i}`;
        } else {
          const objId = argsArray[i]?.[0];
          if (!objId) continue;
          objKey = String(objId);
          const imgObj = await resolveImageObject(page, objKey);
          if (!imgObj) continue;
          if (shouldSkipSmallImage(imgObj.width, imgObj.height)) {
            skippedSmall += 1;
            continue;
          }
          converted = await imageObjectToBlob(imgObj);
        }

        if (!converted) continue;
        const fp = contentFingerprint(objKey, converted.width, converted.height, converted.blob.size);
        const existing = byFp.get(fp);
        if (existing) {
          if (!existing.pages.includes(pageNum)) existing.pages.push(pageNum);
          continue;
        }
        byFp.set(fp, {
          key: objKey,
          pages: [pageNum],
          width: converted.width,
          height: converted.height,
          format: converted.format,
          blob: converted.blob,
        });
      } catch {
        // ベストエフォート: 1枚失敗しても継続
      }
    }
  }

  const images = [];
  let idx = 0;
  for (const item of byFp.values()) {
    idx += 1;
    const firstPage = Math.min(...item.pages);
    const fileName = buildOutputFileName(opts.sourceName, firstPage, idx, item.format);
    images.push({
      id: `img-${idx}`,
      pages: [...item.pages].sort((a, b) => a - b),
      width: item.width,
      height: item.height,
      format: item.format,
      blob: item.blob,
      thumbUrl: URL.createObjectURL(item.blob),
      fileName,
    });
  }

  return { images, skippedSmall, pageCount };
}
