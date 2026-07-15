/**
 * mask.html — UI wiring（機密消し + 注釈）
 */
import {
  applyBlackRect,
  applyBlurRect,
  applyColorRect,
  applyStampRect,
  copyCanvasPng,
  canvasToPngBlob,
  drawAnnotateShape,
  formatBytes,
  hitTestShapes,
  imageFileFromClipboard,
  loadImageFromFile,
  MAX_HISTORY,
  normalizeRect,
  outputFilename,
  restoreState,
  snapshotState,
  validateMaskInput,
} from './mask-engine.js';

const els = {
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  editor: document.getElementById('editor-panel'),
  canvas: document.getElementById('mask-canvas'),
  overlay: document.getElementById('mask-overlay'),
  status: document.getElementById('editor-status'),
  scaledNote: document.getElementById('scaled-note'),
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),
  btnDelete: document.getElementById('btn-delete-shape'),
  btnDownload: document.getElementById('btn-download'),
  btnCopy: document.getElementById('btn-copy'),
  btnReset: document.getElementById('btn-reset'),
  blurRow: document.getElementById('blur-row'),
  colorRow: document.getElementById('color-row'),
  stampRow: document.getElementById('stamp-row'),
  annotateRow: document.getElementById('annotate-row'),
  fillColor: document.getElementById('fill-color'),
};

const ctx = els.canvas.getContext('2d', { willReadFrequently: true });
const overlayCtx = els.overlay.getContext('2d');

/** 図形を載せないラスタ正本 */
const baseCanvas = document.createElement('canvas');
const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });

/** @type {'blur'|'black'|'color'|'stamp'|'annotate'} */
let toolMode = 'blur';
/** @type {'arrow'|'rect'} */
let annotateKind = 'arrow';
/** @type {'サンプル'|'ダミー'|'テスト'} */
let stampText = 'サンプル';
let blurRadius = 8;
let fillColor = '#f8fafc';

let sourceName = 'screenshot.png';
/** @type {{ png: string, shapesJson: string }[]} */
let undoStack = [];
/** @type {{ png: string, shapesJson: string }[]} */
let redoStack = [];
/** @type {import('./mask-engine.js').AnnotateShape[]} */
let shapes = [];
/** @type {string|null} */
let selectedId = null;
let shapeSeq = 1;

let activeDrag = false;
let startX = 0;
let startY = 0;
/** @type {'draw'|'edit'|null} */
let dragMode = null;
/** @type {string|null} */
let editHandle = null;
/** @type {import('./mask-engine.js').AnnotateShape|null} */
let editShape = null;
/** @type {import('./mask-engine.js').AnnotateShape|null} */
let editSnapshot = null;

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
  els.btnDelete.disabled = !selectedId || toolMode !== 'annotate';
  const canCopy = !!navigator.clipboard && !!window.ClipboardItem && document.hasFocus();
  els.btnCopy.disabled = !canCopy;
}

function syncOverlaySize() {
  els.overlay.width = els.canvas.width;
  els.overlay.height = els.canvas.height;
}

function syncBaseSize() {
  baseCanvas.width = els.canvas.width;
  baseCanvas.height = els.canvas.height;
}

function clearOverlay() {
  overlayCtx.clearRect(0, 0, els.overlay.width, els.overlay.height);
}

function cloneShapes(list) {
  return JSON.parse(JSON.stringify(list));
}

