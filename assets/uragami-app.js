/**
 * SUGUDASU 裏紙 — UI
 * Mission: explain, not create drawings.
 * Paper Zoom/Pan: viewer scale only — sheet size never changes (ADR-007).
 * docs/products/uragami/
 */
import {
  COLOR_BLACK,
  COLOR_RED,
  clearSession,
  drawStroke,
  lightSmooth,
  loadSession,
  paintGrid,
  redrawAll,
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
  toolbar: document.getElementById('ug-toolbar'),
  status: document.getElementById('ug-status'),
};

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
let cssW = 0;
let cssH = 0;
let dpr = 1;
/** @type {ReturnType<typeof setTimeout>|null} */
let persistTimer = null;

let viewZoom = 1;
let viewPanX = 0;
let viewPanY = 0;
let spaceDown = false;
let panning = false;
let panPointerId = /** @type {number|null} */ (null);
let panLastX = 0;
let panLastY = 0;
/** @type {Map<number, { x: number, y: number }>} */
const pinchPointers = new Map();
let pinchStartDist = 0;
let pinchStartZoom = 1;

function setStatus(msg) {
  if (els.status) els.status.textContent = msg || '';
}

function meta() {
  return { tool, color };
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    saveSession(strokes, meta());
  }, 200);
}

function applyViewTransform() {
  if (!els.viewport) return;
  els.viewport.style.transform = `translate(${viewPanX}px, ${viewPanY}px) scale(${viewZoom})`;
  updatePanCursor();
}

function clampZoom(z) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

/**
 * Zoom around a stage-local point (client coords → stage).
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
  // Keep the point under cursor stable: world = (screen - pan) / zoom
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
}

function updatePanCursor() {
  const ink = els.ink;
  if (!ink) return;
  const wantPan = spaceDown || panning;
  ink.classList.toggle('is-panning', wantPan);
  ink.classList.toggle('is-pan-active', panning);
}

/**
 * Layout size（transform 前）。描画座標の正本。
 */
function resizeCanvases() {
  const paper = els.paper;
  const ink = els.ink;
  const grid = els.grid;
  if (!paper || !ink || !grid) return;
  cssW = Math.max(1, paper.offsetWidth);
  cssH = Math.max(1, paper.offsetHeight);
  dpr = Math.min(2.5, window.devicePixelRatio || 1);
  for (const c of [ink, grid]) {
    c.width = Math.round(cssW * dpr);
    c.height = Math.round(cssH * dpr);
    c.style.width = `${cssW}px`;
    c.style.height = `${cssH}px`;
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
  if (spaceDown) return;
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
}

function startPan(e) {
  if (drawing) endStroke(e);
  panning = true;
  panPointerId = e.pointerId;
  panLastX = e.clientX;
  panLastY = e.clientY;
  els.ink?.setPointerCapture?.(e.pointerId);
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

  // Ctrl+wheel / trackpad pinch（多くの環境で ctrlKey + wheel）
  stage.addEventListener(
    'wheel',
    (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.01);
      setZoom(viewZoom * factor, e.clientX, e.clientY);
    },
    { passive: false },
  );

  // 中ボタンのオートスクロール防止
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
      window.print();
      return;
    }
    const t = btn.getAttribute('data-ug-tool');
    if (t === 'pen') setTool('pen', btn.getAttribute('data-ug-color') || COLOR_BLACK);
    if (t === 'eraser') setTool('eraser');
  });

  window.addEventListener('resize', () => {
    resizeCanvases();
  });
}

function restore() {
  const data = loadSession();
  if (data?.strokes?.length) {
    strokes = data.strokes;
    if (data.tool === 'pen' || data.tool === 'eraser') tool = data.tool;
    if (data.color === COLOR_RED || data.color === COLOR_BLACK) color = data.color;
  }
}

function init() {
  restore();
  bind();
  setTool(tool, color);
  applyViewTransform();
  resizeCanvases();
  requestAnimationFrame(() => resizeCanvases());
}

init();
