/**
 * SUGUDASU グロース — Direct 再訪（端末内）
 * 決議: docs/notes/bookmark-direct-revisit-research/SYNTHESIS.md（2026-08-13）
 * — 固定バナー / OS手順: Reject
 * — B: 完了フィードバック内1行（通算2回目以降 · Ctrl+D）
 * — C: 組織Wiki/チャットは各ツールの Copy 文言側（ここは出さない）
 * — A Hub: Defer
 */
(function (global) {
  'use strict';

  const LS_DISMISS_LEGACY = 'sg_bookmark_banner_v1';
  const LS_DISMISS = 'sg_bookmark_hint_v1';
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

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function isSyncAuthSurface() {
    const path = global.location.pathname || '';
    return /\/timeline\/app\/?$/i.test(path) || document.body.classList.contains('sg-chrome-focus');
  }

  function isDismissed() {
    try {
      return !!(localStorage.getItem(LS_DISMISS) || localStorage.getItem(LS_DISMISS_LEGACY));
    } catch (_) {
      return true;
    }
  }

  function successCount() {
    try {
      return parseInt(localStorage.getItem(LS_SUCCESS) || '0', 10) || 0;
    } catch (_) {
      return 0;
    }
  }

  /** 通算2回目以降の完了後のみ（決議 B） */
  function shouldShowBookmarkHint() {
    if (isSyncAuthSurface()) return false;
    if (isDismissed()) return false;
    return successCount() >= 2;
  }

  function dismissBookmarkHint() {
    try {
      localStorage.setItem(LS_DISMISS, '1');
      localStorage.setItem(LS_DISMISS_LEGACY, '1');
    } catch (_) { /* ignore */ }
    document.querySelectorAll('[data-sg-bookmark-hint]').forEach((el) => el.remove());
  }

  /** @deprecated 旧バナーAPI互換 */
  function dismissBookmarkBanner() {
    dismissBookmarkHint();
  }

  /**
   * 既存トースト内に1節だけ足す。新規グローバル帯は作らない。
   * @param {HTMLElement | null} toastEl
   * @returns {boolean}
   */
  function decorateCopyToast(toastEl) {
    if (!toastEl || isSyncAuthSurface()) return false;
    if (!shouldShowBookmarkHint()) return false;
    if (toastEl.querySelector('[data-sg-bookmark-hint]')) return false;

    const line = document.createElement('span');
    line.className = 'sg-bookmark-hint';
    line.setAttribute('data-sg-bookmark-hint', '1');
    line.innerHTML =
      '<span class="sg-bookmark-hint__text">次回は Ctrl+D / ⌘D（ブックマーク）</span>' +
      '<button type="button" class="sg-bookmark-hint__dismiss" data-sg-bookmark-dismiss aria-label="この案内を閉じる">閉じる</button>';

    const btn = line.querySelector('[data-sg-bookmark-dismiss]');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dismissBookmarkHint();
      });
    }

    toastEl.appendChild(line);
    return true;
  }

  function recordToolSuccess() {
    // DECISION: localStorage のみ。GA の tool_job_done は sg-copy-feedback / SG_ANALYTICS 側。
    try {
      const n = successCount() + 1;
      localStorage.setItem(LS_SUCCESS, String(n));
    } catch (_) { /* ignore */ }
  }

  function init() {
    if (isSyncAuthSurface()) return;
    try {
      const visits = parseInt(localStorage.getItem(LS_VISITS) || '0', 10) + 1;
      localStorage.setItem(LS_VISITS, String(visits));
    } catch (_) { /* ignore */ }
    // DECISION: 入場時・訪問数ではUIを出さない（産経型・旧固定バナー Reject）
  }

  global.SUGUDASU_GROWTH = {
    init,
    recordToolSuccess,
    dismissBookmarkHint,
    dismissBookmarkBanner,
    shouldShowBookmarkHint,
    decorateCopyToast,
    copyText,
    siteUrl,
    toolUrl,
  };
})(window);
