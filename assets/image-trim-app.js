/**
 * image-trim.html — 指定サイズへの画像切り出し（枠固定 · cover-fit）
 */
const MAX_LONG_EDGE = 2048;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ZOOM_MAX_RATIO = 3;

const PRESETS = {
  'x-cover': { group: 'SNS', label: 'Xカバー', w: 1500, h: 500 },
  avatar: { group: 'SNS', label: 'アバター', w: 256, h: 256 },
  'slide-16x9': { group: '資料', label: '16:9', w: 1920, h: 1080 },
  'slide-4x3': { group: '資料', label: '4:3', w: 1600, h: 1200 },
};

const els = {
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  error: document.getElementById('trim-error'),
  editor: document.getElementById('editor-panel'),
  canvas: document.getElementById('trim-canvas'),
  canvasHost: document.getElementById('canvas-host'),
  zoomSlider: document.getElementById('zoom-slider'),
  zoomLabel: document.getElementById('zoom-label'),
  presetHint: document.getElementById('preset-hint'),
  status: document.getElementById('editor-status'),
  btnDownload: document.getElementById('btn-download'),
  btnCopy: document.getElementById('btn-copy'),
  btnResetView: document.getElementById('btn-reset-view'),
  btnClear: document.getElementById('btn-clear'),
};

const ctx = els.canvas.getContext('2d');

/** @type {ImageBitmap|null} */
let bitmap = null;
let imgW = 0;
let imgH = 0;
let sourceName = 'image.png';
let presetId = 'x-cover';
let frameW = PRESETS['x-cover'].w;
let frameH = PRESETS['x-cover'].h;
/** scale in output-pixel space: drawn size = imgW * scale */
let scale = 1;
let offsetX = 0;
let offsetY = 0;

let dragActive = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOriginOffsetX = 0;
let dragOriginOffsetY = 0;
let rafPending = false;
let lastTapAt = 0;

function showError(message) {
  els.error.textContent = message;
  els.error.classList.remove('hidden');
}

function clearError() {
  els.error.textContent = '';
  els.error.classList.add('hidden');
}

function setStatus(message) {
  els.status.textContent = message;
}

function hasImage() {
  return !!bitmap;
}

function coverMinScale() {
  if (!bitmap) return 1;
  return Math.max(frameW / imgW, frameH / imgH);
}

function clampOffsets() {
  const dw = imgW * scale;
  const dh = imgH * scale;
  const minX = frameW - dw;
  const minY = frameH - dh;
  offsetX = Math.min(0, Math.max(minX, offsetX));
  offsetY = Math.min(0, Math.max(minY, offsetY));
}

function setScale(next, keepCenter = true) {
  const min = coverMinScale();
  const max = min * ZOOM_MAX_RATIO;
  const clamped = Math.min(max, Math.max(min, next));
  if (keepCenter && bitmap) {
    const cx = frameW / 2;
    const cy = frameH / 2;
    const imgCx = (cx - offsetX) / scale;
    const imgCy = (cy - offsetY) / scale;
    scale = clamped;
    offsetX = cx - imgCx * scale;
    offsetY = cy - imgCy * scale;
  } else {
    scale = clamped;
  }
  clampOffsets();
  syncZoomUi();
}

function syncZoomUi() {
  const min = coverMinScale();
  const pct = Math.round((scale / min) * 100);
  els.zoomLabel.textContent = `${pct}%`;
  els.zoomSlider.min = '100';
  els.zoomSlider.max = String(Math.round(ZOOM_MAX_RATIO * 100));
  els.zoomSlider.value = String(pct);
}

function coverFitCenter() {
  scale = coverMinScale();
  offsetX = (frameW - imgW * scale) / 2;
  offsetY = (frameH - imgH * scale) / 2;
  clampOffsets();
  syncZoomUi();
}

/**
 * 単一状態からプレビュー / 書き出しの両方を描画する。
 * @param {CanvasRenderingContext2D} targetCtx
 * @param {number} destW
 * @param {number} destH
 */
function drawCropped(targetCtx, destW, destH) {
  if (!bitmap) return;
  const sx = destW / frameW;
  const sy = destH / frameH;
  targetCtx.clearRect(0, 0, destW, destH);
  targetCtx.drawImage(
    bitmap,
    offsetX * sx,
    offsetY * sy,
    imgW * scale * sx,
    imgH * scale * sy
  );
}

