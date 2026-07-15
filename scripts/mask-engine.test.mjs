#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  guessImageMime,
  hitTestArrow,
  hitTestRoundedFrame,
  normalizeRect,
  outputFilename,
  snapshotState,
  validateMaskInput,
  MAX_FILE_BYTES,
} from '../assets/mask-engine.js';

assert.equal(guessImageMime({ name: 'a.png', type: '' }), 'image/png');
assert.equal(guessImageMime({ name: 'shot.JPG', type: '' }), 'image/jpeg');

{
  const ok = validateMaskInput({ name: 'a.png', type: 'image/png', size: 1000 });
  assert.equal(ok.ok, true);
}
{
  const bad = validateMaskInput({ name: 'a.txt', type: 'text/plain', size: 100 });
  assert.equal(bad.ok, false);
  assert.equal(bad.code, 'bad_type');
}
{
  const big = validateMaskInput({ name: 'a.png', type: 'image/png', size: MAX_FILE_BYTES + 1 });
  assert.equal(big.ok, false);
  assert.equal(big.code, 'too_large');
}

{
  const r = normalizeRect(10, 20, 50, 80, 100, 100);
  assert.equal(r.x, 10);
  assert.equal(r.y, 20);
  assert.equal(r.w, 40);
  assert.equal(r.h, 60);
}
{
  const r = normalizeRect(90, 90, 10, 10, 100, 100);
  assert.equal(r.x, 10);
  assert.equal(r.y, 10);
}

assert.equal(outputFilename('manual/screenshot.jpeg'), 'screenshot-masked.png');
assert.equal(outputFilename('x'), 'x-masked.png');

{
  const arrow = { id: 'a1', type: 'arrow', x0: 0, y0: 0, x1: 100, y1: 0 };
  assert.equal(hitTestArrow(arrow, 50, 0), 'body');
  assert.equal(hitTestArrow(arrow, 0, 0), 'start');
  assert.equal(hitTestArrow(arrow, 100, 0), 'end');
  assert.equal(hitTestArrow(arrow, 50, 80), null);
}
{
  const rect = { id: 'r1', type: 'rect', x: 10, y: 10, w: 200, h: 120 };
  assert.equal(hitTestRoundedFrame(rect, 10, 10), 'nw');
  assert.equal(hitTestRoundedFrame(rect, 10, 70), 'body');
  assert.equal(hitTestRoundedFrame(rect, 110, 70), null);
}
{
  const canvas = { toDataURL: () => 'data:image/png;base64,xx' };
  const st = snapshotState(canvas, [{ id: 'a1', type: 'arrow', x0: 1, y0: 2, x1: 3, y1: 4 }]);
  assert.equal(st.png, 'data:image/png;base64,xx');
  assert.ok(st.shapesJson.includes('a1'));
}

console.log('mask-engine.test.mjs: all tests passed');
