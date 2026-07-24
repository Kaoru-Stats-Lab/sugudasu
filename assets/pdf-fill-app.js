/**
 * SUGUDASU PDF記入 — UI
 * Paper First v2: Unified Object · Direct Manipulation · Inline Text
 */
import {
  DISPLAY_SCALE,
  EXPORT_SCALE,
  FONT_SIZE_DEFAULT,
  MARKER_SIZE_DEFAULT,
  MAX_FILE_BYTES,
  MAX_PAGES,
  applyDatetimeToSlots,
  buildInputStrip,
  buildMarker,
  buildSuggestedFileName,
  checkLimits,
  clampFontSize,
  collectGuideLines,
  drawMarker,
  editedPageIndexes,
  fontFamilyCss,
  isPageEdited,
  looksLikeDatetimeBundle,
  parseDatetimeInput,
  pushUndo,
  reflowInputStripX,
  clampSlotDxPreserveOrder,
  clampStripToPage,
  normalizeEraYearInput,
  applyInputStripFontSize,
  resizeFree,
  resizeKeepingAspect,
  restoreClipboardBlackBackground,
  snapBox,
  snapStrengthForSpeed,
} from './pdf-fill-engine.js';

const $ = (id) => document.getElementById(id);

/** @typedef {'text'|'datetime'|'image'|'black'|'white'} ToolMode */
/** @typedef {'text'|'image'|'black'|'white'|'input-strip'|'marker'} ObjectType */
/**
 * Unified Object Model（ADR-018）+ Input Strip（ADR-025）+ Marker（ADR-026）
 * @typedef {{
 *   id: string,
 *   type: ObjectType,
 *   page: number,
 *   x: number,
 *   y: number,
 *   w: number,
 *   h: number,
 *   text?: string,
 *   fontSize?: number,
 *   fontFamily?: 'gothic'|'mincho',
 *   src?: string,
 *   template?: string,
 *   slots?: Array<{ id: string, label: string, value: string, dx: number, dy: number, w: number, h: number, maxLen?: number }>,
 *   marker?: string
 * }} PaperObject
 */
/**
 * @typedef {{
 *   id: string,
 *   ox: number,
 *   oy: number,
 *   started: boolean,
 *   openEditOnClick?: boolean,
 *   heldX?: number|null,
 *   heldY?: number|null,
 *   lastX?: number,
 *   lastY?: number,
 *   lastT?: number,
 *   speed?: number
 * }} MoveDrag
 */
/**
 * @typedef {{ stripId: string, slotId: string, startPointerX: number, origDx: number, started: boolean }} SlotDrag
 */
/** @typedef {{ id: string, corner: 'nw'|'ne'|'sw'|'se', startX: number, startY: number, orig: PaperObject }} ResizeDrag */
/** @typedef {{ id: string, isNew: boolean, before: string }} TextEditSession */
/** @typedef {{ id: string, isNew: boolean, slotIndex: number, composing?: boolean, beforeSlots: Array<{ id: string, value: string }> }} StripEditSession */

/** @type {import('./vendor/pdfjs/pdf.mjs')|null} */
let pdfjsLib = null;
/** @type {any} */
let pdfDoc = null;
/** @type {Uint8Array|null} */
let sourcePdfBytes = null;
/** @type {PaperObject[]} */
let overlays = [];
/** @type {PaperObject[][]} */
let undoStack = [];
/** @type {PaperObject[][]} */
let redoStack = [];
let pageIndex = 0;
let pageCount = 0;
let displayScale = DISPLAY_SCALE;
/** @type {ToolMode} */
let mode = 'text';
let sourceName = 'document.pdf';
/** @type {string|null} */
let selectedId = null;
/** @type {MoveDrag|null} */
let dragMove = null;
/** @type {SlotDrag|null} */
let dragSlot = null;
/** @type {{ startX: number, startY: number, curX: number, curY: number }|null} */
let dragDraw = null;
/** @type {ResizeDrag|null} */
let dragResize = null;
/** @type {{ guidesX: number[], guidesY: number[] }} */
let activeGuides = { guidesX: [], guidesY: [] };
let pageCssW = 0;
let pageCssH = 0;
let busy = false;
/** @type {ReturnType<typeof setTimeout>|null} */
let guideFadeTimer = null;
let guidesLinger = false;
/** 初回表示で紙を机に置く演出 */
let paperEnterPending = false;
/** @type {string|null} */
let placeFlashId = null;
/** @type {TextEditSession|null} */
let textEditSession = null;
/** @type {StripEditSession|null} */
let stripEditSession = null;
/** 画像配置のクリック位置（ファイル選択用） */
/** @type {{ x: number, y: number }|null} */
let pendingImageAt = null;
/** 文字ツール内 Marker Palette の次に置く記号（ADR-026） */
/** @type {string|null} */
let pendingMarkerKind = null;
/** Object コピペ用（同一書類内の複製） */
/** @type {PaperObject|null} */
let objectClipboard = null;

function vendorPdfjs(rel) {
  return new URL(`./vendor/pdfjs/${rel}`, import.meta.url).href;
}

function vendorPdflib() {
  return new URL('./vendor/pdf-lib/pdf-lib.esm.min.js', import.meta.url).href;
}

