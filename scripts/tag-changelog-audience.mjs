#!/usr/bin/env node
/**
 * 一回限り / 保守用 — changelog に audience を付与（MECE internal · public pickup）
 * 実行: node scripts/tag-changelog-audience.mjs [--write]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHANGELOG_PATH = path.join(path.resolve(__dirname, '..'), 'data', 'changelog.json');

const INTERNAL_TITLE_RE = /DEPLOY_LOG|ガードレール|keepalive|build-pages\.mjs|tool-registry\.json|RUNBOOK文案|TOOL_PAGE_LP_STRATEGY|GUIDES_CONTENT_STRATEGY\.md|lp-marketing-matrix/i;
const FILE_IN_TOOLS_RE = /\.(html|css|js|mjs|md|json)$/i;

/** 同日の細切れを internal 化する候補（public バンドルが別にある日） */
const INTERNAL_BY_DATE_TITLE = new Map([
  ['2026-07-03|リンク集QR — イベント連絡プリセット', 'link-qr-alpha-20260703'],
  ['2026-07-01|ツールページ内 LP — normalize Tier S', 'normalize-naming-20260701'],
]);

function shouldBeInternal(entry) {
  if (entry.audience) return entry.audience === 'internal';
  if (entry.type === 'chore') return true;
  if (INTERNAL_TITLE_RE.test(entry.title || '')) return true;
  const key = `${entry.date}|${entry.title}`;
  if (INTERNAL_BY_DATE_TITLE.has(key)) return true;
  return false;
}

function suggestRollup(entry) {
  const key = `${entry.date}|${entry.title}`;
  return INTERNAL_BY_DATE_TITLE.get(key) || null;
}

function main() {
  const write = process.argv.includes('--write');
  const data = JSON.parse(fs.readFileSync(CHANGELOG_PATH, 'utf8'));
  let tagged = 0;

  for (const entry of data.entries) {
    if (entry.audience) continue;

    if (shouldBeInternal(entry)) {
      entry.audience = 'internal';
      const rollup = suggestRollup(entry);
      if (rollup) entry.rollup = rollup;
      tagged += 1;
    }
  }

  // public pickup に安定 id
  const publicIds = [
    ['2026-07-03', '開発ロードマップ — 予定と対象外を公開', 'roadmap-20260703'],
    ['2026-07-03', 'サイト全体のレイアウトと読みやすさの改善', 'layout-refresh-20260703'],
    ['2026-07-03', 'リンク集QR（link-qr）α — サーバー非保存の即席プロフィール', 'link-qr-alpha-20260703'],
    ['2026-07-01', '全角半角整え（normalize）— 命名刷新・事務OLプリセット2種', 'normalize-naming-20260701'],
  ];
  for (const entry of data.entries) {
    const match = publicIds.find(([d, t]) => entry.date === d && entry.title === t);
    if (match && !entry.id) entry.id = match[2];
  }

  console.log(`[tag-changelog] ${tagged} entries → internal (dry-run=${!write})`);
  if (write) {
    fs.writeFileSync(CHANGELOG_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('[tag-changelog] wrote', CHANGELOG_PATH);
  } else {
    console.log('[tag-changelog] pass --write to apply');
  }
}

main();
