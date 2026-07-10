/**
 * Phase 2 DoD — ブラウザ E2E（playwright）
 * Host/Join · 5回連続接続 · リロード再接続
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.STICKY_ROOM_DOD_URL || 'http://127.0.0.1:8081/room';
const CONNECT_TIMEOUT_MS = 60_000;
const CYCLES = 5;
const CYCLE_RETRIES = 3;
const BETWEEN_CYCLES_MS = 1_500;

/**
 * @param {import('playwright').Page} page
 */
async function waitConnected(page) {
  await page.waitForSelector('#sticky-room-conn-state[data-state="connected"]', {
    timeout: CONNECT_TIMEOUT_MS,
  });
}

/**
 * @param {import('playwright').Page} hostPage
 */
async function startHost(hostPage) {
  await hostPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await hostPage.click('#sticky-room-host');
  await hostPage.waitForSelector('#sticky-room-room-link a', { timeout: CONNECT_TIMEOUT_MS });
}

/**
 * @param {import('playwright').Page} hostPage
 */
async function getJoinUrl(hostPage) {
  await hostPage.waitForFunction(() => {
    const a = document.querySelector('#sticky-room-room-link a');
    return Boolean(a?.href?.includes('#k='));
  }, { timeout: CONNECT_TIMEOUT_MS });
  const href = await hostPage.locator('#sticky-room-room-link a').getAttribute('href');
  if (!href || !href.includes('#k=')) {
    throw new Error('参加用 URL に鍵（#k=）がありません');
  }
  return href;
}

/**
 * @param {import('playwright').Browser} browser
 */
async function connectHostJoinOnce(browser) {
  const host = await browser.newPage();
  const join = await browser.newPage();
  try {
    await startHost(host);
    const joinUrl = await getJoinUrl(host);
    await join.goto(joinUrl, { waitUntil: 'domcontentloaded' });
    await Promise.all([waitConnected(host), waitConnected(join)]);
    return true;
  } finally {
    await host.close();
    await join.close();
  }
}

/**
 * @param {import('playwright').Browser} browser
 */
async function connectWithRetries(browser) {
  let lastErr = /** @type {Error | null} */ (null);
  for (let attempt = 1; attempt <= CYCLE_RETRIES; attempt += 1) {
    try {
      await connectHostJoinOnce(browser);
      return;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      await new Promise((r) => setTimeout(r, 1_000 * attempt));
    }
  }
  throw lastErr ?? new Error('接続に失敗');
}

/**
 * @param {import('playwright').Browser} browser
 */
async function verifyReloadReconnect(browser) {
  const host = await browser.newPage();
  const join = await browser.newPage();
  try {
    await startHost(host);
    const joinUrl = await getJoinUrl(host);
    await join.goto(joinUrl, { waitUntil: 'domcontentloaded' });
    await Promise.all([waitConnected(host), waitConnected(join)]);

    await join.reload({ waitUntil: 'domcontentloaded' });
    await Promise.all([waitConnected(host), waitConnected(join)]);
  } finally {
    await host.close();
    await join.close();
  }
}

async function main() {
  // DECISION: headless Chromium は WebRTC ICE が不安定 — Windows では headed 推奨
  const headless = process.env.STICKY_ROOM_DOD_HEADED === '1' ? false : true;
  const channel = process.env.STICKY_ROOM_DOD_CHANNEL || 'chrome';
  const browser = await chromium.launch({
    headless,
    channel,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--disable-features=WebRtcHideLocalIpsWithMdns',
    ],
  });

  try {
    for (let i = 0; i < CYCLES; i += 1) {
      await connectWithRetries(browser);
      process.stdout.write(`  cycle ${i + 1}/${CYCLES} OK\n`);
      if (i < CYCLES - 1) {
        await new Promise((r) => setTimeout(r, BETWEEN_CYCLES_MS));
      }
    }

    await verifyReloadReconnect(browser);
    process.stdout.write('  reload reconnect OK\n');

    console.log('sticky-room-phase2-dod-e2e: OK');
    console.log(JSON.stringify({ consecutiveCycles: CYCLES, reloadReconnect: true }));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('sticky-room-phase2-dod-e2e: FAIL', err.message);
  process.exit(1);
});