function uid() {
  return `o_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function cloneSlot(s) {
  const { _paintDx, ...rest } = s;
  return { ...rest };
}

function cloneOverlays(list = overlays) {
  return list.map((o) => ({
    ...o,
    slots: o.slots ? o.slots.map(cloneSlot) : undefined,
  }));
}

function commitUndo() {
  pushUndo(undoStack, cloneOverlays());
  redoStack = [];
  updateUndoUi();
}

function canInteract() {
  return !!(pdfDoc && !busy);
}

function measureTextBox(text, fontSize, maxWidth = null) {
  const fs = clampFontSize(fontSize);
  const lines = String(text || ' ').split('\n');
  if (maxWidth && maxWidth > 0) {
    const charsPerLine = Math.max(4, Math.floor(maxWidth / (fs * 0.55)));
    let wrapped = 0;
    for (const line of lines) {
      wrapped += Math.max(1, Math.ceil(Math.max(1, line.length) / charsPerLine));
    }
    return {
      w: maxWidth,
      h: Math.max(fs * 1.45, wrapped * fs * 1.35 + 6),
    };
  }
  const maxLen = Math.max(1, ...lines.map((l) => l.length));
  const w = Math.max(48, Math.min(pageCssW, maxLen * fs * 0.92 + 10));
  const h = Math.max(fs * 1.45, lines.length * fs * 1.35 + 6);
  return { w, h };
}

function updateTypeBar() {
  const bar = $('pdff-type-bar');
  const o = selectedId ? findOverlay(selectedId) : null;
  const show = !!(o && (o.type === 'text' || o.type === 'input-strip' || o.type === 'marker'));
  if (bar) bar.classList.toggle('hidden', !show);
  if (!show || !o) return;
  const fs = o.type === 'marker'
    ? Math.round(o.w || MARKER_SIZE_DEFAULT)
    : clampFontSize(o.fontSize || FONT_SIZE_DEFAULT);
  const val = $('pdff-fs-val');
  if (val) val.textContent = String(fs);
  const fam = o.fontFamily === 'mincho' ? 'mincho' : 'gothic';
  document.querySelectorAll('[data-pdff-font]').forEach((btn) => {
    if (o.type === 'marker') {
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-disabled');
    }
    const on = btn.getAttribute('data-pdff-font') === fam;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

function bumpFontSize(delta) {
  const o = selectedId ? findOverlay(selectedId) : null;
  if (!o || (o.type !== 'text' && o.type !== 'input-strip' && o.type !== 'marker')) return;
  if (!textEditSession && !stripEditSession) commitUndo();
  if (o.type === 'marker') {
    const next = Math.max(16, Math.min(160, Math.round((o.w || MARKER_SIZE_DEFAULT) + delta * 4)));
    if (next === Math.round(o.w || MARKER_SIZE_DEFAULT)) return;
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    o.w = next;
    o.h = next;
    o.x = Math.min(pageCssW - o.w, Math.max(0, cx - next / 2));
    o.y = Math.min(pageCssH - o.h, Math.max(0, cy - next / 2));
  } else if (o.type === 'input-strip') {
    const next = clampFontSize((o.fontSize || FONT_SIZE_DEFAULT) + delta);
    if (next === clampFontSize(o.fontSize || FONT_SIZE_DEFAULT)) return;
    applyInputStripFontSize(o, next);
    clampStripToPage(o, pageCssW, pageCssH);
  } else {
    const next = clampFontSize((o.fontSize || FONT_SIZE_DEFAULT) + delta);
    if (next === clampFontSize(o.fontSize || FONT_SIZE_DEFAULT)) return;
    o.fontSize = next;
    const box = measureTextBox(o.text || 'あ', next);
    o.w = Math.min(pageCssW - o.x, Math.max(o.w, box.w));
    o.h = Math.max(o.h, box.h);
  }
  afterOverlayChange();
}

function setFontFamily(id) {
  const o = selectedId ? findOverlay(selectedId) : null;
  if (!o || (o.type !== 'text' && o.type !== 'input-strip')) return;
  const next = id === 'mincho' ? 'mincho' : 'gothic';
  if (o.fontFamily === next) return;
  if (!textEditSession && !stripEditSession) commitUndo();
  o.fontFamily = next;
  afterOverlayChange();
}

function setError(msg) {
  const el = $('pdff-error');
  if (!el) return;
  if (!msg) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = msg;
  el.classList.remove('hidden');
}

function setStatus(msg) {
  const el = $('pdff-status');
  if (el) el.textContent = msg || '';
}

function setBusy(on, label = '提出用紙を準備しています', progress = null) {
  busy = on;
  const el = $('pdff-busy');
  const labelEl = $('pdff-busy-label');
  const countEl = $('pdff-busy-count');
  const fill = $('pdff-busy-fill');
  if (labelEl) labelEl.textContent = label;
  if (countEl) {
    if (progress && progress.total > 0) {
      countEl.textContent = `${progress.current} / ${progress.total}`;
    } else {
      countEl.textContent = '';
    }
  }
  if (fill) {
    if (progress && progress.total > 0) {
      const pct = Math.max(0, Math.min(100, Math.round((progress.current / progress.total) * 100)));
      fill.style.width = `${pct}%`;
    } else if (on) {
      fill.style.width = '28%';
    } else {
      fill.style.width = '0%';
    }
  }
  if (el) el.classList.toggle('hidden', !on);
  updateBakeEnabled();
  updateUndoUi();
  updatePageLabel();
}

function flashPlaced(id) {
  placeFlashId = id;
  afterOverlayChange();
  window.setTimeout(() => {
    if (placeFlashId === id) {
      placeFlashId = null;
      paintOverlayDom();
    }
  }, 180);
}

function scheduleGuideFade() {
  // Paper First: ガイドは吸着中のみ。離したら即消す
  guidesLinger = false;
  if (guideFadeTimer) clearTimeout(guideFadeTimer);
  guideFadeTimer = null;
  activeGuides = { guidesX: [], guidesY: [] };
  drawGuideOverlay();
}

function playPaperEnter() {
  const wrap = $('pdff-page-wrap');
  if (!wrap) return;
  wrap.classList.remove('pdff-page-wrap--enter');
  // restart animation
  void wrap.offsetWidth;
  wrap.classList.add('pdff-page-wrap--enter');
  const done = () => wrap.classList.remove('pdff-page-wrap--enter');
  wrap.addEventListener('animationend', done, { once: true });
}

function playPaperFlatten() {
  return new Promise((resolve) => {
    const wrap = $('pdff-page-wrap');
    if (!wrap) {
      resolve();
      return;
    }
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      wrap.classList.remove('pdff-page-wrap--flatten');
      resolve();
    };
    wrap.classList.remove('pdff-page-wrap--flatten');
    void wrap.offsetWidth;
    wrap.classList.add('pdff-page-wrap--flatten');
    wrap.addEventListener('animationend', done, { once: true });
    setTimeout(done, 320);
  });
}

function updateBakeEnabled() {
  const bake = $('pdff-bake');
  if (bake) bake.disabled = busy || !pdfDoc;
}

function updateUndoUi() {
  const btn = $('pdff-undo');
  if (btn) btn.disabled = undoStack.length === 0 || busy;
}

async function ensurePdfjs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import(vendorPdfjs('pdf.mjs'));
  pdfjsLib.GlobalWorkerOptions.workerSrc = vendorPdfjs('pdf.worker.mjs');
  return pdfjsLib;
}

function pageOverlays() {
  return overlays.filter((o) => o.page === pageIndex);
}

function findOverlay(id) {
  return overlays.find((o) => o.id === id) || null;
}

function showWorkspace(on) {
  $('pdff-workspace')?.classList.toggle('hidden', !on);
  $('pdff-drop-section')?.classList.toggle('hidden', on);
}

function setMode(next) {
  if (textEditSession) commitTextEdit();
  if (stripEditSession) commitStripEdit();
  mode = next;
  if (next !== 'text') pendingMarkerKind = null;
  document.querySelectorAll('[data-pdff-mode]').forEach((btn) => {
    const on = btn.getAttribute('data-pdff-mode') === next;
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  const hint = $('pdff-mode-hint');
  const imageGuide = $('pdff-image-guide');
  const markerStrip = $('pdff-marker-strip');
  if (imageGuide) imageGuide.classList.toggle('hidden', next !== 'image');
  if (markerStrip) markerStrip.classList.toggle('hidden', next !== 'text');
  syncMarkerPaletteUi();
  if (hint) {
    const map = {
      text: pendingMarkerKind
        ? '記号を紙の上に置きます。空白をクリック。'
        : '紙の上をクリックして書きます。下の記号は紙へ書くチェック等。Enterで改行、外クリックで確定。',
      datetime: '日時を置きます。確定後は掴んで移動。もう一度クリックか Enter で書き直し。Ctrl+C/V・Ctrl+D で複製。',
      image: '',
      black: 'ドラッグで墨塗り。置いたあとも角でサイズ変更できます。',
      white: 'ドラッグで白く隠します。範囲選択中だけ青く見えます。離すと白になります。',
    };
    hint.textContent = map[next] || '';
    hint.classList.toggle('hidden', next === 'image');
  }
  updateTypeBar();
}

function syncMarkerPaletteUi() {
  document.querySelectorAll('[data-pdff-marker]').forEach((btn) => {
    const on = btn.getAttribute('data-pdff-marker') === pendingMarkerKind;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function placeMarkerAt(kind, p) {
  if (!canInteract()) return;
  if (textEditSession) commitTextEdit();
  if (stripEditSession) commitStripEdit();
  commitUndo();
  const size = MARKER_SIZE_DEFAULT;
  const built = buildMarker(kind, {
    page: pageIndex,
    x: Math.min(Math.max(0, p.x - size / 2), Math.max(0, pageCssW - size)),
    y: Math.min(Math.max(0, p.y - size / 2), Math.max(0, pageCssH - size)),
    size,
  });
  const obj = /** @type {PaperObject} */ ({ id: uid(), ...built });
  overlays.push(obj);
  selectedId = obj.id;
  pendingMarkerKind = null;
  syncMarkerPaletteUi();
  afterOverlayChange();
  flashPlaced(obj.id);
  const hint = $('pdff-mode-hint');
  if (hint && mode === 'text') {
    hint.textContent = '紙の上をクリックして書きます。下の記号は紙へ書くチェック等。Enterで改行、外クリックで確定。';
  }
}

function selectObject(id) {
  if (textEditSession && textEditSession.id !== id) commitTextEdit();
  if (stripEditSession && stripEditSession.id !== id) commitStripEdit();
  selectedId = id;
  afterOverlayChange();
}

function clearSelection() {
  if (textEditSession) commitTextEdit();
  if (stripEditSession) commitStripEdit();
  if (!selectedId) return;
  selectedId = null;
  afterOverlayChange();
}

function afterOverlayChange() {
  paintOverlayDom();
  drawGuideOverlay();
  refreshThumbs();
  updateTypeBar();
}

async function loadPdfFile(file) {
  setError('');
  $('pdff-done')?.classList.add('hidden');
  if (!file || (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name))) {
    setError('PDFファイルを選んでください。');
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    setError('ファイルサイズが大きすぎます（提出書類向け · 40MBまで）。');
    return;
  }
  setBusy(true, '提出用紙を準備しています');
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const lib = await ensurePdfjs();
    const task = lib.getDocument({
      data: bytes.slice(0),
      wasmUrl: vendorPdfjs('wasm/'),
    });
    task.onProgress = (p) => {
      if (p && p.total > 0) {
        setBusy(true, '提出用紙を準備しています');
        const fill = $('pdff-busy-fill');
        if (fill) {
          fill.style.width = `${Math.max(4, Math.min(100, Math.round((p.loaded / p.total) * 100)))}%`;
        }
      }
    };
    const doc = await task.promise;
    const limit = checkLimits(file.size, doc.numPages);
    if (!limit.ok && limit.reason === 'page_count') {
      setError(`ページ数が多すぎます（提出書類向け · ${MAX_PAGES}ページ程度まで）。`);
      await doc.destroy();
      return;
    }
    if (pdfDoc) {
      try { await pdfDoc.destroy(); } catch { /* ignore */ }
    }
    pdfDoc = doc;
    sourcePdfBytes = bytes;
    pageCount = doc.numPages;
    pageIndex = 0;
    overlays = [];
    undoStack = [];
    redoStack = [];
    selectedId = null;
    textEditSession = null;
    stripEditSession = null;
    sourceName = file.name || 'document.pdf';
    paperEnterPending = true;
    setBusy(true, '提出用紙を準備しています', { current: 1, total: Math.max(1, pageCount) });
    showWorkspace(true);
    buildThumbs();
    updatePageLabel();
    await renderPage();
    setStatus(`${sourceName} · ${pageCount}ページ`);
    updateUndoUi();
    updateBakeEnabled();
  } catch (err) {
    console.error(err);
    setError('PDFを開けませんでした。別のファイルでお試しください。');
  } finally {
    setBusy(false);
  }
}

function updatePageLabel() {
  const el = $('pdff-page-label');
  if (el) el.textContent = `${pageIndex + 1} / ${pageCount}`;
  const prev = $('pdff-prev');
  const next = $('pdff-next');
  if (prev) prev.disabled = pageIndex <= 0 || busy;
  if (next) next.disabled = pageIndex >= pageCount - 1 || busy;
  document.querySelectorAll('.pdff-thumb').forEach((btn) => {
    const i = Number(btn.getAttribute('data-page'));
    btn.setAttribute('aria-current', i === pageIndex ? 'page' : 'false');
    btn.classList.toggle('pdff-thumb--current', i === pageIndex);
  });
}

function buildThumbs() {
  const nav = $('pdff-thumbs');
  if (!nav) return;
  nav.innerHTML = '';
  for (let i = 0; i < pageCount; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pdff-thumb';
    btn.setAttribute('data-page', String(i));
    btn.setAttribute('aria-label', `${i + 1}ページ`);
    btn.innerHTML = `<span class="pdff-thumb__num">${i + 1}</span><span class="pdff-thumb__mark" aria-hidden="true"></span>`;
    btn.addEventListener('click', async () => {
      if (busy || i === pageIndex) return;
      pageIndex = i;
      selectedId = null;
      updatePageLabel();
      await renderPage();
    });
    nav.appendChild(btn);
  }
  refreshThumbs();
  updatePageLabel();
}

function refreshThumbs() {
  document.querySelectorAll('.pdff-thumb').forEach((btn) => {
    const i = Number(btn.getAttribute('data-page'));
    const edited = isPageEdited(overlays, i);
    btn.classList.toggle('pdff-thumb--edited', edited);
    const mark = btn.querySelector('.pdff-thumb__mark');
    if (mark) mark.textContent = edited ? '✎' : '';
  });
}

async function renderPage() {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(pageIndex + 1);
  const base = page.getViewport({ scale: 1 });
  const stage = document.querySelector('.pdff-stage');
  const pad = 16;
  const availW = Math.max(160, (stage?.clientWidth || 640) - pad);
  const availH = Math.max(200, (stage?.clientHeight || 720) - pad);
  // Paper First: 机いっぱいに紙を置く。表示スケール上限で小さくしない
  displayScale = Math.max(0.45, Math.min(availW / base.width, availH / base.height));

  const viewport = page.getViewport({ scale: displayScale });
  pageCssW = viewport.width;
  pageCssH = viewport.height;

  const canvas = $('pdff-page-canvas');
  const wrap = $('pdff-page-wrap');
  if (!canvas || !wrap) return;
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  wrap.style.width = `${viewport.width}px`;
  wrap.style.height = `${viewport.height}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  afterOverlayChange();
  if (paperEnterPending) {
    paperEnterPending = false;
    playPaperEnter();
  }
}

