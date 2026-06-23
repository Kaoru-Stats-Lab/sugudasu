/**
 * SUGUDASU コピー契約 — クリップボード・行数チェック（全ツール共通）
 * SSOT: docs/DESIGN_GUIDELINE.md §3.8 · docs/notes/SUGUDASU_OOPS_GUARDRAILS.md
 */

export const FILTER_REMINDER =
  '⚠ スプシ/Excelでフィルター・非表示行があると、貼り付け時に行が詰まってズレます。解除してから貼ってください。';

/**
 * @param {string} text
 */
export function countLines(text) {
  if (text == null || text === '') return 0;
  return String(text).split('\n').length;
}

/**
 * @param {HTMLElement | null} el
 * @param {number} inputLines
 * @param {number} outputLines
 */
export function updateLineMatchDisplay(el, inputLines, outputLines) {
  if (!el) return { match: inputLines === outputLines, inputLines, outputLines };
  el.classList.remove('hidden');
  const match = inputLines === outputLines;
  if (match) {
    el.className = 'sg-line-match sg-line-match--ok rounded-lg px-3 py-2 text-sm font-semibold';
    el.textContent = `入力 ${inputLines} 行 → 出力 ${outputLines} 行 ✓ 行数は同じです`;
  } else {
    el.className = 'sg-line-match sg-line-match--warn rounded-lg px-3 py-2 text-sm font-semibold';
    el.textContent = `入力 ${inputLines} 行 → 出力 ${outputLines} 行 — 行数が変わっています`;
  }
  return { match, inputLines, outputLines };
}

/**
 * 行数不一致時のコピーゲート
 * @param {{ gateEl: HTMLElement | null, checkEl: HTMLInputElement | null, copyBtn: HTMLButtonElement | null, inputLines: number, outputLines: number }} cfg
 */
export function syncCopyGate(cfg) {
  const { gateEl, checkEl, copyBtn, inputLines, outputLines } = cfg;
  const mismatch = inputLines !== outputLines;
  if (gateEl) gateEl.classList.toggle('hidden', !mismatch);
  if (mismatch && checkEl) checkEl.checked = false;
  if (copyBtn) {
    if (inputLines === 0) copyBtn.disabled = true;
    else if (mismatch) copyBtn.disabled = !(checkEl && checkEl.checked);
    else copyBtn.disabled = false;
  }
  return mismatch;
}

/**
 * @param {string} text
 * @param {HTMLElement | null} buttonEl
 * @param {{ previewLine?: string, lineCount?: number, toastEl?: HTMLElement | null, lockMs?: number, showFilterReminder?: boolean, toastPrefix?: string, copiedLabel?: string }} [options]
 */
export async function copyWithFeedback(text, buttonEl, options = {}) {
  const payload = String(text ?? '');
  if (!payload) {
    throw new Error('empty');
  }

  try {
    await navigator.clipboard.writeText(payload);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = payload;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    triggerCopyFlash();
  }

  const lockMs = options.lockMs ?? 2000;
  const copiedLabel = options.copiedLabel ?? 'Copied!';
  const prevLabel = buttonEl ? buttonEl.textContent : '';
  if (buttonEl) {
    markCopyButtonDone(buttonEl, { lockMs, copiedLabel, fallbackLabel: prevLabel || 'コピー' });
  }

  const toastEl = options.toastEl;
  if (toastEl) {
    const preview = options.previewLine
      ? String(options.previewLine).slice(0, 40)
      : payload.split('\n')[0]?.slice(0, 40) ?? '';
    const lines = options.lineCount ?? countLines(payload);
    const prefix = options.toastPrefix ?? '出力';
    toastEl.hidden = false;
    toastEl.className = 'sg-copy-toast text-[11px] leading-relaxed rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2';
    const parts = [
      '<strong class="text-emerald-800">クリップボードを更新しました。</strong>',
      ` ${prefix} · ${lines} 行 · 先頭: ${escapeHtml(preview)}${preview.length >= 40 ? '…' : ''}`,
    ];
    if (options.showFilterReminder) {
      parts.push(`<span class="block mt-1 text-amber-800">${FILTER_REMINDER}</span>`);
    }
    toastEl.innerHTML = parts.join('');
  }

  return { ok: true, lineCount: countLines(payload) };
}

/**
 * 変換系: コピー直前に最新出力を再計算してから clipboard へ（入力欄生テキストはコピーしない）
 * @param {{ computeOutput: () => string | null | undefined, buttonEl: HTMLElement | null, toastEl?: HTMLElement | null, gate?: { gateEl, checkEl, getInputLines, getOutputLines }, showFilterReminder?: boolean, toastPrefix?: string }} cfg
 */
export async function copyLatestTransform(cfg) {
  const output = cfg.computeOutput();
  if (!output) throw new Error('empty');

  if (cfg.gate) {
    const inLines = cfg.gate.getInputLines();
    const outLines = cfg.gate.getOutputLines();
    const mismatch = inLines !== outLines;
    if (mismatch && cfg.gate.checkEl && !cfg.gate.checkEl.checked) {
      throw new Error('gate');
    }
  }

  return copyWithFeedback(output, cfg.buttonEl, {
    toastEl: cfg.toastEl,
    lineCount: countLines(output),
    previewLine: output.split('\n')[0],
    showFilterReminder: cfg.showFilterReminder ?? false,
    toastPrefix: cfg.toastPrefix ?? '変換後',
  });
}

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** §3.8 — 画面全体のグリーンフラッシュ（コピー・保存成功） */
export function triggerCopyFlash() {
  if (typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.body.classList.add('sg-copy-flash');
  window.setTimeout(() => document.body.classList.remove('sg-copy-flash'), 320);
}

/**
 * @param {HTMLElement | null} buttonEl
 * @param {{ lockMs?: number, copiedLabel?: string, fallbackLabel?: string }} [options]
 */
export function markCopyButtonDone(buttonEl, options = {}) {
  if (!buttonEl) return;
  const lockMs = options.lockMs ?? 2000;
  const copiedLabel = options.copiedLabel ?? 'Copied!';
  const prevLabel = buttonEl.textContent;
  buttonEl.disabled = true;
  buttonEl.classList.add('sg-copy-btn--done');
  buttonEl.textContent = copiedLabel;
  window.setTimeout(() => {
    buttonEl.disabled = false;
    buttonEl.classList.remove('sg-copy-btn--done');
    buttonEl.textContent = options.fallbackLabel ?? (prevLabel || 'コピー');
  }, lockMs);
}

/**
 * @param {HTMLElement | null} toastEl
 * @param {string} html
 */
export function showCopyToastHtml(toastEl, html) {
  if (!toastEl) return;
  toastEl.hidden = false;
  toastEl.className = 'sg-copy-toast text-[11px] leading-relaxed rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2';
  toastEl.innerHTML = html;
}

if (typeof globalThis !== 'undefined') {
  globalThis.SG_COPY_FEEDBACK = {
    copyWithFeedback,
    copyLatestTransform,
    countLines,
    updateLineMatchDisplay,
    syncCopyGate,
    triggerCopyFlash,
    markCopyButtonDone,
    showCopyToastHtml,
    FILTER_REMINDER,
  };
}
