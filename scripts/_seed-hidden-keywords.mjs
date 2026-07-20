#!/usr/bin/env node
/**
 * 各 data/search-dictionary/{toolId}.json に hiddenKeywords を持たせる（ツール単位 · 中央巨大JSON禁止）
 * 既存配列がある場合は上書きしない（不足キーだけ補完）。
 *
 *   node scripts/_seed-hidden-keywords.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DICT = path.join(ROOT, 'data', 'search-dictionary');
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-registry.json'), 'utf8'));

/** 手作業の検索専用語（画面非表示）。ツール追加＝ここへ追記。 */
const HAND = {
  'group-split': [
    'グループ',
    'グループ分け',
    'チーム',
    'チーム分け',
    'シャッフル',
    '席替え',
    'ランダム',
    '組分け',
    'ブレイクアウト',
    '名簿分割',
  ],
};

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const t = String(x || '').trim();
    if (!t || t.length < 2) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function seedFromDoc(doc, conceptName) {
  const titleBits = new Set(
    [conceptName, doc.toolId].filter(Boolean).map((s) => String(s).trim().toLowerCase())
  );
  const pool = [...(doc.aliases || []), ...(doc.keywords || [])]
    .map((s) => String(s || '').trim())
    .filter((s) => s.length >= 2 && s.length <= 24)
    .filter((s) => !titleBits.has(s.toLowerCase()))
    .filter((s) => !/\s/.test(s) || s.length <= 12);
  return uniq(pool).slice(0, 12);
}

let updated = 0;
for (const f of fs.readdirSync(DICT).filter((x) => x.endsWith('.json'))) {
  const p = path.join(DICT, f);
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  const tool = (registry.tools || {})[doc.toolId] || {};
  const concept = tool.conceptName || '';
  const existing = Array.isArray(doc.hiddenKeywords) ? doc.hiddenKeywords : [];
  const hand = HAND[doc.toolId] || [];
  const auto = existing.length ? [] : seedFromDoc(doc, concept);
  const next = uniq([...existing, ...hand, ...auto]);
  if (JSON.stringify(next) === JSON.stringify(existing) && existing.length) continue;

  doc.hiddenKeywords = next;
  fs.writeFileSync(p, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  updated += 1;
  console.log(`  + ${doc.toolId}: ${doc.hiddenKeywords.length} terms`);
}

console.log(`[seed-hidden-keywords] updated=${updated}`);
