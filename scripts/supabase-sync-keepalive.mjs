#!/usr/bin/env node
/**
 * Ping Sync Supabase REST to reset Free-tier inactivity timer.
 * Reads SYNC_SUPABASE_URL + SYNC_SUPABASE_ANON_KEY from env or .env.sync.local
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envLocal = path.join(root, '.env.sync.local');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(envLocal);

const url = process.env.SYNC_SUPABASE_URL?.replace(/\/$/, '');
const anon = process.env.SYNC_SUPABASE_ANON_KEY;

function fail(msg) {
  console.error(`[supabase-keepalive] FAIL: ${msg}`);
  process.exit(1);
}

if (!url || !anon) {
  fail('Set SYNC_SUPABASE_URL and SYNC_SUPABASE_ANON_KEY (env or .env.sync.local)');
}

const endpoint = `${url}/rest/v1/`;
const res = await fetch(endpoint, {
  method: 'GET',
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
  },
});

if (!res.ok && res.status !== 404) {
  fail(`HTTP ${res.status} from ${endpoint}`);
}

console.log(`[supabase-keepalive] OK — ${endpoint} → ${res.status}`);
console.log('[supabase-keepalive] Free-tier inactivity timer should reset (activity within 7 days)');
