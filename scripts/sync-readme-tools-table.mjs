#!/usr/bin/env node
/**
 * README の「ツール一覧」を tool-registry から自動同期する
 * - MECE分類: 実務ツール / 補助・案内ページ / 法務ページ / 内部ページ
 * - 分類漏れがある場合は FAIL（ヌケモレ防止）
 *
 * Usage:
 *   node scripts/sync-readme-tools-table.mjs
 *   node scripts/sync-readme-tools-table.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const README_PATH = path.join(ROOT, 'README.md');
const REGISTRY_PATH = path.join(ROOT, 'data', 'tool-registry.json');

const START_MARKER = '<!-- AUTO:TOOLS_START -->';
const END_MARKER = '<!-- AUTO:TOOLS_END -->';
const CHECK_ONLY = process.argv.includes('--check');

const CLASSIFICATION = {
  legal: new Set(['privacy', 'terms', 'disclaimer']),
  internal: new Set(['brand-logo-preview']),
  support: new Set(['hub', 'updates', 'roadmap', 'statements', 'not-a-car']),
};

function fail(message) {
  console.error(`[readme-tools] FAIL: ${message}`);
  process.exit(1);
}

function loadJson(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} がありません: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stageLabel(stage) {
  const map = {
    stable: 'stable',
    gamma: 'gamma',
    beta: 'beta',
    alpha: 'alpha',
  };
  return map[stage] ?? 'unknown';
}

function classifyTool(id, tool) {
  if (CLASSIFICATION.legal.has(id)) return 'legal';
  if (CLASSIFICATION.internal.has(id)) return 'internal';
  if (CLASSIFICATION.support.has(id)) return 'support';
  if (tool.inNav) return 'product';
  if (id === 'font-converter') return 'support';
  return null;
}

function sortByNavOrder(entries) {
  return [...entries].sort((a, b) => {
    const ao = a.tool.navOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.tool.navOrder ?? Number.POSITIVE_INFINITY;
    return ao - bo || a.id.localeCompare(b.id, 'ja');
  });
}

function rowFor(entry, includeNav = false) {
  const { id, tool } = entry;
  const file = tool.file ?? `${id}.html`;
  const slug = file.replace(/\.html$/, '');
  const pathLabel = slug === 'hub' ? '/' : `/${slug}`;
  const name = tool.productName ?? tool.conceptName ?? id;
  const stage = stageLabel(tool.stage);
  if (includeNav) {
    return `| [${file}](tools/${file}) | ${pathLabel} | ${name} | ${tool.navLabel ?? '—'} | ${stage} |`;
  }
  return `| [${file}](tools/${file}) | ${pathLabel} | ${name} | ${stage} |`;
}

function buildSection(toolsObj) {
  const buckets = {
    product: [],
    support: [],
    legal: [],
    internal: [],
  };

  for (const [id, tool] of Object.entries(toolsObj)) {
    const bucket = classifyTool(id, tool);
    if (!bucket) {
      fail(`分類未定義の tool_id があります: ${id}（分類ルールを更新してください）`);
    }
    buckets[bucket].push({ id, tool });
  }

  const products = sortByNavOrder(buckets.product);
  const support = sortByNavOrder(buckets.support);
  const legal = sortByNavOrder(buckets.legal);
  const internal = sortByNavOrder(buckets.internal);

  const lines = [];
  lines.push('## ツール一覧（`tools/`）');
  lines.push('');
  lines.push('> この一覧は `data/tool-registry.json` を正本として自動同期しています。');
  lines.push('> 更新コマンド: `npm run sync:readme-tools`（検証のみ: `npm run validate:readme-tools`）');
  lines.push('');
  lines.push('### 1) 実務ツール（ユーザー向け本体）');
  lines.push('');
  lines.push('| ファイル | URL | 名称 | ナビ | stage |');
  lines.push('|---|---|---|---|---|');
  for (const entry of products) lines.push(rowFor(entry, true));
  lines.push('');
  lines.push('### 2) 補助・案内ページ');
  lines.push('');
  lines.push('| ファイル | URL | 名称 | stage |');
  lines.push('|---|---|---|---|');
  for (const entry of support) lines.push(rowFor(entry));
  lines.push('');
  lines.push('### 3) 法務ページ');
  lines.push('');
  lines.push('| ファイル | URL | 名称 | stage |');
  lines.push('|---|---|---|---|');
  for (const entry of legal) lines.push(rowFor(entry));
  lines.push('');
  lines.push('### 4) 内部ページ（非公開運用）');
  lines.push('');
  lines.push('| ファイル | URL | 名称 | stage |');
  lines.push('|---|---|---|---|');
  for (const entry of internal) lines.push(rowFor(entry));
  lines.push('');
  return lines.join('\n');
}

function replaceBetweenMarkers(source, generated) {
  const start = source.indexOf(START_MARKER);
  const end = source.indexOf(END_MARKER);
  if (start < 0 || end < 0 || end <= start) {
    fail(`README にマーカーがありません: ${START_MARKER} ... ${END_MARKER}`);
  }
  const before = source.slice(0, start + START_MARKER.length);
  const after = source.slice(end);
  return `${before}\n\n${generated}\n${after}`;
}

function main() {
  const registry = loadJson(REGISTRY_PATH, 'tool-registry');
  const toolsObj = registry.tools ?? {};
  if (!Object.keys(toolsObj).length) fail('tool-registry.json の tools が空です');

  const readme = fs.readFileSync(README_PATH, 'utf8');
  const generated = buildSection(toolsObj);
  const next = replaceBetweenMarkers(readme, generated);

  if (CHECK_ONLY) {
    if (next !== readme) {
      fail('README のツール一覧が最新ではありません。npm run sync:readme-tools を実行してください。');
    }
    console.log('[readme-tools] OK: README tools table is up to date');
    return;
  }

  fs.writeFileSync(README_PATH, next, 'utf8');
  console.log('[readme-tools] OK: README tools section synced');
}

main();
