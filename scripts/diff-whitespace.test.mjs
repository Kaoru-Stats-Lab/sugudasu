#!/usr/bin/env node
/**
 * diff normalizeWhitespaceForDiff — 単体テスト
 * Run: node scripts/diff-whitespace.test.mjs
 */
import assert from 'node:assert/strict';
import { normalizeWhitespaceForDiff } from '../assets/diff-app.js';

{
  const a = normalizeWhitespaceForDiff('A　B');
  const b = normalizeWhitespaceForDiff('A B');
  assert.equal(a, b);
}

{
  const a = normalizeWhitespaceForDiff('金額 100');
  const b = normalizeWhitespaceForDiff('金額 200');
  assert.notEqual(a, b);
}

{
  const a = normalizeWhitespaceForDiff('foo\tbar');
  const b = normalizeWhitespaceForDiff('foo bar');
  assert.equal(a, b);
}

{
  const a = normalizeWhitespaceForDiff('line  \nnext');
  const b = normalizeWhitespaceForDiff('line\nnext');
  assert.equal(a, b);
}

{
  const a = normalizeWhitespaceForDiff('a\u00a0b');
  assert.equal(a, 'a b');
}

{
  // 連続半角は畳まない
  assert.equal(normalizeWhitespaceForDiff('a  b'), 'a  b');
}

console.log('diff-whitespace.test.mjs: OK');
