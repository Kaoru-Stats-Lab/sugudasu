#!/usr/bin/env node
/**
 * budget-trim-engine — 単体テスト
 * Run: node scripts/budget-trim-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  parseYenAmount,
  parseBudgetPaste,
  sumAmounts,
  budgetStatus,
  arrowKeyDelta,
  encodeHashState,
  decodeHashState,
  buildCleanTsv,
  applyAmountDelta,
  HASH_PREFIX,
  STEP_ARROW,
  STEP_SHIFT,
} from '../assets/budget-trim-engine.js';

{
  assert.equal(parseYenAmount('￥3,000,000-'), 3000000);
  assert.equal(parseYenAmount('1,500,000 円 (暫定)'), 1500000);
  assert.equal(parseYenAmount('１２３４'), 1234);
  assert.equal(parseYenAmount(''), null);
}

{
  const items = parseBudgetPaste('広告費\t1,200,000円\n展示会費\t800,000\n印刷代\t250,000\n\n');
  assert.equal(items.length, 3);
  assert.equal(items[0].name, '広告費');
  assert.equal(items[0].amount, 1200000);
  assert.equal(sumAmounts(items), 2250000);
}

{
  assert.deepEqual(budgetStatus(3420000, 3000000), { kind: 'over', delta: 420000 });
  assert.deepEqual(budgetStatus(3000000, 3000000), { kind: 'under', delta: 0 });
  assert.deepEqual(budgetStatus(2985000, 3000000), { kind: 'under', delta: 15000 });
  assert.equal(budgetStatus(100, null).kind, 'neutral');
}

{
  assert.equal(arrowKeyDelta({ key: 'ArrowUp', shiftKey: false }), STEP_ARROW);
  assert.equal(arrowKeyDelta({ key: 'ArrowDown', shiftKey: true }), -STEP_SHIFT);
  assert.equal(arrowKeyDelta({ key: 'a' }), null);
  assert.equal(applyAmountDelta(100000, -10000), 90000);
}

{
  const state = {
    cap: 3000000,
    items: [
      { name: '広告費', amount: 1000000, locked: true },
      { name: '展示会費', amount: 750000, locked: false },
    ],
  };
  const hash = encodeHashState(state);
  assert.ok(hash.startsWith(HASH_PREFIX));
  const decoded = decodeHashState(hash);
  assert.equal(decoded.ok, true);
  assert.equal(decoded.state.cap, 3000000);
  assert.equal(decoded.state.items.length, 2);
  assert.equal(decoded.state.items[0].locked, true);
  assert.equal(decoded.state.items[0].amount, 1000000);
}

{
  const tsv = buildCleanTsv([
    { name: '広告費', amount: 1000000 },
    { name: '展示会費', amount: 750000 },
    { name: '印刷代', amount: 250000 },
  ]);
  assert.equal(tsv, '広告費\t1000000\n展示会費\t750000\n印刷代\t250000');
}

console.log('budget-trim-engine.test.mjs: OK');
