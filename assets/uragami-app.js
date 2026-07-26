/**
 * SUGUDASU 裏紙 — UI
 * Mission: explain, not create drawings.
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

const els = {
  stage: document.getElementById('ug-stage'),
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
const ERASER_WIDTH = 2.2;
/** @type {ReturnType<typeof setTimeout>|null} */
let persistTimer = null;

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

function resizeCanvases() {
  const paper = els.paper;
  const ink = els.ink;
  const grid = els.grid;
  if (!paper || !ink || !grid) return;
  const rect = paper.getBoundingClientRect();
  cssW = Math.max(1, rect.width);
  cssH = Math.max(1, rect.height);
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
  return {
    x: ((e.clientX - r.left) / r.width) * cssW,
    y: ((e.clientY - r.top) / r.height) * cssH,
  };
}

function beginStroke(e) {
  if (e.button != null && e.button !== 0) return;
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
    // ライブは最終2点だけ足すより、ストローク全体を軽く描き足す
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
  // 上限
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
    // reflow
    void paper.offsetWidth;
    paper.classList.add('ug-paper--flip');
  }
  strokes = [];
  undoStack = [];
  live = null;
  clearSession();
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

function bind() {
  const ink = els.ink;
  if (!ink) return;

  ink.addEventListener('pointerdown', beginStroke);
  ink.addEventListener('pointermove', extendStroke);
  ink.addEventListener('pointerup', endStroke);
  ink.addEventListener('pointercancel', endStroke);
  ink.addEventListener('pointerleave', (e) => {
    if (drawing) endStroke(e);
  });

  // スクロールやタッチのブラウザジェスチャを抑制
  ink.style.touchAction = 'none';

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

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && /** @type {HTMLElement} */ (e.target).tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      // ブラウザ印刷に任せる
    }
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
  resizeCanvases();
  // レイアウト確定後にもう一度
  requestAnimationFrame(() => resizeCanvases());
}

init();
