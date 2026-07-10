#!/usr/bin/env node
/**
 * 長時間シナリオ E2E（圧縮タイムライン）
 * 本番 2h/3h を ttlMs の 2/3 待機で模擬 → 編集 → TTL 満了
 *
 * Run: npm run longevity:sticky-room
 *      STICKY_ROOM_LONGEVITY_HEADED=1 npm run longevity:sticky-room
 */
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVE_PORT = Number(process.env.STICKY_ROOM_LONGEVITY_PORT || 8081);
const TTL_MS = Number(process.env.STICKY_ROOM_LONGEVITY_TTL_MS || 180_000);
const IDLE_MS = Number(process.env.STICKY_ROOM_LONGEVITY_IDLE_MS || Math.round((TTL_MS * 2) / 3));
const BASE = process.env.STICKY_ROOM_LONGEVITY_URL || `http://127.0.0.1:${SERVE_PORT}/room`;

/** @type {import('node:child_process').ChildProcess | null} */
let serveProc = null;

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed`);
  }
}

function waitForHttp(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      });
      req.on('error', retry);
      function retry() {
        if (Date.now() > deadline) reject(new Error(`not ready: ${url}`));
        else setTimeout(tick, 400);
      }
    };
    tick();
  });
}

function startServe() {
  if (process.env.STICKY_ROOM_LONGEVITY_SKIP_SERVE === '1') return;
  serveProc = spawn('npx', ['--yes', 'serve', 'dist-sync', '-l', String(SERVE_PORT)], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: true,
    detached: process.platform !== 'win32',
  });
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
 * @param {import('playwright').Page} page
 */
async function waitConnectedOrSkip(page) {
  try {
    await page.waitForSelector('#sticky-room-conn-state[data-state="connected"]', { timeout: 90_000 });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const roomUrl = `${BASE}?longevity=1&ttlMs=${TTL_MS}`;
  const headed = process.env.STICKY_ROOM_LONGEVITY_HEADED === '1';

  if (process.env.STICKY_ROOM_LONGEVITY_SKIP_BUILD !== '1') {
    run('npm', ['run', 'build:pages:sync']);
  }
  startServe();
  if (process.env.STICKY_ROOM_LONGEVITY_SKIP_SERVE !== '1') {
    await waitForHttp(BASE);
  }

  run('npx', ['playwright', 'install', 'chromium']);

  const browser = await chromium.launch({ headless: !headed });
  const host = await browser.newPage();
  const join = await browser.newPage();
  host.setDefaultTimeout(120_000);
  join.setDefaultTimeout(120_000);

  const report = {
    connected: false,
    idleMs: IDLE_MS,
    ttlMs: TTL_MS,
    editedAfterIdle: false,
    expired: false,
  };

  try {
    console.log(`\n長時間 E2E（圧縮）ttlMs=${TTL_MS} idleMs=${IDLE_MS}\n`);

    await host.goto(roomUrl, { waitUntil: 'domcontentloaded' });
    await host.click('#sticky-room-host');
    await host.waitForSelector('#sticky-room-room-link a', { timeout: 90_000 });
    const joinUrl = await host.locator('#sticky-room-room-link a').getAttribute('href');
    if (!joinUrl) throw new Error('参加 URL なし');

    await join.goto(joinUrl, { waitUntil: 'domcontentloaded' });
    report.connected = (await waitConnectedOrSkip(host)) && (await waitConnectedOrSkip(join));

    if (!report.connected) {
      console.log('ICE 未接続 — 1人モードで放置→編集→TTL のみ続行');
    }

    await host.click('#sticky-room-add');
    await host.waitForFunction(() => {
      const el = document.getElementById('sticky-room-status');
      return el?.textContent?.includes('付箋 1 枚');
    });

    console.log(`放置 ${Math.round(IDLE_MS / 1000)}s …`);
    await Promise.all([host.waitForTimeout(IDLE_MS), join.waitForTimeout(IDLE_MS)]);

    const connState = await host.getAttribute('#sticky-room-conn-state', 'data-state');
    if (connState === 'expired') {
      throw new Error(
        `放置 ${IDLE_MS}ms 中に TTL 満了（ttlMs=${TTL_MS}）。idle は ttl の 2/3 未満にしてください`,
      );
    }

    const reconnectVisible = await host.locator('#sticky-room-reconnect').isVisible();
    if (reconnectVisible) {
      await host.click('#sticky-room-reconnect');
      await host.waitForTimeout(3000);
    }

    await host.click('#sticky-room-add');
    await host.waitForFunction(() => {
      const el = document.getElementById('sticky-room-status');
      return Number(el?.textContent?.match(/付箋 (\d+) 枚/)?.[1] || 0) >= 2;
    });
    report.editedAfterIdle = true;

    const remainingWait = Math.max(5_000, TTL_MS - IDLE_MS + 5_000);
    console.log(`TTL 満了待ち ${Math.round(remainingWait / 1000)}s …`);
    await host.waitForSelector('#sticky-room-conn-state[data-state="expired"]', {
      timeout: remainingWait,
    });
    report.expired = true;

    const addDisabled = await host.locator('#sticky-room-add').isDisabled();
    assertReport(report, addDisabled);
  } finally {
    await host.close();
    await join.close();
    await browser.close();
    stopServe();
  }
}

/**
 * @param {typeof report} report
 * @param {boolean} addDisabled
 */
function assertReport(report, addDisabled) {
  console.log('\n長時間 E2E 結果');
  console.log(`  接続: ${report.connected ? 'OK' : 'スキップ（ICE）'}`);
  console.log(`  放置後編集: ${report.editedAfterIdle ? 'OK' : 'NG'}`);
  console.log(`  TTL 満了: ${report.expired ? 'OK' : 'NG'}`);
  console.log(`  盤面ロック: ${addDisabled ? 'OK' : 'NG'}`);

  if (!report.editedAfterIdle) throw new Error('放置後の編集に失敗');
  if (!report.expired) throw new Error('TTL 満了を検出できませんでした');
  if (!addDisabled) throw new Error('期限切れ後も付箋追加が有効');
  console.log('\nlongevity E2E: OK\n');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
