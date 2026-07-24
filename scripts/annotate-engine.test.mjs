#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  guessImageMime,
  hitTestArrow,
  hitTestEllipseFrame,
  hitTestRoundedFrame,
  normalizeRect,
  outputFilename,
  snapshotState,
  validateAnnotateInput,
  MAX_FILE_BYTES,
} from '../assets/annotate-engine.js';

assert.equal(guessImageMime({ name: 'a.png', type: '' }), 'image/png');

{
  const ok = validateAnnotateInput({ name: 'a.png', type: 'image/png', size: 1000 });
  assert.equal(ok.ok, true);
  assert.equal(ok.kind, 'image');
}
{
  const pdf = validateAnnotateInput({ name: 'doc.pdf', type: 'application/pdf', size: 1000 });
  assert.equal(pdf.ok, true);
  assert.equal(pdf.kind, 'pdf');
}
{
  const bad = validateAnnotateInput({ name: 'a.txt', type: 'text/plain', size: 100 });
  assert.equal(bad.ok, false);
}

assert.equal(outputFilename('shot.jpeg'), 'shot-annotated.png');

{
  const arrow = { id: 'a1', type: 'arrow', x0: 0, y0: 0, x1: 100, y1: 0 };
  assert.equal(hitTestArrow(arrow, 50, 0), 'body');
}
{
  const ellipse = { id: 'e1', type: 'ellipse', x: 10, y: 10, w: 200, h: 120 };
  assert.equal(hitTestEllipseFrame(ellipse, 110, 70), 'body');
}
{
  const rect = { id: 'r1', type: 'rect', x: 10, y: 10, w: 200, h: 120 };
  assert.equal(hitTestRoundedFrame(rect, 110, 70), 'body');
}

console.log('annotate-engine.test.mjs: all tests passed');
