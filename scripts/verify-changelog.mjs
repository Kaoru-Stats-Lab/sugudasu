#!/usr/bin/env node
/**
 * changelog 粒度検証 — audience: public のみユーザー向けルールを強制
 * SSOT: docs/notes/DEV_TRANSPARENCY_RULES.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHANGELOG_PATH = path.join(ROOT, 'data', 'changelog.json');
const REGISTRY_PATH = path.join(ROOT, 'data', 'tool-registry.json');

const EXTRA_TOOL_IDS = new Set([
  'guides',
  'updates',
  'roadmap',
  'statements',
  'not-a-car',
  'sync-timeline-lp',
  'disclaimer',
  'privacy',
  'terms',
  'paper-schedule-research',
  'mask', // legacy id · 2026-07-24 annotate へ rename · 履歴エントリ用
]);

const FILE_EXT_RE = /\.(html|css|js|mjs|md|json)\b/i;
const SG_CLASS_RE = /\bsg-[a-z][\w-]*/i;
const PATH_LIKE_RE = /(?:^|[\s「『(])([\w./-]+\.(?:html|css|js|mjs|md))\b/;

const ALLOWED_TYPES = new Set(['feature', 'fix', 'improve', 'chore']);
const FEAT_ALIAS = 'feat';
const NEW_TOOL_TITLE_RE = /新設|（\/[\w-]+）新設|α\s*[—–-]/;
/** public 禁止 — インフラ · 見た目微調整（DEV_TRANSPARENCY_RULES §2） */
const PUBLIC_INFRA_TITLE_RE =
  /canonical|og:url|robots|GSC|noindex|FAQ\s*レイアウト|設定パネル|内側スクロール|内部JSON|ビルドパイプライン|X-Robots/i;
const PUBLIC_SLUG_LEAD_RE = /^(?:[a-z][\w-]*)\s*(?:を|—|–|-)/;

function normalizeType(type) {
  return type === FEAT_ALIAS ? 'feature' : type;
}

let errors = 0;
let warns = 0;

function fail(msg) {
  console.error(`[changelog-guard] FAIL: ${msg}`);
  errors += 1;
}

function warn(msg) {
  console.warn(`[changelog-guard] WARN: ${msg}`);
  warns += 1;
}

function isPublicEntry(entry) {
  return entry.audience === 'public';
}

function loadRegistryIds() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  return new Set([...Object.keys(registry.tools || {}), ...EXTRA_TOOL_IDS]);
}

function validatePublicEntry(entry, index, registryIds, idIndex) {
  const label = `entries[${index}] (${entry.date} · ${entry.title})`;
  const type = normalizeType(entry.type);

  if (!ALLOWED_TYPES.has(entry.type) && entry.type !== FEAT_ALIAS) {
    fail(`${label}: 未知の type — "${entry.type}"（feature · fix · improve）`);
  }
  if (entry.type === FEAT_ALIAS) {
    warn(`${label}: type=feat は feature に統一してください`);
  }
  if (type === 'improve' && NEW_TOOL_TITLE_RE.test(entry.title || '')) {
    fail(`${label}: 新設・α リリースは type=feature にしてください`);
  }

  if (type === 'chore') {
    fail(`${label}: type=chore は audience:"internal" にしてください`);
  }

  if (PUBLIC_INFRA_TITLE_RE.test(entry.title || '')) {
    fail(`${label}: インフラ・見た目微調整は audience:"internal"（ユーザー価値テスト参照）`);
  }
  if (PUBLIC_SLUG_LEAD_RE.test(entry.title || '')) {
    fail(`${label}: タイトル先頭を registry slug にしない — 概念名（navLabel）を使う`);
  }

  for (const tool of entry.tools || []) {
    if (FILE_EXT_RE.test(tool) || tool.includes('/') || tool.includes('\\')) {
      fail(`${label}: tools にファイルパス禁止 — "${tool}"`);
    } else if (!registryIds.has(tool)) {
      fail(`${label}: tools の未知 id — "${tool}"（registry または EXTRA_TOOL_IDS）`);
    }
  }

  const text = `${entry.title || ''} ${entry.body || ''}`;
  if (SG_CLASS_RE.test(text)) {
    fail(`${label}: CSS クラス名（sg-*）を本文に載せない`);
  }
  if (PATH_LIKE_RE.test(text)) {
    fail(`${label}: ファイルパスを本文に載せない`);
  }

  if (entry.rollup) {
    fail(`${label}: rollup は internal 専用です`);
  }
}

function validateInternalEntry(entry, index, idIndex) {
  const label = `entries[${index}] (${entry.date} · ${entry.title})`;

  if (entry.rollup && !idIndex.has(entry.rollup)) {
    fail(`${label}: rollup 先 id が存在しません — "${entry.rollup}"`);
  }
  if (entry.rollup) {
    const target = idIndex.get(entry.rollup);
    if (target && target.audience === 'internal') {
      fail(`${label}: rollup 先は public である必要があります — "${entry.rollup}"`);
    }
  }
}

function validateLegacyPublic(entry, index) {
  const label = `entries[${index}] legacy (${entry.date} · ${entry.title})`;
  const type = normalizeType(entry.type);
  if (entry.type === FEAT_ALIAS) {
    warn(`${label}: type=feat — feature に統一推奨（本番で「改善」表示になる場合あり）`);
  }
  if (type === 'improve' && NEW_TOOL_TITLE_RE.test(entry.title || '')) {
    warn(`${label}: 新設・α なのに improve — feature に修正`);
  }
  const hasFileTools = (entry.tools || []).some(t => FILE_EXT_RE.test(t) || t.includes('/'));
  const hasSg = SG_CLASS_RE.test(`${entry.title || ''} ${entry.body || ''}`);
  if (hasFileTools || hasSg || entry.type === 'chore') {
    warn(`${label}: audience 未設定のまま粒度違反 — internal 化または public 向けに書き直し`);
  }
}

function main() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    fail('data/changelog.json がありません');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(CHANGELOG_PATH, 'utf8'));
  const entries = data.entries || [];
  const registryIds = loadRegistryIds();

  const idIndex = new Map();
  for (const entry of entries) {
    if (entry.id) {
      if (idIndex.has(entry.id)) {
        fail(`重複 id — "${entry.id}"`);
      }
      idIndex.set(entry.id, entry);
    }
  }

  entries.forEach((entry, index) => {
    if (entry.audience === 'internal') {
      validateInternalEntry(entry, index, idIndex);
      return;
    }
    if (entry.audience === 'public') {
      validatePublicEntry(entry, index, registryIds, idIndex);
      return;
    }
    if (entry.audience === undefined) {
      validateLegacyPublic(entry, index);
      warn(`entries[${index}] (${entry.date} · ${entry.title}): audience 未設定 — /updates 非表示。public または internal を明示`);
      return;
    }
    fail(`entries[${index}]: 未知の audience — "${entry.audience}"`);
  });

  const publicCount = entries.filter(isPublicEntry).length;
  const internalCount = entries.filter(e => e.audience === 'internal').length;
  const legacyCount = entries.filter(e => e.audience === undefined).length;

  if (errors) {
    console.error(`[changelog-guard] ${errors} error(s), ${warns} warn(s) · public=${publicCount} internal=${internalCount}`);
    process.exit(1);
  }

  console.log(`[changelog-guard] OK: ${entries.length} entries · public=${publicCount} internal=${internalCount}${legacyCount ? ` legacy=${legacyCount}` : ''}${warns ? ` · ${warns} warn` : ''}`);
}

main();
