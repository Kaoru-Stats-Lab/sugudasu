/**
 * SUGUDASU PDF記入 — 純関数エンジン
 * docs/products/pdf-fill/
 */

export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_PAGES = 50;
export const DISPLAY_SCALE = 1.25;
/**
 * 編集ページ書き出しの実装値（仕様は「提出用途で十分な印刷品質」のみ。必須DPIではない）。
 * 実測で 250〜350 などへ調整してよい。
 */
export const EXPORT_DPI = 300;
export const EXPORT_SCALE = EXPORT_DPI / 72;
export const SNAP_THRESHOLD_PX = 9;
/** 吸着開始距離（Hard Snap enter） */
export const SNAP_ENTER_PX = 9;
/** 吸着維持距離（exit > enter でブルブル防止） */
export const SNAP_EXIT_PX = 15;
/** @deprecated SNAP_ENTER_PX と同義。互換のため残す */
export const SNAP_STRENGTH = 0.9;
/** @deprecated Hard Snap では未使用 */
export const SNAP_SETTLE_PX = 9;
/** 高速ドラッグ時の吸着下限 · 低速時の上限（ADR-027） */
export const SNAP_STRENGTH_FAST = 0.1;
export const SNAP_STRENGTH_SLOW = 1;
/** この速度(px/s)以上で吸着をほぼ弱める */
export const SNAP_SPEED_FAST_PX_S = 900;
export const UNDO_LIMIT = 40;

/** Marker kinds（ADR-026）。パレット表示用ラベルは記号。描画は Canvas Path 正本 */
export const MARKER_KINDS = /** @type {const} */ ([
  { id: 'circle', label: '○' },
  { id: 'oval', label: '⬭' },
  { id: 'check', label: '✓' },
  { id: 'check-heavy', label: '✔' },
  { id: 'cross', label: '✕' },
  { id: 'triangle', label: '△' },
  { id: 'square', label: '□' },
  { id: 'square-fill', label: '■' },
]);

export const MARKER_SIZE_DEFAULT = 28;

/** @typedef {'gothic'|'mincho'} FontFamilyId */
export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 48;
export const FONT_SIZE_DEFAULT = 16;

/** Paper First: UIは明朝/ゴシックのみ（ADR-020 · 023）。実装は可読性優先（ADR-024） */
export const FONT_FAMILY = {
  gothic: {
    id: /** @type {const} */ ('gothic'),
    label: 'ゴシック',
    css: '"BIZ UDPGothic", "BIZ UDGothic", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "YuGothic", sans-serif',
  },
  mincho: {
    id: /** @type {const} */ ('mincho'),
    label: '明朝',
    css: '"BIZ UDPMincho", "BIZ UDMincho", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif',
  },
};

/**
 * @param {number} size
 */
export function clampFontSize(size) {
  const n = Number(size);
  if (!Number.isFinite(n)) return FONT_SIZE_DEFAULT;
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(n)));
}

/**
 * @param {string|undefined} id
 */
export function fontFamilyCss(id) {
  return (id === 'mincho' ? FONT_FAMILY.mincho : FONT_FAMILY.gothic).css;
}

/**
 * クリップボード由来で透過が落ちた印章向け。
 * 四隅がほぼ黒なら、辺から連結する近黒を透明化する（赤印などは残す）。
 * @param {ImageData} imageData
 * @returns {boolean} 変更したか
 */
