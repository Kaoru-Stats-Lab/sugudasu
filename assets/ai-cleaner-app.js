/**
 * ai-cleaner — 貼る · 落とす · コピー
 */
import { runClean } from './ai-cleaner-engine.js';

/** @typedef {'markdown'|'code'|'json'} CleanMode */

const MODE_HINT = {
  markdown: '連続空行・一部HTMLタグ・水平線（---）を整えます',
  code: 'コードブロックの中身だけ取り出します（複数あれば連結）',
  json: 'JSONを整形します。壊れている場合は修復しません',
};

const els = {
  input: /** @type {HTMLTextAreaElement|null} */ (document.getElementById('ac-input')),
  output: /** @type {HTMLTextAreaElement|null} */ (document.getElementById('ac-output')),
  run: document.getElementById('ac-run'),
  copy: document.getElementById('ac-copy'),
  status: document.getElementById('ac-status'),
  mode: document.getElementById('ac-mode'),
  modeHint: document.getElementById('ac-mode-hint'),
  toast: document.getElementById('ac-toast'),
};

/** @type {CleanMode} */
let mode = 'markdown';
/** @type {ReturnType<typeof setTimeout>|null} */
let toastTimer = null;

/**
 * @param {string} text
 * @param {boolean} [isError]
 */
function setStatus(text, isError = false) {
  if (!els.status) return;
  els.status.textContent = text;
  els.status.classList.toggle('text-rose-700', isError);
  els.status.classList.toggle('text-slate-600', !isError);
}

/**
 * @param {string} text
 * @param {boolean} [isError]
 */
function showToast(text, isError = false) {
  if (!els.toast) return;
  els.toast.textContent = text;
  els.toast.classList.toggle('ac-toast--error', isError);
  els.toast.classList.add('ac-toast--show');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    els.toast?.classList.remove('ac-toast--show');
  }, 800);
}

/**
 * @param {CleanMode} next
 */
function setMode(next) {
  mode = next;
  els.mode?.querySelectorAll('[data-mode]').forEach((btn) => {
    const selected = btn.getAttribute('data-mode') === next;
    btn.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  if (els.modeHint) els.modeHint.textContent = MODE_HINT[next];
}

function run() {
  const text = els.input?.value || '';
  const result = runClean(mode, text);
  if (!result.ok) {
    if (els.output) els.output.value = '';
    setStatus(result.error, true);
    return;
  }
  if (els.output) els.output.value = result.text;
  setStatus('クリーニングしました');
}

async function copyResult() {
  const text = els.output?.value || '';
  if (!text) {
    showToast('結果がありません', true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('✓ コピーしました');
  } catch {
    showToast('コピーできませんでした', true);
  }
}

function bind() {
  els.mode?.addEventListener('click', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const btn = t.closest('[data-mode]');
    if (!btn) return;
    const next = /** @type {CleanMode} */ (btn.getAttribute('data-mode'));
    if (next === 'markdown' || next === 'code' || next === 'json') setMode(next);
  });

  els.run?.addEventListener('click', run);
  els.copy?.addEventListener('click', () => { void copyResult(); });

  els.input?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run();
    }
  });
}

setMode('markdown');
bind();
