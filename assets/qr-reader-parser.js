import { decodeHash } from './link-qr-engine.js';

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isSafeUrl(text) {
  try {
    const url = new URL(String(text ?? '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseQrContent(rawText) {
  const raw = String(rawText ?? '').trim();
  if (!raw) return { type: 'empty', raw, data: {} };

  // DECISION: Sync側の取り込みUIは別画面に分離し、ここでは判定と安全な導線提示だけに留める。
  // DECISION: SGDS1プレフィックスは仕様書v2の想定に合わせた最小判定（誤爆を避けるため先頭一致のみ）。
  if (raw.startsWith('SGDS1-')) {
    // DECISION: Syncの入口を /timeline 固定にせず、/schedule（開発中）を含む将来導線に備えてドメイントップへ寄せる。
    return {
      type: 'sync_secret',
      raw,
      data: {
        summary: 'SUGUDASU Sync の端末追加用QRを検出しました。',
        ctaUrl: 'https://sync.sugudasu.com/',
      },
    };
  }

  const linkQr = parseLinkQr(raw);
  if (linkQr) return linkQr;

  if (isSafeUrl(raw)) return { type: 'url', raw, data: { url: raw } };
  return { type: 'text', raw, data: { text: raw } };
}

function parseLinkQr(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.replace(/\/+$/, '') || '/';
  if (host !== 'sugudasu.com' || path !== '/link-qr' || !parsed.hash) return null;

  const decoded = decodeHash(parsed.hash);
  if (decoded.error || !decoded.links?.length) return null;
  return {
    type: 'link_qr',
    raw,
    data: {
      name: decoded.name || 'リンク集',
      links: decoded.links,
      url: raw,
    },
  };
}

export function renderParsedContent(parsed) {
  if (!parsed) return '<p class="text-xs text-slate-500">結果がありません。</p>';
  if (parsed.type === 'sync_secret') return renderSyncSecretCard(parsed.data);
  if (parsed.type === 'link_qr') return renderLinkQrCard(parsed.data);
  if (parsed.type === 'url') return `<p class="text-sm break-all text-blue-700">${esc(parsed.data.url)}</p>`;
  if (parsed.type === 'text') return `<p class="text-sm break-all text-slate-700">${esc(parsed.data.text)}</p>`;
  return `<p class="text-xs text-slate-500">${esc(parsed.raw || '')}</p>`;
}

function renderLinkQrCard(data) {
  const links = (data.links || [])
    .map((item) => `
      <div class="qr-reader-card__row">
        <span class="qr-reader-card__label">${esc(item.label)}</span>
        <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" class="qr-reader-card__url">${esc(item.url)}</a>
      </div>
    `)
    .join('');

  return `
    <div class="qr-reader-card">
      <p class="qr-reader-card__badge">SUGUDASU リンク集QR</p>
      <p class="qr-reader-card__name">${esc(data.name)}</p>
      <div class="qr-reader-card__rows">${links}</div>
      <p class="mt-3 text-[11px]">
        <a href="link-qr.html" class="text-blue-600 font-semibold hover:underline">自分のリンク集QRを作る</a>
      </p>
    </div>
  `;
}

function renderSyncSecretCard(data) {
  return `
    <div class="qr-reader-card border-amber-200 bg-amber-50">
      <p class="qr-reader-card__badge text-amber-700">SUGUDASU Sync</p>
      <p class="text-sm font-semibold text-slate-900">${esc(data.summary)}</p>
      <p class="text-[11px] text-slate-600 mt-2 leading-relaxed">
        ここでは読取結果の確認のみ行います。端末追加の実行はSync画面で続けてください。
      </p>
      <p class="mt-3 text-[11px]">
        <a href="${esc(data.ctaUrl)}" class="text-blue-600 font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Syncで端末追加を続ける</a>
      </p>
    </div>
  `;
}
