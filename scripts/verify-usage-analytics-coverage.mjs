#!/usr/bin/env node
/**
 * 利用計測カバレッジ監査
 * SSOT: docs/notes/PRODUCT_USAGE_ANALYTICS.md
 * 契約: data/tool-job-contracts.json
 *
 * 既定: 警告のみで exit 0
 * --strict: GAP があれば exit 1
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STRICT = process.argv.includes('--strict');

const contractsPath = path.join(ROOT, 'data', 'tool-job-contracts.json');
const registryPath = path.join(ROOT, 'data', 'tool-registry.json');

const SCAN_GLOBS = [
  ['assets', /\.(js|mjs)$/],
  ['tools', /\.html$/],
];

const SKIP_NAME =
  /(^|\/)(vendor|node_modules|_archive|sg-analytics\.js|sugudasu-shell\.js|sg-copy-feedback\.js|sugudasu-growth\.js)(\/|$)/i;
const SKIP_ENGINE = /-engine\.js$/i;

const TRACK_MARKERS = [
  /notifyJobDone/,
  /downloadBlobTracked/,
  /printTracked/,
  /trackToolJobDone/,
  /trackOutcome\s*:/,
  /copyWithFeedback/,
  /SG_COPY_FEEDBACK\.copyWithFeedback/,
  /window\.copyWithFeedback/,
];

const JOB_PATTERNS = [
  {
    id: 'clipboard.write',
    re: /navigator\.clipboard\.write(Text)?\s*\(/g,
    hint: 'copy — copyWithFeedback / markCopyButtonDone({ trackOutcome }) / notifyJobDone',
  },
  {
    id: 'window.print',
    re: /window\.print\s*\(/g,
    hint: 'print — SG_ANALYTICS.printTracked()',
  },
  {
    id: 'a.download assignment',
    re: /\.download\s*=/g,
    hint: 'download|pdf — downloadBlobTracked(blob, name, outcome)',
  },
];

function fail(msg) {
  console.error(`[usage-analytics-coverage] FAIL: ${msg}`);
  process.exit(1);
}

function listFiles(dir, re, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    if (SKIP_NAME.test(rel)) continue;
    if (SKIP_ENGINE.test(ent.name)) continue;
    if (ent.isDirectory()) listFiles(p, re, acc);
    else if (re.test(ent.name)) acc.push(p);
  }
  return acc;
}

function hasTrackMarker(src) {
  return TRACK_MARKERS.some((re) => re.test(src));
}

function lineOf(src, index) {
  return src.slice(0, index).split(/\r?\n/).length;
}

if (!fs.existsSync(contractsPath)) fail('missing data/tool-job-contracts.json');
if (!fs.existsSync(registryPath)) fail('missing data/tool-registry.json');

const contracts = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const INPUT_KINDS = new Set(contracts.inputKinds || []);
const OUTCOMES = new Set(contracts.outcomes || []);
const INFO = new Set(contracts.infoPageIds || []);
const contractTools = contracts.tools || {};

const contractErrors = [];
for (const [id, entry] of Object.entries(contractTools)) {
  if (!entry || entry.job === false) continue;
  for (const k of entry.inputs || []) {
    if (!INPUT_KINDS.has(k)) contractErrors.push(`${id}: unknown input_kind "${k}"`);
  }
  for (const o of entry.outputs || []) {
    if (!OUTCOMES.has(o)) contractErrors.push(`${id}: unknown outcome "${o}"`);
  }
  if (!Array.isArray(entry.inputs) || entry.inputs.length === 0) {
    contractErrors.push(`${id}: inputs must be non-empty for job tools`);
  }
  if (!Array.isArray(entry.outputs) || entry.outputs.length === 0) {
    contractErrors.push(`${id}: outputs must be non-empty for job tools`);
  }
}

const missingContracts = [];
for (const id of Object.keys(registry.tools || {})) {
  if (INFO.has(id)) continue;
  if (!contractTools[id] || contractTools[id].job === false) {
    // allow explicit job:false in contracts for non-info pages
    if (contractTools[id] && contractTools[id].job === false) continue;
    missingContracts.push(id);
  }
}

const gaps = [];
for (const [folder, re] of SCAN_GLOBS) {
  const files = listFiles(path.join(ROOT, folder), re);
  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const src = fs.readFileSync(file, 'utf8');
    const tracked = hasTrackMarker(src);

    for (const pat of JOB_PATTERNS) {
      pat.re.lastIndex = 0;
      let m;
      while ((m = pat.re.exec(src))) {
        const around = src.slice(Math.max(0, m.index - 120), m.index + 80);
        if (pat.id === 'window.print' && /printTracked/.test(around)) continue;
        if (pat.id === 'a.download assignment' && /downloadBlobTracked/.test(around)) continue;
        if (pat.id.startsWith('clipboard') && /copyWithFeedback|trackOutcome|notifyJobDone/.test(around)) {
          continue;
        }
        if (!tracked) {
          gaps.push({
            file: rel,
            line: lineOf(src, m.index),
            kind: pat.id,
            hint: pat.hint,
          });
        }
      }
    }
  }
}

const byKey = new Map();
for (const g of gaps) {
  const key = `${g.file}::${g.kind}`;
  if (!byKey.has(key)) byKey.set(key, { ...g, count: 1 });
  else byKey.get(key).count += 1;
}
const unique = [...byKey.values()].sort((a, b) => a.file.localeCompare(b.file) || a.kind.localeCompare(b.kind));

let ok = true;
console.log('[usage-analytics-coverage] scanned assets/ + tools/ + tool-job-contracts');

if (contractErrors.length) {
  ok = false;
  console.log(`[usage-analytics-coverage] CONTRACT errors: ${contractErrors.length}`);
  for (const e of contractErrors) console.log(`  - ${e}`);
}

if (missingContracts.length) {
  ok = false;
  console.log(`[usage-analytics-coverage] MISSING contracts for registry job tools: ${missingContracts.length}`);
  for (const id of missingContracts) console.log(`  - ${id}`);
}

if (unique.length === 0) {
  console.log('[usage-analytics-coverage] OK — no untracked job CTA files');
} else {
  ok = false;
  console.log(`[usage-analytics-coverage] GAP files: ${unique.length}`);
  for (const g of unique) {
    console.log(`  - ${g.file}:${g.line}  [${g.kind} ×${g.count}]  → ${g.hint}`);
  }
}

if (ok) {
  console.log('[usage-analytics-coverage] OK — contracts + coverage');
  process.exit(0);
}

console.log(
  STRICT
    ? '[usage-analytics-coverage] FAIL (--strict)'
    : '[usage-analytics-coverage] WARN (exit 0 · use --strict to fail)',
);
process.exit(STRICT ? 1 : 0);
