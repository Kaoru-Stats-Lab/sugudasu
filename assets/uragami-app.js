/**
 * SUGUDASU 裏紙 — UI
 * Mission: explain, not create drawings.
 *
 * 二軸（ADR-007）:
 * - paperFit = 机の中での紙の占有率（表示領域）
 * - viewZoom = 紙を見る距離（紙の論理サイズは不変）
 *
 * docs/products/uragami/
 */
import {
  COLOR_BLACK,
  COLOR_RED,
  PAPER_ASPECT,
  PAPER_FIT_DEFAULT,
  PAPER_FIT_MAX,
  PAPER_FIT_MIN,
  PAPER_LOGICAL,
  clearSession,
  drawStroke,
  eraserBrushWidth,
  lightSmooth,
  loadSession,
  paintGrid,
  redrawAll,
  renderExportCanvas,
  renderExportPng,
  saveSession,
  widthFromVelocity,
} from './uragami-engine.js';

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 3;
const ERASER_WIDTH = 2.2;

const els = {
  stage: document.getElementById('ug-stage'),
  viewport: document.getElementById('ug-viewport'),
  paper: document.getElementById('ug-paper'),
  grid: /** @type {HTMLCanvasElement|null} */ (document.getElementById('ug-grid')),
  ink: /** @type {HTMLCanvasElement|null} */ (document.getElementById('ug-ink')),
  fitHandle: document.getElementById('ug-fit-handle'),
  toolbar: document.getElementById('ug-toolbar'),
  status: document.getElementById('ug-status'),
  printSheet: document.getElementById('ug-print-sheet'),
  printImg: /** @type {HTMLImageElement|null} */ (document.getElementById('ug-print-img')),
};

/** @type {string|null} */
let printObjectUrl = null;

/** @type {import('./uragami-engine.js').UragamiStroke[]} */
let strokes = [];
/** @type {import('./uragami-engine.js').UragamiStroke[]} */
let undoStack = [];
/** @type {import('./uragami-engine.js').UragamiTool} */
let tool = 'pen';
let color = COLOR_BLACK;
/** @type {import('./uragami-engine.js').UragamiStroke|null} */
let live = null;
let drawing = false;
const cssW = PAPER_LOGICAL.w;
const cssH = PAPER_LOGICAL.h;
let dpr = 1;
/** @type {ReturnType<typeof setTimeout>|null} */
let persistTimer = null;

/** 机の中で紙が占める割合（ズームとは別） */
let paperFit = PAPER_FIT_DEFAULT;
let viewZoom = 1;
let viewPanX = 0;
let viewPanY = 0;
let spaceDown = false;
let panning = false;
let panPointerId = /** @type {number|null} */ (null);
let panLastX = 0;
let panLastY = 0;
let fitting = false;
let fitPointerId = /** @type {number|null} */ (null);
/** @type {Map<number, { x: number, y: number }>} */
const pinchPointers = new Map();
let pinchStartDist = 0;
let pinchStartZoom = 1;

function setStatus(msg) {
  if (els.status) els.status.textContent = msg || '';
}

function meta() {
  return { tool, color, paperFit };
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    saveSession(strokes, meta());
  }, 200);
}

function clampFit(f) {
  return Math.min(PAPER_FIT_MAX, Math.max(PAPER_FIT_MIN, f));
}

function clampZoom(z) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

function applyViewTransform() {
  if (!els.viewport) return;
  els.viewport.style.transform = `translate(${viewPanX}px, ${viewPanY}px) scale(${viewZoom})`;
  updatePanCursor();
}

/**
 * Ctrl+wheel は机の中心基準（紙が端へ逃げるのを防ぐ）。
 * ピンチは二指の中点基準のまま setZoom(..., midX, midY)。
 * @param {number} nextZoom
 * @param {number} [clientX]
 * @param {number} [clientY]
 */
