/**
 * SUGUDASU ページ抜き — 純ロジック（選択正規化 · ファイル名 · copyPages）
 * docs/notes/PDF_PICK_SPEC.md
 */
import { sanitizeBaseName as wmSanitize } from './watermark-engine.js';
import { loadPdfLib } from './sg-pdf-vendor.js';
import { PDF_DOC_MAX_FILE_BYTES, PDF_DOC_MAX_PAGES } from './sg-pdf-limits.js';

export const MAX_FILE_BYTES = PDF_DOC_MAX_FILE_BYTES;
export const MAX_PAGES = PDF_DOC_MAX_PAGES;

/**
 * @param {string} name
 * @returns {string}
 */
export function sanitizeBaseName(name) {
  const s = wmSanitize(name);
  return s === 'image' ? 'document' : s;
}

/**
 * @param {number} fileSize
 * @param {number} [pageCount]
 * @returns {{ ok: true } | { ok: false, reason: 'file_size'|'page_count' }}
 */
export function checkLimits(fileSize, pageCount) {
  if (fileSize > MAX_FILE_BYTES) return { ok: false, reason: 'file_size' };
  if (pageCount != null && pageCount > MAX_PAGES) return { ok: false, reason: 'page_count' };
  return { ok: true };
}

/**
 * 0始まりページ番号を文書順のユニーク整数にする。黙ってクランプしない。
 * @param {unknown} selectedZeroBased
 * @param {number} pageCount
 * @returns {{ ok: true, indices: number[] } | { ok: false, reason: 'empty'|'page_index' }}
 */
export function normalizeSelectedPages(selectedZeroBased, pageCount) {
  const total = Math.max(0, Math.floor(Number(pageCount)) || 0);
  if (!Array.isArray(selectedZeroBased) || selectedZeroBased.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  const seen = new Set();
  const indices = [];
  for (const raw of selectedZeroBased) {
    if (typeof raw !== 'number' || !Number.isInteger(raw)) {
      return { ok: false, reason: 'page_index' };
    }
    if (raw < 0 || raw >= total) return { ok: false, reason: 'page_index' };
    if (seen.has(raw)) continue;
    seen.add(raw);
    indices.push(raw);
  }
  if (!indices.length) return { ok: false, reason: 'empty' };
  indices.sort((a, b) => a - b);
  return { ok: true, indices };
}

/**
 * @param {string} sourceName
 * @param {number} pageCount
 * @param {Date} [when]
 * @returns {string}
 */
export function buildOutputFileName(sourceName, pageCount, when = new Date()) {
  const base = sanitizeBaseName(sourceName);
  const n = Math.max(0, Math.floor(Number(pageCount)) || 0);
  const hh = String(when.getHours()).padStart(2, '0');
  const mm = String(when.getMinutes()).padStart(2, '0');
  const ss = String(when.getSeconds()).padStart(2, '0');
  return `${base}_${n}p_${hh}${mm}${ss}.pdf`;
}

/**
 * 選んだページだけを元 PDF からコピーして新 PDF にする。
 * DECISION: 出力はラスタ化せず copyPages。スキャンの文字検索と軽さを奪わない。
 * DECISION: 並べ替えはしない。文書順のみ（v0.1）。
 *
 * @param {Uint8Array} sourceBytes
 * @param {number[]} pageIndicesZeroBased
 * @param {{ importPdfLib?: () => Promise<{ PDFDocument: any }> }} [options]
 * @returns {Promise<Uint8Array>}
 */
export async function copySelectedPages(sourceBytes, pageIndicesZeroBased, options = {}) {
  const importPdfLib = options.importPdfLib || loadPdfLib;
  const { PDFDocument } = await importPdfLib();
  const srcDoc = await PDFDocument.load(sourceBytes.slice(0));
  const total = typeof srcDoc.getPageCount === 'function' ? srcDoc.getPageCount() : 0;
  const gate = normalizeSelectedPages(pageIndicesZeroBased, total);
  if (!gate.ok) {
    const err = new Error(gate.reason);
    err.code = gate.reason;
    throw err;
  }
  const out = await PDFDocument.create();
  const copied = await out.copyPages(srcDoc, gate.indices);
  for (const page of copied) out.addPage(page);
  return out.save();
}
