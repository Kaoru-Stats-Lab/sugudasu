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
  detoxLabel,
  AMOUNT_SOFT_DIGITS,
  clampYenAmount,
} from './budget-trim-engine.js';
import { markCopyButtonDone, triggerCopyFlash } from './sg-copy-feedback.js';

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
  return parseYenAmount(raw);
}

/**
 * 桁数ソフト上限（エラーなし）。超過分は先頭桁を残して切り詰め。
 * @param {HTMLInputElement} inp
 */
function softTrimAmountInput(inp) {
  const raw = String(inp.value || '');
  const sign = raw.trim().startsWith('-') ? '-' : '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= AMOUNT_SOFT_DIGITS) return;
  // DECISION: エラーバナーを出さず、入力そのものを実務桁に戻す
  const clipped = Number(sign + digits.slice(0, AMOUNT_SOFT_DIGITS));
  inp.value = formatYen(clampYenAmount(clipped));
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
    capEl.value = cap == null ? '' : formatYen(cap);
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
      const locked = !!it.locked;
      // B-1/B-2: 1行 · 入口に鍵 · 金額カンマ · ロック多重表現は .sg-lock-row--on
      return `<article class="bt-item sg-lock-row${locked ? ' sg-lock-row--on bt-item--locked' : ''}" data-id="${it.id}">
        <div class="bt-item__row">
          <span class="sg-lock-row__mark" aria-hidden="true">${locked ? '🔒' : '🔓'}</span>
          <div class="bt-item__name">
            <span class="bt-item__idx">${idx + 1}.</span>
            <input type="text" class="sg-input bt-item__name-input" data-name="${it.id}" value="${escapeHtml(it.name)}" placeholder="項目名" ${locked ? 'readonly' : ''} aria-label="項目名" aria-readonly="${locked ? 'true' : 'false'}">
          </div>
          <input type="text" inputmode="numeric" class="sg-input bt-item__amount" data-amount="${it.id}" value="${formatYen(it.amount)}" ${locked ? 'readonly' : ''} aria-label="${escapeHtml(it.name || '項目')}の金額" aria-readonly="${locked ? 'true' : 'false'}">
          <span class="bt-item__yen">円</span>
          <button type="button" class="bt-lock ${locked ? 'bt-lock--closed' : 'bt-lock--open'}" data-lock="${it.id}" aria-pressed="${locked ? 'true' : 'false'}" title="確定枠の目印（合計計算は制限しません）">
            ${locked ? '🔒 ロック中' : '🔓 未ロック'}
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

function parseImport() {
  const text = $('bt-import')?.value || '';
  const parsed = parseBudgetPaste(text);
  if (!parsed.length) {
    setMsg('読み取れる行がありません。項目名と金額の表を貼ってください。');
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
    softTrimAmountInput(/** @type {HTMLInputElement} */ ($('bt-cap')));
    cap = readCapFromUi();
    renderCounter();
    syncHash();
  });
  $('bt-cap')?.addEventListener('blur', () => {
    const el = /** @type {HTMLInputElement|null} */ ($('bt-cap'));
    if (!el) return;
    if (el.value.trim() === '') {
      cap = null;
    } else {
      cap = parseYenAmount(el.value);
      el.value = cap == null ? '' : formatYen(cap);
    }
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

  $('bt-list')?.addEventListener('input', (e) => {
    const inp = /** @type {HTMLInputElement|null} */ (
      /** @type {HTMLElement} */ (e.target).closest('[data-amount]')
    );
    if (!inp || inp.readOnly) return;
    softTrimAmountInput(inp);
  });

  $('bt-list')?.addEventListener('change', (e) => {
    const nameInp = /** @type {HTMLInputElement|null} */ (
      /** @type {HTMLElement} */ (e.target).closest('[data-name]')
    );
    if (nameInp) {
      if (nameInp.readOnly) return;
      const id = nameInp.getAttribute('data-name');
      const name = detoxLabel(nameInp.value);
      items = items.map((it) => (it.id === id ? { ...it, name } : it));
      render();
      return;
    }
    const inp = /** @type {HTMLElement} */ (e.target).closest('[data-amount]');
    if (!inp) return;
    if (/** @type {HTMLInputElement} */ (inp).readOnly) return;
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
    const inp = /** @type {HTMLInputElement|null} */ (
      /** @type {HTMLElement} */ (e.target).closest('[data-amount]')
    );
    if (!inp || inp.readOnly) return;
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
    const btn = $('bt-copy-tsv');
    try {
      await copyText(buildCleanTsv(items));
      triggerCopyFlash();
      markCopyButtonDone(btn, {
        copiedLabel: 'コピーしました',
        fallbackLabel: 'TSVをコピー（Excelへ）',
        trackOutcome: 'copy',
      });
      setMsg('TSV をコピーしました（Excel にそのまま貼れます）');
    } catch {
      setMsg('コピーに失敗しました');
    }
  });

  $('bt-copy-url')?.addEventListener('click', async () => {
    const btn = $('bt-copy-url');
    syncHash();
    try {
      await copyText(location.href);
      triggerCopyFlash();
      markCopyButtonDone(btn, {
        copiedLabel: 'コピーしました',
        fallbackLabel: 'この画面のURLをコピー',
        trackOutcome: 'copy',
      });
      setMsg('この画面のURLをコピーしました（サーバーには送っていません）');
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
    // DECISION: 打つ入口はワークスペース右の黒ボタン（請求書と同型）。貼るカードに置かない。
    const id = newId();
    items = [...items, { id, name: '', amount: 0, locked: false }];
    render();
    requestAnimationFrame(() => {
      const el = /** @type {HTMLInputElement|null} */ (document.querySelector(`[data-name="${id}"]`));
      el?.focus();
    });
  });

  window.addEventListener('hashchange', () => {
    if (suppressHash) return;
    loadFromHash();
  });

  if (!loadFromHash()) {
    render();
  }

  try {
    globalThis.SG_ANALYTICS?.bindTextJobStarted?.($('bt-import'), { debounceMs: 400, minLength: 1 });
  } catch (_) {
    /* ignore */
  }
}

init();