function setZoom(nextZoom, clientX, clientY) {
  const stage = els.stage;
  if (!stage) {
    viewZoom = clampZoom(nextZoom);
    applyViewTransform();
    return;
  }
  const z0 = viewZoom;
  const z1 = clampZoom(nextZoom);
  if (z1 === z0) return;

  const rect = stage.getBoundingClientRect();
  const cx = clientX == null ? rect.left + rect.width / 2 : clientX;
  const cy = clientY == null ? rect.top + rect.height / 2 : clientY;
  const sx = cx - rect.left - rect.width / 2;
  const sy = cy - rect.top - rect.height / 2;
  viewPanX = sx - ((sx - viewPanX) / z0) * z1;
  viewPanY = sy - ((sy - viewPanY) / z0) * z1;
  viewZoom = z1;
  applyViewTransform();
}

function resetView() {
  viewZoom = 1;
  viewPanX = 0;
  viewPanY = 0;
  applyViewTransform();
  setStatus('表示を中央に戻しました');
  window.clearTimeout(resetView._t);
  resetView._t = window.setTimeout(() => setStatus(''), 1200);
}

function updatePanCursor() {
  const ink = els.ink;
  if (!ink) return;
  const wantPan = spaceDown || panning;
  ink.classList.toggle('is-panning', wantPan);
  ink.classList.toggle('is-pan-active', panning);
  els.stage?.classList.toggle('is-pan-active', panning);
  if (wantPan) return;
  updateToolCursor();
}