function paintOverlayDom() {
  const layer = $('pdff-overlay-layer');
  if (!layer) return;
  layer.innerHTML = '';
  layer.style.width = `${pageCssW}px`;
  layer.style.height = `${pageCssH}px`;

  for (const o of pageOverlays()) {
    const el = document.createElement('div');
    el.className = 'pdff-obj';
    el.dataset.id = o.id;
    el.style.left = `${o.x}px`;
    el.style.top = `${o.y}px`;
    el.style.width = `${o.w}px`;
    el.style.height = `${o.h}px`;
    if (o.id === selectedId) el.classList.add('pdff-obj--selected');
    if (o.id === placeFlashId) el.classList.add('pdff-obj--placed');

    if (o.type === 'text') {
      el.classList.add('pdff-obj--text');
      const fs = clampFontSize(o.fontSize || FONT_SIZE_DEFAULT);
      el.style.fontSize = `${fs}px`;
      el.style.fontFamily = fontFamilyCss(o.fontFamily);
      const body = document.createElement('div');
      body.className = 'pdff-obj__body';
      if (textEditSession?.id === o.id) {
        el.classList.add('pdff-obj--editing');
        const ed = document.createElement('div');
        ed.className = 'pdff-text-editor';
        ed.contentEditable = 'true';
        ed.spellcheck = false;
        ed.setAttribute('role', 'textbox');
        ed.setAttribute('aria-multiline', 'true');
        ed.setAttribute('aria-label', '文字を入力');
        ed.innerText = o.text || '';
        ed.addEventListener('pointerdown', (ev) => ev.stopPropagation());
        ed.addEventListener('keydown', onTextEditorKeydown);
        ed.addEventListener('input', () => {
          o.text = ed.innerText.replace(/\u00a0/g, ' ');
          const box = measureTextBox(o.text || ' ', fs, o.w);
          o.h = Math.max(o.h, box.h);
          el.style.height = `${o.h}px`;
        });
        body.appendChild(ed);
      } else {
        body.textContent = o.text || '';
        el.addEventListener('dblclick', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          beginEditExistingText(o);
        });
      }
      el.appendChild(body);
    } else if (o.type === 'input-strip') {
      el.classList.add('pdff-obj--strip');
      const fs = clampFontSize(o.fontSize || FONT_SIZE_DEFAULT);
      el.style.fontSize = `${fs}px`;
      el.style.fontFamily = fontFamilyCss(o.fontFamily);
      const editing = stripEditSession?.id === o.id;
      if (editing) el.classList.add('pdff-obj--editing');
      for (const slot of o.slots || []) {
        const cell = document.createElement('div');
        cell.className = 'pdff-strip-slot';
        // 横寄せドラッグ中のみ _paintDx（負 dx の見た目補正）。確定値は常に slot.dx
        cell.style.left = `${slot._paintDx != null ? slot._paintDx : slot.dx}px`;
        cell.style.top = `${slot.dy}px`;
        cell.style.width = `${slot.w}px`;
        cell.style.height = `${slot.h}px`;
        if (editing && stripEditSession && (o.slots || [])[stripEditSession.slotIndex]?.id === slot.id) {
          cell.classList.add('pdff-strip-slot--active');
        }
        const lab = document.createElement('span');
        lab.className = 'pdff-strip-slot__label';
        lab.textContent = slot.label;
        cell.appendChild(lab);
        if (editing) {
          const inp = document.createElement('input');
          inp.className = 'pdff-strip-slot__input';
          inp.type = 'text';
          inp.value = slot.value || '';
          inp.maxLength = slot.maxLen || 8;
          inp.setAttribute('aria-label', slot.label);
          inp.dataset.slotId = slot.id;
          inp.addEventListener('pointerdown', (ev) => ev.stopPropagation());
          inp.addEventListener('keydown', (ev) => onStripSlotKeydown(ev, o, slot.id));
          inp.addEventListener('compositionstart', () => {
            if (stripEditSession) stripEditSession.composing = true;
          });
          inp.addEventListener('compositionend', () => {
            if (stripEditSession) stripEditSession.composing = false;
            const raw = inp.value;
            if (slot.id === 'year') {
              const normalized = normalizeEraYearInput(raw);
              if (normalized && normalized !== raw) {
                slot.value = normalized;
                inp.value = normalized;
              } else {
                slot.value = raw;
              }
            } else if (looksLikeDatetimeBundle(raw) && o.template === 'datetime') {
              o.slots = applyDatetimeToSlots(o.slots || [], parseDatetimeInput(raw));
              afterOverlayChange();
              return;
            } else {
              slot.value = raw;
            }
          });
          inp.addEventListener('input', () => {
            if (stripEditSession?.composing || inp.composing) return;
            const raw = inp.value;
            if (looksLikeDatetimeBundle(raw) && o.template === 'datetime') {
              const parsed = parseDatetimeInput(raw);
              o.slots = applyDatetimeToSlots(o.slots || [], parsed);
              afterOverlayChange();
              return;
            }
            slot.value = raw;
          });
          inp.addEventListener('paste', (ev) => {
            const text = ev.clipboardData?.getData('text') || '';
            if (looksLikeDatetimeBundle(text) && o.template === 'datetime') {
              ev.preventDefault();
              const parsed = parseDatetimeInput(text);
              o.slots = applyDatetimeToSlots(o.slots || [], parsed);
              afterOverlayChange();
            }
          });
          cell.appendChild(inp);
        } else {
          const val = document.createElement('span');
          val.className = 'pdff-strip-slot__value';
          val.textContent = slot.value || '';
          cell.appendChild(val);
          if (o.id === selectedId) {
            // MECE: 本体=Object移動 / 下端グリップ=slot横寄せ（競合しない）
            const grip = document.createElement('span');
            grip.className = 'pdff-strip-slot__grip';
            grip.title = '左右に動かして欄位置を寄せる';
            grip.setAttribute('aria-label', `${slot.label}を横へ寄せる`);
            grip.addEventListener('pointerdown', (ev) => {
              if (ev.button !== 0) return;
              ev.preventDefault();
              ev.stopPropagation();
              const wrap = $('pdff-page-wrap');
              if (!wrap) return;
              selectedId = o.id;
              dragMove = null;
              dragSlot = {
                stripId: o.id,
                slotId: slot.id,
                startPointerX: localPoint(ev, wrap).x,
                origDx: slot.dx,
                started: false,
              };
              // ジェスチャ中に DOM 再構築しない（capture・状態を壊す）
              wrap.setPointerCapture?.(ev.pointerId);
            });
            cell.appendChild(grip);
          }
        }
        el.appendChild(cell);
      }
      if (!editing) {
        el.addEventListener('dblclick', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          beginEditStrip(o);
        });
      }
    } else if (o.type === 'marker') {
      el.classList.add('pdff-obj--marker');
      const cv = document.createElement('canvas');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(o.w * dpr));
      cv.height = Math.max(1, Math.round(o.h * dpr));
      cv.style.width = '100%';
      cv.style.height = '100%';
      cv.setAttribute('aria-hidden', 'true');
      const cctx = cv.getContext('2d');
      if (cctx) {
        cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cctx.clearRect(0, 0, o.w, o.h);
        drawMarker(cctx, o.marker || 'circle', 0, 0, o.w, o.h);
      }
      el.appendChild(cv);
    } else if (o.type === 'image' && o.src) {
      el.classList.add('pdff-obj--image');
      const img = document.createElement('img');
      img.src = o.src;
      img.alt = '';
      img.draggable = false;
      el.appendChild(img);
    } else if (o.type === 'black') {
      el.classList.add('pdff-obj--black');
    } else if (o.type === 'white') {
      el.classList.add('pdff-obj--white');
    }

    const editingHere =
      (textEditSession?.id === o.id) || (stripEditSession?.id === o.id);
    if (!editingHere) {
      el.addEventListener('pointerdown', (ev) => onObjectPointerDown(ev, o));
    }
    layer.appendChild(el);

    if (o.id === selectedId && !editingHere) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'pdff-obj-delete';
      del.setAttribute('aria-label', '削除');
      del.textContent = '×';
      del.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      });
      del.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        deleteSelected();
      });
      el.appendChild(del);

      if (o.type === 'black' || o.type === 'white' || o.type === 'image' || o.type === 'text' || o.type === 'marker') {
        for (const corner of /** @type {const} */ (['nw', 'ne', 'sw', 'se'])) {
          const h = document.createElement('span');
          h.className = `pdff-handle pdff-handle--${corner}`;
          h.dataset.corner = corner;
          h.addEventListener('pointerdown', (ev) => onResizePointerDown(ev, o, corner));
          el.appendChild(h);
        }
      }
    }
  }

  if (dragDraw) {
    const ghost = document.createElement('div');
    ghost.className = 'pdff-obj pdff-obj--ghost';
    const x = Math.min(dragDraw.startX, dragDraw.curX);
    const y = Math.min(dragDraw.startY, dragDraw.curY);
    const w = Math.abs(dragDraw.curX - dragDraw.startX);
    const h = Math.abs(dragDraw.curY - dragDraw.startY);
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
    ghost.style.width = `${w}px`;
    ghost.style.height = `${h}px`;
    if (mode === 'black') ghost.classList.add('pdff-obj--black');
    if (mode === 'white') ghost.classList.add('pdff-obj--white');
    layer.appendChild(ghost);
  }

  if (textEditSession) {
    requestAnimationFrame(() => {
      const ed = layer.querySelector('.pdff-text-editor');
      if (ed instanceof HTMLElement) {
        ed.focus();
        const range = document.createRange();
        range.selectNodeContents(ed);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  } else if (stripEditSession) {
    requestAnimationFrame(() => {
      const inputs = [...layer.querySelectorAll('.pdff-strip-slot__input')];
      const idx = Math.max(0, Math.min(stripEditSession.slotIndex, inputs.length - 1));
      const inp = inputs[idx];
      if (inp instanceof HTMLInputElement) {
        inp.focus();
        inp.select();
      }
    });
  }
}

function drawGuideOverlay() {
  const g = $('pdff-guide-canvas');
  const grid = $('pdff-grid');
  if (!g) return;
  g.width = Math.floor(pageCssW);
  g.height = Math.floor(pageCssH);
  g.style.width = `${pageCssW}px`;
  g.style.height = `${pageCssH}px`;
  const ctx = g.getContext('2d');
  ctx.clearRect(0, 0, g.width, g.height);

  const dragging = !!(dragMove || dragDraw || dragResize || dragSlot);
  if (grid) grid.classList.toggle('pdff-grid--on', dragging);

  if (!dragging && !guidesLinger) {
    activeGuides = { guidesX: [], guidesY: [] };
    return;
  }

  ctx.strokeStyle = 'rgba(37, 99, 235, 0.22)';
  ctx.lineWidth = 1;
  for (const x of activeGuides.guidesX) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, g.height);
    ctx.stroke();
  }
  for (const y of activeGuides.guidesY) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(g.width, y + 0.5);
    ctx.stroke();
  }
}

