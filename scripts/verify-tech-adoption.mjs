#!/usr/bin/env node
/**
 * Tech Adoption 機械ゲート
 * 正本: data/tech-shared-contracts.json
 * 運用: docs/notes/TECH_ADOPTION_NOTE.md §0
 * Inventory: docs/notes/CAPABILITY_INVENTORY.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTRACTS_PATH = path.join(ROOT, 'data', 'tech-shared-contracts.json');

function fail(msg) {
  console.error(`[tech-adoption-guard] FAIL: ${msg}`);
  process.exitCode = 1;
}

function loadContracts() {
  if (!fs.existsSync(CONTRACTS_PATH)) {
    fail(`contracts がありません: ${CONTRACTS_PATH}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(CONTRACTS_PATH, 'utf8'));
}

/** @param {string} name @param {string[]} include */
function matchInclude(name, include) {
  return include.some((g) => {
    if (!g.includes('*')) return name === g;
    if (g.startsWith('*-') && g.endsWith('.js')) return name.endsWith(g.slice(1));
    if (g.startsWith('sg-') && g.endsWith('.js')) return name.startsWith('sg-') && name.endsWith('.js');
    const re = new RegExp(`^${g.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
    return re.test(name);
  });
}

/** @param {string[]} directories @param {string[]} include */
function collectTargets(directories, include) {
  /** @type {string[]} */
  const files = [];
  for (const d of directories) {
    const dir = path.join(ROOT, d);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (!fs.statSync(full).isFile() || !name.endsWith('.js')) continue;
      if (!matchInclude(name, include)) continue;
      files.push(full);
    }
  }
  return files;
}

function main() {
  const contracts = loadContracts();
  if (!contracts) return;

  for (const rel of contracts.requiredFiles || []) {
    if (!fs.existsSync(path.join(ROOT, rel))) fail(`必須ファイル欠落: ${rel}`);
  }

  for (const rule of contracts.forbiddenPatterns || []) {
    const files = collectTargets(rule.directories || ['assets'], rule.include || ['*.js']);
    const exclude = new Set(rule.excludeFiles || []);
    const re = new RegExp(rule.regex, 'm');
    for (const file of files) {
      const base = path.basename(file);
      if (exclude.has(base)) continue;
      const src = fs.readFileSync(file, 'utf8');
      if (re.test(src)) fail(`${base}: ${rule.message} (rule=${rule.id})`);
    }
  }

  for (const rule of contracts.mustImportWhenMatching || []) {
    const files = collectTargets(rule.directories || ['assets'], rule.include || ['*-app.js']);
    const ifRe = new RegExp(rule.ifRegex, 'm');
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      if (!ifRe.test(src)) continue;
      if (!src.includes(rule.mustContain)) {
        fail(`${path.basename(file)}: ${rule.message} (rule=${rule.id})`);
      }
    }
  }

  if (process.exitCode) {
    console.error('[tech-adoption-guard] 直したら Inventory / TECH_ADOPTION_NOTE も必要なら更新');
    console.error('[tech-adoption-guard] トリガー一覧: data/tech-shared-contracts.json → triggers');
    process.exit(1);
  }

  console.log('[tech-adoption-guard] OK');
  console.log(
    `[tech-adoption-guard] contracts v${contracts.version} · forbidden=${(contracts.forbiddenPatterns || []).length}`,
  );
}

main();
