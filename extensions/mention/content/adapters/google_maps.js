/**
 * Platform Adapter: google_maps（GBP / Maps 口コミ）
 * ContextEnvelope のみ返す。DOM 固有ロジックはここに閉じる。
 */
(function () {
  const adapters = (window.__SUGUDASU_MENTION_ADAPTERS__ = window.__SUGUDASU_MENTION_ADAPTERS__ || {});

  function text(el) {
    return (el?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function meta(name) {
    const el =
      document.querySelector(`meta[property="${name}"]`) ||
      document.querySelector(`meta[name="${name}"]`);
    return el?.getAttribute('content') || '';
  }

  function domainOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  function parseStarsFromAria(label) {
    if (!label) return null;
    const m =
      label.match(/(\d+(?:\.\d+)?)\s*(?:つ星|星|stars?|out of)/i) ||
      label.match(/Rated\s+(\d+(?:\.\d+)?)/i) ||
      label.match(/★{1,5}/);
    if (m && m[1]) return Math.round(Number(m[1]));
    if (m && m[0]?.startsWith('★')) return m[0].length;
    return null;
  }

  function matchesPage() {
    const url = location.href;
    return (
      /google\.[^/]+\/maps/i.test(url) ||
      /maps\.google\./i.test(url) ||
      location.hostname.includes('business.google.com')
    );
  }

  adapters.google_maps = function extractGoogleMaps() {
    if (!matchesPage() && !document.querySelector('[data-review-id], .jftiEf, .MyEned')) {
      return null;
    }

    const url = location.href;
    const isMaps = matchesPage();
    const card =
      document.querySelector('[data-review-id]') ||
      document.querySelector('.jftiEf') ||
      document.querySelector('div[jscontroller] .MyEned')?.closest('div[data-review-id], .jftiEf, div');

    let author = '';
    let body = '';
    let datetime = '';
    let stars = null;
    let hasReply = false;
    let hasImages = false;

    if (card) {
      author =
        text(card.querySelector('.d4r55, .TSUbDb, button[aria-label] span')) ||
        text(card.querySelector('[class*="reviewer"]')) ||
        '';
      body = text(card.querySelector('.wiI7pd, .MyEned, [data-review-text], .review-full-text')) || '';
      datetime = text(card.querySelector('.rsqaWe, .xRkPPb, span[class*="date"]')) || '';
      const starEl =
        card.querySelector('span[role="img"][aria-label]') ||
        card.querySelector('[aria-label*="星"]') ||
        card.querySelector('[aria-label*="star" i]');
      stars = parseStarsFromAria(starEl?.getAttribute('aria-label') || '');
      hasReply = Boolean(
        card.querySelector('.CDe7pd, .wiI7pd + .CDe7pd, [class*="owner-response"], [class*="OwnerResponse"]')
      );
      hasImages = Boolean(card.querySelector('img[src*="googleusercontent"], button[aria-label*="写真"]'));
    }

    if (!body && !author && !isMaps) return null;

    return {
      adapterId: 'google_maps',
      title: document.title || 'Google 口コミ',
      url,
      author,
      datetime,
      body,
      brand: '',
      stars,
      hasImages,
      hasReply,
      domain: domainOf(url),
      ogTitle: meta('og:title'),
      ogImage: meta('og:image'),
      supported: Boolean(body || author || isMaps),
    };
  };
})();
