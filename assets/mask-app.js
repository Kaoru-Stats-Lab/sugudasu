/**
 * mask.html — UI wiring
 */
import {
  applyBlackRect,
  applyMosaicRect,
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
  canvasWrap: document.getElementById('canvas-wrap'),
  status: document.getElementById('editor-status'),
  scaledNote: document.getElementById('scaled-note'),
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),
  btnDownload: document.getElementById('btn-download'),
  btnCopy: document.getElementById('btn-copy'),
  btnReset: document.getElementById('btn-reset'),
  stampRow: document.getElementById('stamp-row'),
};

const ctx = els.canvas.getContext('2d', { willReadFrequently: true });

/** @type {'black'|'mosaic'|'stamp'} */
let toolMode = 'black';
/** @type {'サンプル'|'ダミー'|'テスト'} */
let stampText = 'サンプル';
let mosaicBlock = 12;

let sourceName = 'screenshot.png';
/** @type {string[]} */
let undoStack = [];
/** @type {string[]} */
let redoStack = [];

let drawing = false;
let startX = 0;
let startY = 0;
let previewRect = null;
/** @type {string|null} */
let dragBaseUrl = null;

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle('text-rose-700', isError);
  els.status.classList.toggle('font-semibold', isError);
  els.status.classList.toggle('text-slate-500', !isError);
}

function pushHistory() {
  undoStack.push(snapshotCanvas(els.canvas));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function updateHistoryButtons() {
  els.btnUndo.disabled = undoStack.length === 0;
  els.btnRedo.disabled = redoStack.length === 0;
}

async function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(snapshotCanvas(els.canvas));
  const prev = undoStack.pop();
  await restoreSnapshot(els.canvas, ctx, prev);
  updateHistoryButtons();
  setStatus('1つ戻しました。塗り残しがないか確認してください。');
}

async function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(snapshotCanvas(els.canvas));
  const next = redoStack.pop();
  await restoreSnapshot(els.canvas, ctx, next);
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

function redrawWithPreview() {
  if (!previewRect || !dragBaseUrl) return;
  restoreSnapshot(els.canvas, ctx, dragBaseUrl).then(() => {
    const { x, y, w, h } = previewRect;
    ctx.save();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.restore();
  });
}

function applyTool(rect) {
  const { x, y, w, h } = rect;
  if (w < 4 || h < 4) return;
  if (toolMode === 'black') applyBlackRect(ctx, x, y, w, h);
  else if (toolMode === 'mosaic') applyMosaicRect(ctx, x, y, w, h, mosaicBlock);
  else applyStampRect(ctx, x, y, w, h, stampText);
  setStatus(
    toolMode === 'stamp'
      ? `スタンプ「${stampText}」を配置しました。下の実データは消えません。黒塗り/モザイクと併用してください。`
      : `${toolMode === 'black' ? '黒塗り' : 'モザイク'}を適用しました。`,
  );
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
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    undoStack = [];
    redoStack = [];
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
  try {
    await copyCanvasPng(els.canvas);
    setStatus('クリップボードにコピーしました。');
  } catch (e) {
    alert(e.message);
  }
}

function resetEditor() {
  undoStack = [];
  redoStack = [];
  showEditor(false);
  els.scaledNote.classList.add('hidden');
  setStatus('画像をドロップ · 選択 · Ctrl+V で貼り付け');
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

els.canvas.addEventListener('pointerdown', (e) => {
  els.canvas.setPointerCapture(e.pointerId);
  drawing = true;
  dragBaseUrl = snapshotCanvas(els.canvas);
  const p = canvasPoint(e);
  startX = p.x;
  startY = p.y;
  previewRect = null;
});

els.canvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  const p = canvasPoint(e);
  previewRect = normalizeRect(startX, startY, p.x, p.y, els.canvas.width, els.canvas.height);
  redrawWithPreview();
});

function endDraw(e) {
  if (!drawing) return;
  drawing = false;
  try {
    els.canvas.releasePointerCapture(e.pointerId);
  } catch {
    /* noop */
  }
  if (!previewRect || !dragBaseUrl) {
    dragBaseUrl = null;
    return;
  }
  const before = dragBaseUrl;
  dragBaseUrl = null;
  undoStack.push(before);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
  restoreSnapshot(els.canvas, ctx, before).then(() => applyTool(previewRect));
  previewRect = null;
}

els.canvas.addEventListener('pointerup', endDraw);
els.canvas.addEventListener('pointercancel', endDraw);

els.btnUndo.addEventListener('click', () => undo());
els.btnRedo.addEventListener('click', () => redo());
els.btnDownload.addEventListener('click', () => downloadPng());
els.btnCopy.addEventListener('click', () => copyPng());
els.btnReset.addEventListener('click', () => {
  if (confirm('別の画像を開きます。未保存の編集は失われます。')) resetEditor();
});

document.addEventListener('DOMContentLoaded', () => {
  if (window.SUGUDASU_SEGMENT) {
    window.SUGUDASU_SEGMENT.mount({
      segmentId: 'tool-segment',
      order: ['black', 'mosaic', 'stamp'],
      initial: 'black',
      hints: {
        black: '<strong>黒塗り:</strong> パスワード · 金額 · ID など確実に隠したい箇所向け。',
        mosaic: '<strong>モザイク:</strong> レイアウトを残しつつ内容だけ隠す。機密性が高い値は黒塗り推奨。',
        stamp: '<strong>スタンプ:</strong> 注記用。下の実データは消えません。黒塗り/モザイクと併用。',
      },
      hintId: 'tool-hint',
      modeClassMap: {
        black: 'sg-segment--mode-ec',
        mosaic: 'sg-segment--mode-csv',
        stamp: 'sg-segment--mode-fullwidth',
      },
      onChange: (value) => {
        toolMode = value;
        els.stampRow.classList.toggle('hidden', value !== 'stamp');
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
      segmentId: 'mosaic-segment',
      order: ['fine', 'coarse'],
      initial: 'fine',
      hints: {
        fine: '細かめ（12px）',
        coarse: '粗め（24px）',
      },
      hintId: 'mosaic-hint',
      onChange: (value) => {
        mosaicBlock = value === 'coarse' ? 24 : 12;
      },
    });
  }
  updateHistoryButtons();
  setStatus('画像をドロップ · 選択 · Ctrl+V で貼り付け');
});
