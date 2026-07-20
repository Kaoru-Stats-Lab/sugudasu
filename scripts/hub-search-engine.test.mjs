#!/usr/bin/env node
/**
 * hub-search-engine — 辞書ベース検索の単体テスト
 * Run: node scripts/hub-search-engine.test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeText,
  tokenizeQuery,
  buildIndex,
  search,
  resolveMeantToolId,
  buildLabelToToolId,
} from '../assets/hub-search-engine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dictDir = path.join(root, 'data', 'search-dictionary');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'tool-registry.json'), 'utf8'));
const synonyms = JSON.parse(fs.readFileSync(path.join(root, 'data', 'synonyms.json'), 'utf8'));
const hubCards = JSON.parse(fs.readFileSync(path.join(root, 'data', 'hub-cards.json'), 'utf8'));

const docs = fs
  .readdirSync(dictDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dictDir, f), 'utf8')));

const identities = Object.entries(registry.tools || {}).map(([toolId, t]) => ({
  toolId,
  productName: t.productName,
  conceptName: t.conceptName,
  navLabel: t.navLabel,
  name: t.name,
}));

const hubBlurbs = [];
const seenBlurb = new Set();
for (const card of hubCards.cards || []) {
  if (!card.toolId || !card.blurb || seenBlurb.has(card.toolId)) continue;
  seenBlurb.add(card.toolId);
  hubBlurbs.push({ toolId: card.toolId, blurb: card.blurb });
}

const index = buildIndex(docs, {
  identities,
  synonymEntries: synonyms.entries || [],
  hubBlurbs,
});

{
  assert.equal(normalizeText('ＳＵＧＵＤＡＳＵ　請求書'), 'sugudasu 請求書');
  assert.deepEqual(tokenizeQuery('予算 削り'), ['予算', '削り']);
}

{
  const hubIds = [...new Set((hubCards.cards || []).map((c) => c.toolId))].sort();
  const dictIds = docs.map((d) => d.toolId).sort();
  assert.deepEqual(dictIds, hubIds, 'hub cards と search-dictionary の toolId が一致すること');
}

{
  const labelMap = buildLabelToToolId(identities);
  assert.equal(resolveMeantToolId('SUGUDASU 請求書', labelMap), 'invoice');
  assert.equal(resolveMeantToolId('全角半角整え', labelMap), 'normalize');
  assert.equal(resolveMeantToolId('font-converter', labelMap), 'font-converter');
}

function topIds(q, n = 5) {
  return search(index, q, { limit: n }).map((h) => h.toolId);
}

function assertIncludes(q, toolId) {
  const hits = search(index, q, { limit: 15 });
  const ids = hits.map((h) => h.toolId);
  assert.ok(ids.includes(toolId), `query="${q}" should include ${toolId}; got ${ids.slice(0, 8).join(',')}`);
}

function assertTop(q, toolId) {
  const hits = search(index, q, { limit: 5 });
  assert.ok(hits.length > 0, `query="${q}" should return hits`);
  assert.equal(hits[0].toolId, toolId, `query="${q}" top should be ${toolId}; got ${hits[0].toolId} (${hits[0].score})`);
}

// 代表 Job / 別名
assertTop('請求書', 'invoice');
assertTop('引き算パレット', 'budget-trim');
assertTop('画面共有 QR', 'qr-reader');
assertIncludes('予算を上限内に削る', 'budget-trim');
assertIncludes('時給', 'time-calc');
assertIncludes('割り勘', 'warikan');
assertIncludes('危険な変更', 'diff');
assertIncludes('全角半角', 'normalize');

// Hub blurb（JTBD）経由
assertIncludes('適格請求書', 'invoice');
assertIncludes('黒塗り', 'mask');

// synonyms.json 経由
assertIncludes('インボイス', 'invoice');
assertIncludes('ウォーターマーク', 'watermark');

// 誤検索 → meant リダイレクト（ギャル文字は font-converter）
{
  const hits = search(index, 'ギャル文字 白抜き', { limit: 8 });
  const ids = hits.map((h) => h.toolId);
  assert.ok(
    ids.includes('font-converter') || ids.includes('sns'),
    `ギャル文字 should hit font-converter or sns; got ${ids.join(',')}`
  );
}

// 空クエリ
assert.deepEqual(search(index, '   '), []);
assert.deepEqual(search(index, ''), []);

console.log(
  `[hub-search-engine] OK: docs=${docs.length} terms=${index.terms.length} sample=${topIds('QR', 3).join(',')}`
);