function layoutPreviewSize() {
  const hostW = Math.max(280, els.canvasHost.clientWidth - 16);
  const maxH = Math.min(480, Math.max(200, window.innerHeight * 0.5));
  const aspect = frameW / frameH;
  let dw = hostW;
  let dh = dw / aspect;
  if (dh > maxH) {
    dh = maxH;
    dw = dh * aspect;
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  els.canvas.width = Math.round(dw * dpr);
  els.canvas.height = Math.round(dh * dpr);
  els.canvas.style.width = `${Math.round(dw)}px`;
  els.canvas.style.height = `${Math.round(dh)}px`;
}

function paintPreview() {
  if (!bitmap) return;
  layoutPreviewSize();
  const w = els.canvas.width;
  const h = els.canvas.height;
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);
  drawCropped(ctx, w, h);
  // 枠の縁
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, Math.round(w / 320));
  ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.restore();
}

function schedulePaint() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    paintPreview();
  });
}

function updateActionButtons() {
  const on = hasImage();
  els.btnDownload.disabled = !on;
  els.btnResetView.disabled = !on;
  els.zoomSlider.disabled = !on;
  const canCopy = on && !!navigator.clipboard && !!window.ClipboardItem;
  els.btnCopy.disabled = !canCopy;
}

function setPreset(id) {
  const p = PRESETS[id];
  if (!p) return;
  presetId = id;
  frameW = p.w;
  frameH = p.h;
  document.querySelectorAll('.trim-preset').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.getAttribute('data-preset') === id ? 'true' : 'false');
  });
  els.presetHint.textContent = `出力: ${frameW}×${frameH} px（${p.group} · ${p.label}）`;
  if (bitmap) {
    coverFitCenter();
    schedulePaint();
  }
}

async function decodeToBitmap(file) {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('このブラウザでは画像の読み込みに対応していません。');
  }
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      return await createImageBitmap(file);
    } catch {
      throw new Error('画像を読み込めませんでした。PNG / JPEG / WebP などでお試しください（HEIC は非対応）。');
    }
  }
}

