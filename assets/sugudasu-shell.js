/**
 * SUGUDASU shared chrome — header · 8ツール+一覧ナビ · footer
 * docs/DESIGN_GUIDELINE.md §3.1, §7
 */
(function (global) {
  const TOOLS = [
    { id: 'hub', file: 'hub.html', label: '一覧', icon: '🏠' },
    { id: 'invoice', file: 'invoice.html', label: '請求書', icon: '📄' },
    { id: 'label', file: 'label.html', label: 'ラベル', icon: '🏷️' },
    { id: 'shift', file: 'shift.html', label: 'シフト', icon: '📅' },
    { id: 'report', file: 'report.html', label: '議事録', icon: '📝' },
    { id: 'reverse', file: 'reverse.html', label: '逆引き', icon: '📖' },
    { id: 'present', file: 'present.html', label: 'ギフト', icon: '🎁' },
    { id: 'warikan', file: 'warikan.html', label: '割り勘', icon: '💰' },
    { id: 'sns', file: 'sns.html', label: 'SNS', icon: '✨' }
  ];

  /** 開発(tools/) と本番(dist/) 両対応 */
  function assetUrl(path) {
    const link = document.querySelector('link[href*="sugudasu.css"]');
    if (link && link.getAttribute('href')) {
      const href = link.getAttribute('href');
      const base = href.replace(/sugudasu\.css.*$/, '');
      return base + path;
    }
    return '../assets/' + path;
  }

  function currentFile() {
    let seg = (global.location.pathname || '').split('/').filter(Boolean).pop() || '';
    if (!seg || seg === 'index.html') return 'hub.html';
    if (!seg.endsWith('.html')) seg += '.html';
    return seg;
  }

  function navHtml(activeFile) {
    return `<nav class="no-print bg-slate-800 border-b border-slate-700" aria-label="SUGUDASU ツール">
      <div class="max-w-7xl mx-auto px-2 sm:px-4 overflow-x-auto">
        <ul class="flex gap-1 py-1.5 min-w-max text-[11px] font-semibold">
          ${TOOLS.map(t => {
            const active = t.file === activeFile;
            const icon = t.icon ? `<span class="sg-nav-icon" aria-hidden="true">${t.icon}</span>` : '';
            return `<li><a href="${t.file}" class="sg-nav-link block px-2 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }">${icon}<span class="sg-nav-label">${t.label}</span></a></li>`;
          }).join('')}
        </ul>
      </div>
    </nav>`;
  }

  function headerHtml(title, showPrint) {
    const printBtn = showPrint
      ? `<button type="button" onclick="window.print()" class="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">印刷 / PDF</button>`
      : '';
    return `<header class="no-print bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] text-slate-400 tracking-wide"><a href="hub.html" class="hover:text-white">SUGUDASU</a></p>
          <h1 class="text-sm font-bold truncate">${title}</h1>
        </div>
        ${printBtn}
      </div>
    </header>`;
  }

  function footerHtml() {
    return `<footer class="no-print border-t border-slate-200 bg-white py-6 mt-auto">
      <div class="max-w-7xl mx-auto px-4 text-center space-y-2">
        <p class="text-xs text-slate-500">ブラウザ内完結 · データは外部に送信しません</p>
        <p class="text-[11px] text-slate-500">
          <a href="privacy.html" class="text-blue-600 hover:underline">プライバシーポリシー</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="terms.html" class="text-blue-600 hover:underline">利用規約</a>
          <span class="text-slate-300 mx-1">|</span>
          <a href="disclaimer.html" class="text-blue-600 hover:underline">免責事項</a>
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
    const file = currentFile();
    const top = document.getElementById('sg-chrome-top');
    const bottom = document.getElementById('sg-chrome-bottom');

    if (landscape) {
      document.body.classList.add('sg-print-landscape');
    }

    if (top) {
      top.innerHTML = headerHtml(title, showPrint) + navHtml(file);
    }
    if (bottom) {
      bottom.innerHTML = footerHtml();
    }
  }

  global.SUGUDASU_SHELL = { mount, TOOLS, assetUrl };
})(window);