function localPoint(ev, el) {
  const r = el.getBoundingClientRect();
  return {
    x: Math.min(pageCssW, Math.max(0, ev.clientX - r.left)),
    y: Math.min(pageCssH, Math.max(0, ev.clientY - r.top)),
  };
}

function onObjectPointerDown(ev, o) {
  if (busy) return;
  if (ev.target.closest?.('.pdff-handle') || ev.target.closest?.('.pdff-obj-delete')) return;
  if (ev.target.closest?.('.pdff-strip-slot__grip')) return;
  if (textEditSession) {
    if (textEditSession.id === o.id) return;
    commitTextEdit();
  }
  if (stripEditSession) {
    if (stripEditSession.id === o.id) return;
    commitStripEdit();
  }
  ev.preventDefault();
  ev.stopPropagation();
  const wrap = $('pdff-page-wrap');
  if (!wrap) return;
  if (guideFadeTimer) clearTimeout(guideFadeTimer);
  guidesLinger = false;
  const p = localPoint(ev, wrap);
  // 選択済み日時をもう一度クリック（ドラッグなし）→ 編集。ダブルクリック依存をやめる
  const openEditOnClick = o.type === 'input-strip' && selectedId === o.id;
  selectedId = o.id;
  // DOM再構築の前にオフセットを確定し、capture も先に取る（飛び移り防止）
  dragMove = {
    id: o.id,
    ox: p.x - o.x,
    oy: p.y - o.y,
    started: false,
    openEditOnClick,
    heldX: null,
    heldY: null,
  };
  wrap.setPointerCapture?.(ev.pointerId);
  afterOverlayChange();
}