export function restoreClipboardBlackBackground(imageData) {
  const { data, width, height } = imageData;
  if (!width || !height) return false;

  const idx = (x, y) => (y * width + x) * 4;
  const isKnockable = (i) => {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 12) return true;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max <= 42 && max - min <= 16;
  };

  const corners = [
    idx(0, 0),
    idx(width - 1, 0),
    idx(0, height - 1),
    idx(width - 1, height - 1),
  ];
  if (!corners.every((i) => isKnockable(i) && data[i + 3] > 10)) {
    // すでに透過がある、または四隅が黒背景でない → 触らない
    let hasAlpha = false;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] < 250) {
        hasAlpha = true;
        break;
      }
    }
    if (hasAlpha) return false;
    if (!corners.every((i) => isKnockable(i))) return false;
  }

  const seen = new Uint8Array(width * height);
  /** @type {number[]} */
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (seen[p]) return;
    stack.push(p);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  let changed = false;
  while (stack.length) {
    const p = /** @type {number} */ (stack.pop());
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!isKnockable(i)) continue;
    if (data[i + 3] !== 0) {
      data[i + 3] = 0;
      changed = true;
    }
    const x = p % width;
    const y = (p / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  return changed;
}

/**
 * 画像リサイズ（ADR-022）。anchor はドラッグしていない対角。
 * @param {{ x: number, y: number, w: number, h: number }} orig
 * @param {'nw'|'ne'|'sw'|'se'} corner
 * @param {{ x: number, y: number }} pointer
 * @param {{ min?: number, maxW?: number, maxH?: number }} [limits]
 */
export function resizeKeepingAspect(orig, corner, pointer, limits = {}) {
  const min = limits.min ?? 8;
  const maxW = limits.maxW ?? Infinity;
  const maxH = limits.maxH ?? Infinity;
  const aspect = orig.w / Math.max(orig.h, 1e-6);
  const ax = corner.includes('w') ? orig.x + orig.w : orig.x;
  const ay = corner.includes('n') ? orig.y + orig.h : orig.y;
  let w = Math.abs(pointer.x - ax);
  let h = Math.abs(pointer.y - ay);
  if (w / aspect >= h) {
    h = w / aspect;
  } else {
    w = h * aspect;
  }
  w = Math.min(maxW, Math.max(min, w));
  h = w / aspect;
  if (h > maxH) {
    h = Math.max(min, maxH);
    w = h * aspect;
  }
  let x = corner.includes('w') ? ax - w : ax;
  let y = corner.includes('n') ? ay - h : ay;
  if (x < 0) {
    w = Math.max(min, w + x);
    h = w / aspect;
    x = 0;
    if (corner.includes('n')) y = ay - h;
  }
  if (y < 0) {
    h = Math.max(min, h + y);
    w = h * aspect;
    y = 0;
    if (corner.includes('w')) x = ax - w;
  }
  if (x + w > maxW) {
    w = Math.max(min, maxW - x);
    h = w / aspect;
    if (corner.includes('n')) y = ay - h;
  }
  if (y + h > maxH) {
    h = Math.max(min, maxH - y);
    w = h * aspect;
    if (corner.includes('w')) x = ax - w;
  }
  return { x, y, w, h };
}

/**
 * 自由矩形リサイズ（黒・白、または画像+Shift）
 * @param {{ x: number, y: number, w: number, h: number }} orig
 * @param {'nw'|'ne'|'sw'|'se'} corner
 * @param {{ x: number, y: number }} pointer
 * @param {{ min?: number, maxW?: number, maxH?: number }} [limits]
 */
export function resizeFree(orig, corner, pointer, limits = {}) {
  const min = limits.min ?? 8;
  const maxW = limits.maxW ?? Infinity;
  const maxH = limits.maxH ?? Infinity;
  let x1 = orig.x;
  let y1 = orig.y;
  let x2 = orig.x + orig.w;
  let y2 = orig.y + orig.h;
  if (corner.includes('w')) x1 = Math.min(pointer.x, x2 - min);
  if (corner.includes('e')) x2 = Math.max(pointer.x, x1 + min);
  if (corner.includes('n')) y1 = Math.min(pointer.y, y2 - min);
  if (corner.includes('s')) y2 = Math.max(pointer.y, y1 + min);
  let x = Math.max(0, Math.min(x1, maxW - min));
  let y = Math.max(0, Math.min(y1, maxH - min));
  let w = Math.min(maxW - x, Math.max(min, x2 - x1));
  let h = Math.min(maxH - y, Math.max(min, y2 - y1));
  return { x, y, w, h };
}

