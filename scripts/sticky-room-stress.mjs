#!/usr/bin/env node
/**
 * P2 — 付箋ルーム ストレステスト（100 / 200 / 500 枚）
 * FPS · Drag · Memory（Chromium · performance.memory）
 *
 * Run:
 *   npm run stress:sticky-room
 *   STICKY_ROOM_STRESS_HEADED=1 npm run stress:sticky-room
 *
 * Manual UI: http://localhost:8081/room?stress=1
 */
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVE_PORT = Number(process.env.STICKY_ROOM_STRESS_PORT || 8081);
const BASE_URL = process.env.STICKY_ROOM_STRESS_URL || `http://127.0.0.1:${SERVE_PORT}/room`;
const COUNTS = (process.env.STICKY_ROOM_STRESS_COUNTS || '100,200,500')
  .split(',')
  .map((s) => Number.parseInt(s.trim(), 10))
  .filter((n) => Number.isFinite(n) && n > 0);
const TIMEOUT_MS = Number(process.env.STICKY_ROOM_STRESS_TIMEOUT_MS || 600_000);

/** @type {import('node:child_process').ChildProcess | null} */
let serveProc = null;

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed (exit ${result.status})`);
  }
}

function waitForHttp(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      req.on('error', retry);
      function retry() {
        if (Date.now() > deadline) {
          reject(new Error(`server not ready: ${url}`));
          return;
        }
        setTimeout(tick, 400);
      }
    };
    tick();
  });
}

function startServe() {
  if (process.env.STICKY_ROOM_STRESS_SKIP_SERVE === '1') return;
  serveProc = spawn(
    'npx',
    ['--yes', 'serve', 'dist-sync', '-l', String(SERVE_PORT)],
    { cwd: ROOT, stdio: 'ignore', shell: true, detached: process.platform !== 'win32' },
  );
}

function stopServe() {
  if (!serveProc?.pid) return;
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(serveProc.pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      process.kill(-serveProc.pid);
    }
  } catch {
    /* ignore */
  }
  serveProc = null;
}

/**
 * @param {unknown[]} results
 */
function printReport(results) {
  const header = ['枚数', 'spawn ms', 'idle FPS', 'drag FPS', 'drag p95 ms', 'heap MB'];
  const rows = results.map((raw) => {
    const row = /** @type {{ cardCount: number, spawnMs: number, idleFps: { fps: number }, drag: { dragFps: number, frameMsP95: number } | null, memory: { available: boolean, usedMb: number | null } }} */ (
      raw
    );
    return [
      row.cardCount,
      row.spawnMs,
      row.idleFps?.fps ?? 'n/a',
      row.drag?.dragFps ?? 'n/a',
      row.drag?.frameMsP95 ?? 'n/a',
      row.memory?.available ? row.memory.usedMb : 'n/a',
    ];
  });

  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i]).length)),
  );
  const fmt = (cells) => cells.map((c, i) => String(c).padStart(widths[i])).join('  ');

  console.log('\n付箋ルーム ストレステスト (P2)\n');
  console.log(fmt(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const row of rows) {
    console.log(fmt(row));
  }
  console.log('\n指標: idle FPS = batchDraw ループ · drag FPS = 中央付箋ドラッグ模擬 · heap = performance.memory (Chromium)\n');
}

async function runBrowserSuite() {
  const counts = COUNTS.length > 0 ? COUNTS : [100, 200, 500];
  const url = `${BASE_URL}?stress=auto&counts=${counts.join(',')}`;
  const headed = process.env.STICKY_ROOM_STRESS_HEADED === '1';

  run('npx', ['playwright', 'install', 'chromium']);

  const browser = await chromium.launch({ headless: !headed });
  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);
  page.on('pageerror', (err) => {
    console.error('[sticky-room stress] page error:', err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('[sticky-room stress] console:', msg.text());
    }
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForFunction(() => Array.isArray(window.__stickyRoomStressResults), {
      timeout: TIMEOUT_MS,
    });
    const results = await page.evaluate(() => window.__stickyRoomStressResults);
    printReport(results);
    return results;
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    if (process.env.STICKY_ROOM_STRESS_SKIP_BUILD !== '1') {
      run('npm', ['run', 'build:pages:sync']);
    }
    startServe();
    if (process.env.STICKY_ROOM_STRESS_SKIP_SERVE !== '1') {
      await waitForHttp(BASE_URL);
    }
    await runBrowserSuite();
  } finally {
    stopServe();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