function onResizePointerDown(ev, o, corner) {
  if (busy) return;
  if (textEditSession) commitTextEdit();
  if (stripEditSession) commitStripEdit();
  ev.preventDefault();
  ev.stopPropagation();
  const wrap = $('pdff-page-wrap');
  if (!wrap) return;
  if (guideFadeTimer) clearTimeout(guideFadeTimer);
  guidesLinger = false;
  const p = localPoint(ev, wrap);
  selectedId = o.id;
  dragResize = {
    id: o.id,
    corner,
    startX: p.x,
    startY: p.y,
    orig: { ...o },
  };
  commitUndo();
  afterOverlayChange();
  wrap.setPointerCapture?.(ev.pointerId);
}

function onTextEditorKeydown(ev) {
  // Paper First: Enter = 改行（紙に書く）。確定は外クリック / Ctrl+Enter
  if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
    ev.preventDefault();
    commitTextEdit();
  } else if (ev.key === 'Escape') {
    ev.preventDefault();
    cancelTextEdit();
  }
}

function beginNewTextAt(p) {
  if (textEditSession) commitTextEdit();
  if (stripEditSession) commitStripEdit();
  commitUndo();
  const fontSize = FONT_SIZE_DEFAULT;
  const obj = {
    id: uid(),
    type: /** @type {const} */ ('text'),
    page: pageIndex,
    x: p.x,
    y: p.y,
    w: Math.min(180, pageCssW - p.x),
    h: fontSize * 1.6,
    text: '',
    fontSize,
    fontFamily: /** @type {const} */ ('gothic'),
  };
  overlays.push(obj);
  selectedId = obj.id;
  textEditSession = { id: obj.id, isNew: true, before: '' };
  afterOverlayChange();
}

function beginNewDatetimeAt(p) {
  if (textEditSession) commitTextEdit();
  if (stripEditSession) commitStripEdit();
  commitUndo();
  const built = buildInputStrip('datetime', {
    page: pageIndex,
    x: Math.min(p.x, Math.max(0, pageCssW - 200)),
    y: p.y,
    fontSize: FONT_SIZE_DEFAULT,
    fontFamily: 'gothic',
  });
  const obj = /** @type {PaperObject} */ ({ id: uid(), ...built });
  clampStripToPage(obj, pageCssW, pageCssH);
  overlays.push(obj);
  selectedId = obj.id;
  beginEditStrip(obj, true);
}

function beginEditExistingText(o) {
  if (busy || o.type !== 'text') return;
  if (textEditSession?.id === o.id) return;
  if (textEditSession) commitTextEdit();
  commitUndo();
  textEditSession = { id: o.id, isNew: false, before: o.text || '' };
  selectedId = o.id;
  afterOverlayChange();
}

function commitTextEdit() {
  if (!textEditSession) return;
  const session = textEditSession;
  const o = findOverlay(session.id);
  const editor = document.querySelector('.pdff-text-editor');
  const raw = editor instanceof HTMLElement
    ? editor.innerText
    : (o?.text || '');
  const text = String(raw).replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/\n$/, '');
  textEditSession = null;
  if (!text.trim()) {
    overlays = overlays.filter((x) => x.id !== session.id);
    selectedId = null;
    afterOverlayChange();
    return;
  }
  if (o) {
    o.text = text;
    const box = measureTextBox(text, o.fontSize || FONT_SIZE_DEFAULT, o.w);
    o.w = Math.min(pageCssW - o.x, Math.max(48, o.w));
    o.h = Math.max(box.h, clampFontSize(o.fontSize || FONT_SIZE_DEFAULT) * 1.45);
    selectedId = o.id;
  }
  afterOverlayChange();
  if (o) flashPlaced(o.id);
}

function cancelTextEdit() {
  if (!textEditSession) return;
  const session = textEditSession;
  textEditSession = null;
  if (session.isNew) {
    overlays = overlays.filter((x) => x.id !== session.id);
    selectedId = null;
  } else {
    const o = findOverlay(session.id);
    if (o) o.text = session.before;
  }
  afterOverlayChange();
}

/**
 * @param {PaperObject} o
 * @param {boolean} [isNew]
 * @param {{ skipUndo?: boolean }} [opts]
 */
function beginEditStrip(o, isNew = false, opts = {}) {
  if (busy || o.type !== 'input-strip') return;
  if (stripEditSession?.id === o.id) return;
  if (textEditSession) commitTextEdit();
  if (stripEditSession) commitStripEdit();
  if (!isNew && !opts.skipUndo) commitUndo();
  stripEditSession = {
    id: o.id,
    isNew,
    slotIndex: 0,
    composing: false,
    beforeSlots: (o.slots || []).map((s) => ({ id: s.id, value: s.value || '' })),
  };
  selectedId = o.id;
  afterOverlayChange();
}

function commitStripEdit() {
  if (!stripEditSession) return;
  const session = stripEditSession;
  const o = findOverlay(session.id);
  stripEditSession = null;
  if (!o) {
    afterOverlayChange();
    return;
  }
  const hasValue = (o.slots || []).some((s) => String(s.value || '').trim());
  if (!hasValue && session.isNew) {
    overlays = overlays.filter((x) => x.id !== session.id);
    selectedId = null;
    afterOverlayChange();
    return;
  }
  selectedId = o.id;
  afterOverlayChange();
  flashPlaced(o.id);
}

function cancelStripEdit() {
  if (!stripEditSession) return;
  const session = stripEditSession;
  stripEditSession = null;
  if (session.isNew) {
    overlays = overlays.filter((x) => x.id !== session.id);
    selectedId = null;
  } else {
    const o = findOverlay(session.id);
    if (o?.slots) {
      for (const b of session.beforeSlots) {
        const slot = o.slots.find((s) => s.id === b.id);
        if (slot) slot.value = b.value;
      }
    }
  }
  afterOverlayChange();
}

/**
 * @param {KeyboardEvent} ev
 * @param {PaperObject} o
 * @param {string} slotId
 */
function onStripSlotKeydown(ev, o, slotId) {
  // IME変換中は Tab/Enter を奪わない（「れいわ」→「令和」ができず月へ飛ぶのを防ぐ）
  if (ev.isComposing || ev.keyCode === 229 || stripEditSession?.composing) return;
  const slots = o.slots || [];
  const idx = slots.findIndex((s) => s.id === slotId);
  if (ev.key === 'Tab') {
    ev.preventDefault();
    if (!stripEditSession) return;
    // 年スロット離脱前に和暦を西暦へ
    if (slotId === 'year') {
      const yearSlot = slots.find((s) => s.id === 'year');
      if (yearSlot) yearSlot.value = normalizeEraYearInput(yearSlot.value || '');
    }
    const next = ev.shiftKey
      ? (idx <= 0 ? slots.length - 1 : idx - 1)
      : (idx >= slots.length - 1 ? 0 : idx + 1);
    stripEditSession.slotIndex = next;
    afterOverlayChange();
    return;
  }
  if (ev.key === 'Enter') {
    ev.preventDefault();
    if (slotId === 'year') {
      const yearSlot = slots.find((s) => s.id === 'year');
      if (yearSlot) yearSlot.value = normalizeEraYearInput(yearSlot.value || '');
    }
    commitStripEdit();
    return;
  }
  if (ev.key === 'Escape') {
    ev.preventDefault();
    cancelStripEdit();
  }
}

function deleteSelected() {
  if (!selectedId || busy) return;
  if (textEditSession) {
    cancelTextEdit();
    return;
  }
  if (stripEditSession) {
    cancelStripEdit();
    return;
  }
  const id = selectedId;
  if (!overlays.some((o) => o.id === id)) return;
  commitUndo();
  overlays = overlays.filter((o) => o.id !== id);
  selectedId = null;
  afterOverlayChange();
}

function copySelectedObject() {
  if (busy || textEditSession || stripEditSession) return false;
  const tag = /** @type {HTMLElement} */ (document.activeElement)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return false;
  const o = selectedId ? findOverlay(selectedId) : null;
  if (!o) return false;
  objectClipboard = cloneOverlays([o])[0];
  setStatus('コピーしました。Ctrl+V で同じ紙に貼れます');
  return true;
}

