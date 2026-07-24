/**
 * annotate.html — SUGUDASU 赤入れ
 */
import {
  applyBlackRect,
  applyBlurRect,
  applyMosaicRect,
  buildPartialAnnotatedPdf,
  canvasToJpegBlob,
  canvasToPngBlob,
  copyCanvasPng,
  drawAnnotateShape,
  formatBytes,
  hitTestShapes,
  imageFileFromClipboard,
  loadImageFromFile,
  MAX_HISTORY,
  MAX_PDF_PAGES,
  normalizeRect,
  outputFilename,
  outputFilenameExt,
  PDF_RENDER_SCALE,
  restoreState,
  snapshotState,
  validateAnnotateInput,
} from './annotate-engine.js';

const els = {
  dropZone: document.getElementById('drop-zone'),
  dropPanel: document.getElementById('drop-panel'),
  fileInput: document.getElementById('file-input'),
  editor: document.getElementById('editor-panel'),
  work: document.getElementById('annt-work'),
  canvas: document.getElementById('annt-canvas'),
  canvasHost: document.getElementById('annt-canvas-host'),
  overlay: document.getElementById('annt-overlay'),
  status: document.getElementById('editor-status'),
  scaledNote: document.getElementById('scaled-note'),
  pdfNav: document.getElementById('pdf-nav'),
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),
  btnDelete: document.getElementById('btn-delete-shape'),
  btnCopy: document.getElementById('btn-copy'),
  btnPng: document.getElementById('btn-download-png'),
  btnJpeg: document.getElementById('btn-download-jpeg'),
  btnPdf: document.getElementById('btn-download-pdf'),
  btnReset: document.getElementById('btn-reset'),
  toolBtns: Array.from(document.querySelectorAll('.annt-tool-btn[data-tool]')),
};

const ctx = els.canvas.getContext('2d', { willReadFrequently: true });
const overlayCtx = els.overlay.getContext('2d');
const baseCanvas = document.createElement('canvas');
const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });

/** @type {'select'|'black'|'blur'|'mosaic'|'arrow'|'rect'|'ellipse'} */
let toolMode = 'black';
let blurRadius = 8;
let sourceName = 'screenshot.png';
/** @type {'image'|'pdf'} */
let inputKind = 'image';

/** @type {{ png: string, shapesJson: string }[]} */
let undoStack = [];
/** @type {{ png: string, shapesJson: string }[]} */
let redoStack = [];
/** @type {import('./annotate-engine.js').AnnotateShape[]} */
let shapes = [];
/** @type {string|null} */
let selectedId = null;
let shapeSeq = 1;

let activeDrag = false;
let startX = 0;
let startY = 0;
/** @type {'draw'|'edit'|'mask'|null} */
let dragMode = null;
/** @type {string|null} */
let editHandle = null;
/** @type {import('./annotate-engine.js').AnnotateShape|null} */
let editShape = null;
/** @type {import('./annotate-engine.js').AnnotateShape|null} */
let editSnapshot = null;
/** @type {{ onMove: (e: PointerEvent) => void, onUp: (e: PointerEvent) => void }|null} */
let dragListeners = null;

/** PDF state */
/** @type {Uint8Array|null} */
let sourcePdfBytes = null;
/** @type {import('../vendor/pdfjs/pdf.mjs').PDFDocumentProxy|null} */
let pdfDoc = null;
let pageCount = 0;
let pageIndex = 0;
/** @type {Map<number, { shapesJson: string, basePng: string, edited: boolean }>} */
const pdfPageStore = new Map();

/** @type {import('../vendor/pdfjs/pdf.mjs')|null} */
let pdfjsLib = null;

function vendorPdfjs(rel) {
  return new URL(`./vendor/pdfjs/${rel}`, import.meta.url).href;
}
function vendorPdflib() {
  return new URL('./vendor/pdf-lib/pdf-lib.esm.min.js', import.meta.url).href;
}

