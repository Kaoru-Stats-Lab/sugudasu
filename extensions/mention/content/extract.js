/**
 * Content script ルータ — 登録済み Adapter のみ呼ぶ（端末内 · サーバー送信なし）
 * Maps 固有 DOM は content/adapters/google_maps.js
 */
(function () {
  if (window.__SUGUDASU_MENTION_EXTRACT__) return;
  window.__SUGUDASU_MENTION_EXTRACT__ = true;

  function emptyUnsupported() {
    return {
      adapterId: '',
      title: document.title || '',
      url: location.href,
      author: '',
      datetime: '',
      body: '',
      brand: '',
      stars: null,
      hasImages: false,
      hasReply: false,
      domain: '',
      ogTitle: '',
      ogImage: '',
      supported: false,
    };
  }

  function extract() {
    const adapters = window.__SUGUDASU_MENTION_ADAPTERS__ || {};
    if (typeof adapters.google_maps === 'function') {
      const envelope = adapters.google_maps();
      if (envelope) return envelope;
    }
    return emptyUnsupported();
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'MENTION_EXTRACT') return false;
    try {
      sendResponse({ signals: extract() });
    } catch (err) {
      sendResponse({ error: String(err?.message || err), signals: null });
    }
    return false;
  });
})();
