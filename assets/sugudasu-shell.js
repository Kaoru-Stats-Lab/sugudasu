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
    { id: 'search-query', file: 'search-query.html', label: '検索式', icon: '🔍' },
    { id: 'table-conv', file: 'table-conv.html', label: '表変換', icon: '📊' },
    { id: 'webp-to-jpg', file: 'webp-to-jpg.html', label: 'WebP→JPG', icon: '🖼️' },
    { id: 'video-frame', file: 'video-frame.html', label: '動画コマ抜き', icon: '🎬' },
    { id: 'mask', file: 'mask.html', label: 'マスク', icon: '🛡️' },
    { id: 'image-trim', file: 'image-trim.html', label: '画像切り出し', icon: '✂️' },
    { id: 'watermark', file: 'watermark.html', label: '透かし', icon: '💧' },
    { id: 'pdf-images', file: 'pdf-images.html', label: 'PDF画像', icon: '📄' },
    { id: 'test-data', file: 'test-data.html', label: 'テストデータ', icon: '🧪' },
    { id: 'group-split', file: 'group-split.html', label: '班分け', icon: '👥' },
    { id: 'match-board', file: 'match-board.html', label: 'ドラフト', icon: '🧩' },
    { id: 'planning-poker', file: 'planning-poker.html', label: '見積会議', icon: '🃏' },
    { id: 'timeline', file: 'timeline.html', label: '進行', icon: '⏱️' },
    { id: 'present', file: 'present.html', label: 'ギフト', icon: '🎁' },
    { id: 'fair-draw', file: 'fair-draw.html', label: '抽選', icon: '🎲' },
    { id: 'warikan', file: 'warikan.html', label: '割り勘', icon: '💰' },
    { id: 'sns', file: 'sns.html', label: 'SNS', icon: '✨' },
    { id: 'link-qr', file: 'link-qr.html', label: 'リンクQR', icon: '📇' },
    { id: 'qr-reader', file: 'qr-reader.html', label: 'QR読取', icon: '📷' },
    { id: 'diff', file: 'diff.html', label: '差分', icon: '🔎' },
    { id: 'time-calc', file: 'time-calc.html', label: '時給計算', icon: '⏳' }
  ];

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
    const link = document.querySelector('link[href*="sugudasu.css"]');
    const href = link && link.getAttribute('href');
    if (href && href.startsWith('/')) return 'index.html';
    return 'hub.html';
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
    const items = navItems || TOOLS;
    return `<nav class="no-print bg-slate-800 border-b border-slate-700" aria-label="SUGUDASU ツール">
      <div class="sg-section-shell">
        <ul class="sg-nav-list py-1.5 text-[11px] font-semibold">
          ${items.map(t => {
            const active = t.file === activeFile;
            const icon = t.icon ? `<span class="sg-nav-icon" aria-hidden="true">${t.icon}</span>` : '';
            return `<li class="sg-nav-item"><a href="${t.file}" ${active ? 'aria-current="page"' : ''} class="sg-nav-link block px-2 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }">${icon}<span class="sg-nav-label">${escapeHtml(t.label)}</span></a></li>`;
          }).join('')}
        </ul>
      </div>
    </nav>`;
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
    const printBtn = showPrint
      ? `<button type="button" id="sg-btn-print" onclick="window.print()" class="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">印刷 / PDF</button>`
      : '';
    const pageTitleBlock = title && title !== 'SUGUDASU'
      ? `<div class="sg-site-header__pagetitle-wrap min-w-0 border-l border-slate-200 pl-3">
            <p class="sg-site-header__pagetitle">${escapeHtml(title)}</p>
            ${subtitle ? `<p class="sg-site-header__pagesub">${escapeHtml(subtitle)}</p>` : ''}
          </div>`
      : '';
    return `<header class="sg-site-header">
      <div class="sg-site-header__brand bg-white border-b border-slate-200">
        <div class="sg-site-header__inner flex min-h-14 max-w-7xl mx-auto px-4 items-center justify-between gap-3">
          <div class="sg-site-header__left flex items-center gap-3 min-w-0 flex-1">
            ${logoHtml()}
            ${pageTitleBlock}
          </div>
          ${printBtn}
        </div>
      </div>
    </header>`;
  }

  function focusHeaderHtml(title, subtitle, showPrint) {
    // 当日進行はナビ16本より「今の表」が主役 — 提督判断 · timeline focus モード（§ TIMELINE_TOOL_SPEC §7-1）
    const printBtn = showPrint
      ? `<button type="button" id="sg-btn-print" onclick="window.print()" class="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors">印刷</button>`
      : '';
    const shortTitle = subtitle || title.replace(/^SUGUDASU\s+/, '') || '進行';
    return `<header class="sg-site-header sg-site-header--focus">
      <div class="sg-site-header__inner flex min-h-11 max-w-7xl mx-auto px-3 sm:px-4 items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <a href="${homeHref()}" class="shrink-0 text-[11px] font-bold text-slate-500 hover:text-slate-800 no-underline" aria-label="ツール一覧へ">一覧</a>
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
        <a href="privacy.html" class="hover:underline">プライバシー</a>
        <span aria-hidden="true">·</span>
        <span>ブラウザ内完結</span>
      </div>
    </footer>`;
  }

  function chromeHtml(title, showPrint, activeFile, subtitle, navItems) {
    return `<div class="sg-chrome no-print sticky top-0 z-50 w-full bg-white">${headerHtml(title, showPrint, subtitle)}${navHtml(activeFile, navItems)}</div>`;
  }

  function footerHtml() {
    return `<footer class="no-print border-t border-slate-200 bg-white py-6 mt-auto">
      <div class="sg-section-shell text-center space-y-2">
        <p class="text-xs text-slate-500">ブラウザ内完結 · 名簿を預けない設計を中心に</p>
        <p class="text-[11px] text-slate-500">
          <a href="guides.html" class="text-blue-600 hover:underline">実務ガイド</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="contact.html" class="text-blue-600 hover:underline">問い合わせ</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="updates.html" class="text-blue-600 hover:underline">更新履歴</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="roadmap.html" class="text-blue-600 hover:underline">開発ロードマップ</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="statements.html" class="text-blue-600 hover:underline">SUGUDASU の約束</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="privacy.html" class="text-blue-600 hover:underline">プライバシーポリシー</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="terms.html" class="text-blue-600 hover:underline">利用規約</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="disclaimer.html" class="text-blue-600 hover:underline">免責事項</a>
        </p>
        <p>
          <a href="https://x.com/sugudasu" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 transition-colors" aria-label="SUGUDASU公式X（@sugudasu）">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>@sugudasu</span>
          </a>
        </p>
        <p class="text-[10px] text-slate-400">
          SUGUDASUはビジネスツールです。
          <a href="not-a-car.html" class="underline hover:text-slate-600">SUBARUの中古車「SUGDAS」とは別サービス</a>
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
        top.innerHTML = chromeHtml(title, showPrint, file, subtitle);
      }
    }
    if (bottom && !bottom.innerHTML.trim()) {
      bottom.innerHTML = chromeMode === 'focus' ? focusFooterHtml() : footerHtml();
    }

    loadGrowthScript();
    applyCtaLabels(file);
    applyDevStageBadge();
    applyToolNamingFromRegistry();
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
    alpha: { label: 'アルファ版', cssClass: 'sg-dev-stage--alpha', hint: '骨格確認中。欠落・不具合があり得ます。' },
    beta: { label: 'ベータ版', cssClass: 'sg-dev-stage--beta', hint: '主要機能は動作。品質担保・仕様変更が残ります。' },
    gamma: { label: 'ガンマ版', cssClass: 'sg-dev-stage--gamma', hint: 'リリース候補。細部調整が残る場合あり。' },
    stable: { label: '安定版', cssClass: 'sg-dev-stage--stable', hint: '安定運用。大きな変更は changelog で告知。' },
  };

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDevStageBadgeHtml(stage, opts) {
    const meta = DEV_STAGES[stage] || DEV_STAGES.stable;
    if (!meta.label) return '';
    const ver = opts.version ? ` v${opts.version}` : '';
    const title = opts.title ? `${opts.title} — ` : '';
    const note = opts.statusNote ? ` · ${opts.statusNote}` : '';
    return `<span class="sg-dev-stage ${meta.cssClass}" title="${title}${meta.hint}${note}">${meta.label}${ver}</span>`;
  }

  function formatToolVersionLabel(stage, version) {
    const meta = DEV_STAGES[stage] || DEV_STAGES.stable;
    return `${meta.label} v${version}`;
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
    const file = currentFile();

    const navItems = navItemsFromRegistry(registry);
    const nav = document.querySelector('.sg-nav-list');
    if (nav) {
      nav.innerHTML = navItems.map(t => {
        const active = t.file === file;
        const icon = t.icon ? `<span class="sg-nav-icon" aria-hidden="true">${t.icon}</span>` : '';
        return `<li class="sg-nav-item"><a href="${t.file}" ${active ? 'aria-current="page"' : ''} class="sg-nav-link block px-2 py-1.5 rounded-md whitespace-nowrap transition-colors ${
          active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }">${icon}<span class="sg-nav-label">${escapeHtml(t.label)}</span></a></li>`;
      }).join('');
    }

    if (tool && tool.productName) {
      const titleEl = document.querySelector('.sg-site-header__pagetitle');
      const top = document.getElementById('sg-chrome-top');
      if (titleEl && top && top.getAttribute('data-sg-tool-id')) {
        titleEl.textContent = tool.productName;
      }
    }
  }

  async function applyDevStageBadge() {
    const top = document.getElementById('sg-chrome-top');
    if (!top) return;
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

    const note = tool.statusNote
      ? `<span class="sg-dev-badge-note">${escapeHtml(tool.statusNote)}</span>`
      : '';
    bar.innerHTML = badge + note;
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
    logoHtml,
    trackGaEvent,
    getToolMeta,
    formatToolVersionLabel,
    loadToolRegistry,
  };

  bootstrapChromeFromDom();
})(window);
