#!/usr/bin/env node
/**
 * pdf-images-engine — 単体テスト（純関数）
 * Run: node scripts/pdf-images-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  shouldSkipSmallImage,
  buildOutputFileName,
  buildZipRangeFileName,
  formatPagesLabel,
  formatPageRangeLabel,
  computePageRange,
  checkLimits,
  contentFingerprint,
  sanitizeBaseName,
  MAX_FILE_BYTES,
  MAX_PAGES,
  MIN_SHORT_EDGE_PX,
  MIN_AREA_PX,
} from '../assets/pdf-images-engine.js';

{
  assert.equal(shouldSkipSmallImage(10, 10), true);
  assert.equal(shouldSkipSmallImage(15, 100), false);
  assert.equal(shouldSkipSmallImage(20, 20), false);
  assert.equal(MIN_SHORT_EDGE_PX, 16);
  assert.equal(MIN_AREA_PX, 256);
}

{
  assert.equal(buildOutputFileName('仕様書.PDF', 3, 2, 'png'), '仕様書_p03_img02.png');
  assert.equal(buildOutputFileName('a/b:c.pdf', 1, 1, 'jpg'), 'a_b_c_p01_img01.jpg');
  assert.equal(sanitizeBaseName('x.pdf'), 'x');
}

{
  assert.equal(formatPagesLabel([5, 3, 3]), 'p.3, p.5');
  assert.equal(formatPagesLabel([]), '');
}

{
  assert.equal(checkLimits(100).ok, true);
  assert.equal(checkLimits(MAX_FILE_BYTES + 1).ok, false);
  assert.equal(checkLimits(MAX_FILE_BYTES + 1).reason, 'file_size');
  assert.equal(checkLimits(10).ok, true);
}

{
  assert.deepEqual(computePageRange(1, 50), { ok: true, start: 1, end: 50, count: 50 });
  assert.deepEqual(computePageRange(1, 186), { ok: true, start: 1, end: 50, count: 50 });
  assert.deepEqual(computePageRange(40, 186), { ok: true, start: 40, end: 89, count: 50 });
  assert.deepEqual(computePageRange(170, 186), { ok: true, start: 170, end: 186, count: 17 });
  assert.equal(computePageRange(200, 186).ok, false);
  assert.equal(computePageRange(0, 186).ok, false);
  assert.equal(computePageRange(-1, 186).ok, false);
  assert.equal(computePageRange('abc', 186).ok, false);
  assert.equal(computePageRange('', 186).ok, false);
  assert.equal(computePageRange(1.5, 186).ok, false);
  assert.equal(formatPageRangeLabel(40, 89), '40〜89');
  const when = new Date(2026, 6, 18, 9, 50, 12);
  assert.equal(
    buildZipRangeFileName('sample.pdf', 40, 89, 7, when),
    'sample_p040-089_7img_095012.zip'
  );
  assert.equal(MAX_PAGES, 50);
}

{
  assert.equal(
    contentFingerprint('img_1', 10, 20, 99),
    contentFingerprint('img_1', 10, 20, 99)
  );
  assert.notEqual(
    contentFingerprint('img_1', 10, 20, 99),
    contentFingerprint('img_2', 10, 20, 99)
  );
}

console.log('pdf-images-engine.test.mjs: OK');
