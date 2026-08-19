#!/usr/bin/env node
/**
 * pdf-pick-engine — 単体テスト（純関数 + copyPages モック）
 * Run: node scripts/pdf-pick-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  checkLimits,
  normalizeSelectedPages,
  buildOutputFileName,
  sanitizeBaseName,
  copySelectedPages,
  MAX_FILE_BYTES,
  MAX_PAGES,
} from '../assets/pdf-pick-engine.js';
import { PDF_DOC_MAX_FILE_BYTES, PDF_DOC_MAX_PAGES } from '../assets/sg-pdf-limits.js';

assert.equal(MAX_FILE_BYTES, PDF_DOC_MAX_FILE_BYTES);
assert.equal(MAX_PAGES, PDF_DOC_MAX_PAGES);
assert.equal(MAX_PAGES, 50);

{
  assert.equal(checkLimits(100).ok, true);
  assert.equal(checkLimits(MAX_FILE_BYTES + 1).ok, false);
  assert.equal(checkLimits(MAX_FILE_BYTES + 1).reason, 'file_size');
  assert.equal(checkLimits(10, 50).ok, true);
  assert.equal(checkLimits(10, 51).ok, false);
  assert.equal(checkLimits(10, 51).reason, 'page_count');
}

{
  assert.deepEqual(normalizeSelectedPages([2, 0, 2], 4), { ok: true, indices: [0, 2] });
  assert.equal(normalizeSelectedPages([], 4).reason, 'empty');
  assert.equal(normalizeSelectedPages([0], 0).reason, 'page_index');
  assert.equal(normalizeSelectedPages([4], 4).reason, 'page_index');
  assert.equal(normalizeSelectedPages([-1], 4).reason, 'page_index');
  assert.equal(normalizeSelectedPages([1.5], 4).reason, 'page_index');
  assert.equal(normalizeSelectedPages(['1'], 4).reason, 'page_index');
}

{
  assert.equal(sanitizeBaseName('scan.PDF'), 'scan');
  const when = new Date(2026, 7, 19, 13, 7, 5);
  assert.equal(buildOutputFileName('複合機スキャン.pdf', 3, when), '複合機スキャン_3p_130705.pdf');
}

{
  const added = [];
  const fakePdfLib = {
    PDFDocument: {
      async load() {
        return { getPageCount: () => 5 };
      },
      async create() {
        return {
          async copyPages(_src, idxs) {
            return idxs.map((i) => ({ __copied: i }));
          },
          addPage(page) {
            added.push(page.__copied);
          },
          async save() {
            return new Uint8Array([9, 8, 7]);
          },
        };
      },
    },
  };

  const out = await copySelectedPages(new Uint8Array([1]), [3, 1, 3], {
    importPdfLib: async () => fakePdfLib,
  });
  assert.deepEqual([...out], [9, 8, 7]);
  assert.deepEqual(added, [1, 3]);

  await assert.rejects(
    () => copySelectedPages(new Uint8Array([1]), [], { importPdfLib: async () => fakePdfLib }),
    (err) => err.code === 'empty'
  );
}

console.log('pdf-pick-engine.test.mjs: OK');