/**
 * オーバーレイがあるページ（0-based）を昇順で返す
 * @param {Array<{ page: number }>} overlays
 * @returns {number[]}
 */
export function editedPageIndexes(overlays) {
  const set = new Set();
  for (const o of overlays || []) {
    if (Number.isInteger(o.page) && o.page >= 0) set.add(o.page);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * @param {Array<{ page: number }>} overlays
 * @param {number} pageZero
 */
export function isPageEdited(overlays, pageZero) {
  return (overlays || []).some((o) => o.page === pageZero);
}

/**
 * ドラッグ速度から吸着強度を決める（ADR-027）。
 * 遅いほど強く、速いほど弱い。紙へ置く意図として扱う。
 * @param {number} speedPxPerSec
 */
export function snapStrengthForSpeed(speedPxPerSec) {
  const v = Math.max(0, Number(speedPxPerSec) || 0);
  const t = Math.min(1, v / SNAP_SPEED_FAST_PX_S);
  const eased = t * t;
  return SNAP_STRENGTH_SLOW * (1 - eased) + SNAP_STRENGTH_FAST * eased;
}

/**
 * 1D Hard Snap + ヒステリシス。紙ターゲットを Object より優先（Paper First）。
 * @param {number} value
 * @param {number[]} pageTargets
 * @param {number[]} objectTargets
 * @param {number|null} [heldGuide]
 * @param {number} [strength]
 * @param {number} [enterPx]
 * @param {number} [exitPx]
 * @returns {{ value: number, snapped: boolean, guide: number|null, held: number|null }}
 */
export function hardSnap1D(
  value,
  pageTargets,
  objectTargets,
  heldGuide = null,
  strength = SNAP_STRENGTH_SLOW,
  enterPx = SNAP_ENTER_PX,
  exitPx = SNAP_EXIT_PX
) {
  const gate = Math.max(0, Math.min(1, strength / SNAP_STRENGTH_SLOW));
  const enter = enterPx * (0.35 + 0.65 * gate);
  const exit = exitPx * (0.45 + 0.55 * gate);

  const nearest = (targets, thr) => {
    let best = null;
    let bestDist = thr;
    for (const t of targets || []) {
      if (!Number.isFinite(t)) continue;
      const d = Math.abs(value - t);
      if (d <= bestDist) {
        bestDist = d;
        best = t;
      }
    }
    return best;
  };

  // 維持: exit まで紙に吸い付いたまま（ブルブル防止）
  if (heldGuide != null && Number.isFinite(heldGuide) && Math.abs(value - heldGuide) <= exit) {
    return { value: heldGuide, snapped: true, guide: heldGuide, held: heldGuide };
  }

  // 高速ではほぼ吸わない（意図は「素通り」）
  if (gate < 0.22) {
    return { value, snapped: false, guide: null, held: null };
  }

  const pageHit = nearest(pageTargets, enter);
  if (pageHit != null) {
    return { value: pageHit, snapped: true, guide: pageHit, held: pageHit };
  }
  const objHit = nearest(objectTargets, enter);
  if (objHit != null) {
    return { value: objHit, snapped: true, guide: objHit, held: objHit };
  }
  return { value, snapped: false, guide: null, held: null };
}

/**
 * 互換: 単一ターゲット列への Hard Snap（紙優先なし）。テスト・旧呼び出し用。
 * @param {number} value
 * @param {number[]} targets
 * @param {number} [threshold]
 * @param {number} [strength]
 * @returns {{ value: number, snapped: boolean, guide: number|null }}
 */
export function softSnap(
  value,
  targets,
  threshold = SNAP_ENTER_PX,
  strength = SNAP_STRENGTH_SLOW
) {
  const r = hardSnap1D(value, targets || [], [], null, strength, threshold, threshold * (SNAP_EXIT_PX / SNAP_ENTER_PX));
  return { value: r.value, snapped: r.snapped, guide: r.guide };
}

/**
 * Priority1=紙端・中央 / Priority2=他 Object 端・中央（ADR-027）
 * @param {{ width: number, height: number }} page
 * @param {Array<{ x: number, y: number, w: number, h: number, id?: string }>} objects
 * @param {string|null} [excludeId]
 */
export function collectGuideLines(page, objects, excludeId = null) {
  const pageXs = [0, page.width / 2, page.width];
  const pageYs = [0, page.height / 2, page.height];
  /** @type {number[]} */
  const objectXs = [];
  /** @type {number[]} */
  const objectYs = [];
  for (const o of objects || []) {
    if (excludeId && o.id === excludeId) continue;
    objectXs.push(o.x, o.x + o.w / 2, o.x + o.w);
    objectYs.push(o.y, o.y + o.h / 2, o.y + o.h);
  }
  const round = (n) => Math.round(n * 100) / 100;
  const uniq = (arr) => [...new Set(arr.map(round))];
  return {
    pageXs: uniq(pageXs),
    pageYs: uniq(pageYs),
    objectXs: uniq(objectXs),
    objectYs: uniq(objectYs),
    // 互換（平坦リスト）
    xs: uniq([...pageXs, ...objectXs]),
    ys: uniq([...pageYs, ...objectYs]),
  };
}

/**
 * ボックスを紙→Object の優先で Hard Snap。ドラッグ中に吸着（pointerup ではしない）。
 * @param {{ x: number, y: number, w: number, h: number }} box
 * @param {{ pageXs?: number[], pageYs?: number[], objectXs?: number[], objectYs?: number[], xs?: number[], ys?: number[] }} guides
 * @param {number} [threshold]
 * @param {number} [strength]
 * @param {{ x: number|null, y: number|null }} [held]
 */
export function snapBox(
  box,
  guides,
  threshold = SNAP_ENTER_PX,
  strength = SNAP_STRENGTH_SLOW,
  held = { x: null, y: null }
) {
  const pageXs = guides.pageXs || [];
  const pageYs = guides.pageYs || [];
  const objectXs = guides.objectXs || [];
  const objectYs = guides.objectYs || [];
  // 旧 guides.xs のみの呼び出し互換
  const flatXs = (!pageXs.length && !objectXs.length && guides.xs) ? guides.xs : null;
  const flatYs = (!pageYs.length && !objectYs.length && guides.ys) ? guides.ys : null;

  const exitPx = threshold * (SNAP_EXIT_PX / SNAP_ENTER_PX);

  /**
   * @param {'x'|'y'} axis
   * @param {number|null} heldGuide
   */
  const snapAxis = (axis, heldGuide) => {
    const pageT = flatXs && axis === 'x' ? flatXs : flatYs && axis === 'y' ? flatYs : (axis === 'x' ? pageXs : pageYs);
    const objT = flatXs && axis === 'x' ? [] : flatYs && axis === 'y' ? [] : (axis === 'x' ? objectXs : objectYs);
    const edges = axis === 'x'
      ? [
          { raw: box.x, toPos: (g) => g },
          { raw: box.x + box.w / 2, toPos: (g) => g - box.w / 2 },
          { raw: box.x + box.w, toPos: (g) => g - box.w },
        ]
      : [
          { raw: box.y, toPos: (g) => g },
          { raw: box.y + box.h / 2, toPos: (g) => g - box.h / 2 },
          { raw: box.y + box.h, toPos: (g) => g - box.h },
        ];

    // ヒステリシス: 保持中ガイドへ最も近い辺で維持判定
    if (heldGuide != null && Number.isFinite(heldGuide)) {
      let bestEdge = null;
      let bestDist = Infinity;
      for (const e of edges) {
        const d = Math.abs(e.raw - heldGuide);
        if (d < bestDist) {
          bestDist = d;
          bestEdge = e;
        }
      }
      const gate = Math.max(0, Math.min(1, strength / SNAP_STRENGTH_SLOW));
      const exit = exitPx * (0.45 + 0.55 * gate);
      if (bestEdge && bestDist <= exit) {
        return {
          pos: bestEdge.toPos(heldGuide),
          guide: heldGuide,
          held: heldGuide,
          dist: bestDist,
          priority: 0,
        };
      }
    }

    /** @type {Array<{ pos: number, guide: number, held: number, dist: number, priority: number }>} */
    const hits = [];
    for (const e of edges) {
      const r = hardSnap1D(e.raw, pageT, objT, null, strength, threshold, exitPx);
      if (!r.snapped || r.guide == null) continue;
      const isPage = (pageT || []).some((t) => Math.abs(t - r.guide) < 0.01);
      hits.push({
        pos: e.toPos(r.guide),
        guide: r.guide,
        held: r.held,
        dist: Math.abs(e.raw - r.guide),
        priority: isPage ? 0 : 1,
      });
    }
    hits.sort((a, b) => a.priority - b.priority || a.dist - b.dist);
    return hits[0] || { pos: axis === 'x' ? box.x : box.y, guide: null, held: null, dist: Infinity, priority: 9 };
  };

  const sx = snapAxis('x', held?.x ?? null);
  const sy = snapAxis('y', held?.y ?? null);

  return {
    x: sx.pos,
    y: sy.pos,
    w: box.w,
    h: box.h,
    guidesX: sx.guide != null ? [sx.guide] : [],
    guidesY: sy.guide != null ? [sy.guide] : [],
    heldX: sx.held,
    heldY: sy.held,
  };
}

/**
 * @param {string} raw
 */
export function sanitizeFilePart(raw) {
  return String(raw || '')
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

/**
 * @param {{ date?: Date, docType?: string, personName?: string }} opts
 */
export function buildSuggestedFileName(opts = {}) {
  const date = opts.date instanceof Date ? opts.date : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const docType = sanitizeFilePart(opts.docType || '書類') || '書類';
  const person = sanitizeFilePart(opts.personName || '');
  const parts = [`${y}-${m}-${d}`, docType];
  if (person) parts.push(person);
  return `${parts.join('_')}.pdf`;
}

/**
 * @param {number} bytes
 * @param {number} [pageCount]
 */
export function checkLimits(bytes, pageCount = 1) {
  if (bytes > MAX_FILE_BYTES) return { ok: false, reason: 'file_size' };
  if (pageCount > MAX_PAGES) return { ok: false, reason: 'page_count' };
  return { ok: true };
}

/**
 * @template T
 * @param {T[]} stack
 * @param {T} snapshot
 * @param {number} [limit]
 */
export function pushUndo(stack, snapshot, limit = UNDO_LIMIT) {
  stack.push(snapshot);
  while (stack.length > limit) stack.shift();
  return stack;
}

/**
 * 表示座標 → 書き出し座標
 * @param {number} n
 * @param {number} displayScale
 * @param {number} exportScale
 */
export function mapDisplayToExport(n, displayScale, exportScale) {
  return (n / displayScale) * exportScale;
}

/** @typedef {{ id: string, label: string, maxLen: number, widthEm: number }} InputStripSlotDef */
/** @typedef {{ id: string, label: string, slots: InputStripSlotDef[], gap: number }} InputStripTemplate */

/**
 * Input Strip Templates（ADR-025）。UI名は出さない。追加はここに定義を足すだけ。
 * @type {Record<string, InputStripTemplate>}
 */
export const INPUT_STRIP_TEMPLATES = {
  datetime: {
    id: 'datetime',
    label: '日時',
    gap: 10,
    slots: [
      { id: 'year', label: '年', maxLen: 12, widthEm: 4.2 },
      { id: 'month', label: '月', maxLen: 2, widthEm: 1.8 },
      { id: 'day', label: '日', maxLen: 2, widthEm: 1.8 },
      { id: 'hour', label: '時', maxLen: 2, widthEm: 1.8 },
      { id: 'minute', label: '分', maxLen: 2, widthEm: 1.8 },
    ],
  },
};

/**
 * @param {string} templateId
 * @param {{ page: number, x: number, y: number, fontSize?: number, fontFamily?: string }} opts
 */
export function buildInputStrip(templateId, opts) {
  const tpl = INPUT_STRIP_TEMPLATES[templateId];
  if (!tpl) throw new Error(`unknown input-strip template: ${templateId}`);
  const fontSize = clampFontSize(opts.fontSize ?? FONT_SIZE_DEFAULT);
  // ラベル（年・月…）分の余白を含め、下端が見切れない高さにする
  const h = Math.round(fontSize * 1.45 + 12);
  let dx = 0;
  const slots = tpl.slots.map((def) => {
    const w = Math.round(fontSize * def.widthEm);
    const slot = {
      id: def.id,
      label: def.label,
      value: '',
      dx,
      dy: 0,
      w,
      h,
      maxLen: def.maxLen,
    };
    dx += w + tpl.gap;
    return slot;
  });
  const w = Math.max(8, dx - tpl.gap);
  return {
    type: /** @type {const} */ ('input-strip'),
    template: tpl.id,
    page: opts.page,
    x: opts.x,
    y: opts.y,
    w,
    h,
    fontSize,
    fontFamily: opts.fontFamily === 'mincho' ? 'mincho' : 'gothic',
    slots,
  };
}

/**
 * @param {string} raw
 * @returns {{ year: string, month: string, day: string, hour: string, minute: string }}
 */
export function parseDatetimeInput(raw) {
  const empty = { year: '', month: '', day: '', hour: '', minute: '' };
  const s = String(raw || '').trim();
  if (!s) return empty;

  const pad2 = (n) => String(n).padStart(2, '0');
  const out = { ...empty };

  const reiwa = s.match(
    /令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日(?:\s*(\d+)\s*時(?:\s*(\d+)\s*分)?)?/
  );
  if (reiwa) {
    // 行政書類は元号印字が既定。年スロットは西暦にしない
    out.year = `令和${Number(reiwa[1])}`;
    out.month = pad2(Number(reiwa[2]));
    out.day = pad2(Number(reiwa[3]));
    if (reiwa[4] != null) out.hour = pad2(Number(reiwa[4]));
    if (reiwa[5] != null) out.minute = pad2(Number(reiwa[5]));
    return out;
  }

  const full = s.match(
    /(\d{4})\s*[\/\-年月日.]\s*(\d{1,2})\s*[\/\-月.]\s*(\d{1,2})\s*日?(?:\s*T?\s*(\d{1,2})\s*[:時]\s*(\d{1,2})\s*分?)?/
  );
  if (full) {
    out.year = full[1];
    out.month = pad2(Number(full[2]));
    out.day = pad2(Number(full[3]));
    if (full[4] != null) out.hour = pad2(Number(full[4]));
    if (full[5] != null) out.minute = pad2(Number(full[5]));
    return out;
  }

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (iso) {
    out.year = iso[1];
    out.month = iso[2];
    out.day = iso[3];
    if (iso[4]) out.hour = iso[4];
    if (iso[5]) out.minute = iso[5];
    return out;
  }

  const timeOnly = s.match(/^(\d{1,2}):(\d{2})$/);
  if (timeOnly) {
    out.hour = pad2(Number(timeOnly[1]));
    out.minute = pad2(Number(timeOnly[2]));
    return out;
  }

  const digits = s.replace(/\D/g, '');
  if (/^\d{14}$/.test(digits) || /^\d{12}$/.test(digits)) {
    out.year = digits.slice(0, 4);
    out.month = digits.slice(4, 6);
    out.day = digits.slice(6, 8);
    out.hour = digits.slice(8, 10);
    out.minute = digits.slice(10, 12);
    return out;
  }
  if (/^\d{8}$/.test(digits)) {
    out.year = digits.slice(0, 4);
    out.month = digits.slice(4, 6);
    out.day = digits.slice(6, 8);
    return out;
  }
  if (/^\d{4}$/.test(digits)) {
    out.hour = digits.slice(0, 2);
    out.minute = digits.slice(2, 4);
    return out;
  }

  return empty;
}

/**
 * @param {Array<{ id: string, value: string }>} slots
 * @param {{ year?: string, month?: string, day?: string, hour?: string, minute?: string }} parsed
 */
export function applyDatetimeToSlots(slots, parsed) {
  const map = {
    year: parsed.year || '',
    month: parsed.month || '',
    day: parsed.day || '',
    hour: parsed.hour || '',
    minute: parsed.minute || '',
  };
  return (slots || []).map((slot) => ({
    ...slot,
    value: map[slot.id] ? map[slot.id] : slot.value,
  }));
}

/**
 * @param {string} raw
 */
export function looksLikeDatetimeBundle(raw) {
  const s = String(raw || '').trim();
  if (!s) return false;
  // 「令和7」単独は年スロットの入力。まとめて分解しない
  if (/令和|れいわ|レイワ/.test(s)) {
    return /月/.test(s) || (/日/.test(s) && /年/.test(s));
  }
  if (/[\/\-年月日時分:]/.test(s)) return true;
  const digits = s.replace(/\D/g, '');
  return digits.length >= 8;
}

/**
 * @param {string} kind
 */
export function isMarkerKind(kind) {
  return MARKER_KINDS.some((m) => m.id === kind);
}

/**
 * @param {string} kind
 * @param {{ page: number, x: number, y: number, size?: number }} opts
 */
export function buildMarker(kind, opts) {
  const id = isMarkerKind(kind) ? kind : 'circle';
  const size = Math.max(16, Math.round(opts.size || MARKER_SIZE_DEFAULT));
  return {
    type: /** @type {const} */ ('marker'),
    marker: id,
    page: opts.page,
    x: opts.x,
    y: opts.y,
    w: size,
    h: size,
  };
}

/**
 * Canvas Path 正本（ADR-026）。Unicode フォントに依存しない。
 * 背景は描かない（透明）。インクのみ。
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} kind
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
export function drawMarker(ctx, kind, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const s = Math.min(w, h);
  // 囲み記号は下の文字が読めるよう線を細く（楕円・丸・四角・三角）
  const outline = kind === 'oval' || kind === 'circle' || kind === 'square' || kind === 'triangle';
  const lw = Math.max(1.1, s * (outline ? 0.045 : 0.085));
  ctx.save();
  ctx.strokeStyle = '#111827';
  ctx.fillStyle = '#111827';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'circle') {
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'oval') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.46, s * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'square') {
    const half = s * 0.34;
    ctx.strokeRect(cx - half, cy - half, half * 2, half * 2);
  } else if (kind === 'square-fill') {
    const half = s * 0.34;
    ctx.fillRect(cx - half, cy - half, half * 2, half * 2);
  } else if (kind === 'triangle') {
    const r = s * 0.38;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.92, cy + r * 0.78);
    ctx.lineTo(cx - r * 0.92, cy + r * 0.78);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === 'check' || kind === 'check-heavy') {
    const thick = kind === 'check-heavy' ? lw * 1.45 : lw;
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.28, cy + s * 0.02);
    ctx.lineTo(cx - s * 0.06, cy + s * 0.26);
    ctx.lineTo(cx + s * 0.32, cy - s * 0.28);
    ctx.stroke();
  } else if (kind === 'cross') {
    const r = s * 0.28;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r);
    ctx.lineTo(cx + r, cy + r);
    ctx.moveTo(cx + r, cy - r);
    ctx.lineTo(cx - r, cy + r);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.38, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Input Strip の slot 横位置から親 Object の x/w を再計算（ADR-031）。
 * dy は触らない。
 * @param {{ x: number, w: number, slots?: Array<{ dx: number, w: number }> }} strip
 */
export function reflowInputStripX(strip) {
  const slots = strip.slots || [];
  if (!slots.length) return strip;
  let minDx = Infinity;
  let maxR = -Infinity;
  for (const s of slots) {
    minDx = Math.min(minDx, s.dx);
    maxR = Math.max(maxR, s.dx + s.w);
  }
  if (!Number.isFinite(minDx) || !Number.isFinite(maxR)) return strip;
  if (minDx !== 0) {
    strip.x += minDx;
    for (const s of slots) s.dx -= minDx;
    maxR -= minDx;
  }
  strip.w = Math.max(8, maxR);
  return strip;
}

/**
 * slot の横寄せは許可するが、順序入れ替えは禁止（年→月→日→時→分を保つ）。
 * @param {Array<{ id: string, dx: number, w: number }>} slots
 * @param {string} slotId
 * @param {number} nextDx
 * @param {number} [minGap]
 */
export function clampSlotDxPreserveOrder(slots, slotId, nextDx, minGap = 6) {
  const list = slots || [];
  const idx = list.findIndex((s) => s.id === slotId);
  if (idx < 0) return nextDx;
  const slot = list[idx];
  let min = -Infinity;
  let max = Infinity;
  if (idx > 0) {
    const prev = list[idx - 1];
    min = prev.dx + prev.w + minGap;
  }
  if (idx < list.length - 1) {
    const next = list[idx + 1];
    max = next.dx - slot.w - minGap;
  }
  if (min > max) return slot.dx;
  return Math.min(max, Math.max(min, nextDx));
}

/**
 * 紙（ページ）内に収める。はみ出す場合は x を戻し、それでも超えるなら右端に貼る。
 * @param {{ x: number, y: number, w: number, h: number }} strip
 * @param {number} pageW
 * @param {number} pageH
 */
export function clampStripToPage(strip, pageW, pageH) {
  const w = Math.min(strip.w, Math.max(8, pageW));
  strip.w = w;
  strip.x = Math.min(Math.max(0, strip.x), Math.max(0, pageW - w));
  strip.y = Math.min(Math.max(0, strip.y), Math.max(0, pageH - strip.h));
  return strip;
}

/**
 * Input Strip の文字サイズ変更。slot 幅・高さを追従し、横位置の相対関係はスケール。
 * @param {{ fontSize?: number, template?: string, slots?: Array<{ id: string, dx: number, dy: number, w: number, h: number, value?: string, label?: string, maxLen?: number }>, x: number, w: number, h: number }} strip
 * @param {number} fontSize
 */
export function applyInputStripFontSize(strip, fontSize) {
  const tpl = INPUT_STRIP_TEMPLATES[strip.template || ''] || INPUT_STRIP_TEMPLATES.datetime;
  const prev = clampFontSize(strip.fontSize || FONT_SIZE_DEFAULT);
  const fs = clampFontSize(fontSize);
  if (fs === prev && strip.slots?.length) {
    // 高さだけ見直す場合にも使う
  }
  const scale = prev > 0 ? fs / prev : 1;
  const h = Math.round(fs * 1.45 + 12);
  const defById = Object.fromEntries(tpl.slots.map((d) => [d.id, d]));
  strip.fontSize = fs;
  strip.h = h;
  for (const slot of strip.slots || []) {
    const def = defById[slot.id];
    slot.dx = Math.round(slot.dx * scale);
    slot.dy = 0;
    slot.w = Math.round(fs * (def?.widthEm || 1.8));
    slot.h = h;
  }
  reflowInputStripX(strip);
  return strip;
}

/**
 * 年スロットの表記を整える。行政書類では元号のまま印字する（西暦へ変換しない）。
 * 「れいわ7」→「令和7」など表記ゆれだけ整える。
 * @param {string} raw
 */
export function normalizeEraYearInput(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const toHalf = (n) => String(n).replace(/[０-９]/g, (d) =>
    String('０１２３４５６７８９'.indexOf(d)));
  const reiwa = s.match(/^(?:令和|れいわ|レイワ)\s*([0-9０-９]+)\s*年?$/);
  if (reiwa) {
    const n = Number(toHalf(reiwa[1]));
    if (Number.isFinite(n) && n > 0) return `令和${n}`;
  }
  return s;
}
