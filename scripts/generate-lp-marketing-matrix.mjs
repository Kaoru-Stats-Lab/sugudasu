#!/usr/bin/env node
/**
 * LP マーケティングマトリクス生成
 * source: data/lp-marketing-matrix.json
 * output: docs/prompts/LP_MARKETING_MATRIX.generated.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MATRIX_PATH = path.join(ROOT, 'data', 'lp-marketing-matrix.json');
const DEFAULT_OUT_PATH = path.join(ROOT, 'docs', 'prompts', 'LP_MARKETING_MATRIX.generated.md');

function fail(message) {
  console.error(`[lp-matrix] FAIL: ${message}`);
  process.exit(1);
}

function parseArg(name) {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

function escCell(value) {
  return String(value ?? '').replace(/\|/g, ' ');
}

function buildMarkdown(matrix) {
  const lines = [];
  lines.push('# LP マーケティングマトリクス（自動生成）');
  lines.push('');
  lines.push(`生成日時: ${new Date().toISOString()}`);
  lines.push(`source: \`data/lp-marketing-matrix.json\` · version ${matrix.version}`);
  lines.push('');
  lines.push('## §1 優先度表');
  lines.push('');
  lines.push('| tool_id | productName | registry | 主Pain（1行） | 最優先の型 | 理由（40字以内） | 実装難易度 |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const row of matrix.priority) {
    lines.push(
      `| ${row.tool_id} | ${escCell(row.productName)} | ${row.registryStatus} | ${escCell(row.primaryPain)} | 型${row.primaryType} | ${escCell(row.typeReason)} | ${row.implDifficulty} |`,
    );
  }

  lines.push('');
  lines.push('## §2 ツール束提案');
  lines.push('');
  lines.push('| 束名 | 含むtool_id | 共通ペルソナ | 先に回すGeminiプロンプト順 |');
  lines.push('| --- | --- | --- | --- |');
  for (const bundle of matrix.bundles) {
    lines.push(
      `| ${bundle.name} | ${bundle.tool_ids.join(' / ')} | ${escCell(bundle.persona)} | ${bundle.promptOrder.join(' -> ')} |`,
    );
  }

  lines.push('');
  lines.push('## §3 「幹事さん△問題」相当');
  lines.push('');
  lines.push('| tool_id | 既存手段の「△」に相当する曖昧さ | 幹事が聞き直す典型1文 |');
  lines.push('| --- | --- | --- |');
  for (const row of matrix.deltaProblems) {
    lines.push(`| ${row.tool_id} | ${escCell(row.delta)} | ${escCell(row.typicalAsk)} |`);
  }

  lines.push('');
  lines.push('## §4 今週やるTop3');
  lines.push('');
  lines.push('| 順位 | tool_id | 型 | 期待KPI | 提督が確認すべき事実1つ |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const row of matrix.top3) {
    lines.push(
      `| ${row.rank} | ${row.tool_id} | 型${row.primaryType} | ${escCell(row.expectedKpi)} | ${escCell(row.captainCheck)} |`,
    );
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  if (!fs.existsSync(MATRIX_PATH)) {
    fail('data/lp-marketing-matrix.json が見つかりません');
  }

  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const outArg = parseArg('out');
  const outPath = outArg ? path.resolve(ROOT, outArg) : DEFAULT_OUT_PATH;

  const markdown = buildMarkdown(matrix);
  fs.writeFileSync(outPath, markdown, 'utf8');
  console.log(
    `[lp-matrix] OK: wrote ${path.relative(ROOT, outPath)} (${matrix.priority.length} tools · ${matrix.bundles.length} bundles)`,
  );
}

main();
