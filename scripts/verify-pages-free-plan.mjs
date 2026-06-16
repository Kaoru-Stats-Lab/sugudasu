#!/usr/bin/env node
/**
 * Cloudflare Pages Free plan guard.
 * Fails build when dist/ violates documented static limits.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const LIMITS = {
  maxFiles: 20_000,
  maxSingleFileBytes: 25 * 1024 * 1024, // 25 MiB
  maxHeaderRules: 100,
  maxHeaderValueChars: 2_000,
  maxRedirectStatic: 2_000,
  maxRedirectDynamic: 100,
  maxRedirectTotal: 2_100
};

function fail(msg) {
  console.error(`\n[cf-pages-free-guard] FAIL: ${msg}`);
  process.exit(1);
}

function walkFiles(dir) {
  const files = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        stack.push(full);
      } else {
        files.push({ path: full, size: stat.size });
      }
    }
  }
  return files;
}

function verifyDistFiles() {
  if (!fs.existsSync(DIST)) {
    fail(`dist directory not found: ${DIST}`);
  }

  const files = walkFiles(DIST);
  if (files.length > LIMITS.maxFiles) {
    fail(`file count ${files.length} exceeds Free limit ${LIMITS.maxFiles}`);
  }

  const oversize = files.find((f) => f.size > LIMITS.maxSingleFileBytes);
  if (oversize) {
    const rel = path.relative(ROOT, oversize.path);
    fail(`file ${rel} is ${(oversize.size / (1024 * 1024)).toFixed(2)} MiB (> 25 MiB)`);
  }

  return files.length;
}

function verifyHeadersFile() {
  const headersPath = path.join(DIST, '_headers');
  if (!fs.existsSync(headersPath)) return;

  const lines = fs.readFileSync(headersPath, 'utf8').split(/\r?\n/);
  let rules = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!line.startsWith(' ') && !line.startsWith('\t') && trimmed.startsWith('/')) {
      rules += 1;
    }
    if (line.startsWith(' ') || line.startsWith('\t')) {
      const value = line.split(':').slice(1).join(':').trim();
      if (value.length > LIMITS.maxHeaderValueChars) {
        fail(`_headers has header value > ${LIMITS.maxHeaderValueChars} chars`);
      }
    }
  }

  if (rules > LIMITS.maxHeaderRules) {
    fail(`_headers rules ${rules} exceed Free limit ${LIMITS.maxHeaderRules}`);
  }
}

function verifyRedirectsFile() {
  const redirectsPath = path.join(DIST, '_redirects');
  if (!fs.existsSync(redirectsPath)) return;

  const lines = fs.readFileSync(redirectsPath, 'utf8').split(/\r?\n/);
  let staticRules = 0;
  let dynamicRules = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const source = trimmed.split(/\s+/)[0] || '';
    if (source.includes(':') || source.includes('*')) {
      dynamicRules += 1;
    } else {
      staticRules += 1;
    }
  }

  const total = staticRules + dynamicRules;
  if (staticRules > LIMITS.maxRedirectStatic) {
    fail(`_redirects static rules ${staticRules} exceed ${LIMITS.maxRedirectStatic}`);
  }
  if (dynamicRules > LIMITS.maxRedirectDynamic) {
    fail(`_redirects dynamic rules ${dynamicRules} exceed ${LIMITS.maxRedirectDynamic}`);
  }
  if (total > LIMITS.maxRedirectTotal) {
    fail(`_redirects total rules ${total} exceed ${LIMITS.maxRedirectTotal}`);
  }
}

const fileCount = verifyDistFiles();
verifyHeadersFile();
verifyRedirectsFile();

console.log(`[cf-pages-free-guard] OK: dist files=${fileCount}, within Cloudflare Pages Free static limits.`);
