/**
 * SUGUDASU 引き算パレット — UI
 * docs/notes/BUDGET_TRIM_SPEC.md
 */
import {
  parseBudgetPaste,
  parseYenAmount,
  sumAmounts,
  budgetStatus,
  arrowKeyDelta,
  encodeHashState,
  decodeHashState,
  buildCleanTsv,
  applyAmountDelta,
  formatYen,
  newId,
} from './budget-trim-engine.js';

const $ = (id) => document.getElementById(id);

/** @type {{ id: string, name: string, amount: number, locked: boolean }[]} */
let items = [];
/** @type {number|null} */
let cap = null;
let hashTimer = null;
let suppressHash = false;

function setMsg(msg) {
  const el = $('bt-msg');
  if (el) el.textContent = msg || '';
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function readCapFromUi() {
  const el = $('bt-cap');
  if (!el) return cap;
  const raw = el.value.trim();
  if (raw === '') return null;
  const n = parseYenAmount(raw);
  return n;
}

function syncHash() {
  if (suppressHash) return;
  if (hashTimer) clearTimeout(hashTimer);
  hashTimer = setTimeout(() => {
    const hash = encodeHashState({ cap, items });
    const url = `${location.pathname}${location.search}#${hash}`;
    history.replaceState(null, '', url);
    const share = $('bt-share-url');
    if (share) share.value = location.href;
  }, 120);
}

function renderCounter() {
  const total = sumAmounts(items);
  const status = budgetStatus(total, cap);
  const box = $('bt-counter');
  const totalEl = $('bt-total');
  const statusEl = $('bt-status');
  const capEl = $('bt-cap');
  if (totalEl) totalEl.textContent = formatYen(total);
  if (capEl && document.activeElement !== capEl) {
    capEl.value = cap == null ? '' : String(cap);
  }
  if (!box || !statusEl) return;

  box.classList.remove('bt-counter--over', 'bt-counter--under', 'bt-counter--neutral');
  if (status.kind === 'over') {
    box.classList.add('bt-counter--over');
    statusEl.textContent = `🚨 超過：＋${formatYen(status.delta)}`;
  } else if (status.kind === 'under') {
    box.classList.add('bt-counter--under');
    statusEl.textContent = `✅ 残高：${formatYen(status.delta)}`;
  } else {
    box.classList.add('bt-counter--neutral');
    statusEl.textContent = '上限を入力すると超過 / 残高を表示します';
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderList() {
  const root = $('bt-list');
  const empty = $('bt-empty');
  if (!root) return;
  if (empty) empty.classList.toggle('hidden', items.length > 0);

  root.innerHTML = items
    .map((it, idx) => {
      return `<article class="bt-item${it.locked ? ' bt-item--locked' : ''}" data-id="${it.id}">
        <p class="bt-item__name">${idx + 1}. ${escapeHtml(it.name)}</p>
        <div class="bt-item__row">
          <input type="text" inputmode="numeric" class="sg-input bt-item__amount" data-amount="${it.id}" value="${it.amount}" aria-label="${escapeHtml(it.name)}の金額">
          <span class="bt-item__yen">円</span>
          <button type="button" class="bt-lock" data-lock="${it.id}" aria-pressed="${it.locked ? 'true' : 'false'}" title="確定枠の目印（計算は制限しません）">
            ${it.locked ? '🔒 ロック' : '🔓 アンロック'}
          </button>
        </div>
      </article>`;
    })
    .join('');
}

function render() {
  renderCounter();
  renderList();
  syncHash();
}

function parseImport() {
  const text = $('bt-import')?.value || '';
  const parsed = parseBudgetPaste(text);
  if (!parsed.length) {
    setMsg('読み取れる行がありません。項目名と金額のタブ区切りを貼ってください。');
    return;
  }
  items = parsed;
  setMsg(`${items.length} 行を読み込みました`);
  render();
}

function loadFromHash() {
  const decoded = decodeHashState(location.hash);
  if (!decoded.ok) return false;
  suppressHash = true;
  cap = decoded.state.cap;
  items = decoded.state.items;
  suppressHash = false;
  setMsg('URL から下書きを復元しました');
  render();
  return true;
}

function init() {
  $('bt-parse')?.addEventListener('click', parseImport);

  $('bt-cap')?.addEventListener('change', () => {
    cap = readCapFromUi();
    renderCounter();
    syncHash();
  });
  $('bt-cap')?.addEventListener('input', () => {
    cap = readCapFromUi();
    renderCounter();
    syncHash();
  });

  $('bt-list')?.addEventListener('click', (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest('[data-lock]');
    if (!btn) return;
    const id = btn.getAttribute('data-lock');
    items = items.map((it) => (it.id === id ? { ...it, locked: !it.locked } : it));
    render();
  });

  $('bt-list')?.addEventListener('change', (e) => {
    const inp = /** @type {HTMLElement} */ (e.target).closest('[data-amount]');
    if (!inp) return;
    const id = inp.getAttribute('data-amount');
    const n = parseYenAmount(/** @type {HTMLInputElement} */ (inp).value);
    if (n == null) {
      setMsg('金額は整数の円で入力してください');
      renderList();
      return;
    }
    items = items.map((it) => (it.id === id ? { ...it, amount: n } : it));
    render();
  });

  $('bt-list')?.addEventListener('keydown', (e) => {
    const inp = /** @type {HTMLElement} */ (e.target).closest('[data-amount]');
    if (!inp) return;
    const delta = arrowKeyDelta(e);
    if (delta == null) return;
    e.preventDefault();
    const id = inp.getAttribute('data-amount');
    items = items.map((it) => {
      if (it.id !== id) return it;
      return { ...it, amount: applyAmountDelta(it.amount, delta) };
    });
    render();
    const again = /** @type {HTMLInputElement|null} */ (document.querySelector(`[data-amount="${id}"]`));
    again?.focus();
    again?.select();
  });

  $('bt-copy-tsv')?.addEventListener('click', async () => {
    try {
      await copyText(buildCleanTsv(items));
      setMsg('TSV をコピーしました（Excel にそのまま貼れます）');
    } catch {
      setMsg('コピーに失敗しました');
    }
  });

  $('bt-copy-url')?.addEventListener('click', async () => {
    syncHash();
    try {
      await copyText(location.href);
      setMsg('共有用 URL をコピーしました（サーバーには送っていません）');
    } catch {
      setMsg('コピーに失敗しました');
    }
  });

  $('bt-clear')?.addEventListener('click', () => {
    items = [];
    setMsg('クリアしました');
    render();
  });

  $('bt-add-row')?.addEventListener('click', () => {
    items = [...items, { id: newId(), name: '新規項目', amount: 0, locked: false }];
    render();
  });

  window.addEventListener('hashchange', () => {
    if (suppressHash) return;
    loadFromHash();
  });

  if (!loadFromHash()) {
    render();
  }
}

init();
