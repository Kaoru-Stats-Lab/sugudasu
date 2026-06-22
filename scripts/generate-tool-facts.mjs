#!/usr/bin/env node
/**
 * TOOL_FACTS 生成
 * sources:
 *   - data/tool-registry.json
 *   - data/lp-marketing-matrix.json
 *   - data/tool-facts/{tool_id}.json
 * output:
 *   - docs/prompts/TOOL_FACTS.generated.md
 *   - docs/prompts/tool-facts/{tool_id}.generated.md（個別）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'data', 'tool-registry.json');
const MATRIX_PATH = path.join(ROOT, 'data', 'lp-marketing-matrix.json');
const FACTS_DIR = path.join(ROOT, 'data', 'tool-facts');
const QUEUE_PATH = path.join(FACTS_DIR, '_queue.json');
const DEFAULT_OUT_PATH = path.join(ROOT, 'docs', 'prompts', 'TOOL_FACTS.generated.md');
const PER_TOOL_DIR = path.join(ROOT, 'docs', 'prompts', 'tool-facts');
const SITE_ORIGIN = 'https://sugudasu.com';

function fail(message) {
  console.error(`[tool-facts] FAIL: ${message}`);
  process.exit(1);
}

function parseArg(name) {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

function canonicalPathFromFile(file) {
  if (!file) return '/';
  const slug = file.replace(/\.html$/, '');
  return slug === 'hub' ? '/' : `/${slug}`;
}

function loadJson(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} がありません`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function matrixMaps(matrix) {
  const priority = new Map((matrix.priority ?? []).map((r) => [r.tool_id, r]));
  const delta = new Map((matrix.deltaProblems ?? []).map((r) => [r.tool_id, r]));
  return { priority, delta };
}

function listFactFiles() {
  if (!fs.existsSync(FACTS_DIR)) return [];
  return fs
    .readdirSync(FACTS_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .map((f) => f.replace(/\.json$/, ''));
}

function resolveOrder(queue, factIds, idsArg) {
  if (idsArg) {
    return idsArg
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }
  const order = queue.order ?? [];
  const seen = new Set();
  const result = [];
  for (const id of order) {
    if (factIds.includes(id) && !seen.has(id)) {
      result.push(id);
      seen.add(id);
    }
  }
  for (const id of factIds.sort()) {
    if (!seen.has(id)) {
      result.push(id);
      seen.add(id);
    }
  }
  return result;
}

function mergeToolContext(toolId, registry, matrixMaps, facts) {
  const reg = registry.tools?.[toolId];
  const pri = matrixMaps.priority.get(toolId);
  const del = matrixMaps.delta.get(toolId);
  const file = reg?.file ?? `${toolId}.html`;
  const pathname = canonicalPathFromFile(file);
  const url = `${SITE_ORIGIN}${pathname}`;

  return {
    toolId,
    productName: facts?.productName ?? reg?.productName ?? pri?.productName ?? toolId,
    conceptName: reg?.conceptName ?? '',
    navLabel: reg?.navLabel ?? '',
    stage: reg?.stage ?? 'unknown',
    version: reg?.version ?? '',
    statusNote: reg?.statusNote ?? '',
    url,
    registryStatus: pri?.registryStatus ?? (reg ? 'live' : 'unknown'),
    primaryPain: pri?.primaryPain ?? '',
    primaryType: pri?.primaryType ?? '',
    delta: del?.delta ?? facts?._scaffoldMeta?.delta ?? '',
    typicalAsk: del?.typicalAsk ?? '',
    facts,
  };
}

function bulletLines(items, fallback = '- 要確認') {
  if (!items?.length) return [fallback];
  return items.map((item) => `- ${item}`);
}

function buildPerToolMarkdown(ctx) {
  const f = ctx.facts ?? {};
  const lines = [];
  lines.push(`# TOOL_FACTS: ${ctx.toolId}`);
  lines.push('');
  lines.push(`status: **${f.status ?? 'missing'}** · updated: ${f.updatedAt ?? '—'}`);
  lines.push(`productName: ${ctx.productName} · stage: ${ctx.stage} · URL: ${ctx.url}`);
  lines.push('');
  lines.push('## マーケ（matrix 参照 · 捏造禁止）');
  lines.push('');
  lines.push(`- 主Pain: ${ctx.primaryPain || '要確認'}`);
  lines.push(`- 最優先の型: ${ctx.primaryType ? `型${ctx.primaryType}` : '要確認'}`);
  lines.push(`- △相当: ${ctx.delta || '要確認'}`);
  lines.push(`- 聞き直し例: ${ctx.typicalAsk || '要確認'}`);
  lines.push('');
  if (f.oneLiner) {
    lines.push('## 一行');
    lines.push('');
    lines.push(f.oneLiner);
    lines.push('');
  }
  lines.push('## 実装済み（reviewed のみ Gemini が断定可）');
  lines.push('');
  if (f.status === 'reviewed' && f.implemented?.length) {
    lines.push(...bulletLines(f.implemented));
  } else {
    lines.push('- 要確認（status が reviewed でない、または未記入）');
  }
  lines.push('');
  lines.push('## 未実装 / 言い過ぎ注意');
  lines.push('');
  lines.push(...bulletLines(f.notImplemented, '- 特になし（要確認）'));
  lines.push('');
  lines.push('## データ取り扱い');
  lines.push('');
  const dh = f.dataHandling ?? {};
  lines.push(`- upload: ${dh.upload ?? '要確認'}`);
  lines.push(`- serverSave: ${dh.serverSave ?? '要確認'}`);
  lines.push(`- localStorage: ${dh.localStorage ?? '要確認'}`);
  lines.push(`- retention: ${dh.retention ?? '要確認'}`);
  lines.push('');
  lines.push('## 信頼 FAQ 素材');
  lines.push('');
  const tr = f.trust ?? {};
  lines.push(`- 保存: ${tr.faqStorage ?? '要確認'}`);
  lines.push(`- 編集: ${tr.faqEdit ?? '要確認'}`);
  lines.push(`- 保持: ${tr.faqRetention ?? '要確認'}`);
  lines.push('');
  if (f.postCompletion?.length) {
    lines.push('## 完了後導線');
    lines.push('');
    lines.push(...bulletLines(f.postCompletion));
    lines.push('');
  }
  if (f.promptNotes) {
    lines.push('## Gemini メモ');
    lines.push('');
    lines.push(f.promptNotes);
    lines.push('');
  }
  lines.push('## Gemini 添付ブロック（1ツール）');
  lines.push('');
  lines.push('```text');
  lines.push(`【${ctx.toolId} 事実 · status=${f.status ?? 'missing'}】`);
  lines.push(`${ctx.productName} / ${ctx.url}`);
  lines.push(`Pain: ${ctx.primaryPain || '要確認'}`);
  if (f.status === 'reviewed') {
    for (const item of f.implemented ?? []) lines.push(`実装: ${item}`);
  }
  for (const item of f.notImplemented ?? []) lines.push(`未実装: ${item}`);
  lines.push(`データ: upload=${dh.upload} serverSave=${dh.serverSave} retention=${dh.retention ?? '要確認'}`);
  lines.push('```');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function buildIndexTable(contexts) {
  const lines = [];
  lines.push('| # | tool_id | status | registry | productName | URL |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  contexts.forEach((ctx, i) => {
    const status = ctx.facts?.status ?? 'missing';
    lines.push(
      `| ${i + 1} | ${ctx.toolId} | ${status} | ${ctx.registryStatus} | ${ctx.productName} | ${ctx.url} |`,
    );
  });
  return lines.join('\n');
}

function buildCombinedMarkdown(contexts, queue) {
  const lines = [];
  lines.push('# TOOL_FACTS（Gemini添付用 · 自動生成）');
  lines.push('');
  lines.push(`生成日時: ${new Date().toISOString()}`);
  lines.push('正本: `data/tool-facts/*.json` · `data/tool-registry.json` · `data/lp-marketing-matrix.json`');
  lines.push(`次に着手: **${queue.next ?? '—'}**（\`data/tool-facts/_queue.json\`）`);
  lines.push('');
  lines.push('## インデックス');
  lines.push('');
  lines.push(buildIndexTable(contexts));
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const ctx of contexts) {
    lines.push(`## ${ctx.toolId}`);
    lines.push('');
    lines.push(buildPerToolMarkdown(ctx).replace(/^# TOOL_FACTS:.*\n\n/, ''));
    lines.push('---');
    lines.push('');
  }

  lines.push('## Gemini 一括添付（コピペ）');
  lines.push('');
  lines.push('```text');
  lines.push('【各ツール事実（捏造禁止 · reviewed 以外は要確認）】');
  for (const ctx of contexts) {
    const f = ctx.facts ?? {};
    const tag = f.status === 'reviewed' ? 'OK' : '要確認';
    lines.push(
      `- ${ctx.toolId} [${tag}]: ${ctx.productName} / 型${ctx.primaryType || '?'} / ${ctx.url}`,
    );
  }
  lines.push('```');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  const registry = loadJson(REGISTRY_PATH, 'tool-registry');
  const matrix = loadJson(MATRIX_PATH, 'lp-marketing-matrix');
  const maps = matrixMaps(matrix);
  const queue = fs.existsSync(QUEUE_PATH)
    ? JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'))
    : { order: [], next: null };

  const factIds = listFactFiles();
  if (!factIds.length) {
    fail('data/tool-facts/*.json がありません。npm run scaffold:tool-facts を実行してください');
  }

  const idsArg = parseArg('ids');
  const order = resolveOrder(queue, factIds, idsArg);
  const outArg = parseArg('out');
  const outPath = outArg ? path.resolve(ROOT, outArg) : DEFAULT_OUT_PATH;

  const contexts = [];
  for (const toolId of order) {
    const factsPath = path.join(FACTS_DIR, `${toolId}.json`);
    if (!fs.existsSync(factsPath)) continue;
    const facts = JSON.parse(fs.readFileSync(factsPath, 'utf8'));
    contexts.push(mergeToolContext(toolId, registry, maps, facts));
  }

  if (!contexts.length) fail('出力対象が0件です');

  if (!fs.existsSync(PER_TOOL_DIR)) fs.mkdirSync(PER_TOOL_DIR, { recursive: true });
  for (const ctx of contexts) {
    const perPath = path.join(PER_TOOL_DIR, `${ctx.toolId}.generated.md`);
    fs.writeFileSync(perPath, buildPerToolMarkdown(ctx), 'utf8');
  }

  fs.writeFileSync(outPath, buildCombinedMarkdown(contexts, queue), 'utf8');
  console.log(
    `[tool-facts] OK: wrote ${path.relative(ROOT, outPath)} + ${contexts.length} per-tool files`,
  );
}

main();