async function ensurePdfjs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import(vendorPdfjs('pdf.mjs'));
  pdfjsLib.GlobalWorkerOptions.workerSrc = vendorPdfjs('pdf.worker.mjs');
  return pdfjsLib;
}

let editUndoPushed = false;

function isDrawShapeTool(mode = toolMode) {
  return mode === 'arrow' || mode === 'rect' || mode === 'ellipse';
}
function isShapeTool(mode = toolMode) {
  return mode === 'select' || isDrawShapeTool(mode);
}
function isMaskTool(mode = toolMode) {
  return mode === 'black' || mode === 'blur' || mode === 'mosaic';
}

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle('text-rose-700', isError);
  els.status.classList.toggle('font-semibold', isError);
  els.status.classList.toggle('text-slate-500', !isError);
}

function setTool(mode) {
  toolMode = mode;
  els.toolBtns.forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.tool === mode ? 'true' : 'false');
  });
  if (mode !== 'select' && !isShapeTool(mode)) selectedId = null;
  els.canvas.classList.toggle('cursor-crosshair', mode !== 'select');
  els.canvas.classList.toggle('cursor-default', mode === 'select');
  updateHistoryButtons();
  paint();
  if (mode === 'select') setStatus('クリックで選択 · ドラッグで移動');
  else if (isDrawShapeTool(mode)) setStatus('ドラッグで図形を追加');
  else setStatus('隠したい範囲をドラッグ');
}

function updateHistoryButtons() {
  els.btnUndo.disabled = undoStack.length === 0;
  els.btnRedo.disabled = redoStack.length === 0;
  els.btnDelete.disabled = !selectedId || !isShapeTool(toolMode);
  els.btnCopy.disabled = !(navigator.clipboard && window.ClipboardItem);
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
  ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
  ctx.drawImage(baseCanvas, 0, 0);
  for (const s of shapes) drawAnnotateShape(ctx, s, s.id === selectedId);
}

function flattenShapesToBase() {
  if (!shapes.length) return;
  for (const s of shapes) drawAnnotateShape(baseCtx, s, false);
  shapes = [];
  selectedId = null;
  paint();
}

function drawPreviewStroke(rect) {
  clearOverlay();
  if (!rect) return;
  overlayCtx.save();
  overlayCtx.strokeStyle = '#0ea5e9';
  overlayCtx.lineWidth = 2;
  overlayCtx.setLineDash([6, 4]);
  overlayCtx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  overlayCtx.restore();
}

function markPdfPageEdited() {
  if (inputKind !== 'pdf') return;
  const entry = pdfPageStore.get(pageIndex) || { shapesJson: '[]', basePng: '', edited: false };
  entry.edited = true;
  pdfPageStore.set(pageIndex, entry);
  buildPdfNav();
}

function saveCurrentPdfPageState() {
  if (inputKind !== 'pdf') return;
  pdfPageStore.set(pageIndex, {
    basePng: baseCanvas.toDataURL('image/png'),
    shapesJson: JSON.stringify(shapes),
    edited: pdfPageStore.get(pageIndex)?.edited || shapes.length > 0,
  });
}

async function loadPdfPageState(index) {
  const lib = await ensurePdfjs();
  const page = await pdfDoc.getPage(index + 1);
  const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
  const w = Math.round(viewport.width);
  const h = Math.round(viewport.height);
  els.canvas.width = w;
  els.canvas.height = h;
  syncBaseSize();
  syncOverlaySize();
  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = w;
  renderCanvas.height = h;
  await page.render({ canvasContext: renderCanvas.getContext('2d'), viewport }).promise;

  const stored = pdfPageStore.get(index);
  if (stored && stored.basePng) {
    await restoreState(baseCanvas, baseCtx, { png: stored.basePng, shapesJson: stored.shapesJson });
    shapes = JSON.parse(stored.shapesJson || '[]');
  } else {
    baseCtx.clearRect(0, 0, w, h);
    baseCtx.drawImage(renderCanvas, 0, 0);
    shapes = [];
    pdfPageStore.set(index, { basePng: baseCanvas.toDataURL('image/png'), shapesJson: '[]', edited: false });
  }
  selectedId = null;
  undoStack = [];
  redoStack = [];
  clearOverlay();
  paint();
  pageIndex = index;
  buildPdfNav();
  setStatus(`PDF ${index + 1} / ${pageCount} ページ`);
}

