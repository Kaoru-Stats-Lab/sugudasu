/**
 * SNS / font-converter 共有 — コピー契約 · プレビュー · 変換 UI
 */
import { copyWithFeedback, countLines } from './sg-copy-feedback.js';
import {
  STYLE_BADGES,
  DEFAULT_PREVIEW,
  SNS_DEFAULT_TEXT,
  SNS_DEFAULT_LINES,
  SAMPLE_TEXTS,
  convertWithStyle,
  filterStyles,
  loadFontStyles,
  loadSymbolCatalog,
  loadHiraganaDecor,
  escHtml,
} from './sns-font-engine.js';

const toastSns = document.getElementById('copy-toast-sns');

export async function sgCopy(text, buttonEl, options = {}) {
  const payload = String(text ?? '');
  if (!payload) return;
  const toastEl = options.toastEl ?? toastSns ?? document.getElementById('copy-toast-sns');
  const labelBtn = buttonEl && (
    buttonEl.classList.contains('deco-card__copy')
    || buttonEl.classList.contains('fc-font-card__copy')
    || [...buttonEl.classList].some((c) => c.startsWith('sns-copy-btn'))
  );
  const useButton = options.buttonFeedback !== false && labelBtn;
  try {
    await copyWithFeedback(payload, useButton ? buttonEl : null, {
      toastEl,
      toastPrefix: options.toastPrefix ?? 'コピー',
      lineCount: countLines(payload),
      previewLine: payload.split('\n')[0],
    });
  } catch {
    /* gate / empty */
  }
}

export {
  STYLE_BADGES,
  DEFAULT_PREVIEW,
  SNS_DEFAULT_TEXT,
  SNS_DEFAULT_LINES,
  SAMPLE_TEXTS,
  convertWithStyle,
  filterStyles,
  loadFontStyles,
  loadSymbolCatalog,
  loadHiraganaDecor,
  escHtml,
  copyWithFeedback,
  countLines,
};