function pasteObjectClipboard(at = null) {
  if (busy || !objectClipboard || textEditSession || stripEditSession) return false;
  commitUndo();
  const src = objectClipboard;
  const copy = /** @type {PaperObject} */ ({
    ...src,
    id: uid(),
    page: pageIndex,
    slots: src.slots ? src.slots.map(cloneSlot) : undefined,
  });
  const ox = at ? at.x : src.x + 14;
  const oy = at ? at.y : src.y + 14;
  copy.x = Math.min(pageCssW - copy.w, Math.max(0, ox));
  copy.y = Math.min(pageCssH - copy.h, Math.max(0, oy));
  if (copy.type === 'input-strip') clampStripToPage(copy, pageCssW, pageCssH);
  overlays.push(copy);
  selectedId = copy.id;
  afterOverlayChange();
  // 日時は貼った直後から書き直せる（新規配置と同じ）。Undo は貼り付け1手のみ
  if (copy.type === 'input-strip') {
    beginEditStrip(copy, false, { skipUndo: true });
  } else {
    flashPlaced(copy.id);
  }
  setStatus('貼り付けました');
  return true;
}

/**
 * @param {string} src
 * @param {{ x: number, y: number }|null} [at]
 */
async function placeImageFromSrc(src, at = null) {
  if (!canInteract()) return;
  if (textEditSession) commitTextEdit();
  if (stripEditSession) commitStripEdit();
  const normalized = await normalizePlacedImageSrc(src);
  const size = await imageNaturalSize(normalized);
  const maxW = Math.min(160, pageCssW * 0.35);
  const scale = Math.min(1, maxW / (size.w || 1));
  const w = Math.max(24, size.w * scale);
  const h = Math.max(24, size.h * scale);
  const x = at
    ? Math.min(Math.max(0, at.x), Math.max(0, pageCssW - w))
    : Math.max(0, (pageCssW - w) / 2);
  const y = at
    ? Math.min(Math.max(0, at.y), Math.max(0, pageCssH - h))
    : Math.max(0, (pageCssH - h) / 2);
  commitUndo();
  const obj = {
    id: uid(),
    type: /** @type {const} */ ('image'),
    page: pageIndex,
    x,
    y,
    w,
    h,
    src: normalized,
  };
  overlays.push(obj);
  selectedId = obj.id;
  afterOverlayChange();
  flashPlaced(obj.id);
}

function onWrapPointerDown(ev) {
  if (!pdfDoc || busy) return;
  const wrap = $('pdff-page-wrap');
  if (!wrap || ev.target.closest?.('.pdff-obj')) return;
  if (guideFadeTimer) clearTimeout(guideFadeTimer);
  guidesLinger = false;
  const p = localPoint(ev, wrap);

  if (textEditSession) {
    commitTextEdit();
  }
  if (stripEditSession) {
    commitStripEdit();
  }

  if (mode === 'text') {
    if (pendingMarkerKind) {
      placeMarkerAt(pendingMarkerKind, p);
      return;
    }
    beginNewTextAt(p);
    return;
  }

  if (mode === 'datetime') {
    beginNewDatetimeAt(p);
    return;
  }

  if (mode === 'image') {
    pendingImageAt = p;
    const input = $('pdff-image-input');
    if (!input) return;
    input.click();
    return;
  }

  if (mode === 'black' || mode === 'white') {
    clearSelection();
    dragDraw = { startX: p.x, startY: p.y, curX: p.x, curY: p.y };
    wrap.setPointerCapture?.(ev.pointerId);
    afterOverlayChange();
  }
}

function onWrapPointerMove(ev) {
  const wrap = $('pdff-page-wrap');
  if (!wrap) return;
  const p = localPoint(ev, wrap);

  if (dragResize) {
    const o = findOverlay(dragResize.id);
    if (!o) return;
    const orig = dragResize.orig;
    const limits = { min: 8, maxW: pageCssW, maxH: pageCssH };
    const free = !!(ev.shiftKey) || (o.type !== 'image' && o.type !== 'marker');
    // 文字・黒・白は自由矩形。画像・記号はデフォルト縦横比固定（Shiftで自由）
    const next = free
      ? resizeFree(orig, dragResize.corner, p, limits)
      : resizeKeepingAspect(orig, dragResize.corner, p, limits);
    o.x = next.x;
    o.y = next.y;
    o.w = next.w;
    o.h = next.h;
    paintOverlayDom();
    drawGuideOverlay();
    return;
  }

  if (dragMove) {
    const o = findOverlay(dragMove.id);
    if (!o) return;
    let x = p.x - dragMove.ox;
    let y = p.y - dragMove.oy;
    x = Math.min(pageCssW - o.w, Math.max(0, x));
    y = Math.min(pageCssH - o.h, Math.max(0, y));
    const now = performance.now();
    if (dragMove.lastT != null && dragMove.lastX != null && dragMove.lastY != null) {
      const dt = Math.max(1, now - dragMove.lastT);
      const dist = Math.hypot(p.x - dragMove.lastX, p.y - dragMove.lastY);
      dragMove.speed = (dist / dt) * 1000;
    }
    dragMove.lastX = p.x;
    dragMove.lastY = p.y;
    dragMove.lastT = now;
    if (!dragMove.started && (Math.abs(x - o.x) > 0.5 || Math.abs(y - o.y) > 0.5)) {
      commitUndo();
      dragMove.started = true;
    }
    // Alt: Snap 無効（現状維持）。設定UIは作らない
    if (ev.altKey) {
      dragMove.heldX = null;
      dragMove.heldY = null;
      o.x = x;
      o.y = y;
      activeGuides = { guidesX: [], guidesY: [] };
    } else {
      const guides = collectGuideLines({ width: pageCssW, height: pageCssH }, pageOverlays(), o.id);
      const strength = snapStrengthForSpeed(dragMove.speed || 0);
      const snapped = snapBox(
        { x, y, w: o.w, h: o.h },
        guides,
        undefined,
        strength,
        { x: dragMove.heldX ?? null, y: dragMove.heldY ?? null }
      );
      o.x = snapped.x;
      o.y = snapped.y;
      dragMove.heldX = snapped.heldX ?? null;
      dragMove.heldY = snapped.heldY ?? null;
      activeGuides = { guidesX: snapped.guidesX, guidesY: snapped.guidesY };
    }
    paintOverlayDom();
    drawGuideOverlay();
    return;
  }

  if (dragSlot) {
    const strip = findOverlay(dragSlot.stripId);
    if (!strip || strip.type !== 'input-strip') return;
    const slot = (strip.slots || []).find((s) => s.id === dragSlot.slotId);
    if (!slot) return;
    const dx = p.x - dragSlot.startPointerX;
    const nextDx = clampSlotDxPreserveOrder(strip.slots || [], dragSlot.slotId, dragSlot.origDx + dx);
    if (!dragSlot.started && Math.abs(nextDx - dragSlot.origDx) > 0.5) {
      commitUndo();
      dragSlot.started = true;
    }
    slot.dx = nextDx;
    slot.dy = 0;
    // ドラッグ中は strip.x を動かさない。幅だけ拡げてプレビュー
    let minDx = 0;
    let maxR = 0;
    for (const s of strip.slots || []) {
      minDx = Math.min(minDx, s.dx);
      maxR = Math.max(maxR, s.dx + s.w);
    }
    strip.w = Math.max(8, maxR - Math.min(0, minDx));
    // dx が負のとき見た目が枠外に出ないよう一時オフセット
    for (const s of strip.slots || []) {
      s._paintDx = s.dx - Math.min(0, minDx);
    }
    paintOverlayDom();
    return;
  }

  if (dragDraw) {
    dragDraw.curX = p.x;
    dragDraw.curY = p.y;
    paintOverlayDom();
    drawGuideOverlay();
  }
}