function buildPdfNav() {
  if (inputKind !== 'pdf' || pageCount <= 1) {
    els.pdfNav.classList.add('hidden');
    els.pdfNav.innerHTML = '';
    return;
  }
  els.pdfNav.classList.remove('hidden');
  els.pdfNav.innerHTML = '';
  const label = document.createElement('span');
  label.className = 'text-xs text-slate-600 font-semibold';
  label.textContent = 'ページ:';
  els.pdfNav.appendChild(label);
  for (let i = 0; i < pageCount; i += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'annt-page-btn';
    btn.textContent = String(i + 1);
    if (pdfPageStore.get(i)?.edited) btn.classList.add('is-edited');
    if (i === pageIndex) btn.setAttribute('aria-current', 'page');
    btn.addEventListener('click', async () => {
      if (i === pageIndex) return;
      saveCurrentPdfPageState();
      await loadPdfPageState(i);
    });
    els.pdfNav.appendChild(btn);
  }
}

function applyMaskTool(rect) {
  const { x, y, w, h } = rect;
  if (w < 4 || h < 4) return false;
  const blockSize = Math.max(8, Math.round(12 * (els.canvas.width / 1200)));
  if (toolMode === 'blur') applyBlurRect(baseCtx, baseCanvas, x, y, w, h, blurRadius);
  else if (toolMode === 'black') applyBlackRect(baseCtx, x, y, w, h);
  else if (toolMode === 'mosaic') applyMosaicRect(baseCtx, x, y, w, h, blockSize);
  else return false;
  markPdfPageEdited();
  paint();
  return true;
}

function canvasPoint(evt) {
  const rect = els.canvas.getBoundingClientRect();
  const scaleX = els.canvas.width / rect.width;
  const scaleY = els.canvas.height / rect.height;
  return { x: (evt.clientX - rect.left) * scaleX, y: (evt.clientY - rect.top) * scaleY };
}

function detachDrag() {
  if (!dragListeners) return;
  document.removeEventListener('pointermove', dragListeners.onMove);
  document.removeEventListener('pointerup', dragListeners.onUp);
  document.removeEventListener('pointercancel', dragListeners.onUp);
  dragListeners = null;
}

function nextShapeId() {
  shapeSeq += 1;
  return `s${shapeSeq}`;
}

function applyEditHandle(shape, handle, x, y) {
  if (shape.type === 'arrow') {
    if (handle === 'start') { shape.x0 = x; shape.y0 = y; }
    else if (handle === 'end' || handle === 'body') {
      if (handle === 'body' && editSnapshot?.type === 'arrow') {
        const dx = x - startX; const dy = y - startY;
        shape.x0 = editSnapshot.x0 + dx; shape.y0 = editSnapshot.y0 + dy;
        shape.x1 = editSnapshot.x1 + dx; shape.y1 = editSnapshot.y1 + dy;
      } else { shape.x1 = x; shape.y1 = y; }
    }
    return;
  }
  if (shape.type === 'text') {
    if (handle === 'body' && editSnapshot?.type === 'text') {
      shape.x = editSnapshot.x + (x - startX);
      shape.y = editSnapshot.y + (y - startY);
    }
    return;
  }
  if (shape.type === 'rect' || shape.type === 'ellipse') {
    if (handle === 'body' && editSnapshot && (editSnapshot.type === 'rect' || editSnapshot.type === 'ellipse')) {
      shape.x = editSnapshot.x + (x - startX);
      shape.y = editSnapshot.y + (y - startY);
      return;
    }
    const snap = editSnapshot && (editSnapshot.type === 'rect' || editSnapshot.type === 'ellipse') ? editSnapshot : shape;
    let x0 = snap.x; let y0 = snap.y; let x1 = snap.x + snap.w; let y1 = snap.y + snap.h;
    if (handle === 'nw') { x0 = x; y0 = y; }
    else if (handle === 'ne') { x1 = x; y0 = y; }
    else if (handle === 'sw') { x0 = x; y1 = y; }
    else if (handle === 'se') { x1 = x; y1 = y; }
    const r = normalizeRect(x0, y0, x1, y1, els.canvas.width, els.canvas.height);
    shape.x = r.x; shape.y = r.y; shape.w = Math.max(8, r.w); shape.h = Math.max(8, r.h);
  }
}

