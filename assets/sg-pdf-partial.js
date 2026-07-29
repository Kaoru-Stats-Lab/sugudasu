/**
 * SUGUDASU — 編集ページだけ焼き付け、未編集は元 PDF を保持
 * 影響: pdf-fill · annotate
 */

import { loadPdfLib } from './sg-pdf-vendor.js';

/**
 * @typedef {{ bytes: Uint8Array, width: number, height: number, mime: 'image/jpeg'|'image/png' }} RasterPage
 *
 * @param {Uint8Array} sourceBytes
 * @param {number} pageCount
 * @param {(pageIndex: number) => Promise<RasterPage|null>} rasterizeEditedPage
 *   未編集なら null。編集済みなら画像バイトを返す。
 * @param {{
 *   importPdfLib?: () => Promise<{ PDFDocument: any }>,
 *   pageSize?: 'source'|'raster',
 *   onProgress?: (currentZeroBased: number, total: number) => void,
 *   yieldToMain?: boolean,
 * }} [options]
 * @returns {Promise<Uint8Array>}
 */
export async function buildPartialAnnotatedPdf(sourceBytes, pageCount, rasterizeEditedPage, options = {}) {
  const importPdfLib = options.importPdfLib || loadPdfLib;
  const pageSize = options.pageSize === 'raster' ? 'raster' : 'source';
  const { PDFDocument } = await importPdfLib();
  const srcDoc = await PDFDocument.load(sourceBytes.slice(0));
  const out = await PDFDocument.create();

  for (let i = 0; i < pageCount; i += 1) {
    options.onProgress?.(i, pageCount);
    const raster = await rasterizeEditedPage(i);
    if (raster) {
      const img = raster.mime === 'image/png'
        ? await out.embedPng(raster.bytes)
        : await out.embedJpg(raster.bytes);
      if (pageSize === 'source') {
        const srcPage = srcDoc.getPage(i);
        const { width: pw, height: ph } = srcPage.getSize();
        const page = out.addPage([pw, ph]);
        page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
      } else {
        const page = out.addPage([raster.width, raster.height]);
        page.drawImage(img, { x: 0, y: 0, width: raster.width, height: raster.height });
      }
    } else {
      const [copied] = await out.copyPages(srcDoc, [i]);
      out.addPage(copied);
    }
    if (options.yieldToMain) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return out.save();
}