function onWrapPointerUp() {
  if (dragResize) {
    dragResize = null;
    scheduleGuideFade();
    afterOverlayChange();
    return;
  }
  if (dragSlot) {
    const did = dragSlot.started;
    const id = dragSlot.stripId;
    dragSlot = null;
    const strip = findOverlay(id);
    if (strip?.type === 'input-strip') {
      for (const s of strip.slots || []) delete s._paintDx;
      reflowInputStripX(strip);
      clampStripToPage(strip, pageCssW, pageCssH);
    }
    afterOverlayChange();
    if (did) flashPlaced(id);
    return;
  }
  if (dragMove) {
    const movedId = dragMove.id;
    const didMove = dragMove.started;
    const openEdit = !!(dragMove.openEditOnClick && !didMove);
    dragMove = null;
    scheduleGuideFade();
    if (openEdit) {
      const o = findOverlay(movedId);
      if (o?.type === 'input-strip') {
        beginEditStrip(o);
        return;
      }
    }
    afterOverlayChange();
    if (didMove) flashPlaced(movedId);
    return;
  }
  if (dragDraw) {
    const x = Math.min(dragDraw.startX, dragDraw.curX);
    const y = Math.min(dragDraw.startY, dragDraw.curY);
    const w = Math.abs(dragDraw.curX - dragDraw.startX);
    const h = Math.abs(dragDraw.curY - dragDraw.startY);
    dragDraw = null;
    scheduleGuideFade();
    if (w >= 4 && h >= 4) {
      commitUndo();
      const obj = {
        id: uid(),
        type: /** @type {const} */ (mode === 'white' ? 'white' : 'black'),
        page: pageIndex,
        x,
        y,
        w,
        h,
      };
      overlays.push(obj);
      selectedId = obj.id;
      afterOverlayChange();
      flashPlaced(obj.id);
      return;
    }
    afterOverlayChange();
  }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function imageNaturalSize(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 120, h: img.naturalHeight || 120 });
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 透過を保つ。クリップボードで黒背景化した印章は辺から近黒を抜く。
 * @param {string} src
 */
async function normalizePlacedImageSrc(src) {
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
    const w = img.naturalWidth || 1;
    const h = img.naturalHeight || 1;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return src;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    restoreClipboardBlackBackground(imageData);
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return src;
  }
}

function undo() {
  if (!undoStack.length || busy) return;
  if (textEditSession) {
    cancelTextEdit();
    return;
  }
  if (stripEditSession) {
    cancelStripEdit();
    return;
  }
  redoStack.push(cloneOverlays());
  overlays = undoStack.pop() || [];
  if (selectedId && !overlays.some((o) => o.id === selectedId)) selectedId = null;
  updateUndoUi();
  afterOverlayChange();
}

function redo() {
  if (!redoStack.length || busy || textEditSession || stripEditSession) return;
  pushUndo(undoStack, cloneOverlays());
  overlays = redoStack.pop() || [];
  if (selectedId && !overlays.some((o) => o.id === selectedId)) selectedId = null;
  updateUndoUi();
  afterOverlayChange();
}

/**
 * @param {number} pageZero
 * @param {number} scale
 */
async function rasterizePage(pageZero, scale) {
  const page = await pdfDoc.getPage(pageZero + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  const ratio = scale / displayScale;
  for (const o of overlays.filter((x) => x.page === pageZero)) {
    const x = o.x * ratio;
    const y = o.y * ratio;
    const w = o.w * ratio;
    const h = o.h * ratio;
    if (o.type === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, w, h);
    } else if (o.type === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
    } else if (o.type === 'text') {
      ctx.fillStyle = '#111827';
      const fs = clampFontSize(o.fontSize || FONT_SIZE_DEFAULT) * ratio;
      ctx.font = `${fs}px ${fontFamilyCss(o.fontFamily)}`;
      ctx.textBaseline = 'top';
      const lines = String(o.text || '').split('\n');
      for (let li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], x, y + li * fs * 1.35, w);
      }
    } else if (o.type === 'input-strip') {
      ctx.fillStyle = '#111827';
      const fs = clampFontSize(o.fontSize || FONT_SIZE_DEFAULT) * ratio;
      ctx.font = `${fs}px ${fontFamilyCss(o.fontFamily)}`;
      ctx.textBaseline = 'middle';
      for (const slot of o.slots || []) {
        const sx = (o.x + slot.dx) * ratio;
        const sy = (o.y + slot.dy + slot.h / 2) * ratio;
        const sw = slot.w * ratio;
        ctx.fillText(slot.value || '', sx, sy, sw);
      }
    } else if (o.type === 'marker') {
      drawMarker(ctx, o.marker || 'circle', x, y, w, h);
    } else if (o.type === 'image' && o.src) {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, x, y, w, h);
          resolve();
        };
        img.onerror = resolve;
        img.src = o.src;
      });
    }
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  canvas.width = 0;
  canvas.height = 0;
  return { blob, width: viewport.width, height: viewport.height };
}

function currentSuggestedFileName() {
  return buildSuggestedFileName({
    docType: $('pdff-doc-type')?.value || '書類',
    personName: $('pdff-person')?.value || '',
  });
}

function updateFilenamePreview() {
  const el = $('pdff-filename-preview');
  if (el) el.textContent = currentSuggestedFileName();
}

function openBakeDialog() {
  setError('');
  updateFilenamePreview();
  const edited = editedPageIndexes(overlays);
  if (!edited.length) {
    setError('編集内容がありません。文字・印・黒塗りなどを追加してから保存してください。');
    return;
  }
  const countEl = $('pdff-dialog-count');
  const listEl = $('pdff-dialog-list');
  if (countEl) countEl.textContent = `${edited.length}ページ`;
  if (listEl) {
    listEl.innerHTML = '';
    for (const i of edited) {
      const li = document.createElement('li');
      li.textContent = `✓ ${i + 1}ページ`;
      listEl.appendChild(li);
    }
  }
  const dlgName = $('pdff-dialog-filename');
  if (dlgName) dlgName.textContent = currentSuggestedFileName();
  const dlg = $('pdff-dialog');
  if (dlg) {
    dlg.classList.remove('hidden');
    dlg.setAttribute('aria-hidden', 'false');
  }
}

function closeBakeDialog() {
  const dlg = $('pdff-dialog');
  if (dlg) {
    dlg.classList.add('hidden');
    dlg.setAttribute('aria-hidden', 'true');
  }
}

async function bakeAndDownload() {
  if (!pdfDoc || !sourcePdfBytes || busy) return;
  const edited = new Set(editedPageIndexes(overlays));
  if (!edited.size) {
    setError('編集内容がありません。');
    closeBakeDialog();
    return;
  }

  closeBakeDialog();
  setError('');
  setBusy(true, '提出用PDFを仕上げています', { current: 0, total: pageCount });
  await playPaperFlatten();
  try {
    const { PDFDocument } = await import(vendorPdflib());
    const srcDoc = await PDFDocument.load(sourcePdfBytes.slice(0));
    const out = await PDFDocument.create();

    for (let i = 0; i < pageCount; i++) {
      if (edited.has(i)) {
        setBusy(true, '提出用PDFを仕上げています', { current: i + 1, total: pageCount });
        const { blob, width, height } = await rasterizePage(i, EXPORT_SCALE);
        if (!blob) throw new Error('raster failed');
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const jpg = await out.embedJpg(bytes);
        const page = out.addPage([width, height]);
        page.drawImage(jpg, { x: 0, y: 0, width, height });
      } else {
        setBusy(true, '提出用PDFを仕上げています', { current: i + 1, total: pageCount });
        const [copied] = await out.copyPages(srcDoc, [i]);
        out.addPage(copied);
      }
      await new Promise((r) => setTimeout(r, 0));
    }

    const pdfBytes = await out.save();
    const name = currentSuggestedFileName();
    const url = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    const done = $('pdff-done');
    if (done) {
      done.textContent = '提出用PDFが完成しました';
      done.classList.remove('hidden');
    }
    setStatus(`ダウンロード: ${name} · 固定 ${edited.size}ページ / 全${pageCount}ページ`);
  } catch (err) {
    console.error(err);
    setError('提出用PDFの作成に失敗しました。ページ数を減らして再試行してください。');
  } finally {
    setBusy(false);
  }
}

function clearAll() {
  textEditSession = null;
  stripEditSession = null;
  overlays = [];
  undoStack = [];
  redoStack = [];
  selectedId = null;
  sourcePdfBytes = null;
  if (pdfDoc) {
    try { pdfDoc.destroy(); } catch { /* ignore */ }
  }
  pdfDoc = null;
  pageCount = 0;
  pageIndex = 0;
  showWorkspace(false);
  const nav = $('pdff-thumbs');
  if (nav) nav.innerHTML = '';
  setStatus('');
  setError('');
  closeBakeDialog();
  $('pdff-done')?.classList.add('hidden');
  updateBakeEnabled();
  updateUndoUi();
}