function attachAnnotateDrag() {
  detachDrag();
  editUndoPushed = false;
  const onMove = (e) => {
    if (!activeDrag) return;
    const p = canvasPoint(e);
    if (dragMode === 'draw' && editShape) {
      if (editShape.type === 'arrow') { editShape.x1 = p.x; editShape.y1 = p.y; }
      else if (editShape.type === 'text') { /* fixed */ }
      else {
        const r = normalizeRect(startX, startY, p.x, p.y, els.canvas.width, els.canvas.height);
        editShape.x = r.x; editShape.y = r.y; editShape.w = r.w; editShape.h = r.h;
      }
      paint();
    } else if (dragMode === 'edit' && editShape && editHandle) {
      if (!editUndoPushed) {
        pushUndo();
        editUndoPushed = true;
      }
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
        : draft.type === 'text' ? false : draft.w < 8 || draft.h < 8;
      if (tooSmall && draft.type !== 'text') {
        shapes = shapes.filter((s) => s.id !== draft.id);
        selectedId = null;
      } else {
        shapes = shapes.filter((s) => s.id !== draft.id);
        pushUndo();
        shapes.push(draft);
        selectedId = draft.id;
        markPdfPageEdited();
      }
      paint();
    } else if (dragMode === 'edit') {
      if (editUndoPushed) markPdfPageEdited();
    }
    dragMode = null; editHandle = null; editShape = null; editSnapshot = null;
    editUndoPushed = false;
    updateHistoryButtons();
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
  dragListeners = { onMove, onUp };
}

function attachMaskDrag() {
  detachDrag();
  const onMove = (e) => {
    if (!activeDrag) return;
    drawPreviewStroke(normalizeRect(startX, startY, canvasPoint(e).x, canvasPoint(e).y, els.canvas.width, els.canvas.height));
  };
  const onUp = (e) => {
    detachDrag();
    if (!activeDrag) return;
    activeDrag = false;
    dragMode = null;
    const finalRect = normalizeRect(startX, startY, canvasPoint(e).x, canvasPoint(e).y, els.canvas.width, els.canvas.height);
    clearOverlay();
    if (finalRect.w < 4 || finalRect.h < 4) return;
    pushUndo();
    flattenShapesToBase();
    if (!applyMaskTool(finalRect)) {
      setStatus('マスクを適用できませんでした。別の範囲をお試しください。', true);
    }
    updateHistoryButtons();
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
  dragListeners = { onMove, onUp };
}

function beginDraw(e) {
  if (e.button !== 0 || els.editor.classList.contains('hidden')) return;
  e.preventDefault();
  try { els.canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  const p = canvasPoint(e);
  startX = p.x; startY = p.y;
  clearOverlay();

  const hit = hitTestShapes(shapes, p.x, p.y);
  if (hit && (toolMode === 'select' || isDrawShapeTool(toolMode))) {
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

  if (toolMode === 'select') {
    selectedId = null;
    paint();
    updateHistoryButtons();
    return;
  }

  if (isDrawShapeTool(toolMode)) {
    const id = nextShapeId();
    /** @type {import('./annotate-engine.js').AnnotateShape} */
    let shape;
    if (toolMode === 'arrow') shape = { id, type: 'arrow', x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    else if (toolMode === 'ellipse') shape = { id, type: 'ellipse', x: p.x, y: p.y, w: 1, h: 1 };
    else shape = { id, type: 'rect', x: p.x, y: p.y, w: 1, h: 1 };
    shapes.push(shape);
    selectedId = id;
    editShape = shape;
    dragMode = 'draw';
    activeDrag = true;
    paint();
    attachAnnotateDrag();
    return;
  }

  if (isMaskTool(toolMode)) {
    activeDrag = true;
    dragMode = 'mask';
    attachMaskDrag();
  }
}

async function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshotState(baseCanvas, shapes));
  shapes = await restoreState(baseCanvas, baseCtx, undoStack.pop());
  selectedId = null;
  clearOverlay();
  paint();
  updateHistoryButtons();
}

async function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshotState(baseCanvas, shapes));
  shapes = await restoreState(baseCanvas, baseCtx, redoStack.pop());
  selectedId = null;
  clearOverlay();
  paint();
  updateHistoryButtons();
}

function deleteSelectedShape() {
  if (!selectedId) return;
  pushUndo();
  shapes = shapes.filter((s) => s.id !== selectedId);
  selectedId = null;
  markPdfPageEdited();
  paint();
  updateHistoryButtons();
}

function showEditor(show) {
  els.editor.classList.toggle('hidden', !show);
  els.dropPanel.classList.toggle('hidden', show);
  els.work.classList.toggle('is-open', show);
}

async function loadImageFile(file) {
  const { img, width, height, scaled, sourceName: name } = await loadImageFromFile(file);
  inputKind = 'image';
  sourcePdfBytes = null;
  pdfDoc = null;
  pageCount = 0;
  pdfPageStore.clear();
  els.btnPdf.classList.add('hidden');
  els.pdfNav.classList.add('hidden');
  sourceName = name;
  els.canvas.width = width;
  els.canvas.height = height;
  syncBaseSize();
  syncOverlaySize();
  baseCtx.clearRect(0, 0, width, height);
  baseCtx.drawImage(img, 0, 0, width, height);
  shapes = [];
  selectedId = null;
  undoStack = [];
  redoStack = [];
  clearOverlay();
  paint();
  showEditor(true);
  els.scaledNote.classList.toggle('hidden', !scaled);
  setTool('black');
  setStatus(`${width}×${height} · ${formatBytes(file.size)}`);
}

async function loadPdfFile(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const lib = await ensurePdfjs();
  const doc = await lib.getDocument({ data: bytes.slice(0), wasmUrl: vendorPdfjs('wasm/') }).promise;
  if (doc.numPages > MAX_PDF_PAGES) {
    await doc.destroy();
    throw new Error(`PDF は ${MAX_PDF_PAGES} ページまでです。`);
  }
  if (pdfDoc) try { await pdfDoc.destroy(); } catch { /* ignore */ }
  pdfDoc = doc;
  sourcePdfBytes = bytes;
  inputKind = 'pdf';
  pageCount = doc.numPages;
  pageIndex = 0;
  pdfPageStore.clear();
  sourceName = file.name || 'document.pdf';
  els.btnPdf.classList.remove('hidden');
  showEditor(true);
  els.scaledNote.classList.add('hidden');
  await loadPdfPageState(0);
  setTool('black');
}

async function loadFile(file) {
  const check = validateAnnotateInput(file);
  if (!check.ok) { alert(check.message); return; }
  try {
    if (check.kind === 'pdf') await loadPdfFile(file);
    else await loadImageFile(file);
  } catch (e) {
    alert(e.message || '読み込みに失敗しました。');
  }
}

function compositeCanvas() {
  paint();
  return els.canvas;
}

async function downloadPng() {
  const blob = await canvasToPngBlob(compositeCanvas());
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = outputFilename(sourceName);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  setStatus('PNG を保存しました。');
}

async function downloadJpeg() {
  const blob = await canvasToJpegBlob(compositeCanvas());
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = outputFilenameExt(sourceName, 'jpeg');
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  setStatus('JPEG を保存しました。');
}

async function copyOutput() {
  if (!document.hasFocus()) {
    setStatus('ウィンドウをクリックしてフォーカス後にコピーしてください。', true);
    return;
  }
  try {
    await copyCanvasPng(compositeCanvas());
    setStatus('クリップボードにコピーしました。');
  } catch (e) {
    setStatus(e.message || 'コピーに失敗しました。', true);
  }
}

async function rasterizePageForExport(index) {
  saveCurrentPdfPageState();
  const stored = pdfPageStore.get(index);
  if (!stored?.edited) return null;
  const tmp = document.createElement('canvas');
  tmp.width = els.canvas.width;
  tmp.height = els.canvas.height;
  if (index === pageIndex) {
    paint();
    tmp.getContext('2d').drawImage(els.canvas, 0, 0);
  } else {
    const tctx = tmp.getContext('2d');
    await restoreState(tmp, tctx, { png: stored.basePng, shapesJson: stored.shapesJson });
    const pageShapes = JSON.parse(stored.shapesJson || '[]');
    for (const s of pageShapes) drawAnnotateShape(tctx, s, false);
  }
  const blob = await canvasToJpegBlob(tmp, 0.92);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { bytes, width: tmp.width, height: tmp.height, mime: /** @type {const} */ ('image/jpeg') };
}

async function downloadPdf() {
  if (inputKind !== 'pdf' || !sourcePdfBytes || !pdfDoc) return;
  saveCurrentPdfPageState();
  try {
    const pdfBytes = await buildPartialAnnotatedPdf(
      sourcePdfBytes,
      pageCount,
      (i) => rasterizePageForExport(i),
      () => import(vendorPdflib()),
    );
    const stem = (sourceName || 'document').replace(/\.[^.]+$/, '');
    const url = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stem}-annotated.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus('PDF を保存しました（未編集ページは元のまま）。');
  } catch (e) {
    alert(e.message || 'PDF の作成に失敗しました。');
  }
}