function pushUndo() {
  undoStack.push(snapshotState(baseCanvas, shapes));
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function paint() {
  const w = els.canvas.width;
  const h = els.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(baseCanvas, 0, 0);
  for (const s of shapes) {
    drawAnnotateShape(ctx, s, s.id === selectedId);
  }
}

function flattenShapesToBase() {
  if (!shapes.length) return;
  for (const s of shapes) {
    drawAnnotateShape(baseCtx, s, false);
  }
  shapes = [];
  selectedId = null;
  paint();
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
  if (toolMode === 'annotate') return '注釈を追加しました。';
  return `スタンプ「${stampText}」を配置しました。下の実データは消えません。ぼかし/黒塗りと併用してください。`;
}

function applyMaskTool(rect) {
  const { x, y, w, h } = rect;
  if (w < 4 || h < 4) return false;
  if (toolMode === 'blur') applyBlurRect(baseCtx, baseCanvas, x, y, w, h, blurRadius);
  else if (toolMode === 'black') applyBlackRect(baseCtx, x, y, w, h);
  else if (toolMode === 'color') applyColorRect(baseCtx, x, y, w, h, fillColor);
  else if (toolMode === 'stamp') applyStampRect(baseCtx, x, y, w, h, stampText);
  else return false;
  paint();
  setStatus(toolStatusLabel());
  return true;
}

function updateToolRows(mode) {
  els.blurRow.classList.toggle('hidden', mode !== 'blur');
  els.colorRow.classList.toggle('hidden', mode !== 'color');
  els.stampRow.classList.toggle('hidden', mode !== 'stamp');
  els.annotateRow.classList.toggle('hidden', mode !== 'annotate');
  updateHistoryButtons();
}

async function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(snapshotState(baseCanvas, shapes));
  const prev = undoStack.pop();
  shapes = await restoreState(baseCanvas, baseCtx, prev);
  selectedId = null;
  clearOverlay();
  paint();
  updateHistoryButtons();
  setStatus('1つ戻しました。');
}

async function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(snapshotState(baseCanvas, shapes));
  const next = redoStack.pop();
  shapes = await restoreState(baseCanvas, baseCtx, next);
  selectedId = null;
  clearOverlay();
  paint();
  updateHistoryButtons();
  setStatus('やり直しました。');
}

