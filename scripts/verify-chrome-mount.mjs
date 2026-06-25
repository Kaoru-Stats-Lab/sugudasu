#!/usr/bin/env node
/**
 * 共通ヘッダー（sg-chrome）のビルド後検証 — 高頻度インシデントの回帰防止
 * docs/notes/CHROME_HEADER_GUARDRAILS.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = process.env.SUGUDASU_DIST
  ? path.resolve(process.env.SUGUDASU_DIST)
  : path.resolve(__dirname, '..', 'dist');

const SKIP = new Set(['brand-logo-preview.html']);

function fail(msg) {
  console.error(`[chrome-mount-guard] FAIL: ${msg}`);
  process.exit(1);
}

function verifyFile(file) {
  if (SKIP.has(file)) return;
  const html = fs.readFileSync(path.join(DIST, file), 'utf8');
  if (!html.includes('id="sg-chrome-top"')) return;

  const topMatch = html.match(/<div[^>]*id="sg-chrome-top"[^>]*>/);
  if (!topMatch) fail(`${file}: sg-chrome-top が見つかりません`);
  if (!/data-sg-title="[^"]+"/.test(topMatch[0])) {
    fail(`${file}: sg-chrome-top に data-sg-title がありません`);
  }

  if (!html.includes('sugudasu-shell.js')) {
    fail(`${file}: sugudasu-shell.js が読み込まれていません`);
  }
  if (/sugudasu-shell\.js[^"]*"\s+defer/.test(html)) {
    fail(`${file}: sugudasu-shell.js に defer が付いています（ヘッダー未表示の原因）`);
  }
  if (/<script[^>]*defer[^>]*>[\s\S]*?SUGUDASU_SHELL\.mount/.test(html)) {
    fail(`${file}: SUGUDASU_SHELL.mount に defer が付いています`);
  }
  if (/SUGUDASU_SHELL\.mount\s*\(/.test(html)) {
    fail(`${file}: インライン SUGUDASU_SHELL.mount が残っています（data-sg-title + shell 自動マウントに統一）`);
  }

  const topIdx = html.indexOf('id="sg-chrome-top"');
  const shellIdx = html.indexOf('sugudasu-shell.js');
  if (shellIdx < topIdx) {
    fail(`${file}: shell.js が sg-chrome-top より前にあります`);
  }
}

if (!fs.existsSync(DIST)) {
  fail('dist/ がありません。先に npm run build:pages を実行してください');
}

const files = fs.readdirSync(DIST).filter((f) => f.endsWith('.html'));
let checked = 0;
for (const file of files) {
  verifyFile(file);
  if (!SKIP.has(file) && fs.readFileSync(path.join(DIST, file), 'utf8').includes('id="sg-chrome-top"')) {
    checked += 1;
  }
}

console.log(`[chrome-mount-guard] OK: ${checked} pages with sg-chrome-top`);
