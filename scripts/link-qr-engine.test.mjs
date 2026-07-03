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
  DEFAULT_PRESET,
} from '../assets/link-qr-engine.js';

assert.equal(DEFAULT_PRESET, 'event_contact');

// 正規化 · テックSNS
assert.equal(normalizeLinkInput('@alice', 'x').url, 'https://x.com/alice');
assert.equal(normalizeLinkInput('bob', 'gh').url, 'https://github.com/bob');
assert.equal(normalizeLinkInput('https://zenn.dev/carol', 'zn').url, 'https://zenn.dev/carol');
assert.ok(normalizeLinkInput('not a url', 'web').error);

// 正規化 · イベント連絡
assert.equal(normalizeLinkInput('dev@example.com', 'mail').url, 'mailto:dev@example.com');
assert.equal(
  normalizeLinkInput('https://workspace.slack.com/team/U012ABC', 'slack').url,
  'https://workspace.slack.com/team/U012ABC',
);
assert.ok(normalizeLinkInput('not-slack.com/foo', 'slack').error);

// ラウンドトリップ · イベント連絡
{
  const payload = buildPayload('アイデアソン A', {
    slack: 'https://workspace.slack.com/team/U1',
    mail: 'mailto:a@example.com',
  }, 'event_contact');
  assert.equal(payload?.pr, 'event_contact');
  const enc = encodePayload(payload);
  const dec = decodeHash(`#${enc.hash}`);
  assert.equal(dec.name, 'アイデアソン A');
  assert.equal(dec.presetId, 'event_contact');
  assert.equal(dec.links?.length, 2);
}

// ラウンドトリップ · 旧形式（pr なし）
{
  const legacy = { v: 1, n: 'Legacy', l: [['x', 'https://x.com/u']] };
  const enc = encodePayload(legacy);
  const dec = decodeHash(`#${enc.hash}`);
  assert.equal(dec.presetId, 'tech_sns');
}

// 共有 URL
{
  const payload = buildPayload('Test', { web: 'https://example.com' }, 'tech_sns');
  const share = buildShareUrl('https://sugudasu.com', '/link-qr', payload);
  assert.ok(share.url?.includes('#p='));
}

// フォーム
{
  const r = parseFormInputs('Alice', { x: '@alice', gh: 'bob' }, 'tech_sns');
  assert.equal(r.errors.length, 0);
  assert.equal(r.payload?.l.length, 2);
}

{
  const r = parseFormInputs('', {}, 'event_contact');
  assert.ok(r.errors.length > 0);
}

assert.ok(MAX_UTF8_BYTES >= 800);

console.log('link-qr-engine.test.mjs: OK');