function deleteSelectedShape() {
  if (!selectedId) return;
  const idx = shapes.findIndex((s) => s.id === selectedId);
  if (idx < 0) return;
  pushUndo();
  shapes.splice(idx, 1);
  selectedId = null;
  paint();
  updateHistoryButtons();
  setStatus('図形を削除しました。');
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

function nextShapeId() {
  shapeSeq += 1;
  return `s${shapeSeq}`;
}

function finishMaskDrag(e) {
  detachDrag();
  if (!activeDrag) return;
  activeDrag = false;
  dragMode = null;

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

  pushUndo();
  flattenShapesToBase();
  applyMaskTool(finalRect);
}

function attachMaskDrag() {
  detachDrag();
  const onMove = (e) => {
    if (!activeDrag) return;
    const p = canvasPoint(e);
    const rect = normalizeRect(startX, startY, p.x, p.y, els.canvas.width, els.canvas.height);
    drawPreviewStroke(rect);
  };
  const onUp = (e) => finishMaskDrag(e);
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
  dragListeners = { onMove, onUp };
}

function applyEditHandle(shape, handle, x, y) {
  if (shape.type === 'arrow') {
    if (handle === 'start') {
      shape.x0 = x;
      shape.y0 = y;
    } else if (handle === 'end' || handle === 'body') {
      if (handle === 'body' && editSnapshot && editSnapshot.type === 'arrow') {
        const dx = x - startX;
        const dy = y - startY;
        shape.x0 = editSnapshot.x0 + dx;
        shape.y0 = editSnapshot.y0 + dy;
        shape.x1 = editSnapshot.x1 + dx;
        shape.y1 = editSnapshot.y1 + dy;
      } else {
        shape.x1 = x;
        shape.y1 = y;
      }
    }
    return;
  }
  if (shape.type === 'rect') {
    if (handle === 'body' && editSnapshot && editSnapshot.type === 'rect') {
      const dx = x - startX;
      const dy = y - startY;
      shape.x = editSnapshot.x + dx;
      shape.y = editSnapshot.y + dy;
      return;
    }
    const snap = editSnapshot && editSnapshot.type === 'rect' ? editSnapshot : shape;
    let x0 = snap.x;
    let y0 = snap.y;
    let x1 = snap.x + snap.w;
    let y1 = snap.y + snap.h;
    if (handle === 'nw') { x0 = x; y0 = y; }
    else if (handle === 'ne') { x1 = x; y0 = y; }
    else if (handle === 'sw') { x0 = x; y1 = y; }
    else if (handle === 'se') { x1 = x; y1 = y; }
    const r = normalizeRect(x0, y0, x1, y1, els.canvas.width, els.canvas.height);
    shape.x = r.x;
    shape.y = r.y;
    shape.w = Math.max(8, r.w);
    shape.h = Math.max(8, r.h);
  }
}

function attachAnnotateDrag() {
  detachDrag();
  const onMove = (e) => {
    if (!activeDrag) return;
    const p = canvasPoint(e);
    if (dragMode === 'draw' && editShape) {
      if (editShape.type === 'arrow') {
        editShape.x1 = p.x;
        editShape.y1 = p.y;
      } else {
        const r = normalizeRect(startX, startY, p.x, p.y, els.canvas.width, els.canvas.height);
        editShape.x = r.x;
        editShape.y = r.y;
        editShape.w = r.w;
        editShape.h = r.h;
      }
      paint();
      return;
    }
    if (dragMode === 'edit' && editShape && editHandle) {
      applyEditHandle(editShape, editHandle, p.x, p.y);
      paint();
    }
  };
  const onUp = () => {
    detachDrag();
    if (!activeDrag) return;
    activeDrag = false;

    if (dragMode === 'draw' && editShape) {
      const draft = editShape;
      const tooSmall = draft.type === 'arrow'
        ? Math.hypot(draft.x1 - draft.x0, draft.y1 - draft.y0) < 8
        : draft.w < 8 || draft.h < 8;
      if (tooSmall) {
        shapes = shapes.filter((s) => s.id !== draft.id);
        selectedId = null;
      } else {
        shapes = shapes.filter((s) => s.id !== draft.id);
        pushUndo();
        shapes.push(draft);
        selectedId = draft.id;
        setStatus(toolStatusLabel());
      }
      paint();
    } else if (dragMode === 'edit' && editShape) {
      setStatus('図形を調整しました。');
      paint();
    }
    dragMode = null;
    editHandle = null;
    editShape = null;
    editSnapshot = null;
    updateHistoryButtons();
  };
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
    syncBaseSize();
    syncOverlaySize();
    baseCtx.clearRect(0, 0, width, height);
    baseCtx.drawImage(img, 0, 0, width, height);
    shapes = [];
    selectedId = null;
    clearOverlay();
    paint();
    undoStack = [];
    redoStack = [];
    activeDrag = false;
    detachDrag();
    updateHistoryButtons();
    showEditor(true);
    els.scaledNote.classList.toggle('hidden', !scaled);
    const hint = toolMode === 'annotate'
      ? 'ドラッグで矢印または枠を追加'
      : '隠したい範囲をドラッグ';
    setStatus(`${width}×${height} · ${formatBytes(file.size)} — ${hint}`);
  } catch (e) {
    alert(e.message || '読み込みに失敗しました。');
  }
}

