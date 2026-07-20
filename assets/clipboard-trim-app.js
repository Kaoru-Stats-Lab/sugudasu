/**
 * clipboard-trim — Ctrl+V → 余白除去 → PNGコピー
 */
import {
  canvasToPngBlob,
  decodeImage,
  trimToCanvas,
} from './clipboard-trim-engine.js';

const els = {
  dropZone: document.getElementById('ct-drop'),
  fileInput: /** @type {HTMLInputElement|null} */ (document.getElementById('ct-file')),
  preview: /** @type {HTMLCanvasElement|null} */ (document.getElementById('ct-preview')),
  copyBtn: document.getElementById('ct-copy'),
  msg: document.getElementById('ct-msg'),
};

/** @type {HTMLCanvasElement|null} */
let trimmed = null;

function setMsg(text, isError = false) {
  if (!els.msg) return;
  els.msg.textContent = text || '';
  els.msg.classList.toggle('text-rose-700', !!isError && !!text);
  els.msg.classList.toggle('text-slate-600', !isError || !text);
}

function supportsImageClipboardWrite() {
  return !!(navigator.clipboard && typeof ClipboardItem !== 'undefined');
}

/**
 * @param {DataTransfer|null|undefined} dt
 * @returns {File|null}
 */
function imageFileFromClipboard(dt) {
  if (!dt) return null;
  for (const item of Array.from(dt.items || [])) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

/**
 * @param {HTMLCanvasElement} src
 */
function showPreview(src) {
  if (!els.preview) return;
  els.preview.width = src.width;
  els.preview.height = src.height;
  const ctx = els.preview.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, src.width, src.height);
  ctx.drawImage(src, 0, 0);
  els.preview.classList.remove('hidden');
  if (els.dropZone) els.dropZone.classList.add('hidden');
}

/**
 * @param {File} file
 */
async function loadPastedImage(file) {
  setMsg('');
  try {
    const bitmap = await decodeImage(file);
    const w = /** @type {{width?:number,naturalWidth?:number}} */ (bitmap).width
      || /** @type {{naturalWidth?:number}} */ (bitmap).naturalWidth
      || 0;
    const h = /** @type {{height?:number,naturalHeight?:number}} */ (bitmap).height
      || /** @type {{naturalHeight?:number}} */ (bitmap).naturalHeight
      || 0;
    const out = trimToCanvas(bitmap, w, h);
    if (typeof bitmap.close === 'function') {
      try {
        bitmap.close();
      } catch {
        /* ignore */
      }
    }
    trimmed = out;
    showPreview(out);
  } catch {
    trimmed = null;
    setMsg('画像の読み込みに失敗しました', true);
  }
}

async function copyPng() {
  if (!trimmed) {
    setMsg('画像を貼り付けてください', true);
    return;
  }
  if (!supportsImageClipboardWrite()) {
    setMsg('このブラウザでは画像コピーに対応していません', true);
    return;
  }
  try {
    const blob = await canvasToPngBlob(trimmed);
    // DECISION: ClipboardItem に Promise を渡す（Safari 系の Blob 直接拒否に備える）
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': Promise.resolve(blob) }),
    ]);
    setMsg('PNGをコピーしました');
  } catch {
    setMsg('このブラウザでは画像コピーに対応していません', true);
  }
}

document.addEventListener('paste', (e) => {
  const f = imageFileFromClipboard(e.clipboardData);
  if (!f) return;
  e.preventDefault();
  loadPastedImage(f);
});

if (els.dropZone && els.fileInput) {
  els.dropZone.addEventListener('click', () => els.fileInput.click());
  els.dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      els.fileInput.click();
    }
  });
  els.fileInput.addEventListener('change', () => {
    const f = els.fileInput.files && els.fileInput.files[0];
    if (f) loadPastedImage(f);
    els.fileInput.value = '';
  });
  els.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.dropZone.classList.add('is-dragover');
  });
  els.dropZone.addEventListener('dragleave', () => {
    els.dropZone.classList.remove('is-dragover');
  });
  els.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('is-dragover');
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadPastedImage(f);
  });
}

if (els.copyBtn) {
  els.copyBtn.addEventListener('click', () => {
    copyPng();
  });
}

if (!supportsImageClipboardWrite() && els.copyBtn) {
  setMsg('このブラウザでは画像コピーに対応していません', true);
}
