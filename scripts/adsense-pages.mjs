/**
 * AdSense 自動広告 — core のみ · パス限定注入
 * SSOT: data/adsense.json · docs/notes/ADSENSE_R2_BOARD_SYNTHESIS.md
 * 検証: verify-adsense-pages.mjs
 *
 * DECISION (2026-08-13 R2): 薄いツールURLへの一律注入をやめ、
 * テキスト密度の高い面（guides · hub · updates · statements · roadmap）のみ注入する。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const ADSENSE_CONFIG_PATH = path.join(ROOT, 'data', 'adsense.json');
export const ADSENSE_MARKER = 'pagead2.googlesyndication.com';

/**
 * ビルド相対パス（dist 基準）または tools ファイル名から注入可否を判定
 * @param {string} fileRel
 * @param {{ guide?: boolean }} [opts]
 */
export function shouldInjectAdsense(fileRel, opts = {}) {
  if (opts.guide) return true;
  const f = String(fileRel || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
  if (!f) return false;
  if (f.startsWith('guides/') || f === 'guides.html') return true;
  if (/^guides\/[^/]+\/index\.html$/.test(f)) return true;
  if (f === 'hub.html' || f === 'index.html') return true;
  const allowLeaf = new Set(['updates.html', 'statements.html', 'roadmap.html']);
  if (allowLeaf.has(f)) return true;
  // clean URL 複製: updates/index.html ← updates.html
  const m = f.match(/^([^/]+)\/index\.html$/);
  if (m && allowLeaf.has(`${m[1]}.html`)) return true;
  return false;
}

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

/**
 * @param {string} html
 * @param {{ enabled: boolean, client: string } | null} adsenseConfig
 * @param {string} [fileRel]
 * @param {{ guide?: boolean }} [opts]
 */
export function injectAdsenseHead(html, adsenseConfig, fileRel = '', opts = {}) {
  if (!adsenseConfig) return html;
  if (!shouldInjectAdsense(fileRel, opts)) return html;
  if (html.includes(ADSENSE_MARKER)) return html;
  return html.replace(/(<meta charset="UTF-8">)/, `$1\n${adsenseHeadSnippet(adsenseConfig.client)}`);
}
