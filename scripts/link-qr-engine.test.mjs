#!/usr/bin/env node
/**
 * リンク集QR — 単体テスト
 * Run: node scripts/link-qr-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  buildPayload,
  buildShareUrl,
  decodeHash,
  encodePayload,
  normalizeLinkInput,
  parseFormInputs,
  MAX_UTF8_BYTES,
} from '../assets/link-qr-engine.js';

// 正規化
assert.equal(normalizeLinkInput('@alice', 'x').url, 'https://x.com/alice');
assert.equal(normalizeLinkInput('bob', 'gh').url, 'https://github.com/bob');
assert.equal(normalizeLinkInput('https://zenn.dev/carol', 'zn').url, 'https://zenn.dev/carol');
assert.ok(normalizeLinkInput('not a url', 'web').error);

// ラウンドトリップ
{
  const payload = buildPayload('山田 太郎', {
    x: 'https://x.com/yamada',
    gh: 'https://github.com/yamada',
  });
  assert.ok(payload);
  const enc = encodePayload(payload);
  assert.ok(enc.hash);
  const dec = decodeHash(`#${enc.hash}`);
  assert.equal(dec.name, '山田 太郎');
  assert.equal(dec.links?.length, 2);
  assert.equal(dec.links?.[0].url, 'https://x.com/yamada');
}

// 共有 URL
{
  const payload = buildPayload('Test', { web: 'https://example.com' });
  const share = buildShareUrl('https://sugudasu.com', '/link-qr', payload);
  assert.ok(share.url?.includes('#p='));
  const dec = decodeHash(share.url.split('#')[1] ? `#${share.url.split('#')[1]}` : '');
  assert.equal(dec.links?.[0].url, 'https://example.com');
}

// フォーム
{
  const r = parseFormInputs('Alice', { x: '@alice', gh: 'bob' });
  assert.equal(r.errors.length, 0);
  assert.equal(r.payload?.l.length, 2);
}

{
  const r = parseFormInputs('', {});
  assert.ok(r.errors.length > 0);
}

assert.ok(MAX_UTF8_BYTES >= 800);

console.log('link-qr-engine.test.mjs: OK');
