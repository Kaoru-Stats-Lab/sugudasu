#!/usr/bin/env node
/**
 * Gate 8 — /room の Cache-Control: no-store を dist-sync/_headers で検証
 * Run: npm run verify:sticky-room:no-store
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const headersPath = path.join(ROOT, 'dist-sync', '_headers');

if (!fs.existsSync(headersPath)) {
  console.error('dist-sync/_headers がありません。先に npm run build:pages:sync');
  process.exit(1);
}

const text = fs.readFileSync(headersPath, 'utf8');
const lines = text.split(/\r?\n/);

/**
 * @param {string} pathRule
 */
function hasNoStore(pathRule) {
  const idx = lines.findIndex((l) => l.trim() === pathRule);
  if (idx < 0) return false;
  for (let i = idx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) break;
    if (!line.startsWith(' ') && !line.startsWith('\t')) break;
    if (/Cache-Control:\s*no-store/i.test(line)) return true;
  }
  return false;
}

assert.equal(hasNoStore('/room'), true, '/room に Cache-Control: no-store が必要');
assert.equal(hasNoStore('/room/*'), true, '/room/* に Cache-Control: no-store が必要');

const htmlPath = path.join(ROOT, 'dist-sync', 'room', 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /Cache-Control[^>]*no-store/i, 'room/index.html に meta no-store');
}

console.log('sticky-room-no-store.test.mjs: OK (/room · /room/* · meta)');
