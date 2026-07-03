#!/usr/bin/env node
/**
 * AdSense ビルド後検証 — core 全 HTML に自動広告タグ · Sync はゼロ
 * data/adsense.json enabled 時のみ core を要求。Sync は常に pagead 禁止。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADSENSE_MARKER, loadAdsenseConfig } from './adsense-pages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseTarget() {
  const arg = process.argv.find((a) => a.startsWith('--target='));
  if (arg) return arg.slice('--target='.length);
  const dist = process.env.SUGUDASU_DIST;
  if (dist && dist.replace(/\\/g, '/').includes('dist-sync')) return 'sync';
  return 'core';
}

const BUILD_TARGET = parseTarget();
const IS_SYNC = BUILD_TARGET === 'sync';
const DIST = process.env.SUGUDASU_DIST
  ? path.resolve(process.env.SUGUDASU_DIST)
  : path.join(ROOT, IS_SYNC ? 'dist-sync' : 'dist');

function fail(msg) {
  console.error(`[adsense-guard] FAIL: ${msg}`);
  process.exit(1);
}

function listHtmlFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) listHtmlFiles(p, acc);
    else if (ent.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

if (!fs.existsSync(DIST)) {
  fail(`${DIST} がありません。先に npm run build:pages を実行してください`);
}

const htmlFiles = listHtmlFiles(DIST);
const rel = (p) => path.relative(DIST, p).replace(/\\/g, '/');
const adsenseConfig = loadAdsenseConfig(IS_SYNC);

if (IS_SYNC) {
  const hits = htmlFiles.filter((p) => fs.readFileSync(p, 'utf8').includes(ADSENSE_MARKER));
  if (hits.length) {
    fail(`Sync に AdSense タグがあります: ${hits.map(rel).join(', ')}`);
  }
  console.log(`[adsense-guard] OK: Sync — ${htmlFiles.length} HTML · AdSense なし`);
  process.exit(0);
}

if (!adsenseConfig) {
  const hits = htmlFiles.filter((p) => fs.readFileSync(p, 'utf8').includes(ADSENSE_MARKER));
  if (hits.length) {
    fail(`adsense.json が無効なのにタグがあります: ${hits.map(rel).join(', ')}`);
  }
  console.log('[adsense-guard] OK: core — AdSense 無効（data/adsense.json enabled=false）');
  process.exit(0);
}

const missing = [];
const wrongClient = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes(ADSENSE_MARKER)) {
    missing.push(rel(file));
    continue;
  }
  if (!html.includes(adsenseConfig.client)) {
    wrongClient.push(rel(file));
  }
}

if (missing.length) {
  fail(
    `core の HTML に AdSense タグがありません（${missing.length}件）: ${missing.slice(0, 8).join(', ')}${
      missing.length > 8 ? '…' : ''
    } — tools/*.html を追加したら build-pages が自動注入します`
  );
}
if (wrongClient.length) {
  fail(`client ID 不一致: ${wrongClient.join(', ')} — data/adsense.json を確認`);
}

console.log(
  `[adsense-guard] OK: core — ${htmlFiles.length} HTML · auto ads (${adsenseConfig.client})`
);
