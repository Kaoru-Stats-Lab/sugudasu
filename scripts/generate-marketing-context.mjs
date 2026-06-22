#!/usr/bin/env node
/**
 * Gemini マーケ添付コンテキスト一括生成
 * - TOOL_FACTS.generated.md
 * - LP_MARKETING_MATRIX.generated.md
 * - GEMINI_MARKETING_CONTEXT.generated.md（結合）
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROMPTS_DIR = path.join(ROOT, 'docs', 'prompts');
const TOOL_FACTS_PATH = path.join(PROMPTS_DIR, 'TOOL_FACTS.generated.md');
const LP_MATRIX_PATH = path.join(PROMPTS_DIR, 'LP_MARKETING_MATRIX.generated.md');
const OUT_PATH = path.join(PROMPTS_DIR, 'GEMINI_MARKETING_CONTEXT.generated.md');

function fail(message) {
  console.error(`[marketing-context] FAIL: ${message}`);
  process.exit(1);
}

function runNodeScript(scriptName) {
  const scriptPath = path.join(ROOT, 'scripts', scriptName);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    fail(`${scriptName} が失敗しました (exit ${result.status})`);
  }
}

function main() {
  runNodeScript('generate-tool-facts.mjs');
  runNodeScript('generate-lp-marketing-matrix.mjs');

  if (!fs.existsSync(TOOL_FACTS_PATH) || !fs.existsSync(LP_MATRIX_PATH)) {
    fail('生成物が見つかりません');
  }

  const toolFacts = fs.readFileSync(TOOL_FACTS_PATH, 'utf8').trim();
  const lpMatrix = fs.readFileSync(LP_MATRIX_PATH, 'utf8').trim();

  const merged = [
    '# GEMINI マーケ添付コンテキスト（自動生成）',
    '',
    `生成日時: ${new Date().toISOString()}`,
    '正本プロンプト: `docs/prompts/kanji-san-lp-patterns-gemini.md`',
    '',
    '---',
    '',
    toolFacts,
    '',
    '---',
    '',
    lpMatrix,
    '',
  ].join('\n');

  fs.writeFileSync(OUT_PATH, merged, 'utf8');
  console.log(`[marketing-context] OK: wrote ${path.relative(ROOT, OUT_PATH)}`);
}

main();
