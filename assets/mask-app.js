/**
 * mask.html — UI wiring
 */
import {
  applyBlackRect,
  applyBlurRect,
  applyColorRect,
  applyStampRect,
  copyCanvasPng,
  canvasToPngBlob,
  formatBytes,
  imageFileFromClipboard,
  loadImageFromFile,
  MAX_HISTORY,
  normalizeRect,
  outputFilename,
  restoreSnapshot,
  snapshotCanvas,
  validateMaskInput,
} from './mask-engine.js';

const els = {
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  editor: document.getElementById('editor-panel'),
  canvas: document.getElementById('mask-canvas'),
  overlay: document.getElementById('mask-overlay'),
  canvasWrap: document.getElementById('canvas-wrap'),
  status: document.getElementById('editor-status'),
  scaledNote: document.getElementById('scaled-note'),
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),
  btnDownload: document.getElementById('btn-download'),
  btnCopy: document.getElementById('btn-copy'),
  btnReset: document.getElementById('btn-reset'),
  blurRow: document.getElementById('blur-row'),
  colorRow: document.getElementById('color-row'),
  stampRow: document.getElementById('stamp-row'),
  fillColor: document.getElementById('fill-color'),
};

const ctx = els.canvas.getContext('2d', { willReadFrequently: true });
const overlayCtx = els.overlay.getContext('2d');

/** @type {'blur'|'black'|'color'|'stamp'} */
let toolMode = 'blur';
/** @type {'サンプル'|'ダミー'|'テスト'} */
let stampText = 'サンプル';
let blurRadius = 8;
let fillColor = '#f8fafc';

let sourceName = 'screenshot.png';
/** @type {string[]} */
let undoStack = [];
/** @type {string[]} */
let redoStack = [];

let activeDrag = false;
let startX = 0;
let startY = 0;
/** @type {{ onMove: (e: PointerEvent) => void, onUp: (e: PointerEvent) => void }|null} */
let dragListeners = null;

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle('text-rose-700', isError);
  els.status.classList.toggle('font-semibold', isError);
  els.status.classList.toggle('text-slate-500', !isError);
}

function updateHistoryButtons() {
  els.btnUndo.disabled = undoStack.length === 0;
  els.btnRedo.disabled = redoStack.length === 0;
  const canCopy = !!navigator.clipboard && !!window.ClipboardItem && document.hasFocus();
  els.btnCopy.disabled = !canCopy;
}

function syncOverlaySize() {
  els.overlay.width = els.canvas.width;
  els.overlay.height = els.canvas.height;
}

function clearOverlay() {
  overlayCtx.clearRect(0, 0, els.overlay.width, els.overlay.height);
}

function drawPreviewStroke(rect) {
  clearOverlay();
  if (!rect) return;
  const { x, y, w, h } = rect;
  overlayCtx.save();
  overlayCtx.strokeStyle = '#0ea5e9';
  overlayCtx.lineWidth = 2;
  overlayCtx.setLineDash([6, 4]);
  overlayCtx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  overlayCtx.restore();
}

function toolStatusLabel() {
  if (toolMode === 'blur') return 'ぼかしを適用しました。パスワード・金額などは黒塗りも検討してください。';
  if (toolMode === 'black') return '黒塗りを適用しました。';
  if (toolMode === 'color') return '指定色で塗りました。文字は消えていません。機密はぼかし/黒塗りも併用してください。';
  return `スタンプ「${stampText}」を配置しました。下の実データは消えません。ぼかし/黒塗りと併用してください。`;
}

function applyTool(rect) {
  const { x, y, w, h } = rect;
  if (w < 4 || h < 4) return false;
  if (toolMode === 'blur') applyBlurRect(ctx, els.canvas, x, y, w, h, blurRadius);
  else if (toolMode === 'black') applyBlackRect(ctx, x, y, w, h);
  else if (toolMode === 'color') applyColorRect(ctx, x, y, w, h, fillColor);
  else applyStampRect(ctx, x, y, w, h, stampText);
  setStatus(toolStatusLabel());
  return true;
}

