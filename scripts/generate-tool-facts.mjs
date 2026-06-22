#!/usr/bin/env node
/**
 * TOOL_FACTS 生成
 * source: data/tool-registry.json
 * output: docs/prompts/TOOL_FACTS.generated.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'data', 'tool-registry.json');
const DEFAULT_OUT_PATH = path.join(ROOT, 'docs', 'prompts', 'TOOL_FACTS.generated.md');
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

function pickTools(tools, idsArg) {
  const entries = Object.entries(tools);
  if (!idsArg) {
    return entries
      .filter(([, tool]) => tool.inNav)
      .sort((a, b) => (a[1].navOrder || 999) - (b[1].navOrder || 999));
  }

  const requested = idsArg
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const selected = [];
  for (const id of requested) {
    if (!tools[id]) fail(`tool-registry に "${id}" がありません`);
    selected.push([id, tools[id]]);
  }
  return selected;
}

function buildMarkdown(selected) {
  const lines = [];
  lines.push('# TOOL_FACTS（Gemini添付用・自動生成）');
  lines.push('');
  lines.push(`生成日時: ${new Date().toISOString()}`);
  lines.push(`source: \`data/tool-registry.json\``);
  lines.push('');
  lines.push('| tool_id | productName | conceptName | stage | statusNote | URL |');
  lines.push('| --- | --- | --- | --- | --- | --- |');

  for (const [id, tool] of selected) {
    const pathname = canonicalPathFromFile(tool.file || `${id}.html`);
    const url = `${SITE_ORIGIN}${pathname}`;
    const productName = tool.productName || '';
    const conceptName = tool.conceptName || '';
    const stage = tool.stage || '';
    const statusNote = (tool.statusNote || '').replace(/\|/g, ' ');
    lines.push(`| ${id} | ${productName} | ${conceptName} | ${stage} | ${statusNote} | ${url} |`);
  }

  lines.push('');
  lines.push('## Gemini 添付ブロック（コピペ）');
  lines.push('');
  lines.push('```text');
  lines.push('【各ツール事実（捏造禁止 · 不明は「要確認」）');
  for (const [id, tool] of selected) {
    const pathname = canonicalPathFromFile(tool.file || `${id}.html`);
    const url = `${SITE_ORIGIN}${pathname}`;
    const stage = tool.stage || 'unknown';
    const statusNote = tool.statusNote || '要確認';
    lines.push(`- ${id}: ${tool.productName} / stage=${stage} / ${statusNote} / ${url}`);
  }
  lines.push('】');
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function main() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    fail('data/tool-registry.json が見つかりません');
  }

  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(raw);
  if (!registry.tools || typeof registry.tools !== 'object') {
    fail('tool-registry.json の tools が不正です');
  }

  const idsArg = parseArg('ids');
  const outArg = parseArg('out');
  const outPath = outArg ? path.resolve(ROOT, outArg) : DEFAULT_OUT_PATH;

  const selected = pickTools(registry.tools, idsArg);
  if (!selected.length) fail('出力対象ツールが0件です');

  const markdown = buildMarkdown(selected);
  fs.writeFileSync(outPath, markdown, 'utf8');
  console.log(`[tool-facts] OK: wrote ${path.relative(ROOT, outPath)} (${selected.length} tools)`);
}

main();