/** ペンは色付き十字、消しゴムは実際の消し半径の円 */
function updateToolCursor() {
  const ink = els.ink;
  const paper = els.paper;
  if (!ink || !paper) return;
  if (spaceDown || panning) return;

  if (tool === 'eraser') {
    const displayW = Math.max(1, paper.getBoundingClientRect().width);
    const brushLogical = eraserBrushWidth(ERASER_WIDTH);
    const r = Math.max(6, (brushLogical / 2) * (displayW / cssW));
    const size = Math.ceil(r * 2 + 4);
    const c = size / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${c}" cy="${c}" r="${r}" fill="rgba(255,255,255,0.25)" stroke="#64748b" stroke-width="1.25"/><circle cx="${c}" cy="${c}" r="1.25" fill="#64748b"/></svg>`;
    ink.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${c} ${c}, cell`;
    return;
  }

  const stroke = color === COLOR_RED ? COLOR_RED : COLOR_BLACK;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  ink.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, crosshair`;
}

/**
 * 紙の表示サイズを stage × paperFit に合わせる（論理座標は不変）。
 */
function layoutPaper() {
  const stage = els.stage;
  const paper = els.paper;
  if (!stage || !paper) return;
  const sw = Math.max(1, stage.clientWidth);
  const sh = Math.max(1, stage.clientHeight);
  const fit = clampFit(paperFit);
  let w = sw * fit;
  let h = w / PAPER_ASPECT;
  if (h > sh * fit) {
    h = sh * fit;
    w = h * PAPER_ASPECT;
  }
  paper.style.width = `${Math.round(w)}px`;
  paper.style.height = `${Math.round(h)}px`;
  syncCanvases();
  updateToolCursor();
}

function setPaperFit(next, opts = {}) {
  const f0 = paperFit;
  const f1 = clampFit(next);
  if (Math.abs(f1 - f0) < 0.0005) return;
  paperFit = f1;
  layoutPaper();
  if (!opts.silent) {
    setStatus(`紙の大きさ ${Math.round(paperFit * 100)}%`);
    window.clearTimeout(setPaperFit._t);
    setPaperFit._t = window.setTimeout(() => setStatus(''), 1200);
  }
  schedulePersist();
}

/** 論理解像度でバッファを張り、CSS は紙いっぱいに伸ばす */
function syncCanvases() {
  const ink = els.ink;
  const grid = els.grid;
  if (!ink || !grid) return;
  dpr = Math.min(2.5, window.devicePixelRatio || 1);
  for (const c of [ink, grid]) {
    c.width = Math.round(cssW * dpr);
    c.height = Math.round(cssH * dpr);
    c.style.width = '100%';
    c.style.height = '100%';
  }
  const gctx = grid.getContext('2d');
  const ictx = ink.getContext('2d');
  if (gctx) paintGrid(gctx, cssW, cssH, dpr);
  if (ictx) {
    ictx.imageSmoothingEnabled = true;
    redrawAll(ictx, strokes, cssW, cssH, dpr);
  }
}

function inkCtx() {
  return els.ink?.getContext('2d') || null;
}

function localPoint(e) {
  const ink = els.ink;
  if (!ink) return { x: 0, y: 0 };
  const r = ink.getBoundingClientRect();
  const w = Math.max(1, r.width);
  const h = Math.max(1, r.height);
  return {
    x: ((e.clientX - r.left) / w) * cssW,
    y: ((e.clientY - r.top) / h) * cssH,
  };
}

function beginStroke(e) {
  if (e.button != null && e.button !== 0) return;
  if (spaceDown || fitting) return;
  e.preventDefault();
  els.ink?.setPointerCapture?.(e.pointerId);
  drawing = true;
  const p = localPoint(e);
  const w = tool === 'eraser' ? ERASER_WIDTH : widthFromVelocity(0, 16);
  live = {
    id: crypto.randomUUID(),
    tool,
    color: tool === 'pen' ? color : '#000000',
    points: [{ x: p.x, y: p.y, w, t: performance.now() }],
  };
  const ctx = inkCtx();
  if (ctx && live) drawStroke(ctx, live);
}

function extendStroke(e) {
  if (!drawing || !live) return;
  e.preventDefault();
  const events =
    typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length
      ? e.getCoalescedEvents()
      : [e];
  const ctx = inkCtx();
  for (const ev of events) {
    const p = localPoint(ev);
    const prev = live.points[live.points.length - 1];
    const now = performance.now();
    const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
    if (dist < 0.4) continue;
    const w =
      tool === 'eraser' ? ERASER_WIDTH : widthFromVelocity(dist, now - prev.t);
    live.points.push({ x: p.x, y: p.y, w, t: now });
  }
  if (ctx) {
    const n = live.points.length;
    if (n >= 2) {
      const seg = {
        ...live,
        points: live.points.slice(Math.max(0, n - 3)),
      };
      drawStroke(ctx, seg);
    }
  }
}

function endStroke(e) {
  if (!drawing || !live) return;
  e?.preventDefault?.();
  drawing = false;
  live.points = lightSmooth(live.points);
  undoStack.push(strokes);
  if (undoStack.length > 40) undoStack.shift();
  strokes = [...strokes, live];
  live = null;
  const ctx = inkCtx();
  if (ctx) redrawAll(ctx, strokes, cssW, cssH, dpr);
  schedulePersist();
}

function undo() {
  if (!undoStack.length) return;
  strokes = undoStack.pop() || [];
  const ctx = inkCtx();
  if (ctx) redrawAll(ctx, strokes, cssW, cssH, dpr);
  schedulePersist();
  setStatus('');
}

function turnPage() {
  const paper = els.paper;
  if (paper) {
    paper.classList.remove('ug-paper--flip');
    void paper.offsetWidth;
    paper.classList.add('ug-paper--flip');
  }
  strokes = [];
  undoStack = [];
  live = null;
  clearSession();
  resetView();
  const ctx = inkCtx();
  if (ctx) redrawAll(ctx, strokes, cssW, cssH, dpr);
  window.setTimeout(() => paper?.classList.remove('ug-paper--flip'), 420);
  setStatus('');
}

async function savePng() {
  try {
    const blob = await renderExportPng(strokes, cssW, cssH);
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `uragami-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('PNGを保存しました');
  } catch {
    setStatus('PNGを保存できませんでした');
  }
}

/**
 * Chrome は transform 付き canvas を印刷で落とすことがある。
 * PNG と同系統の静止画シートを印刷対象にする。
 * @param {'sync'|'hires'} [mode]
 */
function preparePrintSheet(mode = 'sync') {
  const img = els.printImg;
  if (!img) return;
  if (mode === 'hires') {
    /* async path via printPaper */
    return;
  }
  try {
    const canvas = renderExportCanvas(strokes, cssW, cssH, 150);
    img.src = canvas.toDataURL('image/png');
  } catch {
    img.removeAttribute('src');
  }
}

function clearPrintObjectUrl() {
  if (printObjectUrl) {
    URL.revokeObjectURL(printObjectUrl);
    printObjectUrl = null;
  }
}

async function printPaper() {
  const img = els.printImg;
  if (!img) {
    window.print();
    return;
  }
  try {
    setStatus('印刷用の紙を準備しています…');
    const blob = await renderExportPng(strokes, cssW, cssH);
    clearPrintObjectUrl();
    printObjectUrl = URL.createObjectURL(blob);
    img.src = printObjectUrl;
    if (typeof img.decode === 'function') {
      await img.decode();
    } else {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('img'));
      });
    }
    setStatus('');
    window.print();
  } catch {
    preparePrintSheet('sync');
    setStatus('');
    window.print();
  }
}

function setTool(next, nextColor) {
  tool = next;
  if (nextColor) color = nextColor;
  els.toolbar?.querySelectorAll('[data-ug-tool]').forEach((btn) => {
    const t = btn.getAttribute('data-ug-tool');
    const c = btn.getAttribute('data-ug-color');
    let on = false;
    if (t === 'pen' && tool === 'pen' && c === color) on = true;
    if (t === 'eraser' && tool === 'eraser') on = true;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  updateToolCursor();
}

function startPan(e) {
  if (drawing) endStroke(e);
  panning = true;
  panPointerId = e.pointerId;
  panLastX = e.clientX;
  panLastY = e.clientY;
  const target = /** @type {Element|null} */ (e.currentTarget);
  if (target && 'setPointerCapture' in target) {
    /** @type {Element & { setPointerCapture: (id:number)=>void }} */ (target).setPointerCapture(e.pointerId);
  } else {
    els.ink?.setPointerCapture?.(e.pointerId);
  }
  updatePanCursor();
}

function movePan(e) {
  if (!panning || panPointerId !== e.pointerId) return;
  viewPanX += e.clientX - panLastX;
  viewPanY += e.clientY - panLastY;
  panLastX = e.clientX;
  panLastY = e.clientY;
  applyViewTransform();
}

function endPan(e) {
  if (!panning || (e && panPointerId !== e.pointerId)) return;
  panning = false;
  panPointerId = null;
  updatePanCursor();
}

function fitFromPointer(clientX, clientY) {
  const stage = els.stage;
  if (!stage) return;
  const r = stage.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const dx = Math.abs(clientX - cx);
  const dy = Math.abs(clientY - cy);
  const needW = dx * 2;
  const needH = dy * 2;
  const fitW = needW / Math.max(1, r.width);
  const fitH = needH / Math.max(1, r.height);
  setPaperFit(Math.max(fitW, fitH));
}

function onPointerDown(e) {
  const isMiddle = e.button === 1;
  const isSpacePan = spaceDown && e.button === 0;
  if (isMiddle || isSpacePan) {
    e.preventDefault();
    startPan(e);
    return;
  }
  if (e.pointerType === 'touch') {
    pinchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchPointers.size === 2) {
      if (drawing) endStroke(e);
      const pts = [...pinchPointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      pinchStartZoom = viewZoom;
      return;
    }
  }
  beginStroke(e);
}

function onPointerMove(e) {
  if (fitting && fitPointerId === e.pointerId) {
    e.preventDefault();
    fitFromPointer(e.clientX, e.clientY);
    return;
  }
  if (panning) {
    e.preventDefault();
    movePan(e);
    return;
  }
  if (e.pointerType === 'touch' && pinchPointers.has(e.pointerId)) {
    pinchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchPointers.size === 2) {
      e.preventDefault();
      const pts = [...pinchPointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      setZoom(pinchStartZoom * (dist / pinchStartDist), midX, midY);
      return;
    }
  }
  extendStroke(e);
}

function onPointerUp(e) {
  if (fitting && fitPointerId === e.pointerId) {
    fitting = false;
    fitPointerId = null;
    return;
  }
  pinchPointers.delete(e.pointerId);
  if (panning) {
    endPan(e);
    return;
  }
  endStroke(e);
}

function bind() {
  const ink = els.ink;
  const stage = els.stage;
  if (!ink || !stage) return;

  ink.addEventListener('pointerdown', onPointerDown);
  ink.addEventListener('pointermove', onPointerMove);
  ink.addEventListener('pointerup', onPointerUp);
  ink.addEventListener('pointercancel', onPointerUp);
  ink.addEventListener('pointerleave', (e) => {
    if (drawing) endStroke(e);
  });
  ink.style.touchAction = 'none';

  // 机（紙の外）をドラッグでパン · ダブルクリックで中央復帰
  stage.addEventListener('pointerdown', (e) => {
    if (e.target !== stage) return;
    if (e.button === 1 || e.button === 0) {
      e.preventDefault();
      startPan(e);
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (panning) {
      e.preventDefault();
      movePan(e);
    }
  });
  stage.addEventListener('pointerup', (e) => {
    if (panning) endPan(e);
  });
  stage.addEventListener('pointercancel', (e) => {
    if (panning) endPan(e);
  });
  stage.addEventListener('dblclick', (e) => {
    if (e.target !== stage && !(e.target instanceof Element && e.target.closest('#ug-viewport'))) return;
    // 紙上のダブルクリックは描画と競合しやすいので机のみ
    if (e.target !== stage) return;
    e.preventDefault();
    resetView();
  });

  els.fitHandle?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (drawing) endStroke(e);
    fitting = true;
    fitPointerId = e.pointerId;
    els.fitHandle?.setPointerCapture?.(e.pointerId);
    fitFromPointer(e.clientX, e.clientY);
  });
  els.fitHandle?.addEventListener('pointermove', onPointerMove);
  els.fitHandle?.addEventListener('pointerup', onPointerUp);
  els.fitHandle?.addEventListener('pointercancel', onPointerUp);

  // Ctrl+wheel = 見る距離（机の中心基準） / Alt+wheel = 紙の占有率
  stage.addEventListener(
    'wheel',
    (e) => {
      if (e.altKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.0008;
        setPaperFit(paperFit + delta);
        return;
      }
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.01);
      // カーソル基準にすると紙が端へ逃げる → 机の中心基準
      setZoom(viewZoom * factor);
    },
    { passive: false },
  );

  stage.addEventListener('auxclick', (e) => {
    if (e.button === 1) e.preventDefault();
  });
  stage.addEventListener('mousedown', (e) => {
    if (e.button === 1) e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && /** @type {HTMLElement} */ (e.target).tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      spaceDown = true;
      updatePanCursor();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      spaceDown = false;
      if (!panning) updatePanCursor();
    }
  });
  window.addEventListener('blur', () => {
    spaceDown = false;
    endPan();
    fitting = false;
    updatePanCursor();
  });

  document.addEventListener('click', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('[data-ug-action],[data-ug-tool]') : null;
    if (!btn) return;
    const action = btn.getAttribute('data-ug-action');
    if (action === 'undo') {
      undo();
      return;
    }
    if (action === 'turn') {
      turnPage();
      return;
    }
    if (action === 'png') {
      void savePng();
      return;
    }
    if (action === 'print') {
      void printPaper();
      return;
    }
    const t = btn.getAttribute('data-ug-tool');
    if (t === 'pen') setTool('pen', btn.getAttribute('data-ug-color') || COLOR_BLACK);
    if (t === 'eraser') setTool('eraser');
  });

  window.addEventListener('resize', () => {
    layoutPaper();
    updateToolCursor();
  });

  // Ctrl/Cmd+P は紙を先に焼いてから印刷（ヘッダー印刷ボタンは E-L3 で廃止）
  document.addEventListener(
    'keydown',
    (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'p') return;
      const tag = (e.target && /** @type {HTMLElement} */ (e.target).tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      void printPaper();
    },
    true,
  );
  window.addEventListener('afterprint', () => {
    clearPrintObjectUrl();
    if (els.printImg) els.printImg.removeAttribute('src');
  });
}

function restore() {
  const data = loadSession();
  if (data?.strokes?.length) {
    strokes = data.strokes;
    if (data.tool === 'pen' || data.tool === 'eraser') tool = data.tool;
    if (data.color === COLOR_RED || data.color === COLOR_BLACK) color = data.color;
  }
  if (typeof data?.paperFit === 'number') paperFit = clampFit(data.paperFit);
}

function init() {
  restore();
  bind();
  setTool(tool, color);
  applyViewTransform();
  layoutPaper();
  requestAnimationFrame(() => layoutPaper());
}

init();
