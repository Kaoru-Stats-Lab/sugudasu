/**
 * SUGUDASU コピー契約 — クリップボード・行数チェック（全ツール共通）
 * SSOT: docs/DESIGN_GUIDELINE.md §3.8 · docs/notes/UIUX_EXPERIENCE_IMPLEMENTATION_CONTRACT.md §2.2
 * 採択: E-TOAST/E-FLASH 案 C+（2026-07-30）— 操作点確認 · ペイロード近接 · 全面flash禁止 · ボタン印刷緑化禁止
 * 利用計測: docs/notes/PRODUCT_USAGE_ANALYTICS.md（成功時 tool_job_done · 本文は送らない）
 */

import { notifyJobDone, notifyJobFailed } from './sg-analytics.js';

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
    notifyJobFailed('empty');
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

  // C+: 全面 flash 廃止（triggerCopyFlash は no-op 互換）

  const lockMs = options.lockMs ?? 2000;
  const copiedLabel = options.copiedLabel ?? 'コピーしました';
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
    toastEl.setAttribute('role', 'status');
    toastEl.className = 'sg-copy-toast sg-copy-toast--ok text-[11px] leading-relaxed rounded-lg px-3 py-2';
    const parts = [
      '<strong class="sg-copy-toast__label">コピーしました。</strong>',
      ` ${prefix} · ${lines} 行 · 先頭: ${escapeHtml(preview)}${preview.length >= 40 ? '…' : ''}`,
    ];
    if (options.showFilterReminder) {
      parts.push(`<span class="block mt-1 text-amber-800">${FILTER_REMINDER}</span>`);
    }
    toastEl.innerHTML = parts.join('');
  }

  // DECISION: GA はメタのみ。行数・プレビューはトースト専用でイベントに載せない。
  notifyJobDone('copy');
  try {
    if (typeof globalThis !== 'undefined' && globalThis.SUGUDASU_GROWTH) {
      globalThis.SUGUDASU_GROWTH.recordToolSuccess();
      // B: 完了フィードバック内1行（通算2回目以降 · 固定バナー禁止）
      if (toastEl) globalThis.SUGUDASU_GROWTH.decorateCopyToast(toastEl);
    }
  } catch (_) {
    /* ignore */
  }

  return { ok: true, lineCount: countLines(payload) };
}

/**
 * 変換系: コピー直前に最新出力を再計算してから clipboard へ（入力欄生テキストはコピーしない）
 * Transform-Copy は近接ペイロード確認のため toastEl を渡すこと（C+ / §3.8）
 * @param {{ computeOutput: () => string | null | undefined, buttonEl: HTMLElement | null, toastEl?: HTMLElement | null, gate?: { gateEl, checkEl, getInputLines, getOutputLines }, showFilterReminder?: boolean, toastPrefix?: string }} cfg
 */
export async function copyLatestTransform(cfg) {
  if (cfg.gate) {
    const inLines = cfg.gate.getInputLines();
    const outLines = cfg.gate.getOutputLines();
    const mismatch = inLines !== outLines;
    if (mismatch && cfg.gate.checkEl && !cfg.gate.checkEl.checked) {
      notifyJobFailed('gate');
      throw new Error('gate');
    }
  }

  const output = cfg.computeOutput();
  if (!output) {
    notifyJobFailed('empty');
    throw new Error('empty');
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

/**
 * @deprecated E-TOAST/E-FLASH C+（2026-07-30）で全面 flash 廃止。呼び出し互換のため残す no-op。
 */
export function triggerCopyFlash() {
  /* no-op */
}

/**
 * 操作点確認（C+）: ラベルを「コピーしました」へ · ボタン色は変えない（印刷緑流用禁止）
 * @param {HTMLElement | null} buttonEl
 * @param {{ lockMs?: number, copiedLabel?: string, fallbackLabel?: string, trackOutcome?: 'copy'|'pdf'|'download'|'print' }} [options]
 */
export function markCopyButtonDone(buttonEl, options = {}) {
  if (!buttonEl) return;
  const lockMs = options.lockMs ?? 2000;
  const copiedLabel = options.copiedLabel ?? 'コピーしました';
  const prevLabel = buttonEl.textContent;
  buttonEl.disabled = true;
  buttonEl.classList.remove('sg-copy-btn--done');
  buttonEl.classList.add('sg-copy-btn--confirmed');
  buttonEl.textContent = copiedLabel;
  window.setTimeout(() => {
    buttonEl.disabled = false;
    buttonEl.classList.remove('sg-copy-btn--confirmed', 'sg-copy-btn--done');
    buttonEl.textContent = options.fallbackLabel ?? (prevLabel || 'コピー');
  }, lockMs);
  // DECISION: copyWithFeedback は自前で notifyJobDone する。画像コピー等は trackOutcome で明示。
  if (options.trackOutcome) {
    try {
      notifyJobDone(options.trackOutcome);
    } catch (_) {
      /* ignore */
    }
  }
}

/**
 * @param {HTMLElement | null} toastEl
 * @param {string} html
 */
export function showCopyToastHtml(toastEl, html) {
  if (!toastEl) return;
  toastEl.hidden = false;
  toastEl.setAttribute('role', 'status');
  toastEl.className = 'sg-copy-toast sg-copy-toast--ok text-[11px] leading-relaxed rounded-lg px-3 py-2';
  toastEl.innerHTML = html;
  try {
    if (typeof globalThis !== 'undefined' && globalThis.SUGUDASU_GROWTH) {
      globalThis.SUGUDASU_GROWTH.decorateCopyToast(toastEl);
    }
  } catch (_) {
    /* ignore */
  }
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
