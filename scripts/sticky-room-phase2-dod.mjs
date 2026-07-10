#!/usr/bin/env node
/**
 * Phase 2 Definition of Done — 機械検証
 * Run: npm run verify:sticky-room:phase2-dod
 */
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVE_PORT = Number(process.env.STICKY_ROOM_DOD_PORT || 8081);
const BASE_URL = process.env.STICKY_ROOM_DOD_URL || `http://127.0.0.1:${SERVE_PORT}/room`;

/** @type {import('node:child_process').ChildProcess | null} */
let serveProc = null;

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
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
  if (process.env.STICKY_ROOM_DOD_SKIP_SERVE === '1') return;
  serveProc = spawn(
    'npx',
    ['--yes', 'serve', 'dist-sync', '-l', String(SERVE_PORT)],
    { cwd: ROOT, stdio: 'ignore', shell: true, detached: process.platform !== 'win32' }
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

async function runE2E() {
  process.env.STICKY_ROOM_DOD_URL = BASE_URL;
  if (!process.env.STICKY_ROOM_DOD_HEADED && process.platform === 'win32') {
    process.env.STICKY_ROOM_DOD_HEADED = '1';
  }
  run('npx', ['playwright', 'install', 'chromium']);
  run('node', ['scripts/sticky-room-phase2-dod-e2e.mjs']);
}

function printReport(results) {
  const e2eSkipped = process.env.STICKY_ROOM_DOD_SKIP_E2E === '1';
  const mark = (ok, skipped = false) => (skipped ? '—' : ok ? '☑' : '□');
  const lines = [
    '',
    'Phase 2 完了条件',
    `${mark(results.hostJoin, e2eSkipped)} HostからJoinできる`,
    `${mark(results.fiveCycles, e2eSkipped)} 5回連続接続成功`,
    `${mark(results.reload, e2eSkipped)} リロード後も再接続できる`,
    `${results.build ? '☑' : '□'} build成功`,
    `${results.test ? '☑' : '□'} test成功`,
    e2eSkipped ? '（browser E2E は手動 · 上記 SSOT 手順）' : '',
    '',
  ];
  console.log(lines.filter(Boolean).join('\n'));
}

async function main() {
  const results = {
    test: false,
    build: false,
    hostJoin: false,
    fiveCycles: false,
    reload: false,
  };

  try {
    console.log('=== Phase 2 DoD: test ===');
    run('npm', ['run', 'test:sticky-room']);
    results.test = true;

    console.log('=== Phase 2 DoD: build ===');
    run('npm', ['run', 'build:pages:sync']);
    results.build = true;

    console.log('=== Phase 2 DoD: browser E2E ===');
    const probe = BASE_URL.replace(/\/?$/, '/');
    if (process.env.STICKY_ROOM_DOD_SKIP_E2E === '1') {
      console.log('(browser E2E skipped — STICKY_ROOM_DOD_SKIP_E2E=1)');
      console.log('  手動: npm run preview:pages:sync → 2タブで Host/Join · 5回 · リロード再接続');
    } else {
      if (process.env.STICKY_ROOM_DOD_SKIP_SERVE !== '1') {
        startServe();
      }
      await waitForHttp(probe);
      await runE2E();
      results.hostJoin = true;
      results.fiveCycles = true;
      results.reload = true;
    }
  } finally {
    stopServe();
    printReport(results);
  }

  const e2eRequired = process.env.STICKY_ROOM_DOD_SKIP_E2E !== '1';
  const allOk =
    results.test &&
    results.build &&
    (!e2eRequired || (results.hostJoin && results.fiveCycles && results.reload));
  if (!allOk) process.exit(1);
  console.log('verify:sticky-room:phase2-dod: ALL OK');
}

main().catch((err) => {
  stopServe();
  console.error('verify:sticky-room:phase2-dod: FAIL', err.message);
  process.exit(1);
});