function updateToolRows(mode) {
  els.blurRow.classList.toggle('hidden', mode !== 'blur');
  els.colorRow.classList.toggle('hidden', mode !== 'color');
  els.stampRow.classList.toggle('hidden', mode !== 'stamp');
}

async function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(snapshotCanvas(els.canvas));
  const prev = undoStack.pop();
  await restoreSnapshot(els.canvas, ctx, prev);
  clearOverlay();
  updateHistoryButtons();
  setStatus('1つ戻しました。塗り残しがないか確認してください。');
}

async function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(snapshotCanvas(els.canvas));
  const next = redoStack.pop();
  await restoreSnapshot(els.canvas, ctx, next);
  clearOverlay();
  updateHistoryButtons();
  setStatus('やり直しました。');
}

function canvasPoint(evt) {
  const rect = els.canvas.getBoundingClientRect();
  const scaleX = els.canvas.width / rect.width;
  const scaleY = els.canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

function detachDrag() {
  if (!dragListeners) return;
  const { onMove, onUp } = dragListeners;
  document.removeEventListener('pointermove', onMove);
  document.removeEventListener('pointerup', onUp);
  document.removeEventListener('pointercancel', onUp);
  dragListeners = null;
}

function finishDrag(e) {
  detachDrag();
  if (!activeDrag) return;
  activeDrag = false;

  const finalRect = normalizeRect(
    startX,
    startY,
    canvasPoint(e).x,
    canvasPoint(e).y,
    els.canvas.width,
    els.canvas.height,
  );
  clearOverlay();

  if (finalRect.w < 4 || finalRect.h < 4) return;

  undoStack.push(snapshotCanvas(els.canvas));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
  applyTool(finalRect);
}

function attachDrag() {
  detachDrag();
  const onMove = (e) => {
    if (!activeDrag) return;
    const p = canvasPoint(e);
    const rect = normalizeRect(startX, startY, p.x, p.y, els.canvas.width, els.canvas.height);
    drawPreviewStroke(rect);
  };
  const onUp = (e) => finishDrag(e);
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
  dragListeners = { onMove, onUp };
}

function showEditor(show) {
  els.editor.classList.toggle('hidden', !show);
  els.dropZone.classList.toggle('hidden', show);
}

async function loadFile(file) {
  const check = validateMaskInput(file);
  if (!check.ok) {
    alert(check.message);
    return;
  }
  try {
    const { img, width, height, scaled, sourceName: name } = await loadImageFromFile(file);
    sourceName = name;
    els.canvas.width = width;
    els.canvas.height = height;
    syncOverlaySize();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    clearOverlay();
    undoStack = [];
    redoStack = [];
    activeDrag = false;
    detachDrag();
    updateHistoryButtons();
    showEditor(true);
    els.scaledNote.classList.toggle('hidden', !scaled);
    setStatus(`${width}×${height} · ${formatBytes(file.size)} — 隠したい範囲をドラッグ`);
  } catch (e) {
    alert(e.message || '読み込みに失敗しました。');
  }
}

async function downloadPng() {
  try {
    const blob = await canvasToPngBlob(els.canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFilename(sourceName);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus('PNG をダウンロードしました。貼り付け先で塗り残しを確認してください。');
  } catch (e) {
    alert(e.message);
  }
}

async function copyPng() {
  if (!document.hasFocus()) {
    setStatus('ウィンドウを一度クリックしてフォーカス後に「コピー」を押してください。', true);
    return;
  }
  try {
    await copyCanvasPng(els.canvas);
    setStatus('クリップボードにコピーしました。');
  } catch (e) {
    const raw = e?.message || '';
    if (raw.includes('Document is not focused') || e?.name === 'NotAllowedError') {
      setStatus('コピーはブラウザが前面表示・フォーカス中のみ使えます。前面にして再実行してください。', true);
      return;
    }
    setStatus(`コピーに失敗しました: ${raw || 'PNG保存をご利用ください。'}`, true);
  }
}

function resetEditor() {
  undoStack = [];
  redoStack = [];
  activeDrag = false;
  detachDrag();
  clearOverlay();
  showEditor(false);
  els.scaledNote.classList.add('hidden');
  setStatus('画像をドロップ · 選択 · Ctrl+V で貼り付け');
}

function beginDraw(e) {
  if (e.button !== 0 || els.editor.classList.contains('hidden')) return;
  e.preventDefault();
  activeDrag = true;
  const p = canvasPoint(e);
  startX = p.x;
  startY = p.y;
  clearOverlay();
  attachDrag();
}

els.dropZone.addEventListener('click', () => els.fileInput.click());
els.dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    els.fileInput.click();
  }
});
els.fileInput.addEventListener('change', () => {
  const f = els.fileInput.files && els.fileInput.files[0];
  if (f) loadFile(f);
  els.fileInput.value = '';
});

