#!/usr/bin/env node
/**
 * watermark-engine — 単体テスト
 * Run: node scripts/watermark-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  sanitizeBaseName,
  buildOutputFileName,
  isAcceptedImageFile,
  snapOpacity,
  normalizePosition,
  fitWithinMaxEdge,
  anchorPoint,
  crc32,
  buildStoreZip,
  OPACITY_STEPS,
  POSITIONS,
  MAX_FILES,
  MAX_EDGE,
} from '../assets/watermark-engine.js';

{
  assert.equal(sanitizeBaseName('写真.PNG'), '写真');
  assert.equal(sanitizeBaseName('a/b:c.jpg'), 'a_b_c');
  assert.equal(sanitizeBaseName(''), 'image');
}

{
  assert.equal(buildOutputFileName('demo.png', 3), 'demo_wm_03.png');
}

{
  assert.equal(isAcceptedImageFile({ type: 'image/png', name: 'a.png' }), true);
  assert.equal(isAcceptedImageFile({ type: 'image/gif', name: 'a.gif' }), false);
  assert.equal(isAcceptedImageFile({ type: '', name: 'x.webp' }), true);
}

{
  assert.equal(snapOpacity(0.19), 0.2);
  assert.equal(snapOpacity(0.5), 0.4);
  assert.equal(snapOpacity(0.55), 0.6);
  assert.deepEqual([...OPACITY_STEPS], [0.2, 0.4, 0.6]);
}

{
  assert.equal(normalizePosition('mc'), 'mc');
  assert.equal(normalizePosition('xx'), 'br');
  assert.equal(POSITIONS.length, 9);
}

{
  const fit = fitWithinMaxEdge(8000, 4000, MAX_EDGE);
  assert.equal(fit.scaled, true);
  assert.equal(fit.w, MAX_EDGE);
  assert.equal(fit.h, MAX_EDGE / 2);
  const small = fitWithinMaxEdge(100, 80);
  assert.equal(small.scaled, false);
}

{
  const a = anchorPoint(1000, 1000, 100, 50, 'tl');
  assert.ok(a.x < 100 && a.y < 100);
  const c = anchorPoint(1000, 1000, 100, 50, 'mc');
  assert.ok(Math.abs(c.x - 450) < 5);
  const br = anchorPoint(1000, 1000, 100, 50, 'br');
  assert.ok(br.x > 800 && br.y > 800);
}

{
  const data = new TextEncoder().encode('hello');
  const zip = buildStoreZip([{ name: 'a.txt', data }]);
  assert.equal(zip[0], 0x50);
  assert.equal(zip[1], 0x4b);
  assert.ok(zip.length > 30 + data.length);
  assert.equal(crc32(data), crc32(data));
  assert.notEqual(crc32(data), crc32(new TextEncoder().encode('hallo')));
}

{
  assert.equal(MAX_FILES, 20);
  assert.equal(MAX_EDGE, 4096);
}

console.log('watermark-engine.test.mjs: OK');
