#!/usr/bin/env node
/**
 * 景品表示法 一次スクリーニング — 単体テスト（10本以上）
 * Run: node scripts/prize-law-eval.test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluatePrizeLaw,
  calcGeneralLotteryMaxPrize,
  calcLumpSumMaxPremium,
  fisherYatesDraw,
  runBandDraw,
  sha256Hex,
} from '../assets/prize-law-eval.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/prize-law-rules.json'), 'utf8'));
const patterns = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/prize-law-patterns.json'), 'utf8'));

function baseInput(overrides = {}) {
  return {
    audience: 'consumer',
    patternIds: [],
    maxTransactionYen: 3000,
    maxPrizeYen: 50000,
    totalPrizeYen: 100000,
    expectedSalesYen: 10000000,
    winnerCount: 10,
    isPaid: true,
    prizeName: 'テスト景品',
    campaignSummary: 'テストキャンペーン',
    ...overrides,
  };
}

// 1. P01例: 3000円取引 × 10万景品 → 赤（上限6万）
{
  const r = evaluatePrizeLaw(baseInput({ maxTransactionYen: 3000, maxPrizeYen: 100000 }), rules, patterns);
  assert.equal(r.overallLevel, 'red', 'P01 numeric: 3000×20=60000 cap, 100000 prize → red');
  assert.ok(r.hasRedFlag);
}

// 2. 3000円取引 × 5万景品 → 目安内
{
  const r = evaluatePrizeLaw(baseInput({ maxTransactionYen: 3000, maxPrizeYen: 50000 }), rules, patterns);
  const maxCheck = r.numericChecks.find((c) => c.id === 'general-lottery-max');
  assert.equal(maxCheck?.level, 'ok');
}

// 3. 5000円以上取引 × 15万景品 → 赤（上限10万）
{
  const r = evaluatePrizeLaw(baseInput({ maxTransactionYen: 8000, maxPrizeYen: 150000 }), rules, patterns);
  assert.equal(r.overallLevel, 'red');
}

// 4. 8000円取引 × 8万景品 → 目安内
{
  const r = evaluatePrizeLaw(baseInput({ maxTransactionYen: 8000, maxPrizeYen: 80000 }), rules, patterns);
  const maxCheck = r.numericChecks.find((c) => c.id === 'general-lottery-max');
  assert.equal(maxCheck?.level, 'ok');
}

// 5. 景品総額が売上2%超 → 赤
{
  const r = evaluatePrizeLaw(
    baseInput({ expectedSalesYen: 10000000, totalPrizeYen: 300000, maxPrizeYen: 30000 }),
    rules,
    patterns,
  );
  const totalCheck = r.numericChecks.find((c) => c.id === 'general-lottery-total');
  assert.equal(totalCheck?.level, 'red');
}

// 6. 景品総額が売上2%以内 → ok
{
  const r = evaluatePrizeLaw(
    baseInput({ expectedSalesYen: 10000000, totalPrizeYen: 150000, maxPrizeYen: 20000 }),
    rules,
    patterns,
  );
  const totalCheck = r.numericChecks.find((c) => c.id === 'general-lottery-total');
  assert.equal(totalCheck?.level, 'ok');
}

// 7. 総付: 500円取引 × 250円景品 → 赤（上限200）
{
  const lump = calcLumpSumMaxPremium(rules, 500);
  assert.equal(lump.maxAllowedYen, 200);
  const r = evaluatePrizeLaw(
    baseInput({ patternIds: ['P02'], maxTransactionYen: 500, maxPrizeYen: 250 }),
    rules,
    patterns,
  );
  assert.ok(r.flags.some((f) => f.id === 'lump-sum-max' && f.level === 'red'));
}

// 8. 総付: 5000円取引 × 600円景品 → 目安内（上限1000=10分の2）
{
  const lump = calcLumpSumMaxPremium(rules, 5000);
  assert.equal(lump.maxAllowedYen, 1000);
  const r = evaluatePrizeLaw(
    baseInput({ patternIds: ['P05'], maxTransactionYen: 5000, maxPrizeYen: 600 }),
    rules,
    patterns,
  );
  const lumpCheck = r.numericChecks.find((c) => c.id === 'lump-sum-max');
  assert.equal(lumpCheck?.level, 'ok');
}

// 8b. 総付: 5000円 × 1100円 → 赤
{
  const r = evaluatePrizeLaw(
    baseInput({ patternIds: ['P05'], maxTransactionYen: 5000, maxPrizeYen: 1100 }),
    rules,
    patterns,
  );
  assert.ok(r.numericChecks.some((c) => c.id === 'lump-sum-max' && c.level === 'red'));
}

// 9. 総付: 5000円 × 400円 → ok
{
  const r = evaluatePrizeLaw(
    baseInput({ patternIds: ['P02'], maxTransactionYen: 5000, maxPrizeYen: 400 }),
    rules,
    patterns,
  );
  const lumpCheck = r.numericChecks.find((c) => c.id === 'lump-sum-max');
  assert.equal(lumpCheck?.level, 'ok');
}

// 10. P02パターン選択 → 赤フラグ
{
  const r = evaluatePrizeLaw(baseInput({ patternIds: ['P02'], maxPrizeYen: 100 }), rules, patterns);
  assert.ok(r.flags.some((f) => f.id === 'P02' && f.level === 'red'));
}

// 11. P03パターン → 黄
{
  const r = evaluatePrizeLaw(baseInput({ patternIds: ['P03'], maxPrizeYen: 1000, maxTransactionYen: 1000 }), rules, patterns);
  assert.equal(r.overallLevel, 'yellow');
}

// 12. 社内 + P11 → 黄
{
  const r = evaluatePrizeLaw(
    { ...baseInput({ audience: 'internal', patternIds: ['P11'] }), maxPrizeYen: 0 },
    rules,
    patterns,
  );
  assert.ok(r.flags.some((f) => f.id === 'P11'));
  assert.equal(r.overallLevel, 'yellow');
}

// 13. calcGeneralLotteryMaxPrize 単体
{
  const a = calcGeneralLotteryMaxPrize(rules, 4999);
  assert.equal(a.maxAllowedYen, 4999 * 20);
  const b = calcGeneralLotteryMaxPrize(rules, 5000);
  assert.equal(b.maxAllowedYen, 100000);
}

// 14. Fisher-Yates: 固定シードで再現
{
  let counter = 0;
  const fixed = [3, 1, 0];
  const randomFn = () => new Uint32Array([fixed[counter++ % fixed.length]]);
  const { winners } = fisherYatesDraw(['A', 'B', 'C', 'D'], 2, { randomFn });
  assert.equal(winners.length, 2);
}

// 15. SHA-256
{
  const hex = await sha256Hex('alice\nbob\n');
  assert.equal(hex.length, 64);
  assert.match(hex, /^[0-9a-f]+$/);
}

// 16. P08 — nextSteps が付く
{
  const r = evaluatePrizeLaw(baseInput({ patternIds: ['P08'] }), rules, patterns);
  const p08 = r.flags.find((f) => f.id === 'P08');
  assert.ok(p08 && p08.nextSteps && p08.nextSteps.length >= 3, 'P08 should include concrete nextSteps');
  assert.ok(p08.nextSteps.some((s) => s.url && s.kind === 'consult'), 'P08 should link to consultation');
}

// 17. runBandDraw: 賞帯別・既当選者除外
{
  const seedBuf = new Uint8Array(16).fill(42);
  const seedHex = Array.from(seedBuf).map((b) => b.toString(16).padStart(2, '0')).join('');
  const draw = runBandDraw(
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    [{ label: '1位', count: 1 }, { label: '2位', count: 3 }, { label: '3位', count: 5 }],
    { seedBuf, seedHex, exclude: true },
  );
  assert.equal(draw.bands.length, 3);
  assert.equal(draw.winners.length, 9);
  assert.equal(new Set(draw.winners).size, 9, 'exclude=true なら重複当選なし');
  assert.equal(draw.drawMode, 'bands');
}

// 18. runBandDraw: 各賞帯に当選者が割り当てられる
{
  const draw = runBandDraw(['1', '2', '3', '4', '5', '6'], [
    { label: '1位', count: 1 },
    { label: '2位', count: 2 },
  ], { exclude: true });
  assert.equal(draw.bands[0].winners.length, 1);
  assert.equal(draw.bands[1].winners.length, 2);
  assert.equal(draw.winners.length, 3);
  assert.equal(draw.bands[0].label, '1位');
}

// 19. P12 — 複数コース
{
  const r = evaluatePrizeLaw(baseInput({ patternIds: ['P12'] }), rules, patterns);
  const p12 = r.flags.find((f) => f.id === 'P12');
  assert.ok(p12 && p12.level === 'yellow');
  assert.ok(p12.nextSteps && p12.nextSteps.length >= 3);
}

// 20. P13 — 複数SNS口数増
{
  const r = evaluatePrizeLaw(baseInput({ patternIds: ['P13'] }), rules, patterns);
  assert.ok(r.flags.some((f) => f.id === 'P13' && f.level === 'yellow'));
}

// 21. P14 — 購入ティア口数
{
  const r = evaluatePrizeLaw(baseInput({ patternIds: ['P14'] }), rules, patterns);
  assert.ok(r.flags.some((f) => f.id === 'P14'));
}

// 22. P15 — 紹介・Wチャンス
{
  const r = evaluatePrizeLaw(baseInput({ patternIds: ['P15'] }), rules, patterns);
  assert.ok(r.flags.some((f) => f.id === 'P15'));
}

console.log('prize-law-eval.test.mjs — all tests passed (' + 23 + ')');