els.dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  els.dropZone.classList.add('border-sky-400', 'bg-sky-50/50');
});
els.dropZone.addEventListener('dragleave', () => {
  els.dropZone.classList.remove('border-sky-400', 'bg-sky-50/50');
});
els.dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  els.dropZone.classList.remove('border-sky-400', 'bg-sky-50/50');
  const f = e.dataTransfer?.files?.[0];
  if (f) loadFile(f);
});

document.addEventListener('paste', (e) => {
  const f = imageFileFromClipboard(e.clipboardData);
  if (!f) return;
  e.preventDefault();
  loadFile(f);
});

els.canvas.addEventListener('pointerdown', beginDraw);

els.btnUndo.addEventListener('click', () => undo());
els.btnRedo.addEventListener('click', () => redo());
els.btnDownload.addEventListener('click', () => downloadPng());
els.btnCopy.addEventListener('click', () => copyPng());
els.btnReset.addEventListener('click', () => {
  if (confirm('別の画像を開きます。未保存の編集は失われます。')) resetEditor();
});

if (els.fillColor) {
  els.fillColor.addEventListener('input', () => {
    fillColor = els.fillColor.value;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.SUGUDASU_SEGMENT) {
    window.SUGUDASU_SEGMENT.mount({
      segmentId: 'tool-segment',
      order: ['blur', 'black', 'color', 'stamp'],
      initial: 'blur',
      hints: {
        blur: '<strong>ぼかし:</strong> マニュアル向け。目立ちすぎず内容を読みにくくします。機密性が高い値は黒塗りも検討。',
        black: '<strong>黒塗り:</strong> パスワード · 金額 · ID など確実に隠したい箇所向け。',
        color: '<strong>同色塗り:</strong> 背景色に合わせて矩形を塗る。文字は消えません。',
        stamp: '<strong>スタンプ:</strong> 注記用。下の実データは消えません。ぼかし/黒塗りと併用。',
      },
      hintId: 'tool-hint',
      modeClassMap: {
        blur: 'sg-segment--mode-ec',
        black: 'sg-segment--mode-csv',
        color: 'sg-segment--mode-fullwidth',
        stamp: 'sg-segment--mode-fullwidth',
      },
      onChange: (value) => {
        toolMode = value;
        updateToolRows(value);
      },
    });

    window.SUGUDASU_SEGMENT.mount({
      segmentId: 'stamp-segment',
      order: ['サンプル', 'ダミー', 'テスト'],
      initial: 'サンプル',
      onChange: (value) => {
        stampText = value;
      },
    });

    window.SUGUDASU_SEGMENT.mount({
      segmentId: 'blur-segment',
      order: ['soft', 'strong'],
      initial: 'soft',
      hints: {
        soft: 'やわらかめ（8px）',
        strong: '強め（16px）',
      },
      hintId: 'blur-hint',
      onChange: (value) => {
        blurRadius = value === 'strong' ? 16 : 8;
      },
    });
  }
  updateToolRows(toolMode);
  updateHistoryButtons();
  setStatus('画像をドロップ · 選択 · Ctrl+V で貼り付け');
});

window.addEventListener('focus', updateHistoryButtons);
window.addEventListener('blur', updateHistoryButtons);
