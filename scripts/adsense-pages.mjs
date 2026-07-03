/**
 * AdSense 自動広告 — core のみ head 注入 · Sync は常に除外
 * SSOT: data/adsense.json · 検証: verify-adsense-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const ADSENSE_CONFIG_PATH = path.join(ROOT, 'data', 'adsense.json');
export const ADSENSE_MARKER = 'pagead2.googlesyndication.com';

/** @returns {{ enabled: boolean, client: string } | null} */
export function loadAdsenseConfig(isSync) {
  if (isSync) return null;
  if (!fs.existsSync(ADSENSE_CONFIG_PATH)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(ADSENSE_CONFIG_PATH, 'utf8'));
    if (!raw.enabled || !raw.client) return null;
    return { enabled: true, client: String(raw.client) };
  } catch {
    return null;
  }
}

export function adsenseHeadSnippet(client) {
  return `    <script async src="https://${ADSENSE_MARKER}/pagead/js/adsbygoogle.js?client=${client}"
     crossorigin="anonymous"></script>`;
}

export function injectAdsenseHead(html, adsenseConfig) {
  if (!adsenseConfig || html.includes(ADSENSE_MARKER)) return html;
  return html.replace(/(<meta charset="UTF-8">)/, `$1\n${adsenseHeadSnippet(adsenseConfig.client)}`);
}
