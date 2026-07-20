/**
 * json-view — 貼る · 見る · 探す · 持ち帰る
 * V1: 仮想スクロールなし · 常時コピーボタンなし
 */
import {
  allContainerPaths,
  arrayCapNotice,
  collectSearchMatches,
  expandPathsForSegments,
  flattenVisible,
  formatPreview,
  getValueType,
  parseJson,
  pathToBreadcrumb,
  toJsonPath,
  typeLabel,
  valueForCopy,
} from './json-view-engine.js';

/** @typedef {import('./json-view-engine.js').TreeRow} TreeRow */
/** @typedef {import('./json-view-engine.js').SearchMatch} SearchMatch */

const els = {
  input: /** @type {HTMLTextAreaElement|null} */ (document.getElementById('jv-input')),
  parseBtn: document.getElementById('jv-parse'),
  status: document.getElementById('jv-status'),
  pathBar: document.getElementById('jv-path'),
  pathHint: document.getElementById('jv-path-hint'),
  search: /** @type {HTMLInputElement|null} */ (document.getElementById('jv-search')),
  searchMeta: document.getElementById('jv-search-meta'),
  searchNext: document.getElementById('jv-search-next'),
  expandAll: document.getElementById('jv-expand-all'),
  collapseAll: document.getElementById('jv-collapse-all'),
  tree: document.getElementById('jv-tree'),
  copyStatus: document.getElementById('jv-copy-status'),
  toast: document.getElementById('jv-toast'),
};

/** @type {unknown|null} */
let rootValue = null;
/** @type {Set<string>} */
let expandedPaths = new Set(['']);
/** @type {TreeRow[]} */
let visibleRows = [];
/** @type {SearchMatch[]} */
let matches = [];
let matchIndex = -1;
let matchQuery = '';
/** @type {string|null} */
let focusedPath = null;
/** @type {Array<string|number>|null} */
let activeSegments = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let pasteTimer = null;

function setStatus(text, isError = false) {
  if (!els.status) return;
  els.status.textContent = text;
  els.status.classList.toggle('text-rose-700', isError);
  els.status.classList.toggle('text-slate-600', !isError);
}

/** @type {ReturnType<typeof setTimeout>|null} */
let toastTimer = null;

/**
 * @param {string} text
 * @param {boolean} [isError]
 */
function showToast(text, isError = false) {
  if (!els.toast) {
    setCopyStatus(text);
    return;
  }
  els.toast.textContent = text;
  els.toast.classList.toggle('jv-toast--error', isError);
  els.toast.classList.add('jv-toast--show');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    els.toast?.classList.remove('jv-toast--show');
  }, 800);
  setCopyStatus(text);
}

/**
 * @param {string} text
 */
function setCopyStatus(text) {
  if (!els.copyStatus) return;
  els.copyStatus.textContent = text || '';
  if (text) {
    window.setTimeout(() => {
      if (els.copyStatus && els.copyStatus.textContent === text) {
        els.copyStatus.textContent = '';
      }
    }, 800);
  }
}

/**
 * @param {string} text
 */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('✓ コピーしました');
  } catch {
    showToast('コピーできませんでした', true);
  }
}

/**
 * @param {string} text
 */
function setSearchMeta(text) {
  if (!els.searchMeta) return;
  els.searchMeta.textContent = text;
  els.searchMeta.classList.toggle('hidden', !text);
}

function updatePathBar() {
  if (!els.pathBar) return;
  if (!activeSegments) {
    els.pathBar.textContent = '場所を表示 — 行にマウスを乗せるとここに出ます';
    els.pathBar.classList.add('jv-path--empty');
    els.pathBar.removeAttribute('title');
    return;
  }
  const human = pathToBreadcrumb(activeSegments);
  const machine = toJsonPath(activeSegments);
  els.pathBar.textContent = human;
  els.pathBar.classList.remove('jv-path--empty');
  els.pathBar.title = `クリックで場所をコピー: ${machine}`;
}

function resetSearchState() {
  matches = [];
  matchIndex = -1;
  matchQuery = '';
  focusedPath = null;
  setSearchMeta('');
}

function rebuildRows() {
  if (rootValue == null) {
    visibleRows = [];
    return;
  }
  const q = els.search?.value || '';
  visibleRows = flattenVisible(rootValue, expandedPaths, q);
}

function renderTree() {
  if (!els.tree) return;
  if (rootValue == null) {
    els.tree.innerHTML = '<p class="jv-empty">左に JSON を貼ると、ここに構造が出ます。</p>';
    return;
  }

  rebuildRows();
  const rows = visibleRows;
  if (!rows.length) {
    els.tree.innerHTML = '<p class="jv-empty">表示する項目がありません。</p>';
    return;
  }

  els.tree.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const row of rows) frag.appendChild(renderRow(row));
  els.tree.appendChild(frag);
}

/**
 * @param {TreeRow} row
 */
