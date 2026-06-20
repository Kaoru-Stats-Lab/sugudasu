/**
 * SUGUDASU グロース — ブックマーク誘導 · ツール結果の X シェア（intent 起動）
 * docs/BACKLOG.md §2-5 A2 / A4
 */
(function (global) {
  'use strict';

  const LS_DISMISS = 'sg_bookmark_banner_v1';
  const LS_SUCCESS = 'sg_tool_success_count_v1';
  const LS_VISITS = 'sg_visit_count_v1';

  function siteUrl(path) {
    const p = path || global.location.pathname;
    const normalized = p.startsWith('/') ? p : '/' + p;
    return global.location.origin + normalized;
  }

  function pageFile() {
    let seg = (global.location.pathname || '').split('/').filter(Boolean).pop() || '';
    if (!seg || seg === 'index.html') return 'hub.html';
    return seg.endsWith('.html') ? seg : seg + '.html';
  }

  function toolUrl(file) {
    return siteUrl('/' + (file || pageFile()));
  }

  function openXIntent(text, url) {
    const params = new URLSearchParams();
    const body = String(text || '').trim();
    if (body) params.set('text', body);
    if (url) params.set('url', url);
    global.open('https://twitter.com/intent/tweet?' + params.toString(), '_blank', 'noopener,noreferrer');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function dismissBookmarkBanner() {
    try {
      localStorage.setItem(LS_DISMISS, '1');
    } catch (_) { /* ignore */ }
    const el = document.getElementById('sg-bookmark-banner');
    if (el) el.remove();
  }

  function showBookmarkBanner() {
    if (document.getElementById('sg-bookmark-banner')) return;
    try {
      if (localStorage.getItem(LS_DISMISS)) return;
    } catch (_) { return; }

    const bar = document.createElement('div');
    bar.id = 'sg-bookmark-banner';
    bar.className = 'sg-bookmark-banner no-print';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'ブックマークの案内');
    bar.innerHTML = `
      <div class="sg-bookmark-banner__inner">
        <div class="sg-bookmark-banner__text">
          <p class="sg-bookmark-banner__title">次回も1秒で開く</p>
          <p class="sg-bookmark-banner__body">よく使う方は<strong>ホーム画面に追加</strong>または<strong>ブックマーク</strong>が便利です（データは端末内のみ）。</p>
          <p class="sg-bookmark-banner__hint">iPhone: 共有 → ホーム画面に追加 · Android: メニュー → ホーム画面に追加</p>
        </div>
        <div class="sg-bookmark-banner__actions">
          <button type="button" class="sg-bookmark-banner__close" data-sg-bookmark-dismiss>閉じる</button>
        </div>
      </div>`;
    bar.querySelector('[data-sg-bookmark-dismiss]').addEventListener('click', dismissBookmarkBanner);
    document.body.appendChild(bar);
  }

  function shouldOfferBookmark() {
    try {
      if (localStorage.getItem(LS_DISMISS)) return false;
      const success = parseInt(localStorage.getItem(LS_SUCCESS) || '0', 10);
      const visits = parseInt(localStorage.getItem(LS_VISITS) || '0', 10);
      return success >= 1 || visits >= 2;
    } catch (_) {
      return false;
    }
  }

  function recordToolSuccess() {
    try {
      const n = parseInt(localStorage.getItem(LS_SUCCESS) || '0', 10) + 1;
      localStorage.setItem(LS_SUCCESS, String(n));
    } catch (_) { /* ignore */ }
    if (shouldOfferBookmark()) showBookmarkBanner();
  }

  function init() {
    try {
      const visits = parseInt(localStorage.getItem(LS_VISITS) || '0', 10) + 1;
      localStorage.setItem(LS_VISITS, String(visits));
    } catch (_) { /* ignore */ }
    if (shouldOfferBookmark()) showBookmarkBanner();
  }

  function shareXWarikan(getSummary) {
    const summary = typeof getSummary === 'function' ? getSummary() : null;
    if (!summary) {
      alert('先に割り勘を計算してください。');
      return;
    }
    const raw = String(summary.total || '').trim();
    const totalLabel = raw ? (raw.startsWith('¥') ? raw : '¥' + raw) : '';
    const text = `飲み会${totalLabel}の割り勘を透明精算。${summary.hint || '幹事の味方'}`;
    openXIntent(text, toolUrl('warikan.html'));
  }

  function shareXInvoice(getSummary) {
    const summary = typeof getSummary === 'function' ? getSummary() : null;
    const extra = summary && summary.total ? `合計${summary.total}の` : '';
    const text = `${extra}請求書をブラウザだけで作成。ログイン不要`;
    openXIntent(text, toolUrl('invoice.html'));
  }

  function shareXReceipt(getSummary) {
    const summary = typeof getSummary === 'function' ? getSummary() : null;
    const extra = summary && summary.net ? `手取り${summary.net}の` : '';
    const text = `${extra}領収書を逆算。源泉・消費税込みで一瞬`;
    openXIntent(text, toolUrl('receipt.html'));
  }

  global.SUGUDASU_GROWTH = {
    init,
    recordToolSuccess,
    dismissBookmarkBanner,
    openXIntent,
    shareXWarikan,
    shareXInvoice,
    shareXReceipt,
    copyText,
    siteUrl,
    toolUrl,
  };
})(window);
