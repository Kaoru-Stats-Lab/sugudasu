/**
 * SUGUDASU 裏紙 — 描画エンジン
 * docs/products/uragami/ · ADR-006 Pen First · ADR-009 No Persistence
 *
 * DECISION: 描き味・レイテンシを機能より優先。筆ペン禁止。弱補正。
 * SessionStorage は F5 回復専用（保管ではない）。
 */

export const PAPER_MM = { w: 210, h: 297 };
export const GRID_MM = 5;
export const COLOR_BLACK = '#1D1D1D';
export const COLOR_RED = '#B41E23';
export const PAPER_BG = '#F8F5EC';
export const GRID_COLOR = 'rgba(216, 221, 230, 0.28)';

export const STROKE_BASE = 2.2;
export const STROKE_MIN = 1.9;
export const STROKE_MAX = 2.5;

export const SS_KEY = 'sugudasu-uragami-v1';

/** @typedef {'pen'|'eraser'} UragamiTool */
/** @typedef {{ x: number, y: number, w: number, t: number }} UragamiPoint */
/** @typedef {{ id: string, tool: UragamiTool, color: string, points: UragamiPoint[] }} UragamiStroke */

/**
 * @param {number} distPx
 * @param {number} dtMs
 */
export function widthFromVelocity(distPx, dtMs) {
  const dt = Math.max(1, dtMs);
  const v = distPx / dt; // px/ms
  // 速い → やや細い。変化はごく小さい
  const t = Math.min(1, Math.max(0, v / 1.2));
  return STROKE_MAX - t * (STROKE_MAX - STROKE_MIN);
}

/**
 * 弱めの位置補正（前後平均）。Excalidraw ほど強くない。
 * @param {UragamiPoint[]} pts
 */
export function lightSmooth(pts) {
  if (pts.length < 3) return pts.slice();
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    out.push({
      x: (a.x + b.x * 2 + c.x) / 4,
      y: (a.y + b.y * 2 + c.y) / 4,
      w: b.w,
      t: b.t,
    });
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {UragamiStroke} stroke
 */
export function drawStroke(ctx, stroke) {
  const pts = stroke.points;
  if (!pts.length) return;

  if (stroke.tool === 'eraser') {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, Math.max(8, pts[0].w * 4), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        ctx.lineWidth = Math.max(12, ((p0.w + p1.w) / 2) * 6);
        const mx = (p0.x + p1.x) / 2;
        const my = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, pts[0].w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // 可変幅: セグメントごとに
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    ctx.beginPath();
    ctx.lineWidth = (a.w + b.w) / 2;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {UragamiStroke[]} strokes
 * @param {number} cssW
 * @param {number} cssH
 * @param {number} dpr
 */
export function redrawAll(ctx, strokes, cssW, cssH, dpr) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const s of strokes) drawStroke(ctx, s);
}

/**
 * 方眼を別 canvas に描く（インクと分離）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cssW
 * @param {number} cssH
 * @param {number} dpr
 */
export function paintGrid(ctx, cssW, cssH, dpr) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const step = cssW * (GRID_MM / PAPER_MM.w);
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = step; x < cssW; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, cssH);
  }
  for (let y = step; y < cssH; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(cssW, y);
  }
  ctx.stroke();
}

/**
 * @param {UragamiStroke[]} strokes
 * @param {object} meta
 */
export function saveSession(strokes, meta) {
  try {
    const payload = {
      v: 1,
      strokes,
      tool: meta.tool,
      color: meta.color,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(SS_KEY, JSON.stringify(payload));
  } catch {
    /* quota — ignore */
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !Array.isArray(data.strokes)) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SS_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * 紙ごと PNG（透過なし）。おおよそ 300dpi 相当。
 * @param {UragamiStroke[]} strokes
 * @param {number} cssW
 * @param {number} cssH
 */
export async function renderExportPng(strokes, cssW, cssH) {
  const dpi = 300;
  const w = Math.round((PAPER_MM.w / 25.4) * dpi);
  const h = Math.round((PAPER_MM.h / 25.4) * dpi);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no-2d');

  ctx.fillStyle = PAPER_BG;
  ctx.fillRect(0, 0, w, h);

  const sx = w / cssW;
  const sy = h / cssH;

  const step = w * (GRID_MM / PAPER_MM.w);
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = Math.max(1, w / 1400);
  ctx.beginPath();
  for (let x = step; x < w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = step; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  const scaled = strokes.map((s) => ({
    ...s,
    points: s.points.map((p) => ({
      x: p.x * sx,
      y: p.y * sy,
      w: p.w * ((sx + sy) / 2),
      t: p.t,
    })),
  }));
  for (const s of scaled) drawStroke(ctx, s);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png');
  });
}