function resetEditor() {
  undoStack = [];
  redoStack = [];
  shapes = [];
  selectedId = null;
  pdfPageStore.clear();
  if (pdfDoc) try { pdfDoc.destroy(); } catch { /* ignore */ }
  pdfDoc = null;
  sourcePdfBytes = null;
  inputKind = 'image';
  detachDrag();
  clearOverlay();
  showEditor(false);
  els.scaledNote.classList.add('hidden');
  els.btnPdf.classList.add('hidden');
  setStatus('画像またはPDFをドロップ · Ctrl+V');
  updateHistoryButtons();
}

els.toolBtns.forEach((btn) => {
  btn.addEventListener('click', () => setTool(/** @type {typeof toolMode} */ (btn.dataset.tool)));
});

els.dropZone.addEventListener('click', () => els.fileInput.click());
els.dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }
});
els.fileInput.addEventListener('change', () => {
  const f = els.fileInput.files?.[0];
  if (f) loadFile(f);
  els.fileInput.value = '';
});
els.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); els.dropZone.classList.add('is-dragover'); });
els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('is-dragover'));
els.dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  els.dropZone.classList.remove('is-dragover');
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
els.btnCopy.addEventListener('click', () => copyOutput());
els.btnPng.addEventListener('click', () => downloadPng());
els.btnJpeg.addEventListener('click', () => downloadJpeg());
els.btnPdf.addEventListener('click', () => downloadPdf());
els.btnReset.addEventListener('click', () => {
  if (confirm('別のファイルを開きます。未保存の編集は失われます。')) resetEditor();
});

document.addEventListener('keydown', (e) => {
  if (els.editor.classList.contains('hidden')) return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (mod && key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && isShapeTool(toolMode)) {
    e.preventDefault();
    deleteSelectedShape();
  }
});

setTool('black');
updateHistoryButtons();
setStatus('画像またはPDFをドロップ · Ctrl+V');
