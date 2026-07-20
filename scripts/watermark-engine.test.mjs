#!/usr/bin/env node
/**
 * watermark-engine — 単体テスト
 * Run: node scripts/watermark-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  sanitizeBaseName,
  sanitizeSuffix,
  buildOutputFileName,
  uniquifyFileName,
  isAcceptedImageFile,
  snapOpacity,
  normalizePosition,
  fitWithinMaxEdge,
  anchorPoint,
  findOpaqueBounds,
  crc32,
  buildStoreZip,
  OPACITY_STEPS,
  POSITIONS,
  MAX_FILES,
  MAX_EDGE,
  SUFFIX_MAX_LEN,
  TEXT_RATIO_LONG,
  TEXT_RATIO_SHORT,
} from '../assets/watermark-engine.js';

{
  assert.equal(sanitizeBaseName('写真.PNG'), '写真');
  assert.equal(sanitizeBaseName('a/b:c.jpg'), 'a_b_c');
  assert.equal(sanitizeBaseName(''), 'image');
}

{
  assert.equal(sanitizeSuffix('社外秘'), '社外秘');
  assert.ok(sanitizeSuffix('あ'.repeat(100)).length <= SUFFIX_MAX_LEN);
  assert.equal(sanitizeSuffix('a/b:c*d'), 'a_b_c_d');
}

{
  assert.equal(
    buildOutputFileName({ sourceName: 'demo.png', appendWatermarkToName: false }),
    'demo.png'
  );
  assert.equal(
    buildOutputFileName({
      sourceName: 'sample.png',
      appendWatermarkToName: true,
      mode: 'text',
      text: '社外秘',
    }),
    'sample_社外秘.png'
  );
  assert.equal(
    buildOutputFileName({
      sourceName: 'sample.png',
      appendWatermarkToName: true,
      mode: 'logo',
      logoFileName: 'company-logo.png',
    }),
    'sample_company-logo.png'
  );
  assert.equal(
    buildOutputFileName({
      sourceName: 'sample.png',
      appendWatermarkToName: true,
      mode: 'logo',
      logoFileName: '',
    }),
    'sample_logo.png'
  );

  const used = new Set();
  const a = buildOutputFileName({
    sourceName: 'sample.png',
    appendWatermarkToName: true,
    mode: 'text',
    text: 'CONFIDENTIAL',
    usedNames: used,
  });
  const b = buildOutputFileName({
    sourceName: 'sample.png',
    appendWatermarkToName: true,
    mode: 'text',
    text: 'CONFIDENTIAL',
    usedNames: used,
  });
  assert.equal(a, 'sample_CONFIDENTIAL.png');
  assert.equal(b, 'sample_CONFIDENTIAL (1).png');
}

{
  assert.equal(uniquifyFileName('x.png', new Set(['x.png'])), 'x (1).png');
}

{
  // 旧 signature 互換
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
  // 透明余白: 中央 2×2 だけ不透明
  const w = 8;
  const h = 8;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 3; y <= 4; y++) {
    for (let x = 3; x <= 4; x++) {
      const i = (y * w + x) * 4;
      data[i] = 255;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }
  const bounds = findOpaqueBounds({ data, width: w, height: h });
  assert.deepEqual(bounds, { sx: 3, sy: 3, sw: 2, sh: 2 });
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
  assert.ok(TEXT_RATIO_LONG > 0 && TEXT_RATIO_SHORT > TEXT_RATIO_LONG);
}

console.log('watermark-engine.test.mjs: OK');
