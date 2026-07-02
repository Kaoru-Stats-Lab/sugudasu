#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  guessImageMime,
  normalizeRect,
  outputFilename,
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

console.log('mask-engine.test.mjs: all tests passed');
