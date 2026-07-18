#!/usr/bin/env node
/**
 * statements-product.json の MECE 検証
 * — カテゴリ正本: data/categories.json
 * — registry の inNav 製品ツールと 1:1 対応
 *
 *   node scripts/verify-statements-product.mjs
 *   node scripts/verify-statements-product.mjs --sync-date
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.join(ROOT, 'data', 'tool-registry.json');
const PRODUCT = path.join(ROOT, 'data', 'statements-product.json');
const CATEGORIES = path.join(ROOT, 'data', 'categories.json');
const ROADMAP = path.join(ROOT, 'data', 'roadmap.json');

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
]);

function fail(msg) {
  console.error(`[statements-product] FAIL: ${msg}`);
  process.exitCode = 1;
}

function main() {
  const syncDate = process.argv.includes('--sync-date');
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  const product = JSON.parse(fs.readFileSync(PRODUCT, 'utf8'));
  const catDoc = JSON.parse(fs.readFileSync(CATEGORIES, 'utf8'));
  const roadmap = JSON.parse(fs.readFileSync(ROADMAP, 'utf8'));

  if (syncDate) {
    product.updatedAt = roadmap.updatedAt || product.updatedAt;
    fs.writeFileSync(PRODUCT, `${JSON.stringify(product, null, 2)}\n`, 'utf8');
    console.log(`[statements-product] updatedAt → ${product.updatedAt} (from roadmap)`);
  }

  if (product.categories) {
    fail('statements-product.json に categories[] が残っています。正本は data/categories.json です');
  }

  const cats = catDoc.categories || [];
  const tools = product.tools || [];
  const catIds = new Set();
  for (const c of cats) {
    if (!c.id || !c.label) fail(`category に id/label が必要: ${JSON.stringify(c)}`);
    if (c.hub || c.chipLabel || c.mobilePrimary || c.showChip) {
      fail(`categories.json に UI フィールドがあります (${c.id})。hub-config.json へ`);
    }
    if (c.blurb && !c.description) fail(`${c.id}: blurb ではなく description を使ってください`);
    if (catIds.has(c.id)) fail(`category id 重複: ${c.id}`);
    catIds.add(c.id);
  }

  const expected = [];
  for (const [id, tool] of Object.entries(registry.tools || {})) {
    if (SUPPORT_IDS.has(id)) continue;
    if (tool.inNav === true) expected.push(id);
  }
  expected.sort();

  const seen = new Set();
  for (const row of tools) {
    const id = row.toolId;
    if (!id) {
      fail('tools[] に toolId が無い行があります');
      continue;
    }
    if (seen.has(id)) fail(`tools[] で toolId 重複: ${id}`);
    seen.add(id);
    if (!catIds.has(row.categoryId)) fail(`${id}: 未知の categoryId=${row.categoryId}`);
    if (!registry.tools[id]) fail(`${id}: tool-registry に存在しません`);
    if (!row.inputHandling || !row.promiseNote) fail(`${id}: inputHandling / promiseNote 必須`);
    const meta = registry.tools[id];
    if (!row.productName) fail(`${id}: productName 必須（slug 表示禁止）`);
    if (row.productName !== meta.productName) {
      fail(`${id}: productName 不一致 statements="${row.productName}" registry="${meta.productName}"`);
    }
    if (row.file && row.file !== meta.file) {
      fail(`${id}: file 不一致 statements="${row.file}" registry="${meta.file}"`);
    }
    if (meta.categoryId && meta.categoryId !== row.categoryId) {
      fail(`${id}: registry.categoryId=${meta.categoryId} ≠ statements=${row.categoryId}`);
    }
    if (!meta.categoryId) fail(`${id}: tool-registry に categoryId がありません`);
  }

  const missing = expected.filter((id) => !seen.has(id));
  const extra = [...seen].filter((id) => !expected.includes(id));
  if (missing.length) fail(`registry inNav にあるが statements-product に無い: ${missing.join(', ')}`);
  if (extra.length) fail(`statements-product にあるが registry inNav 対象外: ${extra.join(', ')}`);

  for (const c of cats) {
    const n = tools.filter((t) => t.categoryId === c.id).length;
    if (n === 0) fail(`空カテゴリ（ツール0件）: ${c.id}`);
  }

  if (product.updatedAt && roadmap.updatedAt && product.updatedAt < roadmap.updatedAt) {
    fail(
      `updatedAt(${product.updatedAt}) が roadmap.updatedAt(${roadmap.updatedAt}) より古い。同一タイミングで更新するか --sync-date を実行してください`
    );
  }

  if (process.exitCode) {
    console.error('[statements-product] 検証失敗');
    process.exit(1);
  }
  console.log(
    `[statements-product] OK: categories=${cats.length} · tools=${tools.length} · updatedAt=${product.updatedAt}`
  );
}

main();