async function downscaleIfNeeded(src) {
  const longEdge = Math.max(src.width, src.height);
  if (longEdge <= MAX_LONG_EDGE) return src;
  const ratio = MAX_LONG_EDGE / longEdge;
  const w = Math.max(1, Math.round(src.width * ratio));
  const h = Math.max(1, Math.round(src.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('画像の縮小に失敗しました。');
  c.drawImage(src, 0, 0, w, h);
  src.close();
  return createImageBitmap(canvas);
}

function imageFileFromClipboard(dt) {
  if (!dt) return null;
  const items = Array.from(dt.items || []);
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

async function loadFile(file) {
  clearError();
  if (!file) return;
  if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif)$/i.test(file.name || '')) {
    showError('対応していない形式です。PNG / JPEG / WebP / GIF をお使いください。');
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    showError(`1ファイル ${Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB までです。`);
    return;
  }
  try {
    let next = await decodeToBitmap(file);
    next = await downscaleIfNeeded(next);
    if (bitmap) bitmap.close();
    bitmap = next;
    imgW = bitmap.width;
    imgH = bitmap.height;
    sourceName = file.name || 'pasted-image.png';
    els.dropZone.classList.add('hidden');
    els.editor.classList.remove('hidden');
    coverFitCenter();
    updateActionButtons();
    setStatus('画像をドラッグで位置合わせ · ホイールで拡大');
    schedulePaint();
  } catch (err) {
    showError(err && err.message ? err.message : '画像の読み込みに失敗しました。');
    updateActionButtons();
  }
}

function clearImage() {
  if (bitmap) bitmap.close();
  bitmap = null;
  imgW = 0;
  imgH = 0;
  els.editor.classList.add('hidden');
  els.dropZone.classList.remove('hidden');
  updateActionButtons();
  clearError();
}

function exportCanvas() {
  const out = document.createElement('canvas');
  out.width = frameW;
  out.height = frameH;
  const octx = out.getContext('2d');
  if (!octx || !bitmap) return null;
  drawCropped(octx, frameW, frameH);
  return out;
}

function outputFilename() {
  const base = (sourceName || 'image').split(/[/\\]/).pop() || 'image';
  const stem = base.replace(/\.[^.]+$/, '') || 'image';
  return `${stem}-${frameW}x${frameH}.png`;
}

function downloadPng() {
  const out = exportCanvas();
  if (!out) return;
  out.toBlob((blob) => {
    if (!blob) {
      showError('PNG の生成に失敗しました。');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFilename();
    a.click();
    URL.revokeObjectURL(url);
    setStatus('PNG を保存しました。');
  }, 'image/png');
}

async function copyPng() {
  const out = exportCanvas();
  if (!out) return;
  try {
    const blob = await new Promise((resolve, reject) => {
      out.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/png');
    });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    setStatus('クリップボードにコピーしました。');
  } catch {
    showError('コピーに失敗しました。PNG保存をお試しください。');
  }
}

function pointerToFrameDelta(dx, dy) {
  const dispW = els.canvas.clientWidth || frameW;
  const ratio = frameW / dispW;
  return { dx: dx * ratio, dy: dy * ratio };
}

function onPointerDown(e) {
  if (!bitmap) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const now = Date.now();
  if (now - lastTapAt < 320) {
    coverFitCenter();
    schedulePaint();
    lastTapAt = 0;
    return;
  }
  lastTapAt = now;
  dragActive = true;
  els.canvas.classList.add('is-dragging');
  els.canvas.setPointerCapture(e.pointerId);
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragOriginOffsetX = offsetX;
  dragOriginOffsetY = offsetY;
}

function onPointerMove(e) {
  if (!dragActive || !bitmap) return;
  const { dx, dy } = pointerToFrameDelta(e.clientX - dragStartX, e.clientY - dragStartY);
  offsetX = dragOriginOffsetX + dx;
  offsetY = dragOriginOffsetY + dy;
  clampOffsets();
  schedulePaint();
}

function onPointerUp(e) {
  if (!dragActive) return;
  dragActive = false;
  els.canvas.classList.remove('is-dragging');
  try {
    els.canvas.releasePointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
}

function onWheel(e) {
  if (!bitmap) return;
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.06 : 1 / 1.06;
  setScale(scale * factor, true);
  schedulePaint();
}

// —— events ——
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
  els.dropZone.classList.add('border-violet-400', 'bg-violet-50/40');
});
els.dropZone.addEventListener('dragleave', () => {
  els.dropZone.classList.remove('border-violet-400', 'bg-violet-50/40');
});
els.dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  els.dropZone.classList.remove('border-violet-400', 'bg-violet-50/40');
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) loadFile(f);
});

document.addEventListener('paste', (e) => {
  const f = imageFileFromClipboard(e.clipboardData);
  if (!f) return;
  e.preventDefault();
  loadFile(f);
});

document.querySelectorAll('.trim-preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    setPreset(btn.getAttribute('data-preset'));
  });
});

els.zoomSlider.addEventListener('input', () => {
  if (!bitmap) return;
  const pct = Number(els.zoomSlider.value) || 100;
  setScale(coverMinScale() * (pct / 100), true);
  schedulePaint();
});

els.btnDownload.addEventListener('click', () => downloadPng());
els.btnCopy.addEventListener('click', () => copyPng());
els.btnResetView.addEventListener('click', () => {
  if (!bitmap) return;
  coverFitCenter();
  schedulePaint();
  setStatus('中央・最小拡大に戻しました。');
});
els.btnClear.addEventListener('click', () => clearImage());

els.canvas.addEventListener('pointerdown', onPointerDown);
els.canvas.addEventListener('pointermove', onPointerMove);
els.canvas.addEventListener('pointerup', onPointerUp);
els.canvas.addEventListener('pointercancel', onPointerUp);
els.canvas.addEventListener('wheel', onWheel, { passive: false });
els.canvas.addEventListener('dblclick', (e) => {
  if (!bitmap) return;
  e.preventDefault();
  coverFitCenter();
  schedulePaint();
});

window.addEventListener('resize', () => {
  if (bitmap) schedulePaint();
});

setPreset('x-cover');
updateActionButtons();
