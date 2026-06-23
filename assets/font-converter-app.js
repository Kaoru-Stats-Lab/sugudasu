import {
  STYLE_BADGES,
  DEFAULT_PREVIEW,
  convertWithStyle,
  filterStyles,
  loadFontStyles,
  loadSymbolCatalog,
  escHtml,
} from './sns-font-engine.js';

const inputEl = document.getElementById('fc-input');
const listEl = document.getElementById('fc-font-list');
const countEl = document.getElementById('fc-result-count');
const miniRoot = document.getElementById('fc-mini-symbols');
const symbolRoot = document.getElementById('fc-symbol-catalog');
const filterRoot = document.getElementById('fc-filters');
const toastEl = document.getElementById('copy-toast-fc');

let fontStyles = [];
let symbolCatalog = { miniSymbols: [], groups: [] };
let activeFilter = 'all';

async function copyText(text, btn) {
  if (window.SG_COPY_FEEDBACK && btn) {
    try {
      await window.SG_COPY_FEEDBACK.copyWithFeedback(text, btn, {
        toastEl,
        toastPrefix: 'コピー',
        copiedLabel: '済',
        lineCount: window.SG_COPY_FEEDBACK.countLines(text),
        previewLine: text.split('\n')[0],
      });
      return;
    } catch { /* fallback */ }
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  if (btn) {
    const prev = btn.textContent;
    btn.textContent = '済';
    setTimeout(() => { btn.textContent = prev; }, 1600);
  }
}

function insertSymbol(symbol) {
  const base = inputEl.value.trim();
  inputEl.value = base ? `${base} ${symbol}` : symbol;
  inputEl.focus();
  const end = inputEl.value.length;
  inputEl.setSelectionRange(end, end);
  renderFonts();
}

function renderMiniSymbols() {
  if (!miniRoot) return;
  const items = symbolCatalog.miniSymbols?.length
    ? symbolCatalog.miniSymbols
    : ['♡', '୨୧', '⌇', 'ꕀ', '✦', '☾'];
  miniRoot.innerHTML = items.map((sym) =>
    `<button type="button" class="fc-mini-symbol" data-sym="${escHtml(sym)}" title="入力欄に追加">${escHtml(sym)}</button>`
  ).join('');
  miniRoot.querySelectorAll('.fc-mini-symbol').forEach((btn) => {
    btn.addEventListener('click', () => insertSymbol(btn.getAttribute('data-sym')));
  });
}

function renderSymbolCatalog() {
  if (!symbolRoot || !symbolCatalog.groups?.length) return;
  symbolRoot.innerHTML = symbolCatalog.groups.map((group, gi) => `
    <details class="fc-symbol-section"${gi === 0 ? ' open' : ''}>
      <summary>${escHtml(group.label)} <span class="text-[10px] font-normal text-slate-400">${group.symbols.length}件</span></summary>
      <div class="fc-symbol-grid">
        ${group.symbols.map((sym) =>
          `<button type="button" class="fc-symbol-chip" data-sym="${escHtml(sym)}" title="コピー">${escHtml(sym)}</button>`
        ).join('')}
      </div>
    </details>
  `).join('');

  symbolRoot.querySelectorAll('.fc-symbol-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      copyText(btn.getAttribute('data-sym'), btn);
      btn.classList.add('fc-symbol-chip--copied');
      setTimeout(() => btn.classList.remove('fc-symbol-chip--copied'), 800);
    });
  });
}

function renderFilters() {
  if (!filterRoot) return;
  const defs = [
    { id: 'all', label: 'すべて' },
    { id: 'featured', label: '定番' },
    { id: 'latin', label: '英数字' },
    { id: 'japanese', label: '日本語' },
  ];
  filterRoot.innerHTML = defs.map((d) =>
    `<button type="button" class="fc-filter-btn${activeFilter === d.id ? ' fc-filter-btn--active' : ''}" data-filter="${d.id}">${d.label}</button>`
  ).join('');
  filterRoot.querySelectorAll('.fc-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.getAttribute('data-filter') || 'all';
      renderFilters();
      renderFonts();
    });
  });
}

function renderFonts() {
  if (!listEl || !fontStyles.length) return;
  const raw = inputEl.value.trim();
  const source = raw || DEFAULT_PREVIEW;
  const visible = filterStyles(fontStyles, activeFilter);

  listEl.innerHTML = visible.map((style, index) => {
    const converted = convertWithStyle(source, style);
    const pill = STYLE_BADGES[style.key] || 'おすすめ';
    const featured = activeFilter === 'all' && index < 3 ? ' fc-font-card--featured' : '';
    return `
      <article class="fc-font-card${featured}">
        <div class="fc-font-card__info">
          <div class="fc-font-card__meta">
            <span class="fc-font-card__label">${escHtml(style.name)}</span>
            <span class="fc-font-card__pill">${escHtml(pill)}</span>
          </div>
          <div class="fc-font-card__preview">${escHtml(converted)}</div>
        </div>
        <button type="button" class="fc-font-card__copy">コピー</button>
      </article>`;
  }).join('');

  listEl.querySelectorAll('.fc-font-card__copy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.fc-font-card');
      const preview = card?.querySelector('.fc-font-card__preview')?.textContent || '';
      copyText(preview, btn);
    });
  });

  if (countEl) countEl.textContent = `${visible.length} 種類`;
}

async function init() {
  try {
    [fontStyles, symbolCatalog] = await Promise.all([
      loadFontStyles(),
      loadSymbolCatalog(),
    ]);
  } catch (err) {
    if (listEl) listEl.innerHTML = `<p class="text-xs text-red-600">フォント定義の読み込みに失敗しました。</p>`;
    console.error(err);
    return;
  }

  renderFilters();
  renderMiniSymbols();
  renderSymbolCatalog();
  renderFonts();

  inputEl.addEventListener('input', renderFonts);
  document.getElementById('fc-clear')?.addEventListener('click', () => {
    inputEl.value = '';
    renderFonts();
  });
}

init();
