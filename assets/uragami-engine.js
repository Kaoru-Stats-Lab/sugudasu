/**
 * SUGUDASU 裏紙 — 描画エンジン
 * docs/products/uragami/ · ADR-006 Pen First · ADR-009 No Persistence
 *
 * DECISION: 描き味・レイテンシを機能より優先。筆ペン禁止。弱補正。
 * SessionStorage は F5 回復専用（保管ではない）。
 */

export const PAPER_MM = { w: 320, h: 180 }; // 16:9 の論理 mm（方眼・PNG dpi 換算用）
/** 描画座標の正本。表示サイズ（紙占有率）が変わっても不変。 */
export const PAPER_LOGICAL = { w: 1600, h: 900 };
export const PAPER_ASPECT = 16 / 9;
export const GRID_MM = 5;
export const COLOR_BLACK = '#1D1D1D';
export const COLOR_RED = '#B41E23';
export const PAPER_BG = '#F8F5EC';
export const DESK_BG = '#E7EBF2';
export const PAPER_EDGE = '#DDD7CA';
export const GRID_COLOR = 'rgba(216, 221, 230, 0.25)';

export const STROKE_BASE = 2.2;
export const STROKE_MIN = 1.9;
export const STROKE_MAX = 2.5;

/** 消しゴムの見た目の線幅（論理px）。カーソル円と一致させる。 */
export function eraserBrushWidth(pointW = STROKE_BASE) {
  return Math.max(12, pointW * 6);
}

export const SS_KEY = 'sugudasu-uragami-v3';

export const PAPER_FIT_MIN = 0.6;
export const PAPER_FIT_MAX = 0.95;
export const PAPER_FIT_DEFAULT = 0.9;

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
      ctx.arc(pts[0].x, pts[0].y, eraserBrushWidth(pts[0].w) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        ctx.lineWidth = eraserBrushWidth((p0.w + p1.w) / 2);
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
      v: 3,
      strokes,
      tool: meta.tool,
      color: meta.color,
      paperFit: meta.paperFit,
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
    if (!data || (data.v !== 3 && data.v !== 1) || !Array.isArray(data.strokes)) return null;
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
 * 紙＋方眼＋インクを1枚に合成（透過なし）。
 * 消しゴムはインク層だけで destination-out し、紙色を抜かない。
 * @param {UragamiStroke[]} strokes
 * @param {number} cssW
 * @param {number} cssH
 * @param {number} [dpi=300]
 */
export function renderExportCanvas(strokes, cssW, cssH, dpi = 300) {
  const w = Math.round((PAPER_MM.w / 25.4) * dpi);
  const h = Math.round((PAPER_MM.h / 25.4) * dpi);
  const paper = document.createElement('canvas');
  paper.width = w;
  paper.height = h;
  const pctx = paper.getContext('2d');
  if (!pctx) throw new Error('no-2d');

  pctx.fillStyle = PAPER_BG;
  pctx.fillRect(0, 0, w, h);

  const step = w * (GRID_MM / PAPER_MM.w);
  pctx.strokeStyle = GRID_COLOR;
  pctx.lineWidth = Math.max(1, w / 1400);
  pctx.beginPath();
  for (let x = step; x < w; x += step) {
    pctx.moveTo(x, 0);
    pctx.lineTo(x, h);
  }
  for (let y = step; y < h; y += step) {
    pctx.moveTo(0, y);
    pctx.lineTo(w, y);
  }
  pctx.stroke();

  const ink = document.createElement('canvas');
  ink.width = w;
  ink.height = h;
  const ictx = ink.getContext('2d');
  if (!ictx) throw new Error('no-2d');

  const sx = w / cssW;
  const sy = h / cssH;
  const scaled = strokes.map((s) => ({
    ...s,
    points: s.points.map((p) => ({
      x: p.x * sx,
      y: p.y * sy,
      w: p.w * ((sx + sy) / 2),
      t: p.t,
    })),
  }));
  for (const s of scaled) drawStroke(ictx, s);
  pctx.drawImage(ink, 0, 0);
  return paper;
}

/**
 * 紙ごと PNG（透過なし）。おおよそ 300dpi 相当。
 * @param {UragamiStroke[]} strokes
 * @param {number} cssW
 * @param {number} cssH
 */
export async function renderExportPng(strokes, cssW, cssH) {
  const canvas = renderExportCanvas(strokes, cssW, cssH, 300);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png');
  });
}
