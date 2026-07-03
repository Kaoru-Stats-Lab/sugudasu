#!/usr/bin/env node
/**
 * invoice-finance — 単体テスト
 * Run: node scripts/invoice-finance.test.mjs
 */
import assert from 'node:assert/strict';
import {
  HAND_TAKE_PROGRESSIVE_THRESHOLD,
  PROGRESSIVE_TAX_AT_1M,
  PROGRESSIVE_THRESHOLD,
  applyRounding,
  compareInclusiveTaxPerChunk,
  computeInvoiceTotals,
  computeWithholdingTax,
  computeWithholdingSummary,
  grossPaymentFromNetHandTake,
  parseYenInput,
  splitInclusiveTaxAmount,
  splitMixedInclusiveTax,
} from '../assets/invoice-finance.js';

assert.equal(parseYenInput('¥1,234,567'), 1234567);
assert.equal(applyRounding(10.6, 'floor'), 10);
assert.equal(applyRounding(10.6, 'round'), 11);
assert.equal(applyRounding(10.1, 'ceil'), 11);

// 外税明細
{
  const t = computeInvoiceTotals([
    { name: 'A', qty: 1, price: 100000, taxRate: 10 },
    { name: 'B', qty: 1, price: 50000, taxRate: 8 },
  ]);
  assert.equal(t.subtotal, 150000);
  assert.equal(t.tax10, 10000);
  assert.equal(t.tax8, 4000);
  assert.equal(t.totalInTax, 164000);
}

// 源泉 10.21% 切捨て
assert.equal(computeWithholdingTax(500000), Math.floor(500000 * 0.1021));

// 累進 150万 — No.2792 式: (A−100万)×20.42% + 102,100
{
  const tax = computeWithholdingTax(1500000);
  const expected = Math.floor((1500000 - PROGRESSIVE_THRESHOLD) * 0.2042 + PROGRESSIVE_TAX_AT_1M);
  assert.equal(tax, expected);
  assert.equal(tax, 204200);
  assert.equal(PROGRESSIVE_TAX_AT_1M, 102100);
}

// No.2792 手取10万 → 支払111,370 · 源泉11,370
{
  const gross = grossPaymentFromNetHandTake(100000);
  assert.equal(gross, 111370);
  assert.equal(computeWithholdingTax(gross), 11370);
}

// 手取の二段階境界
assert.equal(HAND_TAKE_PROGRESSIVE_THRESHOLD, 897900);

// 源泉サマリー（税抜 · 150万報酬 + 10%消費税）
{
  const s = computeWithholdingSummary({
    subtotal: 1500000,
    totalInTax: 1650000,
    enabled: true,
    baseMode: 'ex-tax',
  });
  assert.equal(s.withholdingTax, 204200);
  assert.equal(s.netPayment, 1650000 - 204200);
}

// 源泉サマリー（税込150万）
{
  const s = computeWithholdingSummary({
    subtotal: 1363636,
    totalInTax: 1500000,
    enabled: true,
    baseMode: 'in-tax',
  });
  assert.equal(s.withholdingTax, 204200);
  assert.equal(s.netPayment, 1295800);
}

// 手取契約サマリー
{
  const s = computeWithholdingSummary({
    subtotal: 500000,
    totalInTax: 550000,
    enabled: true,
    contractMode: 'net',
    netTargetYen: 100000,
  });
  assert.equal(s.grossPayment, 111370);
  assert.equal(s.withholdingTax, 11370);
  assert.equal(s.netFromContract, 100000);
}

// 内税 10%
{
  const s = splitInclusiveTaxAmount(11000, 10, 'floor');
  assert.equal(s.base, 10000);
  assert.equal(s.tax, 1000);
}

// 混在
{
  const m = splitMixedInclusiveTax({ amount10: 11000, amount8: 10800 });
  assert.equal(m.totalBase, 10000 + 10000);
  assert.equal(m.totalTax, 1000 + 800);
}

// 行ごと比較で差が出るケース（存在確認）
{
  const c = compareInclusiveTaxPerChunk(25001, 10, 10000, 'floor');
  assert.ok(typeof c.baseDiff === 'number');
}

console.log('invoice-finance.test.mjs: all passed');
