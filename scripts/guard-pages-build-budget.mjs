#!/usr/bin/env node
/**
 * Local build budget guard for Cloudflare Pages Free (500 builds/month).
 * Use this only for production release operations.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OPS_DIR = path.join(ROOT, '.ops');
const LEDGER_PATH = path.join(OPS_DIR, 'cloudflare-pages-build-budget.json');

const month = new Date().toISOString().slice(0, 7); // YYYY-MM
const hardLimit = 500;
const softLimit = Number(process.env.PAGES_MONTHLY_BUILD_BUDGET || 450);

function readLedger() {
  if (!fs.existsSync(LEDGER_PATH)) {
    return { month, used: 0, softLimit, hardLimit };
  }
  const raw = fs.readFileSync(LEDGER_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (parsed.month !== month) {
    return { month, used: 0, softLimit, hardLimit };
  }
  return {
    month,
    used: Number(parsed.used || 0),
    softLimit: Number(parsed.softLimit || softLimit),
    hardLimit
  };
}

function writeLedger(data) {
  fs.mkdirSync(OPS_DIR, { recursive: true });
  fs.writeFileSync(LEDGER_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function parseProjectArg() {
  const arg = process.argv.find((a) => a.startsWith('--project='));
  const project = arg?.split('=')[1]?.trim();
  if (project && project !== 'core' && project !== 'sync') {
    console.error(`[pages-build-budget] Unknown --project=${project} (use core|sync)`);
    process.exit(1);
  }
  return project || 'core';
}

function checkOnly(data) {
  if (data.used >= data.softLimit) {
    console.error(`[pages-build-budget] FAIL: used ${data.used}/${data.softLimit} (soft cap) for ${data.month}`);
    process.exit(1);
  }
  if (data.used >= data.hardLimit) {
    console.error(`[pages-build-budget] FAIL: used ${data.used}/${data.hardLimit} (hard cap) for ${data.month}`);
    process.exit(1);
  }
  console.log(`[pages-build-budget] OK: used ${data.used}/${data.softLimit} (hard ${data.hardLimit}) for ${data.month}`);
}

function consume(data, project) {
  const next = {
    ...data,
    used: data.used + 1,
    lastProject: project,
    lastAt: new Date().toISOString()
  };
  if (next.used > next.softLimit) {
    console.error(`[pages-build-budget] BLOCK: next would be ${next.used}/${next.softLimit} (soft cap)`);
    process.exit(1);
  }
  if (next.used > next.hardLimit) {
    console.error(`[pages-build-budget] BLOCK: next would exceed hard cap ${next.hardLimit}`);
    process.exit(1);
  }
  writeLedger(next);
  console.log(
    `[pages-build-budget] CONSUMED (${project}): ${next.used}/${next.softLimit} (hard ${next.hardLimit}) for ${next.month}`
  );
}

const mode = process.argv[2] || 'check';
const project = parseProjectArg();
const ledger = readLedger();

if (mode === 'check') {
  checkOnly(ledger);
} else if (mode === 'consume') {
  consume(ledger, project);
} else if (mode === 'show') {
  console.log(JSON.stringify(ledger, null, 2));
} else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}
