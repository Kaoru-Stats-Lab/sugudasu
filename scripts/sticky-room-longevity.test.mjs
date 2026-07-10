#!/usr/bin/env node
/**
 * 長時間シナリオ — 2h 放置 → 再接続/編集 → TTL
 * Node: タイムライン + TTL ステップ（注入 clock）
 * Run: npm run test:sticky-room:longevity
 */
import assert from 'node:assert/strict';
import {
  LONGEVITY_IDLE_MS,
  ROOM_TTL_MS,
  computeRoomExpiresAt,
  createCard,
  getTtlRemainingMs,
  isRoomExpired,
  stepTtlCheck,
  ttlRemainingAfterLongIdle,
  upsertLocalCard,
} from '../assets/sticky-room-sync.js';

const T0 = 1_700_000_000_000;
const TWO_H = LONGEVITY_IDLE_MS;
const ONE_H = 60 * 60 * 1000;

// --- 1. 2 時間放置（本番 TTL 3h）---

{
  const expiresAt = computeRoomExpiresAt(T0);
  const atIdle = T0 + TWO_H;
  const snap = ttlRemainingAfterLongIdle(T0, atIdle);

  assert.equal(snap.idleMs, TWO_H);
  assert.equal(snap.expiresAt, expiresAt);
  assert.equal(snap.remainingMs, ROOM_TTL_MS - TWO_H);
  assert.equal(snap.remainingMs, ONE_H);
  assert.equal(snap.expired, false);
  assert.equal(isRoomExpired(expiresAt, atIdle), false);
}

// --- 2. 放置後も編集可能（TTL 前 · 同期とは独立の Map）---

{
  const atEdit = T0 + TWO_H + 5000;
  const expiresAt = computeRoomExpiresAt(T0);
  assert.equal(isRoomExpired(expiresAt, atEdit), false);

  let cards = new Map();
  cards = upsertLocalCard(
    cards,
    createCard({ cardId: 'long-1', text: '2h後の編集', updatedAt: atEdit }),
  );
  assert.equal(cards.get('long-1')?.text, '2h後の編集');
}

// --- 3. TTL 到達で expire ---

{
  const expiresAt = computeRoomExpiresAt(T0);
  const before = stepTtlCheck(expiresAt, false, expiresAt - 1);
  assert.equal(before.shouldExpire, false);
  assert.ok(before.remainingMs > 0);

  const at = stepTtlCheck(expiresAt, false, expiresAt);
  assert.equal(at.shouldExpire, true);
  assert.equal(at.remainingMs, 0);

  const after = stepTtlCheck(expiresAt, true, expiresAt + 999);
  assert.equal(after.shouldExpire, false);
  assert.equal(after.roomExpired, true);
}

// --- 4. 再接続しても expiresAt は延長しない（host-ready の正本）---

{
  const hostStart = T0;
  const hostExpires = computeRoomExpiresAt(hostStart);
  const joinReceivedExpires = hostExpires;
  const reconnectAt = hostStart + TWO_H;

  assert.equal(joinReceivedExpires, hostExpires);
  assert.equal(getTtlRemainingMs(joinReceivedExpires, reconnectAt), ONE_H);
  assert.equal(isRoomExpired(joinReceivedExpires, reconnectAt), false);
}

// --- 5. 注入 clock で放置→編集→TTL の一連シミュレーション ---

{
  let t = T0;
  const now = () => t;
  const expiresAt = computeRoomExpiresAt(now());
  let roomExpired = false;
  const ticks = [];

  const runTick = () => {
    const step = stepTtlCheck(expiresAt, roomExpired, now());
    ticks.push({ t, remainingMs: step.remainingMs, shouldExpire: step.shouldExpire });
    if (step.shouldExpire) roomExpired = true;
    return step;
  };

  // ホスト開始
  runTick();

  // 2h 放置
  t += TWO_H;
  const idleStep = runTick();
  assert.equal(idleStep.shouldExpire, false);
  assert.equal(idleStep.remainingMs, ONE_H);

  // 再接続後の編集（状態のみ）
  let cards = new Map();
  cards = upsertLocalCard(cards, createCard({ cardId: 'c1', text: 'reconnect-edit', updatedAt: now() }));
  assert.equal(cards.size, 1);

  // TTL まで進める
  t = expiresAt;
  const endStep = runTick();
  assert.equal(endStep.shouldExpire, true);
  assert.equal(roomExpired, true);

  assert.ok(ticks.length >= 3);
}

console.log(
  'sticky-room-longevity.test.mjs: OK (2h idle · reconnect/edit window · TTL expire)',
);
