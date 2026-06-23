/**
 * /stamp — 電子印鑑 UI（認印のみ）
 */
import {
  SIZE_PRESETS,
  STAMP_DEFAULT_COLOR,
  canvasToBlob,
  defaultFilename,
  downloadPngDataUrl,
  ensureStampFonts,
  renderStamp,
  sanitizeStampText,
} from './stamp-engine.js';
import { writeStampHandoff } from './stamp-handoff.js';

const $ = (id) => document.getElementById(id);

const state = {
  fontStyle: 'mincho',
  color: STAMP_DEFAULT_COLOR,
  tiltDeg: 0,
  sizePresetId: 'invoice-user',
};

let previewCanvas = null;
let lastDataUrl = '';
let toastTimer = 0;
let redrawQueued = false;

function currentPreset() {
  return SIZE_PRESETS.find((p) => p.id === state.sizePresetId) || SIZE_PRESETS[0];
}

function currentSizePx() {
  return currentPreset().px;
}

async function redraw() {
  if (!previewCanvas) return;
  await ensureStampFonts(state.fontStyle);
  const text = $('stamp-text')?.value ?? '';
  const dataUrl = renderStamp(previewCanvas, {
    text,
    color: state.color,
    fontStyle: state.fontStyle,
    tiltDeg: state.tiltDeg,
    sizePx: currentSizePx(),
  });
  lastDataUrl = dataUrl || '';
  const empty = !sanitizeStampText(text);
  $('stamp-preview-empty')?.classList.toggle('hidden', !empty);
  $('stamp-actions')?.classList.toggle('opacity-50', !lastDataUrl || empty);
  $('stamp-actions')?.classList.toggle('pointer-events-none', !lastDataUrl || empty);
}

function scheduleRedraw() {
  if (redrawQueued) return;
  redrawQueued = true;
  queueMicrotask(async () => {
    redrawQueued = false;
    await redraw();
  });
}

function showToast(message, tone = 'ok') {
  const el = $('stamp-toast');
  if (!el) return;
  el.hidden = false;
  el.className = tone === 'warn'
    ? 'stamp-toast stamp-toast--warn'
    : 'stamp-toast stamp-toast--ok';
  el.textContent = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.hidden = true;
  }, 3200);
}

async function copyPngToClipboard(buttonEl) {
  if (!lastDataUrl || !previewCanvas) return;
  const prev = buttonEl?.textContent;
  try {
    const blob = await canvasToBlob(previewCanvas);
    if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } else {
      throw new Error('clipboard-image');
    }
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.classList.add('sg-copy-btn--done');
      buttonEl.textContent = 'Copied!';
      window.setTimeout(() => {
        buttonEl.disabled = false;
        buttonEl.classList.remove('sg-copy-btn--done');
        buttonEl.textContent = prev || 'クリップボードにコピー';
      }, 2000);
    }
    showToast('透過PNGをクリップボードにコピーしました。');
  } catch {
    showToast('お使いのブラウザでは画像コピーに未対応です。PNG保存をお試しください。', 'warn');
  }
}

function useOnInvoice() {
  if (!lastDataUrl) return;
  const label = sanitizeStampText($('stamp-text')?.value ?? '');
  const ok = writeStampHandoff({ slot: 'user', dataUrl: lastDataUrl, label });
  if (!ok) {
    showToast('印影データが大きすぎるか、ブラウザの保存領域が使えません。PNGを保存して請求書から画像選択してください。', 'warn');
    return;
  }
  window.location.href = '/invoice?from=stamp';
}

function bindEvents() {
  $('stamp-text')?.addEventListener('input', scheduleRedraw);

  $('stamp-color')?.addEventListener('input', (e) => {
    state.color = e.target.value;
    scheduleRedraw();
  });

  $('stamp-font')?.addEventListener('change', (e) => {
    state.fontStyle = e.target.value === 'gyosho' ? 'gyosho' : 'mincho';
    scheduleRedraw();
  });

  $('stamp-tilt')?.addEventListener('input', (e) => {
    state.tiltDeg = Number(e.target.value);
    const label = $('stamp-tilt-val');
    if (label) label.textContent = `${state.tiltDeg}°`;
    scheduleRedraw();
  });

  $('stamp-size')?.addEventListener('change', (e) => {
    state.sizePresetId = e.target.value;
    scheduleRedraw();
  });

  $('stamp-btn-download')?.addEventListener('click', () => {
    if (!lastDataUrl) return;
    downloadPngDataUrl(lastDataUrl, defaultFilename());
    showToast('PNGを保存しました。');
  });

  $('stamp-btn-copy')?.addEventListener('click', (e) => {
    copyPngToClipboard(e.currentTarget);
  });

  $('stamp-btn-use-invoice')?.addEventListener('click', useOnInvoice);

  $('stamp-btn-reset')?.addEventListener('click', () => {
    state.color = STAMP_DEFAULT_COLOR;
    state.tiltDeg = 0;
    state.fontStyle = 'mincho';
    const colorEl = $('stamp-color');
    if (colorEl) colorEl.value = STAMP_DEFAULT_COLOR;
    const tiltEl = $('stamp-tilt');
    if (tiltEl) tiltEl.value = '0';
    const tiltVal = $('stamp-tilt-val');
    if (tiltVal) tiltVal.textContent = '0°';
    const fontEl = $('stamp-font');
    if (fontEl) fontEl.value = 'mincho';
    scheduleRedraw();
  });
}

function fillSizeSelect() {
  const sel = $('stamp-size');
  if (!sel) return;
  sel.innerHTML = SIZE_PRESETS.map(
    (p) => `<option value="${p.id}">${p.label}</option>`,
  ).join('');
  sel.value = state.sizePresetId;
}

async function init() {
  previewCanvas = $('stamp-canvas');
  fillSizeSelect();
  bindEvents();
  await redraw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init(); });
} else {
  init();
}
