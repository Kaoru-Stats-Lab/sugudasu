#!/usr/bin/env node
/**
 * sticky-room-crypto — AES-GCM 単体テスト
 * Run: npm run test:sticky-room-crypto
 */
import assert from 'node:assert/strict';
import {
  clearRoomCrypto,
  decryptPayload,
  decryptWireString,
  encryptPayload,
  encryptWireString,
  fragmentToKey,
  generateRoomKey,
  initRoomCrypto,
  isCryptoReady,
  isEncryptedEnvelope,
  keyToFragment,
} from '../assets/sticky-room-crypto.js';

{
  const key = generateRoomKey();
  assert.equal(key.length, 32);
  const frag = keyToFragment(key);
  assert.match(frag, /^#k=/);
  assert.deepEqual(fragmentToKey(frag), key);
}

{
  clearRoomCrypto();
  assert.equal(isCryptoReady(), false);
  const key = generateRoomKey();
  await initRoomCrypto(key);
  assert.equal(isCryptoReady(), true);

  const plain = { type: 'ping', id: 42 };
  const enc = await encryptPayload(plain);
  assert.equal(isEncryptedEnvelope(enc), true);
  const dec = await decryptPayload(enc);
  assert.deepEqual(dec, plain);

  const wire = await encryptWireString({ type: 'card-add', card: { cardId: 'a', x: 1, y: 2, text: '', color: 'yellow', updatedAt: 1 } });
  const parsed = JSON.parse(wire);
  assert.equal(parsed.t, 'e');
  const inner = await decryptWireString(wire);
  assert.equal(inner.type, 'card-add');

  clearRoomCrypto();
  assert.equal(isCryptoReady(), false);
}

console.log('sticky-room-crypto.test.mjs: OK');
