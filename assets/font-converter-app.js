import { sgCopy, DEFAULT_PREVIEW, SAMPLE_TEXTS, convertWithStyle, filterStyles, loadFontStyles, loadSymbolCatalog, loadHiraganaDecor, escHtml, STYLE_BADGES } from './sns-app.js';

const inputEl = document.getElementById('fc-input');
const listEl = document.getElementById('fc-font-list');
const countEl = document.getElementById('fc-result-count');
const miniRoot = document.getElementById('fc-mini-symbols');
const sampleRoot = document.getElementById('fc-sample-texts');
const symbolRoot = document.getElementById('fc-symbol-catalog');
const hiraRoot = document.getElementById('fc-hiragana-grid');
const filterRoot = document.getElementById('fc-filters');
const toastEl = document.getElementById('copy-toast-fc');

let fontStyles = [];
let symbolCatalog = { miniSymbols: [], groups: [] };
let hiraganaDecor = null;
let activeFilter = 'all';

async function copyText(text, btn, options = {}) {
  await sgCopy(text, btn, { toastEl, toastPrefix: 'コピー', ...options });
}

function insertSymbol(symbol) {
  const base = inputEl.value.trim();
  inputEl.value = base ? `${base} ${symbol}` : symbol;
  inputEl.focus();
  const end = inputEl.value.length;
  inputEl.setSelectionRange(end, end);
  renderFonts();
}

function renderSampleTexts() {
  if (!sampleRoot) return;
  sampleRoot.innerHTML = SAMPLE_TEXTS.map((s, i) =>
    `<button type="button" class="fc-sample-chip" data-sample-idx="${i}">${escHtml(s.label)}</button>`
  ).join('');
  sampleRoot.querySelectorAll('.fc-sample-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sample = SAMPLE_TEXTS[Number(btn.getAttribute('data-sample-idx'))];
      if (!sample) return;
      inputEl.value = sample.text;
      inputEl.focus();
      renderFonts();
    });
  });
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
    btn.addEventListener('click', async () => {
      await copyText(btn.getAttribute('data-sym'), btn, { buttonFeedback: false });
      btn.classList.add('fc-symbol-chip--copied');
      setTimeout(() => btn.classList.remove('fc-symbol-chip--copied'), 900);
    });
  });
}

function renderHiraganaGrid() {
  if (!hiraRoot || !hiraganaDecor?.rows?.length) return;
  const map = hiraganaDecor.map || {};
  hiraRoot.innerHTML = hiraganaDecor.rows.map((row) => {
    const cells = row.map((kana) => {
      const decor = map[kana] || kana;
      return `
        <button type="button" class="fc-hiragana-cell" data-char="${escHtml(decor)}" title="${escHtml(kana)} → コピー">
          <span class="fc-hiragana-cell__kana">${escHtml(kana)}</span>
          <span class="fc-hiragana-cell__decor">${escHtml(decor)}</span>
        </button>`;
    }).join('');
    return `<div class="fc-hiragana-row">${cells}</div>`;
  }).join('');

  hiraRoot.querySelectorAll('.fc-hiragana-cell').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await copyText(btn.getAttribute('data-char'), btn, { buttonFeedback: false });
      btn.classList.add('fc-hiragana-cell--copied');
      setTimeout(() => btn.classList.remove('fc-hiragana-cell--copied'), 900);
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
          <div class="fc-font-card__preview sg-deco-text">${escHtml(converted)}</div>
        </div>
        <button type="button" class="fc-font-card__copy">コピー</button>
      </article>`;
  }).join('');

  listEl.querySelectorAll('.fc-font-card__copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.fc-font-card');
      const preview = card?.querySelector('.fc-font-card__preview')?.textContent || '';
      await copyText(preview, btn);
    });
  });

  if (countEl) countEl.textContent = `${visible.length} 種類`;
}

async function init() {
  try {
    [fontStyles, symbolCatalog, hiraganaDecor] = await Promise.all([
      loadFontStyles(),
      loadSymbolCatalog(),
      loadHiraganaDecor(),
    ]);
  } catch (err) {
    if (listEl) listEl.innerHTML = `<p class="text-xs text-red-600">フォント定義の読み込みに失敗しました。</p>`;
    console.error(err);
    return;
  }

  renderFilters();
  renderSampleTexts();
  renderMiniSymbols();
  renderSymbolCatalog();
  renderHiraganaGrid();
  renderFonts();

  inputEl.addEventListener('input', renderFonts);
  document.getElementById('fc-clear')?.addEventListener('click', () => {
    inputEl.value = '';
    renderFonts();
  });
}

init();
