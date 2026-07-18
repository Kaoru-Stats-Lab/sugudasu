#!/usr/bin/env node
/**
 * Hub IA / カテゴリ SSOT 検証
 * — categories · hub-config · synonyms · registry.categoryId
 * — Hub UI へカテゴリ名をハードコードしない前提の静的チェック
 *
 *   node scripts/verify-hub-ia.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SUPPORT_IDS = new Set([
  'hub',
  'updates',
  'roadmap',
  'statements',
  'privacy',
  'terms',
  'disclaimer',
  'not-a-car',
  'guides',
  'contact',
  'brand-logo-preview',
]);

function fail(msg) {
  console.error(`[hub-ia] FAIL: ${msg}`);
  process.exitCode = 1;
}

function main() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tool-registry.json'), 'utf8'));
  const catDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/categories.json'), 'utf8'));
  const hubConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hub-config.json'), 'utf8'));
  const synonyms = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/synonyms.json'), 'utf8'));
  const hubCards = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hub-cards.json'), 'utf8'));
  const relations = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/relations.json'), 'utf8'));

  const catIds = new Set((catDoc.categories || []).map((c) => c.id));
  for (const c of catDoc.categories || []) {
    if (!c.id || !c.label || c.order == null || !c.description) {
      fail(`categories.json 必須: id/label/order/description (${c.id || '?'})`);
    }
    if (c.hub || c.compare || c.blurb || c.chipLabel || c.mobilePrimary) {
      fail(`categories.json はドメインのみ。UI/compare は別ファイル (${c.id})`);
    }
  }

  for (const id of hubConfig.chipOrder || []) {
    if (!catIds.has(id)) fail(`hub-config.chipOrder 未知: ${id}`);
  }
  for (const id of hubConfig.primaryCategories || []) {
    if (!catIds.has(id)) fail(`hub-config.primaryCategories 未知: ${id}`);
  }
  for (const [id, label] of Object.entries(hubConfig.chipLabels || {})) {
    if (!catIds.has(id)) fail(`hub-config.chipLabels 未知: ${id}`);
    if (!label) fail(`hub-config.chipLabels[${id}] が空`);
  }

  for (const [id, tool] of Object.entries(registry.tools || {})) {
    if (SUPPORT_IDS.has(id)) continue;
    if (tool.inNav !== true) continue;
    if (!tool.categoryId) fail(`registry ${id}: categoryId 必須`);
    if (!catIds.has(tool.categoryId)) fail(`registry ${id}: 未知の categoryId=${tool.categoryId}`);
    if (tool.tags) fail(`registry ${id}: tags 禁止（検索は synonyms.json）`);
  }

  for (const entry of synonyms.entries || []) {
    for (const tid of entry.toolIds || []) {
      if (!registry.tools[tid]) fail(`synonyms: 未知の toolId=${tid}`);
    }
    if (!entry.terms || !entry.terms.length) fail('synonyms: terms が空のエントリ');
  }

  const cardToolIds = new Set();
  for (const card of hubCards.cards || []) {
    if (!registry.tools[card.toolId]) fail(`hub-cards: 未知の toolId=${card.toolId}`);
    if (!card.blurb) fail(`hub-cards: blurb 必須 (${card.toolId})`);
    cardToolIds.add(card.toolId);
  }
  for (const [id, tool] of Object.entries(registry.tools || {})) {
    if (id === 'hub' || !tool.inNav) continue;
    if (!cardToolIds.has(id)) fail(`hub-cards に inNav ツールが無い: ${id}`);
  }

  for (const [from, tos] of Object.entries(relations.relations || {})) {
    if (!registry.tools[from]) fail(`relations: 未知 from=${from}`);
    for (const to of tos) {
      if (!registry.tools[to]) fail(`relations: 未知 to=${to} (from ${from})`);
    }
  }

  if (process.exitCode) {
    console.error('[hub-ia] 検証失敗');
    process.exit(1);
  }
  console.log(
    `[hub-ia] OK: categories=${catIds.size} · cards=${(hubCards.cards || []).length} · synonyms=${(synonyms.entries || []).length}`
  );
}

main();
