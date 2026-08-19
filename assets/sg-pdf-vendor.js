/**
 * SUGUDASU — pdf.js / pdf-lib vendor bootstrap（共通）
 * 影響: pdf-fill · annotate · pdf-images · clip-stash · pdf-pick
 * 正本: docs/notes/TECH_ADOPTION_NOTE.md · CAPABILITY_INVENTORY.md
 */

/** @param {string} rel vendor/pdfjs 配下の相対パス */
export function pdfjsVendorUrl(rel) {
  return new URL(`./vendor/pdfjs/${rel}`, import.meta.url).href;
}

export function pdflibVendorUrl() {
  return new URL('./vendor/pdf-lib/pdf-lib.esm.min.js', import.meta.url).href;
}

/** @type {any} */
let pdfjsLibCache = null;

/**
 * pdf.js を1回だけ読み込み、workerSrc を設定する。
 * @returns {Promise<any>}
 */
export async function ensurePdfjs() {
  if (pdfjsLibCache) return pdfjsLibCache;
  const lib = await import(pdfjsVendorUrl('pdf.mjs'));
  lib.GlobalWorkerOptions.workerSrc = pdfjsVendorUrl('pdf.worker.mjs');
  pdfjsLibCache = lib;
  return lib;
}

/**
 * @returns {Promise<{ PDFDocument: any }>}
 */
export async function loadPdfLib() {
  return import(pdflibVendorUrl());
}

/**
 * getDocument 用の共通オプション片（wasmUrl）。
 * @returns {{ wasmUrl: string }}
 */
export function pdfjsDocumentExtras() {
  return { wasmUrl: pdfjsVendorUrl('wasm/') };
}
