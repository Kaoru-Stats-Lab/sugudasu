#!/usr/bin/env node
/**
 * Pre-deploy gate — reads docs/notes/DEPLOY_LOG.md latest entry for target.
 * SSOT: docs/notes/DEPLOY_LOG.md
 *
 * Usage:
 *   node scripts/check-deploy-gate.mjs --target=core
 *   node scripts/check-deploy-gate.mjs --target=sync
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logPath = join(root, 'docs/notes/DEPLOY_LOG.md');

const targetArg = process.argv.find((a) => a.startsWith('--target='));
const target = targetArg?.split('=')[1]?.trim();
const allowedTargets = new Set(['core', 'sync']);

function fail(msg) {
  console.error(`[deploy:gate] BLOCKED: ${msg}`);
  console.error('[deploy:gate] SSOT: docs/notes/DEPLOY_LOG.md — append entry with status: approved');
  process.exit(1);
}

if (!target || !allowedTargets.has(target)) {
  fail('Missing or invalid --target=core|sync');
}

let text;
try {
  text = readFileSync(logPath, 'utf8');
} catch {
  fail('DEPLOY_LOG.md not found');
}

const blocks = text.split(/\n(?=## DEPLOY-\d{8}-\d{3}\s*\n)/).filter((b) => /^## DEPLOY-/.test(b));
if (blocks.length === 0) {
  fail('No DEPLOY-YYYYMMDD-NNN entries found');
}

const forTarget = blocks.filter((b) => {
  const m = b.match(/\*\*target\*\*[^|\n]*\|\s*`([^`]+)`/);
  return m?.[1]?.trim() === target;
});

if (forTarget.length === 0) {
  fail(`No DEPLOY entries for target=${target}`);
}

const lastBlock = forTarget[forTarget.length - 1];
const idMatch = lastBlock.match(/^## (DEPLOY-\d{8}-\d{3})/);
const id = idMatch?.[1];
if (!id) {
  fail('Malformed latest DEPLOY entry');
}

const statusMatch = lastBlock.match(/\*\*status\*\*[^|\n]*\|\s*`([^`]+)`/);
const approverMatch = lastBlock.match(/\*\*approver\*\*[^|\n]*\|\s*([^\n|]+)/);

const status = statusMatch?.[1]?.trim();
const approver = approverMatch?.[1]?.trim();

if (!status) {
  fail(`Latest ${target} entry ${id} missing **status** field`);
}

if (status === 'blocked' || status === 'aborted') {
  fail(`Latest ${target} entry ${id} is \`${status}\``);
}

if (status === 'planned') {
  fail(`Latest ${target} entry ${id} is \`planned\` — set status to \`approved\` with approver: 提督`);
}

if (status !== 'approved' && status !== 'executed') {
  fail(`Latest ${target} entry ${id} has unknown status \`${status}\``);
}

if (!approver || /承認なし/.test(approver)) {
  fail(`Latest ${target} entry ${id} lacks valid approver`);
}

console.log(`[deploy:gate] OK — ${id} target=${target} status=${status} approver=${approver.trim()}`);
console.log('[deploy:gate] Reminder: P1–P8 in DEPLOY_LOG.md · same target ≤1 deploy/day · Free 500 builds/mo');