function bindDrop() {
  const drop = $('pdff-drop');
  const input = $('pdff-file');
  if (!drop || !input) return;
  const open = () => input.click();
  drop.addEventListener('click', open);
  drop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });
  input.addEventListener('change', () => {
    const f = input.files?.[0];
    input.value = '';
    if (f) loadPdfFile(f);
  });
  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('sg-file-drop--active');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('sg-file-drop--active'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('sg-file-drop--active');
    const f = e.dataTransfer?.files?.[0];
    if (f) loadPdfFile(f);
  });
}

function bindImageInput() {
  const input = $('pdff-image-input');
  if (!input) return;
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const src = await readAsDataUrl(file);
    await placeImageFromSrc(src, pendingImageAt);
    pendingImageAt = null;
  });
}

function bindPaperImageDrop() {
  const wrap = $('pdff-page-wrap');
  if (!wrap) return;
  wrap.addEventListener('dragover', (e) => {
    if (!canInteract()) return;
    if ([...e.dataTransfer?.types || []].includes('Files')) {
      e.preventDefault();
    }
  });
  wrap.addEventListener('drop', async (e) => {
    if (!canInteract()) return;
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.preventDefault();
    e.stopPropagation();
    const p = localPoint(e, wrap);
    const src = await readAsDataUrl(file);
    await placeImageFromSrc(src, p);
  });
}

async function handlePasteImage(e) {
  if (!canInteract()) return;
  const tag = /** @type {HTMLElement} */ (e.target)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (textEditSession || stripEditSession) return;
  // Ctrl+V の keydown で Object 貼り付け済みなら、ここは画像専用
  // （印モード、または Object クリップボードが空のとき）
  if (objectClipboard && mode !== 'image') {
    if (pasteObjectClipboard()) e.preventDefault();
    return;
  }
  const items = [...(e.clipboardData?.items || [])];
  const preferred =
    items.find((i) => i.type === 'image/png')
    || items.find((i) => i.type.startsWith('image/'));
  if (preferred) {
    e.preventDefault();
    const file = preferred.getAsFile();
    if (!file) return;
    const src = await readAsDataUrl(file);
    await placeImageFromSrc(src, null);
    return;
  }
  if (objectClipboard && pasteObjectClipboard()) {
    e.preventDefault();
  }
}

function init() {
  bindDrop();
  bindImageInput();
  bindPaperImageDrop();
  setMode('text');

  document.querySelectorAll('[data-pdff-mode]').forEach((btn) => {
    btn.addEventListener('click', () => setMode(/** @type {ToolMode} */ (btn.getAttribute('data-pdff-mode'))));
  });

  document.querySelectorAll('[data-pdff-marker]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!canInteract() || mode !== 'text') {
        setMode('text');
      }
      const kind = btn.getAttribute('data-pdff-marker') || '';
      pendingMarkerKind = pendingMarkerKind === kind ? null : kind;
      syncMarkerPaletteUi();
      const hint = $('pdff-mode-hint');
      if (hint) {
        hint.textContent = pendingMarkerKind
          ? '記号を紙の上に置きます。空白をクリック。'
          : '紙の上をクリックして書きます。下の記号は紙へ書くチェック等。Enterで改行、外クリックで確定。';
      }
    });
  });

  document.querySelectorAll('[data-pdff-font]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setFontFamily(btn.getAttribute('data-pdff-font') || 'gothic');
    });
  });
  $('pdff-fs-dec')?.addEventListener('click', () => bumpFontSize(-1));
  $('pdff-fs-inc')?.addEventListener('click', () => bumpFontSize(1));
  $('pdff-image-guide')?.addEventListener('click', () => {
    if (!canInteract() || mode !== 'image') return;
    pendingImageAt = null;
    $('pdff-image-input')?.click();
  });

  const wrap = $('pdff-page-wrap');
  wrap?.addEventListener('pointerdown', onWrapPointerDown);
  wrap?.addEventListener('pointermove', (ev) => {
    onWrapPointerMove(ev);
    wrap.classList.toggle('pdff-page-wrap--dragging', !!(dragMove || dragSlot || dragResize || dragDraw));
  });
  wrap?.addEventListener('pointerup', (ev) => {
    onWrapPointerUp();
    wrap.classList.remove('pdff-page-wrap--dragging');
  });
  wrap?.addEventListener('pointercancel', () => {
    onWrapPointerUp();
    wrap.classList.remove('pdff-page-wrap--dragging');
  });
  wrap?.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const o = selectedId ? findOverlay(selectedId) : null;
    if (!o || (o.type !== 'text' && o.type !== 'input-strip' && o.type !== 'marker')) return;
    e.preventDefault();
    bumpFontSize(e.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  $('pdff-undo')?.addEventListener('click', undo);
  $('pdff-bake')?.addEventListener('click', openBakeDialog);
  $('pdff-dialog-confirm')?.addEventListener('click', bakeAndDownload);
  $('pdff-dialog-cancel')?.addEventListener('click', closeBakeDialog);
  $('pdff-dialog')?.addEventListener('click', (e) => {
    if (e.target === $('pdff-dialog')) closeBakeDialog();
  });
  $('pdff-doc-type')?.addEventListener('input', updateFilenamePreview);
  $('pdff-person')?.addEventListener('input', updateFilenamePreview);
  updateFilenamePreview();
  $('pdff-clear')?.addEventListener('click', clearAll);
  $('pdff-prev')?.addEventListener('click', async () => {
    if (textEditSession) commitTextEdit();
    if (stripEditSession) commitStripEdit();
    if (pageIndex <= 0) return;
    pageIndex -= 1;
    selectedId = null;
    updatePageLabel();
    await renderPage();
  });
  $('pdff-next')?.addEventListener('click', async () => {
    if (textEditSession) commitTextEdit();
    if (stripEditSession) commitStripEdit();
    if (pageIndex >= pageCount - 1) return;
    pageIndex += 1;
    selectedId = null;
    updatePageLabel();
    await renderPage();
  });

  window.addEventListener('paste', (e) => {
    void handlePasteImage(e);
  });

  window.addEventListener('resize', () => {
    if (!pdfDoc || busy) return;
    void renderPage();
  });

  document.addEventListener('pointerdown', (e) => {
    if (!textEditSession && !stripEditSession) return;
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.closest?.('.pdff-text-editor') || t.closest?.('.pdff-obj--editing')) return;
    if (t.closest?.('.pdff-strip-slot__input')) return;
    if (t.closest?.('#pdff-type-bar')) return;
    if (textEditSession) commitTextEdit();
    if (stripEditSession) commitStripEdit();
  }, true);

  window.addEventListener('keydown', (e) => {
    if (textEditSession) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelTextEdit();
      }
      return;
    }
    if (stripEditSession) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelStripEdit();
      }
      return;
    }
    if (e.key === 'Escape') {
      if (pendingMarkerKind) {
        pendingMarkerKind = null;
        syncMarkerPaletteUi();
        setMode(mode);
        return;
      }
      closeBakeDialog();
      clearSelection();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      const tag = /** @type {HTMLElement} */ (e.target)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || /** @type {HTMLElement} */ (e.target)?.isContentEditable) return;
      e.preventDefault();
      deleteSelected();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      if (copySelectedObject()) {
        e.preventDefault();
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      // Object クリップボード優先（電子印の画像が残っていても日時を潰さない）
      // 印を貼るときは「印・画像」タブへ（mode=image）
      const tag = /** @type {HTMLElement} */ (e.target)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (objectClipboard && mode !== 'image') {
        if (pasteObjectClipboard()) e.preventDefault();
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      if (copySelectedObject() && pasteObjectClipboard()) {
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'Enter' && selectedId && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = /** @type {HTMLElement} */ (e.target)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || /** @type {HTMLElement} */ (e.target)?.isContentEditable) return;
      const o = findOverlay(selectedId);
      if (o?.type === 'input-strip') {
        e.preventDefault();
        beginEditStrip(o);
      } else if (o?.type === 'text') {
        e.preventDefault();
        beginEditExistingText(o);
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });

  updateUndoUi();
  updateBakeEnabled();
}

init();
