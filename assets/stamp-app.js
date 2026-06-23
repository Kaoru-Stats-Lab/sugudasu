/**
 * /stamp — 電子印鑑 UI
 */
import {
  SIZE_PRESETS,
  STAMP_DEFAULT_COLOR,
  canvasToBlob,
  defaultFilename,
  downloadPngDataUrl,
  renderStamp,
  sanitizeStampText,
  typeToDefaultSlot,
} from './stamp-engine.js';
import {
  stampSlotLabel,
  writeStampHandoff,
} from './stamp-handoff.js';

const $ = (id) => document.getElementById(id);

const state = {
  type: 'round',
  fontStyle: 'mincho',
  color: STAMP_DEFAULT_COLOR,
  tiltDeg: 0,
  sizePresetId: 'invoice-user',
};

let previewCanvas = null;
let lastDataUrl = '';
let toastTimer = 0;

function parseInitialSlot() {
  const params = new URLSearchParams(window.location.search);
  const slot = params.get('slot');
  if (slot === 'comp') {
    state.type = 'square';
    state.sizePresetId = 'invoice-comp';
    return;
  }
  if (slot === 'user') {
    state.type = 'round';
    state.sizePresetId = 'invoice-user';
  }
}

function currentPreset() {
  return SIZE_PRESETS.find((p) => p.id === state.sizePresetId) || SIZE_PRESETS[0];
}

function currentSizePx() {
  return currentPreset().px;
}

function currentSlot() {
  const preset = currentPreset();
  if (preset.slot) return preset.slot;
  return typeToDefaultSlot(state.type);
}

function placeholderForType() {
  return state.type === 'square'
    ? '例: 株式会社スグダス\n（改行で2行に分割可）'
    : '例: 山田';
}

function updateTypeUi() {
  const isRound = state.type === 'round';
  $('stamp-type-round')?.classList.toggle('sns-pv-tab--active', isRound);
  $('stamp-type-square')?.classList.toggle('sns-pv-tab--active', !isRound);
  $('stamp-type-round')?.setAttribute('aria-selected', isRound ? 'true' : 'false');
  $('stamp-type-square')?.setAttribute('aria-selected', !isRound ? 'true' : 'false');

  const input = $('stamp-text');
  if (input) {
    input.placeholder = placeholderForType();
    if (state.type === 'round') {
      input.rows = 2;
    } else {
      input.rows = 3;
    }
  }

  const useBtn = $('stamp-btn-use-invoice');
  if (useBtn) {
    const slot = currentSlot();
    useBtn.textContent = slot === 'comp' ? 'この印影を社印として請求書に使う' : 'この印影を担当者印として請求書に使う';
  }

  const hint = $('stamp-type-hint');
  if (hint) {
    hint.textContent = isRound
      ? '認印（丸）— 個人名・苗字向け。請求書の担当者印スロットに合わせたサイズです。'
      : '角印 — 会社名・屋号向け。請求書の社印スロットに合わせたサイズです。';
  }
}

function redraw() {
  if (!previewCanvas) return;
  const text = $('stamp-text')?.value ?? '';
  const dataUrl = renderStamp(previewCanvas, {
    type: state.type,
    text,
    color: state.color,
    fontStyle: state.fontStyle,
    tiltDeg: state.tiltDeg,
    sizePx: currentSizePx(),
  });
  lastDataUrl = dataUrl || '';
  const empty = !sanitizeStampText(text, state.type);
  $('stamp-preview-empty')?.classList.toggle('hidden', !empty);
  $('stamp-actions')?.classList.toggle('opacity-50', !lastDataUrl || empty);
  $('stamp-actions')?.classList.toggle('pointer-events-none', !lastDataUrl || empty);
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
  const slot = currentSlot();
  const label = sanitizeStampText($('stamp-text')?.value ?? '', state.type);
  const ok = writeStampHandoff({ slot, dataUrl: lastDataUrl, label });
  if (!ok) {
    showToast('印影データが大きすぎるか、ブラウザの保存領域が使えません。PNGを保存して請求書から画像選択してください。', 'warn');
    return;
  }
  window.location.href = '/invoice?from=stamp';
}

function bindEvents() {
  $('stamp-type-round')?.addEventListener('click', () => {
    state.type = 'round';
    if (state.sizePresetId === 'invoice-comp') state.sizePresetId = 'invoice-user';
    updateTypeUi();
    redraw();
  });
  $('stamp-type-square')?.addEventListener('click', () => {
    state.type = 'square';
    if (state.sizePresetId === 'invoice-user') state.sizePresetId = 'invoice-comp';
    updateTypeUi();
    redraw();
  });

  $('stamp-text')?.addEventListener('input', redraw);

  $('stamp-color')?.addEventListener('input', (e) => {
    state.color = e.target.value;
    redraw();
  });

  $('stamp-font')?.addEventListener('change', (e) => {
    state.fontStyle = e.target.value === 'kointai' ? 'kointai' : 'mincho';
    redraw();
  });

  $('stamp-tilt')?.addEventListener('input', (e) => {
    state.tiltDeg = Number(e.target.value);
    const label = $('stamp-tilt-val');
    if (label) label.textContent = `${state.tiltDeg}°`;
    redraw();
  });

  $('stamp-size')?.addEventListener('change', (e) => {
    state.sizePresetId = e.target.value;
    const preset = currentPreset();
    if (preset.slot === 'user') state.type = 'round';
    if (preset.slot === 'comp') state.type = 'square';
    updateTypeUi();
    redraw();
  });

  $('stamp-btn-download')?.addEventListener('click', () => {
    if (!lastDataUrl) return;
    downloadPngDataUrl(lastDataUrl, defaultFilename(state.type, currentSlot()));
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
    redraw();
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

function init() {
  parseInitialSlot();
  previewCanvas = $('stamp-canvas');
  fillSizeSelect();
  updateTypeUi();
  bindEvents();
  redraw();

  const params = new URLSearchParams(window.location.search);
  if (params.get('slot') === 'comp' || params.get('slot') === 'user') {
    showToast(`${stampSlotLabel(currentSlot())}向けに設定しました。`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
