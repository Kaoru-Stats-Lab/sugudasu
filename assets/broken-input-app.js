/**
 * 壊れ入力 — 選ぶ · コピー
 */
import { copyWithFeedback } from './sg-copy-feedback.js';
import {
  CATEGORIES,
  PRESETS,
  presetsForCategory,
  previewText,
  displayDiffersFromCopy,
} from './broken-input-presets.js';

const els = {
  tabs: document.getElementById('ci-cats'),
  list: document.getElementById('ci-list'),
  toast: document.getElementById('ci-toast'),
};

/** @type {string} */
let categoryId = CATEGORIES[0]?.id || 'length';
/** @type {ReturnType<typeof setTimeout>|null} */
let toastTimer = null;

/**
 * @param {string} text
 */
function showToast(text) {
  if (!els.toast) return;
  els.toast.textContent = text;
  els.toast.classList.add('ci-toast--show');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    els.toast?.classList.remove('ci-toast--show');
  }, 800);
}

function renderTabs() {
  if (!els.tabs) return;
  els.tabs.innerHTML = CATEGORIES.map(
    (c) =>
      `<button type="button" role="tab" class="sg-segment__btn" data-cat="${c.id}" aria-selected="${
        c.id === categoryId ? 'true' : 'false'
      }">${c.label}</button>`
  ).join('');
}

/**
 * @param {string} text
 */
function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderList() {
  if (!els.list) return;
  const presets = presetsForCategory(categoryId);
  els.list.innerHTML = presets
    .map((p) => {
      const prev = previewText(p);
      const differs = displayDiffersFromCopy(p);
      const note = differs
        ? `<p class="text-[10px] text-amber-800">画面の見た目と、コピーされる中身が違います</p>`
        : '';
      const previewBlock =
        prev != null
          ? `<pre class="ci-preview" aria-label="プレビュー">${esc(prev)}</pre>`
          : '';
      return `<article class="sg-card p-4 space-y-2 ci-card" data-preset-id="${esc(p.id)}">
  <div class="flex flex-wrap items-start justify-between gap-2">
    <div class="min-w-0 space-y-1">
      <h3 class="text-sm font-bold text-slate-900">${esc(p.title)}</h3>
      <p class="text-[11px] text-slate-500 leading-relaxed">${esc(p.description)}</p>
    </div>
    <button type="button" class="sg-btn-primary text-sm shrink-0 ci-copy" data-copy-id="${esc(p.id)}">コピー</button>
  </div>
  ${previewBlock}
  ${note}
</article>`;
    })
    .join('');
}

/**
 * @param {string} next
 */
function setCategory(next) {
  if (!CATEGORIES.some((c) => c.id === next)) return;
  categoryId = next;
  els.tabs?.querySelectorAll('[data-cat]').forEach((btn) => {
    const selected = btn.getAttribute('data-cat') === next;
    btn.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  renderList();
}

/**
 * @param {string} presetId
 * @param {HTMLElement | null} buttonEl
 */
async function copyPreset(presetId, buttonEl) {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset?.value && preset?.value !== '') return;
  // NUL など空に見える場合もコピーする（value に制御文字のみのケースは今回なし）
  try {
    await copyWithFeedback(preset.value, buttonEl, {
      toastEl: null,
      toastPrefix: '壊れ入力',
      copiedLabel: 'コピー済み',
    });
    showToast('✓ コピーしました');
  } catch {
    showToast('コピーできませんでした');
  }
}

els.tabs?.addEventListener('click', (ev) => {
  const btn = /** @type {HTMLElement|null} */ (ev.target instanceof Element
    ? ev.target.closest('[data-cat]')
    : null);
  if (!btn) return;
  const id = btn.getAttribute('data-cat');
  if (id) setCategory(id);
});

els.list?.addEventListener('click', (ev) => {
  const btn = /** @type {HTMLElement|null} */ (ev.target instanceof Element
    ? ev.target.closest('[data-copy-id]')
    : null);
  if (!btn) return;
  const id = btn.getAttribute('data-copy-id');
  if (id) void copyPreset(id, btn);
});

renderTabs();
renderList();