async function downloadPng() {
  try {
    paint();
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
    paint();
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
  shapes = [];
  selectedId = null;
  activeDrag = false;
  detachDrag();
  clearOverlay();
  showEditor(false);
  els.scaledNote.classList.add('hidden');
  setStatus('画像をドロップ · 選択 · Ctrl+V で貼り付け');
  updateHistoryButtons();
}

function beginDraw(e) {
  if (e.button !== 0 || els.editor.classList.contains('hidden')) return;
  e.preventDefault();
  const p = canvasPoint(e);
  startX = p.x;
  startY = p.y;
  clearOverlay();

  if (toolMode === 'annotate') {
    const hit = hitTestShapes(shapes, p.x, p.y);
    if (hit) {
      pushUndo();
      selectedId = hit.shape.id;
      dragMode = 'edit';
      editHandle = hit.handle;
      editShape = hit.shape;
      editSnapshot = cloneShapes([hit.shape])[0];
      activeDrag = true;
      paint();
      updateHistoryButtons();
      attachAnnotateDrag();
      return;
    }

    const id = nextShapeId();
    /** @type {import('./mask-engine.js').AnnotateShape} */
    let shape;
    if (annotateKind === 'arrow') {
      shape = { id, type: 'arrow', x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    } else {
      shape = { id, type: 'rect', x: p.x, y: p.y, w: 1, h: 1 };
    }
    shapes.push(shape);
    selectedId = id;
    editShape = shape;
    dragMode = 'draw';
    activeDrag = true;
    paint();
    attachAnnotateDrag();
    return;
  }

  activeDrag = true;
  dragMode = 'draw';
  attachMaskDrag();
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
els.btnDelete.addEventListener('click', () => deleteSelectedShape());
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

document.addEventListener('keydown', (e) => {
  if (els.editor.classList.contains('hidden')) return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // DECISION: 「戻す」ボタンがある履歴UIは Ctrl/Cmd+Z を必須配線（ボタンと対）。Redo は OS差吸収で Y と Shift+Z 両方。
  if (mod && key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
    return;
  }
  if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
    e.preventDefault();
    redo();
    return;
  }

  if ((e.key === 'Delete' || e.key === 'Backspace') && toolMode === 'annotate' && selectedId) {
    e.preventDefault();
    deleteSelectedShape();
    return;
  }
  if (toolMode !== 'annotate') return;
  if (e.key === 'a' || e.key === 'A') {
    annotateKind = 'arrow';
    const btn = document.querySelector('#annotate-segment [data-segment-value="arrow"]');
    if (btn) btn.click();
  }
  if (e.key === 'r' || e.key === 'R') {
    annotateKind = 'rect';
    const btn = document.querySelector('#annotate-segment [data-segment-value="rect"]');
    if (btn) btn.click();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (window.SUGUDASU_SEGMENT) {
    window.SUGUDASU_SEGMENT.mount({
      segmentId: 'tool-segment',
      order: ['blur', 'black', 'color', 'stamp', 'annotate'],
      initial: 'blur',
      hints: {
        blur: '<strong>ぼかし:</strong> マニュアル向け。目立ちすぎず内容を読みにくくします。機密性が高い値は黒塗りも検討。',
        black: '<strong>黒塗り:</strong> パスワード · 金額 · ID など確実に隠したい箇所向け。',
        color: '<strong>同色塗り:</strong> 背景色に合わせて矩形を塗る。文字は消えません。',
        stamp: '<strong>スタンプ:</strong> 注記用。下の実データは消えません。ぼかし/黒塗りと併用。',
        annotate: '<strong>注釈:</strong> 本家 Skitch 型のマゼンタ矢印・枠（色固定 · 白フチ · 影）。図形を選んで削除できます。',
      },
      hintId: 'tool-hint',
      modeClassMap: {
        blur: 'sg-segment--mode-ec',
        black: 'sg-segment--mode-csv',
        color: 'sg-segment--mode-fullwidth',
        stamp: 'sg-segment--mode-fullwidth',
        annotate: 'sg-segment--mode-fullwidth',
      },
      onChange: (value) => {
        toolMode = value;
        if (value !== 'annotate') selectedId = null;
        updateToolRows(value);
        paint();
        if (value === 'annotate') {
          setStatus('ドラッグで矢印または枠。選択して削除できます。');
        }
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

    window.SUGUDASU_SEGMENT.mount({
      segmentId: 'annotate-segment',
      order: ['arrow', 'rect'],
      initial: 'arrow',
      hints: {
        arrow: 'ドラッグで矢印（先端が指す側）。',
        rect: 'ドラッグで角丸の枠（塗りなし）。',
      },
      hintId: 'annotate-hint',
      onChange: (value) => {
        annotateKind = value === 'rect' ? 'rect' : 'arrow';
      },
    });
  }
  updateToolRows(toolMode);
  updateHistoryButtons();
  setStatus('画像をドロップ · 選択 · Ctrl+V で貼り付け');
});

window.addEventListener('focus', updateHistoryButtons);
window.addEventListener('blur', updateHistoryButtons);
