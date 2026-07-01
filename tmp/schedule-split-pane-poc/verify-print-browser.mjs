/**
 * 印刷メディアの computed style を headless Chrome で検証。
 * 要: ローカルで PoC サーバー起動済み (8092)
 */
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:8092/tmp/schedule-split-pane-poc/';

function rgbBlackish(rgb) {
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return false;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return rgb === 'black' || rgb === '#000' || rgb === '#000000';
  return Number(m[1]) < 40 && Number(m[2]) < 40 && Number(m[3]) < 40;
}

async function checkTheme(theme) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const url = theme === 'dark' ? `${BASE}?theme=dark` : BASE;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('.table-row', { timeout: 10000 });
    await page.emulateMediaType('print');

    const sample = await page.evaluate(() => {
      const row = document.querySelector('.table-row:not(.table-add-sub-row)');
      const th = document.querySelector('.th');
      const bar = document.querySelector('.bar');
      const shell = document.querySelector('.schedule-shell');
      const cs = (el) => (el ? getComputedStyle(el) : null);
      const rowS = cs(row);
      const thS = cs(th);
      const barS = cs(bar);
      const shellS = cs(shell);
      return {
        shellClass: shell?.className || '',
        rowColor: rowS?.color || '',
        rowBorder: rowS?.borderColor || '',
        thColor: thS?.color || '',
        barColor: barS?.color || '',
        barBorder: barS?.borderTopColor || barS?.borderColor || '',
        bodyBg: getComputedStyle(document.body).backgroundColor,
      };
    });

    const ok =
      rgbBlackish(sample.rowColor) &&
      rgbBlackish(sample.thColor) &&
      rgbBlackish(sample.barColor) &&
      rgbBlackish(sample.barBorder);

    console.log(`\n[${theme}] emulateMediaType(print)`);
    console.log(JSON.stringify(sample, null, 2));
    console.log(ok ? '✓ 黒文字・黒罫線' : '✗ 印刷色が黒ではない');
    return ok;
  } finally {
    await browser.close();
  }
}

const lightOk = await checkTheme('light');
const darkOk = await checkTheme('dark');

if (!lightOk || !darkOk) process.exit(1);
console.log('\nブラウザ印刷メディア検証 OK');
