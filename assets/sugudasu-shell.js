/**
 * SUGUDASU shared chrome — header · ツールナビ · footer
 * docs/DESIGN_GUIDELINE.md §1.3, §3.1, §7
 * ナビラベル SSOT: data/tool-registry.json navLabel（TOOLS は初回描画フォールバック）
 */
(function (global) {
  const GA4_MEASUREMENT_ID = 'G-WBB6PTTYF7';
  /** @type {Array<{id:string,file:string,label:string,icon:string}>} — registry navLabel と同期 */
  const TOOLS = [
    { id: 'hub', file: 'hub.html', label: '一覧', icon: '🏠' },
    { id: 'invoice', file: 'invoice.html', label: '請求書', icon: '📄' },
    { id: 'stamp', file: 'stamp.html', label: '印鑑', icon: '🔴' },
    { id: 'receipt', file: 'receipt.html', label: '領収書', icon: '🧾' },
    { id: 'label', file: 'label.html', label: 'ラベル', icon: '🏷️' },
    { id: 'shift', file: 'shift.html', label: 'シフト', icon: '📅' },
    { id: 'report', file: 'report.html', label: '議事録', icon: '📝' },
    { id: 'reverse', file: 'reverse.html', label: '逆引き', icon: '📖' },
    { id: 'normalize', file: 'normalize.html', label: '全角半角', icon: '🔤' },
    { id: 'clip-stash', file: 'clip-stash.html', label: '仮置き', icon: '📋' },
    { id: 'search-query', file: 'search-query.html', label: '検索式', icon: '🔍' },
    { id: 'table-conv', file: 'table-conv.html', label: '表変換', icon: '📊' },
    { id: 'webp-to-jpg', file: 'webp-to-jpg.html', label: 'WebP→JPG', icon: '🖼️' },
    { id: 'video-frame', file: 'video-frame.html', label: '動画コマ抜き', icon: '🎬' },
    { id: 'annotate', file: 'annotate.html', label: '赤入れ', icon: '✏️' },
    { id: 'image-trim', file: 'image-trim.html', label: '画像切り出し', icon: '✂️' },
    { id: 'clipboard-trim', file: 'clipboard-trim.html', label: '余白トリム', icon: '📐' },
    { id: 'watermark', file: 'watermark.html', label: '透かし', icon: '💧' },
    { id: 'pdf-fill', file: 'pdf-fill.html', label: 'PDF記入', icon: '✍️' },
    { id: 'pdf-images', file: 'pdf-images.html', label: 'PDF画像', icon: '📄' },
    { id: 'test-data', file: 'test-data.html', label: 'テストデータ', icon: '🧪' },
    { id: 'broken-input', file: 'broken-input.html', label: '壊れ入力', icon: '💥' },
    { id: 'group-split', file: 'group-split.html', label: '班分け', icon: '👥' },
    { id: 'match-board', file: 'match-board.html', label: 'ドラフト', icon: '🧩' },
    { id: 'slot-board', file: 'slot-board.html', label: '枠取り', icon: '📦' },
    { id: 'planning-poker', file: 'planning-poker.html', label: '見積会議', icon: '🃏' },
    { id: 'timeline', file: 'timeline.html', label: '進行', icon: '⏱️' },
    { id: 'fair-draw', file: 'fair-draw.html', label: '抽選', icon: '🎲' },
    { id: 'budget-trim', file: 'budget-trim.html', label: '予算引き算', icon: '✂️' },
    { id: 'warikan', file: 'warikan.html', label: '割り勘', icon: '💰' },
    { id: 'sns', file: 'sns.html', label: 'SNS', icon: '✨' },
    { id: 'link-qr', file: 'link-qr.html', label: 'リンクQR', icon: '📇' },
    { id: 'qr-reader', file: 'qr-reader.html', label: 'QR読取', icon: '📷' },
    { id: 'diff', file: 'diff.html', label: '差分', icon: '🔎' },
    { id: 'json-view', file: 'json-view.html', label: 'JSON見る', icon: '🌲' },
    { id: 'ai-cleaner', file: 'ai-cleaner.html', label: 'AIコピペ整形', icon: '🧹' },
    { id: 'time-calc', file: 'time-calc.html', label: '時給計算', icon: '⏳' }
  ];

  /** 本番 dist は CSS が /assets/…（クリーン URL 配下でもルート絶対パスが必須） */
  function isProdSite() {
    const link = document.querySelector('link[href*="sugudasu.css"]');
    const href = link && link.getAttribute('href');
    if (href && href.startsWith('/')) return true;
    const host = String(global.location && global.location.hostname || '');
    return host === 'sugudasu.com' || host.endsWith('.pages.dev');
  }

  /**
   * 内部ページ URL。本番は必ず /slug（相対 .html 禁止）。
   * DECISION: clean URL の /guides/ や誤パス配下だと相対 invoice.html が
   * /guides/invoice.html になり、CF の未知URL→index フォールバックで「遷移しない」罠になる。
   * @param {string} fileOrPath hub.html | invoice.html | fair-draw.html?tab=check | /invoice
   */
  function pageHref(fileOrPath) {
    if (!fileOrPath) return isProdSite() ? '/' : 'hub.html';
    if (/^(https?:|mailto:|tel:|#)/i.test(fileOrPath)) return fileOrPath;
    // DECISION: ?query と #hash を両方残す（statements.html#copy-first-tech 等）
    const m = String(fileOrPath).match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
    const rawPath = (m && m[1]) || String(fileOrPath);
    const qs = `${(m && m[2]) || ''}${(m && m[3]) || ''}`;
    let slug = rawPath.replace(/^\.\//, '').replace(/^\//, '').replace(/\.html$/i, '');
    if (!slug || slug === 'hub' || slug === 'index') {
      return (isProdSite() ? '/' : 'hub.html') + qs;
    }
    if (isProdSite()) return `/${slug}${qs}`;
    const local = rawPath.endsWith('.html') ? rawPath.replace(/^\//, '') : `${slug}.html`;
    return local + qs;
  }

  /** 開発(tools/) と本番(dist/) 両対応 */
  function assetUrl(path) {
    const link = document.querySelector('link[href*="sugudasu.css"]');
    if (link && link.getAttribute('href')) {
      const href = link.getAttribute('href');
      const base = href.replace(/sugudasu\.css.*$/, '');
      if (base) return base + path;
    }
    const host = String(global.location && global.location.hostname || '');
    if (host === 'sugudasu.com' || host.endsWith('.pages.dev')) {
      return '/assets/' + path;
    }
    return '../assets/' + path;
  }

  /** 開発(tools/) と本番(dist/) 両対応 */
  function dataUrl(path) {
    const link = document.querySelector('link[href*="sugudasu.css"]');
    if (link && link.getAttribute('href')) {
      const href = link.getAttribute('href');
      const base = href.replace(/assets\/sugudasu\.css.*$/, '');
      if (base) return base + 'data/' + path;
    }
    const host = String(global.location && global.location.hostname || '');
    if (host === 'sugudasu.com' || host.endsWith('.pages.dev')) {
      return '/data/' + path;
    }
    return '../data/' + path;
  }

  function homeHref() {
    return pageHref('hub.html');
  }

  function currentFile() {
    let seg = (global.location.pathname || '').split('/').filter(Boolean).pop() || '';
    if (!seg || seg === 'index.html') return 'hub.html';
    if (!seg.endsWith('.html')) seg += '.html';
    return seg;
  }

  function navItemsFromRegistry(registry) {
    if (!registry || !registry.tools) return TOOLS;
    const list = Object.entries(registry.tools)
      .filter(([, t]) => t.inNav && t.navLabel)
      .sort((a, b) => (a[1].navOrder || 99) - (b[1].navOrder || 99))
      .map(([id, t]) => ({
        id,
        file: t.file,
        label: t.navLabel,
        icon: t.navIcon || '',
      }));
    return list.length ? list : TOOLS;
  }

  function navHtml(activeFile, navItems) {
    // Phase2: ツール横並びナビは廃止。互換のため空。
    void activeFile;
    void navItems;
    return '';
  }

  const SITE_PAGE_IDS = {
    hub: 1,
    index: 1,
    updates: 1,
    roadmap: 1,
    statements: 1,
    privacy: 1,
    terms: 1,
    disclaimer: 1,
    'not-a-car': 1,
    guides: 1,
    contact: 1,
    'brand-logo-preview': 1,
  };

  /** @returns {'hub'|'product'|'site'} */
  function resolveNavMode(opts, file) {
    const explicit = opts && opts.navMode;
    if (explicit === 'hub' || explicit === 'product' || explicit === 'site') return explicit;
    const slug = String(file || '')
      .replace(/\\/g, '/')
      .replace(/^.*\//, '')
      .replace(/\.html$/i, '')
      .replace(/\?.*$/, '');
    if (!slug || slug === 'hub' || slug === 'index') return 'hub';
    if (SITE_PAGE_IDS[slug] || slug.indexOf('category') === 0) return 'site';
    return 'product';
  }

  function navLinksForMode(mode, activeFile) {
    if (mode === 'hub') {
      return [
        { file: 'guides.html', label: '実務ガイド' },
        { file: 'updates.html', label: '更新履歴' },
        { file: 'roadmap.html', label: 'ロードマップ' },
      ];
    }
    if (mode === 'product') {
      return [
        { file: 'hub.html', label: '← ツール一覧', isBack: true },
        { file: 'guides.html', label: '実務ガイド' },
      ];
    }
    // site（更新履歴・ガイド・約束など）
    return [
      { file: 'hub.html', label: 'ツール一覧' },
      { file: 'guides.html', label: '実務ガイド' },
      { file: 'updates.html', label: '更新履歴' },
      { file: 'roadmap.html', label: 'ロードマップ' },
    ];
  }

  function drawerLinksForMode(mode) {
    const base = navLinksForMode(mode, '');
    // モバイルdrawerに約束を追加（Desktopヘッダーは項目を増やさない）
    return base.concat([{ file: 'statements.html', label: '約束' }]);
  }

  function isNavActive(file, activeFile) {
    if (file === 'hub.html') {
      return activeFile === 'hub.html' || activeFile === 'index.html' || !activeFile;
    }
    return file === activeFile;
  }

  function siteNavLinksHtml(links, activeFile, opts) {
    const linkClass = (opts && opts.drawer) ? 'sg-site-nav__drawer-link' : 'sg-site-nav__link';
    return links
      .map((t) => {
        const active = isNavActive(t.file, activeFile);
        const extra = t.isBack ? ' sg-site-nav__link--back' : '';
        return `<a href="${pageHref(t.file)}" ${active ? 'aria-current="page"' : ''} class="${linkClass}${extra}${
          active ? ' is-active' : ''
        }">${escapeHtml(t.label)}</a>`;
      })
      .join('');
  }

  /**
   * Phase2: Header = サイトナビ（白1段）。ツール一覧横スクロールは出さない。
   * DECISION: Hub/Product/Site でリンク集合だけ変え、見た目の骨は共通。
   */
  function siteChromeHtml(mode, title, showPrint, activeFile, subtitle) {
    const desktopLinks = navLinksForMode(mode, activeFile);
    const drawerLinks = drawerLinksForMode(mode);
    const printBtn = showPrint
      ? `<button type="button" id="sg-btn-print" onclick="window.print()" class="sg-site-nav__print shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">印刷 / PDF</button>`
      : '';
    // Hub はタイトル帯を出さず探索UIに集中。Product は productName を淡く表示。
    const pageTitleBlock =
      mode === 'product' && title && title !== 'SUGUDASU'
        ? `<div class="sg-site-header__pagetitle-wrap min-w-0 border-l border-slate-200 pl-3">
            <p class="sg-site-header__pagetitle">${escapeHtml(title)}</p>
            ${subtitle ? `<p class="sg-site-header__pagesub">${escapeHtml(subtitle)}</p>` : ''}
          </div>`
        : '';

    return `<div class="sg-chrome sg-chrome--site no-print sticky top-0 z-50 w-full bg-white" data-sg-nav-kind="${mode}">
      <header class="sg-site-header">
        <div class="sg-site-header__brand">
          <div class="sg-site-header__inner">
            <div class="sg-site-header__left">
              ${logoHtml()}
              ${pageTitleBlock}
            </div>
            <nav class="sg-site-nav sg-site-nav--desktop" aria-label="SUGUDASU サイト">
              ${siteNavLinksHtml(desktopLinks, activeFile, {})}
            </nav>
            <div class="sg-site-header__right">
              ${printBtn}
              <button type="button" class="sg-site-nav__menu-btn" id="sg-site-nav-menu-btn" aria-expanded="false" aria-controls="sg-site-nav-drawer" aria-label="メニューを開く">☰</button>
            </div>
          </div>
          <div id="sg-site-nav-drawer" class="sg-site-nav__drawer" hidden>
            <nav class="sg-site-nav__drawer-nav" aria-label="サイトメニュー">
              ${siteNavLinksHtml(drawerLinks, activeFile, { drawer: true })}
            </nav>
          </div>
        </div>
      </header>
    </div>`;
  }

  function bindSiteNavDrawer() {
    const btn = document.getElementById('sg-site-nav-menu-btn');
    const drawer = document.getElementById('sg-site-nav-drawer');
    if (!btn || !drawer || btn.dataset.sgBound) return;
    btn.dataset.sgBound = '1';
    btn.addEventListener('click', function () {
      const open = drawer.hasAttribute('hidden');
      if (open) {
        drawer.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'メニューを閉じる');
      } else {
        drawer.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'メニューを開く');
      }
    });
  }

  /** @deprecated Phase2 · siteChromeHtml を使う */
  function siteNavHtml(activeFile) {
    return siteChromeHtml('site', 'SUGUDASU', false, activeFile, '');
  }

  function logoHtml() {
    const markSrc = assetUrl('logo-mark.png?v=2');
    return `<a href="${homeHref()}" class="sg-logo inline-flex items-center gap-1.5 shrink-0 no-underline leading-none" aria-label="SUGUDASU ホーム">
      <img class="sg-logo__mark h-8 w-auto max-h-9 object-contain" src="${markSrc}" alt="" width="56" height="56" decoding="async">
      <span class="sg-logo__word font-extrabold text-[#001f3f] tracking-wide">SUGUDASU</span>
    </a>`;
  }

  function ensureFavicon() {
    if (document.querySelector('link[data-sg-favicon]')) return;
    const links = [
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: 'favicon-16.png?v=4' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'favicon-32.png?v=4' },
      { rel: 'icon', type: 'image/png', sizes: '48x48', href: 'favicon-48.png?v=4' },
      { rel: 'icon', type: 'image/png', href: 'favicon.png?v=4' },
      { rel: 'apple-touch-icon', type: 'image/png', sizes: '180x180', href: 'apple-touch-icon.png?v=4' }
    ];
    links.forEach((item) => {
      const link = document.createElement('link');
      link.rel = item.rel;
      if (item.type) link.type = item.type;
      if (item.sizes) link.sizes = item.sizes;
      link.href = assetUrl(item.href);
      link.setAttribute('data-sg-favicon', '1');
      document.head.appendChild(link);
    });
  }

  function headerHtml(title, showPrint, subtitle) {
    return siteChromeHtml('site', title, showPrint, currentFile(), subtitle);
  }

  function focusHeaderHtml(title, subtitle, showPrint) {
    // 当日進行はナビより「今の表」が主役 — timeline focus モード（TIMELINE_TOOL_SPEC §7-1）
    const printBtn = showPrint
      ? `<button type="button" id="sg-btn-print" onclick="window.print()" class="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors">印刷</button>`
      : '';
    const shortTitle = subtitle || title.replace(/^SUGUDASU\s+/, '') || '進行';
    return `<header class="sg-site-header sg-site-header--focus">
      <div class="sg-site-header__inner flex min-h-11 max-w-7xl mx-auto px-3 sm:px-4 items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <a href="${homeHref()}" class="shrink-0 text-[11px] font-bold text-slate-500 hover:text-slate-800 no-underline" aria-label="ツール一覧へ">← ツール一覧</a>
          <span class="text-slate-300" aria-hidden="true">/</span>
          <p class="text-sm font-bold text-slate-900 truncate">${escapeHtml(shortTitle)}</p>
          <span data-sg-focus-badge class="shrink-0"></span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${printBtn}
        </div>
      </div>
    </header>`;
  }

  function focusChromeHtml(title, showPrint, subtitle) {
    return `<div class="sg-chrome sg-chrome--focus no-print sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-slate-200">${focusHeaderHtml(title, subtitle, showPrint)}</div>`;
  }

  function focusFooterHtml() {
    return `<footer class="no-print border-t border-slate-100 bg-white py-3 mt-auto">
      <div class="sg-section-shell text-center text-[11px] text-slate-400 space-x-2">
        <a href="${homeHref()}" class="text-slate-500 hover:underline">ツール一覧</a>
        <span aria-hidden="true">·</span>
        <a href="${pageHref('privacy.html')}" class="hover:underline">プライバシー</a>
        <span aria-hidden="true">·</span>
        <span>ブラウザ内完結</span>
      </div>
    </footer>`;
  }

  function chromeHtml(title, showPrint, activeFile, subtitle, navItems, navMode) {
    void navItems;
    const mode = navMode === 'hub' || navMode === 'product' || navMode === 'site' ? navMode : resolveNavMode({ navMode }, activeFile);
    return siteChromeHtml(mode, title, showPrint, activeFile, subtitle);
  }

  function footerHtml() {
    return `<footer class="no-print border-t border-slate-200 bg-white py-6 mt-auto">
      <div class="sg-section-shell text-center space-y-2">
        <p class="text-xs text-slate-500">ブラウザ内完結 · 名簿を預けない設計を中心に</p>
        <p class="text-[11px] text-slate-500">
          <a href="${pageHref('guides.html')}" class="text-blue-600 hover:underline">実務ガイド</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="${pageHref('contact.html')}" class="text-blue-600 hover:underline">問い合わせ</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="${pageHref('updates.html')}" class="text-blue-600 hover:underline">更新履歴</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="${pageHref('roadmap.html')}" class="text-blue-600 hover:underline">開発ロードマップ</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="${pageHref('statements.html')}" class="text-blue-600 hover:underline">SUGUDASU の約束</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="${pageHref('privacy.html')}" class="text-blue-600 hover:underline">プライバシーポリシー</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="${pageHref('terms.html')}" class="text-blue-600 hover:underline">利用規約</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="${pageHref('disclaimer.html')}" class="text-blue-600 hover:underline">免責事項</a>
        </p>
        <p>
          <a href="https://x.com/sugudasu" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 transition-colors" aria-label="SUGUDASU公式X（@sugudasu）">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>@sugudasu</span>
          </a>
        </p>
        <p class="text-[10px] text-slate-400">
          SUGUDASUはビジネスツールです。
          <a href="${pageHref('not-a-car.html')}" class="underline hover:text-slate-600">SUBARUの中古車「SUGDAS」とは別サービス</a>
        </p>
        <p class="text-[10px] text-slate-400">&copy; SUGUDASU（すぐだす）</p>
      </div>
    </footer>`;
  }

  /**
   * @param {object} opts
   * @param {string} opts.title — ヘッダー見出し
   * @param {boolean} [opts.print=false] — 印刷ボタン
   * @param {boolean} [opts.landscape=false] — A4横印刷（シフト）
   */
  function mount(opts) {
    const title = (opts && opts.title) || 'SUGUDASU';
    const showPrint = !!(opts && opts.print);
    const landscape = !!(opts && opts.landscape);
    const subtitle = (opts && opts.subtitle) || '';
    const chromeMode = (opts && opts.chromeMode) || 'default';
    const file = currentFile();
    const navMode = resolveNavMode(opts || {}, file);
    const top = document.getElementById('sg-chrome-top');
    const bottom = document.getElementById('sg-chrome-bottom');

    if (landscape) {
      document.body.classList.add('sg-print-landscape');
    }
    if (chromeMode === 'focus') {
      document.body.classList.add('sg-chrome-focus');
    }

    ensureFavicon();
    loadGa4();

    if (top) {
      if (top.querySelector('.sg-chrome')) return;
      if (chromeMode === 'focus') {
        top.innerHTML = focusChromeHtml(title, showPrint, subtitle);
      } else {
        top.innerHTML = chromeHtml(title, showPrint, file, subtitle, null, navMode);
        bindSiteNavDrawer();
      }
    }
    if (bottom && !bottom.innerHTML.trim()) {
      bottom.innerHTML = chromeMode === 'focus' ? focusFooterHtml() : footerHtml();
    }

    loadGrowthScript();
    applyCtaLabels(file);
    applyDevStageBadge();
    applyToolNamingFromRegistry();
    recordRecentTool(file);
  }

  /** Hub IA: recentTools に tool id のみ（入力内容は保存しない） */
  function recordRecentTool(file) {
    const id = String(file || '')
      .replace(/^.*\//, '')
      .replace(/\.html$/i, '');
    if (!id || id === 'hub' || id.indexOf('sync-') === 0) return;
    const support = {
      updates: 1,
      roadmap: 1,
      statements: 1,
      privacy: 1,
      terms: 1,
      disclaimer: 1,
      'not-a-car': 1,
      guides: 1,
      contact: 1,
    };
    if (support[id]) return;
    try {
      if (global.SUGUDASU_HUB_IA && typeof global.SUGUDASU_HUB_IA.pushRecent === 'function') {
        global.SUGUDASU_HUB_IA.pushRecent(id);
      } else {
        const key = 'recentTools';
        const raw = localStorage.getItem(key);
        let list = [];
        if (raw) {
          try {
            list = JSON.parse(raw);
          } catch (_) {
            list = [];
          }
        }
        if (!Array.isArray(list)) list = [];
        list = list.filter((x) => x !== id);
        list.unshift(id);
        localStorage.setItem(key, JSON.stringify(list.slice(0, 8)));
      }
      trackGaEvent('product_opened', { tool_id: id });
    } catch (_) {
      /* noop */
    }
  }

  /** #sg-chrome-top の data-sg-* から同期マウント（inline mount 不要 · defer 事故防止） */
  function readMountOptsFromDom() {
    const top = document.getElementById('sg-chrome-top');
    if (!top) return null;
    const title = top.getAttribute('data-sg-title');
    if (!title) return null;
    return {
      title,
      subtitle: top.getAttribute('data-sg-subtitle') || '',
      print: top.getAttribute('data-sg-print') === 'true',
      landscape: top.getAttribute('data-sg-landscape') === 'true',
      chromeMode: top.getAttribute('data-sg-chrome-mode') === 'focus' ? 'focus' : 'default',
      navMode: (function () {
        const n = top.getAttribute('data-sg-nav');
        if (n === 'hub' || n === 'product' || n === 'site') return n;
        return undefined;
      })(),
    };
  }

  function syncDocClusterPill(segment) {
    const pill = segment.querySelector('.sg-segment__pill');
    if (!pill) return;
    const active =
      segment.querySelector('.sg-segment__btn[aria-current="page"]') ||
      segment.querySelector('.sg-segment__btn[aria-selected="true"]');
    if (!active) return;
    segment.querySelectorAll('.sg-segment__btn').forEach((btn) => {
      btn.setAttribute('aria-selected', btn === active ? 'true' : 'false');
    });
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  function initDocClusterNav() {
    document.querySelectorAll('.sg-doc-cluster').forEach((segment) => {
      const sync = () => syncDocClusterPill(segment);
      sync();
      global.requestAnimationFrame(sync);
      global.addEventListener('resize', sync, { passive: true });
    });
  }

  function initPrivacyBadges() {
    document.querySelectorAll('[data-sg-privacy-badge]').forEach((el) => {
      const subject = String(el.getAttribute('data-subject') || '入力内容').trim() || '入力内容';
      const extra = String(el.getAttribute('data-extra') || '').trim();
      let text = subject + 'はサーバーに送信しません';
      if (extra) text += ' · ' + extra;
      el.textContent = text;
    });
  }

  function bootstrapChromeFromDom() {
    const opts = readMountOptsFromDom();
    if (opts) mount(opts);
    initDocClusterNav();
    initPrivacyBadges();
  }

  function loadGa4() {
    if (!GA4_MEASUREMENT_ID) return;
    const host = String(global.location && global.location.hostname || '');
    if (host === 'localhost' || host === '127.0.0.1') return;
    if (global.gtag || document.querySelector('script[data-sg-ga4-lib]')) return;

    global.dataLayer = global.dataLayer || [];
    global.gtag = function gtag() {
      global.dataLayer.push(arguments);
    };
    global.gtag('js', new Date());
    global.gtag('config', GA4_MEASUREMENT_ID);

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_MEASUREMENT_ID);
    s.setAttribute('data-sg-ga4-lib', '1');
    document.head.appendChild(s);
  }

  function trackGaEvent(name, params) {
    if (!name || typeof global.gtag !== 'function') return;
    try {
      global.gtag('event', name, Object.assign({
        event_source: 'sugudasu_shell',
      }, params || {}));
    } catch (_) {
      // noop: tracking failure should never block UI
    }
  }

  function loadGrowthScript() {
    if (global.SUGUDASU_GROWTH) {
      global.SUGUDASU_GROWTH.init();
      return;
    }
    const existing = document.querySelector('script[data-sg-growth]');
    if (existing) return;
    const s = document.createElement('script');
    s.src = assetUrl('sugudasu-growth.js');
    s.async = true;
    s.setAttribute('data-sg-growth', '1');
    s.onload = function () {
      if (global.SUGUDASU_GROWTH) global.SUGUDASU_GROWTH.init();
    };
    document.head.appendChild(s);
  }

  let ctaConfigCache = null;
  let toolRegistryCache = null;

  const DEV_STAGES = {
    // Phase2: 一般向け文言のみ（版数・Backlog・内部ステージ名は出さない）
    alpha: {
      label: '新しい機能を試験公開しています',
      cssClass: 'sg-dev-stage--alpha',
      hint: '試験公開中の機能です。フィードバックを歓迎します。',
    },
    beta: {
      label: '試験公開中です',
      cssClass: 'sg-dev-stage--beta',
      hint: '主要機能は使えます。仕様が変わる場合があります。',
    },
    gamma: {
      label: '新しい機能を試験公開しています',
      cssClass: 'sg-dev-stage--gamma',
      hint: '試験公開中の機能です。',
    },
    stable: { label: '', cssClass: 'sg-dev-stage--stable', hint: '' },
  };

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDevStageBadgeHtml(stage, opts) {
    void opts;
    const meta = DEV_STAGES[stage] || DEV_STAGES.stable;
    if (!meta.label) return '';
    // DECISION: version / statusNote（Backlog等）は一般UIに出さない
    return `<span class="sg-dev-stage ${meta.cssClass}" title="${escapeHtml(meta.hint)}">${escapeHtml(meta.label)}</span>`;
  }

  function formatToolVersionLabel(stage, version) {
    void version;
    // DECISION: 一般UIに版数・内部ステージ名を出さない
    const meta = DEV_STAGES[stage] || DEV_STAGES.stable;
    return meta.label || '公開中';
  }

  async function loadToolRegistry() {
    if (toolRegistryCache) return toolRegistryCache;
    try {
      const res = await fetch(dataUrl('tool-registry.json'), { cache: 'no-store' });
      if (!res.ok) return null;
      toolRegistryCache = await res.json();
      return toolRegistryCache;
    } catch {
      return null;
    }
  }

  function getToolMeta(toolId) {
    if (!toolId || !toolRegistryCache) return null;
    return toolRegistryCache.tools && toolRegistryCache.tools[toolId] || null;
  }

  function toolIdFromDom() {
    const top = document.getElementById('sg-chrome-top');
    const explicit = top && top.getAttribute('data-sg-tool-id');
    if (explicit) return explicit;
    const file = currentFile();
    if (file === 'index.html' || file === 'hub.html') return 'hub';
    return file.replace(/\.html$/, '');
  }

  async function applyToolNamingFromRegistry() {
    const registry = await loadToolRegistry();
    if (!registry) return;
    const toolId = toolIdFromDom();
    const tool = getToolMeta(toolId);
    // Phase2: ヘッダーはサイトナビ固定。ツール横並びを registry から再注入しない。

    if (tool && tool.productName) {
      const titleEl = document.querySelector('.sg-site-header__pagetitle');
      const top = document.getElementById('sg-chrome-top');
      // Hub はページタイトル帯なし。Product のみ productName を淡く表示。
      if (titleEl && top && top.getAttribute('data-sg-tool-id') && toolId !== 'hub') {
        titleEl.textContent = tool.productName;
      }
    }
  }

  async function applyDevStageBadge() {
    const top = document.getElementById('sg-chrome-top');
    if (!top) return;
    // Hub 公開 UI から開発ステージ帯を外す
    const navAttr = top.getAttribute('data-sg-nav');
    if (navAttr === 'hub' || navAttr === 'site' || toolIdFromDom() === 'hub') return;
    const registry = await loadToolRegistry();
    if (!registry) return;
    const toolId = toolIdFromDom();
    const tool = getToolMeta(toolId);
    if (!tool || tool.devBadge === false) return;

    const badge = formatDevStageBadgeHtml(tool.stage, {
      version: tool.version,
      title: tool.name,
      statusNote: tool.statusNote,
    });

    // focus モードは帯バナーを出さず、コンパクトヘッダ内にバッジのみ（当日の縦スペース確保）
    if (top.getAttribute('data-sg-chrome-mode') === 'focus') {
      const slot = document.querySelector('[data-sg-focus-badge]');
      if (slot) slot.innerHTML = badge;
      const bar = document.getElementById('sg-dev-badge-bar');
      if (bar) bar.hidden = true;
      return;
    }

    let bar = document.getElementById('sg-dev-badge-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'sg-dev-badge-bar';
      bar.className = 'no-print sg-dev-badge-bar';
      top.insertAdjacentElement('afterend', bar);
    }

    bar.innerHTML = badge;
    bar.hidden = !badge;
  }

  async function loadCtaConfig() {
    if (ctaConfigCache) return ctaConfigCache;
    try {
      const res = await fetch(dataUrl('cta.json'), { cache: 'no-store' });
      if (!res.ok) return null;
      ctaConfigCache = await res.json();
      return ctaConfigCache;
    } catch {
      return null;
    }
  }

  async function applyCtaLabels(file) {
    const cfg = await loadCtaConfig();
    if (!cfg || !cfg.pages) return;
    const pageId = String(file || '').replace(/\.html$/, '');
    const page = cfg.pages[pageId];
    if (!page || !Array.isArray(page.items)) return;
    page.items.forEach((item) => {
      if (!item || !item.selector) return;
      const targets = document.querySelectorAll(item.selector);
      if (!targets.length) return;
      targets.forEach((el) => {
        if (item.text) el.textContent = item.text;
        if (el.dataset.sgCtaTracked) return;
        el.dataset.sgCtaTracked = '1';
        el.addEventListener('click', () => {
          trackGaEvent('sg_cta_click', {
            page_id: pageId,
            page_path: global.location.pathname || '',
            cta_selector: item.selector,
            cta_label: item.label || item.text || el.textContent || '',
          });
        });
      });
    });
  }

  global.SUGUDASU_SHELL = {
    mount,
    bootstrapChromeFromDom,
    initPrivacyBadges,
    TOOLS,
    navItemsFromRegistry,
    assetUrl,
    dataUrl,
    pageHref,
    logoHtml,
    trackGaEvent,
    getToolMeta,
    formatToolVersionLabel,
    loadToolRegistry,
  };

  bootstrapChromeFromDom();
})(window);
