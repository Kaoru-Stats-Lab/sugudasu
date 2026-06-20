#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  guessImageMime,
  outputFilename,
  extForFormat,
  mimeForFormat,
  validateImageFile,
  validateWebpInput,
  isWebpFile,
  parseFetchableImageUrl,
  filenameFromImageUrl,
  isWebpBlob,
  MAX_FILE_BYTES,
} from '../assets/webp-to-jpg.js';

assert.equal(isWebpFile({ name: 'a.webp', type: '' }), true);
assert.equal(isWebpFile({ name: 'a.png', type: 'image/png' }), false);

{
  const ok = validateWebpInput({ name: 'a.webp', type: 'image/webp', size: 1000 });
  assert.equal(ok.ok, true);
}
{
  const bad = validateWebpInput({ name: 'a.png', type: 'image/png', size: 1000 });
  assert.equal(bad.ok, false);
  assert.equal(bad.code, 'not_webp');
}

assert.equal(guessImageMime({ name: 'a.webp', type: '' }), 'image/webp');
assert.equal(guessImageMime({ name: 'photo.PNG', type: 'image/png' }), 'image/png');
assert.equal(guessImageMime({ name: 'x.txt', type: 'text/plain' }), '');

assert.equal(outputFilename('screenshot.webp', 'png'), 'screenshot.png');
assert.equal(outputFilename('dir/foo.jpeg', 'webp'), 'foo.webp');
assert.equal(extForFormat('jpeg'), 'jpg');
assert.equal(mimeForFormat('png'), 'image/png');

{
  const ok = validateImageFile({ name: 'a.webp', type: 'image/webp', size: 1000 });
  assert.equal(ok.ok, true);
}
{
  const bad = validateImageFile({ name: 'a.webp', type: 'image/webp', size: MAX_FILE_BYTES + 1 });
  assert.equal(bad.ok, false);
  assert.equal(bad.code, 'too_large');
}

assert.equal(parseFetchableImageUrl('').ok, false);
assert.equal(parseFetchableImageUrl('https://cdn.example/a.webp').ok, true);
assert.equal(parseFetchableImageUrl('javascript:alert(1)').ok, false);
assert.equal(filenameFromImageUrl('https://x.test/path/photo.jpg'), 'photo.webp');
assert.equal(filenameFromImageUrl('https://x.test/a.webp'), 'a.webp');

{
  const riff = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const blob = new Blob([riff], { type: '' });
  assert.equal(await isWebpBlob(blob), true);
}
{
  const blob = new Blob([new Uint8Array([0x89, 0x50])], { type: 'image/png' });
  assert.equal(await isWebpBlob(blob), false);
}

console.log('webp-to-jpg.test.mjs: all tests passed');