function renderRow(row) {
  const el = document.createElement('div');
  el.className = `jv-row${row.match ? ' jv-row--match' : ''}`;
  if (row.isNotice) el.classList.add('jv-row--notice');
  if (focusedPath && row.path === focusedPath) {
    el.classList.add('jv-row--focus-flash');
  }
  el.style.paddingLeft = `${0.5 + row.depth * 0.85}rem`;
  el.dataset.path = row.path;

  if (row.isNotice) {
    const notice = document.createElement('span');
    notice.className = 'jv-row__notice';
    notice.textContent = arrayCapNotice(Number(row.value) || 0, !!row.hasSearchExtras);
    el.append(notice);
    return el;
  }

  el.addEventListener('mouseenter', () => {
    activeSegments = row.segments;
    updatePathBar();
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'jv-row__toggle';
  toggle.textContent = row.hasChildren ? (row.expanded ? '▼' : '▶') : '·';
  toggle.disabled = !row.hasChildren;
  toggle.setAttribute('aria-label', row.hasChildren ? (row.expanded ? '閉じる' : '開く') : '');
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!row.hasChildren) return;
    if (expandedPaths.has(row.path)) expandedPaths.delete(row.path);
    else expandedPaths.add(row.path);
    renderTree();
  });

  const key = document.createElement('span');
  key.className = 'jv-row__key';
  key.textContent = row.key == null ? '(ルート)' : row.key;
  key.title = row.hasChildren ? 'クリックで開閉 · 場所は上に表示' : '場所は上に表示';
  key.addEventListener('click', (e) => {
    e.stopPropagation();
    activeSegments = row.segments;
    updatePathBar();
    if (!row.hasChildren) return;
    if (expandedPaths.has(row.path)) expandedPaths.delete(row.path);
    else expandedPaths.add(row.path);
    renderTree();
  });

  const preview = document.createElement('span');
  preview.className = 'jv-row__preview';
  preview.textContent = formatPreview(row.value, /** @type {import('./json-view-engine.js').JsonValueType} */ (row.type));
  preview.title = 'ダブルクリックで値をコピー';
  preview.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    void copyText(valueForCopy(row.value, /** @type {import('./json-view-engine.js').JsonValueType} */ (row.type)));
  });

  const type = document.createElement('span');
  type.className = 'jv-row__type';
  type.textContent = typeLabel(row.type);

  el.append(toggle, key, preview, type);
  return el;
}

/**
 * @param {string} path
 */
function focusAndScrollToPath(path) {
  if (!els.tree) return;
  focusedPath = path;
  renderTree();

  const selector = `.jv-row[data-path="${CSS.escape(path)}"]`;
  const target = /** @type {HTMLElement|null} */ (els.tree.querySelector(selector));
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      target.classList.remove('jv-row--focus-flash');
    }, 900);
  }
}

function runParse() {
  const text = els.input?.value || '';
  const result = parseJson(text);
  if (!result.ok) {
    rootValue = null;
    activeSegments = null;
    resetSearchState();
    updatePathBar();
    setStatus(result.error || '読み取れませんでした。', true);
    renderTree();
    return;
  }

  rootValue = result.value;
  expandedPaths = new Set(['']);
  activeSegments = null;
  resetSearchState();
  updatePathBar();

  const type = getValueType(rootValue);
  const summary = type === 'object'
    ? `オブジェクト ${Object.keys(/** @type {Record<string, unknown>} */ (rootValue)).length}件`
    : type === 'array'
      ? `配列 ${/** @type {unknown[]} */ (rootValue).length}件`
      : typeLabel(type);
  setStatus(`読み取りました — ${summary}`);
  renderTree();
}

function onSearchInput() {
  if (!rootValue) {
    setSearchMeta('');
    return;
  }
  const q = els.search?.value.trim() || '';
  matchQuery = '';
  matchIndex = -1;
  focusedPath = null;
  matches = q ? collectSearchMatches(rootValue, q) : [];
  if (!q) setSearchMeta('');
  else if (!matches.length) setSearchMeta('0 / 0');
  else setSearchMeta(`0 / ${matches.length}`);
  renderTree();
}

function jumpToNextMatch() {
  const q = els.search?.value.trim() || '';
  if (!rootValue || !q) {
    resetSearchState();
    return;
  }
  if (matchQuery !== q) {
    matches = collectSearchMatches(rootValue, q);
    matchIndex = -1;
    matchQuery = q;
  }
  if (!matches.length) {
    setSearchMeta('0 / 0');
    return;
  }
  matchIndex = (matchIndex + 1) % matches.length;
  const target = matches[matchIndex];
  expandedPaths = expandPathsForSegments(target.segments);
  activeSegments = target.segments;
  updatePathBar();
  setSearchMeta(`${matchIndex + 1} / ${matches.length}`);
  focusAndScrollToPath(target.path);
}

function bindEvents() {
  els.parseBtn?.addEventListener('click', runParse);

  els.input?.addEventListener('paste', () => {
    if (pasteTimer) window.clearTimeout(pasteTimer);
    pasteTimer = window.setTimeout(() => runParse(), 0);
  });

  els.input?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runParse();
    }
  });

  els.search?.addEventListener('input', onSearchInput);
  els.search?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    jumpToNextMatch();
  });
  els.searchNext?.addEventListener('click', jumpToNextMatch);

  els.pathBar?.addEventListener('click', () => {
    if (!activeSegments) return;
    void copyText(toJsonPath(activeSegments));
  });

  els.expandAll?.addEventListener('click', () => {
    if (rootValue == null) return;
    expandedPaths = allContainerPaths(rootValue);
    renderTree();
  });

  els.collapseAll?.addEventListener('click', () => {
    expandedPaths = new Set(['']);
    renderTree();
  });
}

bindEvents();
updatePathBar();
renderTree();
