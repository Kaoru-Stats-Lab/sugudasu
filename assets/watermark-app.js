/**
 * SUGUDASU 透かし — UI
 * docs/notes/WATERMARK_TOOL_SPEC.md
 */
import {
  MAX_FILES,
  MAX_EDGE,
  OPACITY_STEPS,
  POSITIONS,
  isAcceptedImageFile,
  snapOpacity,
  normalizePosition,
  fitWithinMaxEdge,
  renderWatermarkedCanvas,
  buildOutputFileName,
  buildStoreZip,
} from './watermark-engine.js';

/** @type {{ file: File, url: string, img: HTMLImageElement, scaled: boolean }[]} */
let items = [];
/** @type {HTMLImageElement|null} */
let logoImg = null;
let logoUrl = '';

const $ = (id) => document.getElementById(id);

function setError(msg) {
  const el = $('wm-error');
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
  const el = $('wm-status');
  if (el) el.textContent = msg || '';
}

function currentOpts() {
  const mode = document.querySelector('input[name="wm-mode"]:checked')?.value === 'logo' ? 'logo' : 'text';
  const opacity = snapOpacity(Number(document.querySelector('input[name="wm-opacity"]:checked')?.value || 0.4));
  const position = normalizePosition(document.querySelector('input[name="wm-position"]:checked')?.value || 'br');
  return {
    mode,
    text: String($('wm-text')?.value || '').trim() || 'CONFIDENTIAL',
    logo: logoImg || undefined,
    logoNaturalW: logoImg?.naturalWidth,
    logoNaturalH: logoImg?.naturalHeight,
    position,
    opacity,
  };
}

function syncModeUi() {
  const mode = currentOpts().mode;
  const textWrap = $('wm-text-wrap');
  const logoWrap = $('wm-logo-wrap');
  if (textWrap) textWrap.classList.toggle('hidden', mode !== 'text');
  if (logoWrap) logoWrap.classList.toggle('hidden', mode !== 'logo');
}

function revokeAll() {
  for (const it of items) URL.revokeObjectURL(it.url);
  items = [];
  if (logoUrl) URL.revokeObjectURL(logoUrl);
  logoUrl = '';
  logoImg = null;
}

/**
 * @param {File[]} files
 */
async function addFiles(files) {
  setError('');
  const accepted = files.filter(isAcceptedImageFile);
  if (!accepted.length) {
    setError('PNG / JPEG / WebP のみ追加できます。');
    return;
  }
  const room = MAX_FILES - items.length;
  if (room <= 0) {
    setError(`一度に扱えるのは ${MAX_FILES} 枚までです。`);
    return;
  }
  const slice = accepted.slice(0, room);
  if (accepted.length > room) {
    setError(`${MAX_FILES} 枚を超えた分は追加しませんでした。`);
  }

  for (const file of slice) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    const fitted = fitWithinMaxEdge(img.naturalWidth, img.naturalHeight, MAX_EDGE);
    items.push({ file, url, img, scaled: fitted.scaled });
  }
  renderList();
  $('wm-editor')?.classList.remove('hidden');
  const scaledN = items.filter((x) => x.scaled).length;
  if (scaledN) {
    setStatus(`長辺 ${MAX_EDGE}px 超の画像を ${scaledN} 枚、縮小して処理します。`);
  } else {
    setStatus(`${items.length} 枚読み込み済み`);
  }
}

/**
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('load-failed'));
    img.src = url;
  });
}

function renderList() {
  const list = $('wm-list');
  if (!list) return;
  list.innerHTML = '';
  items.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2';
    row.innerHTML = `
      <img src="${it.url}" alt="" class="h-12 w-12 object-cover rounded border border-slate-100">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold text-slate-800 truncate">${escapeHtml(it.file.name)}</p>
        <p class="text-[10px] text-slate-500">${it.img.naturalWidth}×${it.img.naturalHeight}${it.scaled ? ' · 縮小予定' : ''}</p>
      </div>
      <button type="button" class="text-[11px] font-semibold text-rose-700 hover:underline" data-remove="${idx}">外す</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.getAttribute('data-remove'));
      const [removed] = items.splice(i, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      renderList();
      if (!items.length) {
        $('wm-editor')?.classList.add('hidden');
        setStatus('');
      } else {
        setStatus(`${items.length} 枚`);
      }
    });
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png');
  });
}

async function processAll() {
  if (!items.length) {
    setError('画像を追加してください。');
    return;
  }
  const opts = currentOpts();
  if (opts.mode === 'logo' && !opts.logo) {
    setError('ロゴ画像を選んでください。');
    return;
  }
  setError('');
  setStatus('処理中…');
  const outFiles = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const canvas = renderWatermarkedCanvas(it.img, opts);
    const blob = await canvasToPngBlob(canvas);
    const buf = new Uint8Array(await blob.arrayBuffer());
    const name = buildOutputFileName(it.file.name, i + 1);
    outFiles.push({ name, data: buf, blob });
  }
  return outFiles;
}

async function onDownloadZip() {
  try {
    const files = await processAll();
    if (!files?.length) return;
    const zipBytes = buildStoreZip(files.map(({ name, data }) => ({ name, data })));
    downloadBlob(new Blob([zipBytes], { type: 'application/zip' }), 'sugudasu-watermark.zip');
    setStatus(`ZIP を保存しました（${files.length} 枚）`);
  } catch (err) {
    console.error(err);
    setError('ZIP の作成に失敗しました。単枚ダウンロードを試してください。');
    setStatus('');
  }
}

async function onDownloadEach() {
  try {
    const files = await processAll();
    if (!files?.length) return;
    for (const f of files) {
      downloadBlob(f.blob, f.name);
      await new Promise((r) => setTimeout(r, 120));
    }
    setStatus(`PNG を ${files.length} 枚ダウンロードしました`);
  } catch (err) {
    console.error(err);
    setError('書き出しに失敗しました。');
    setStatus('');
  }
}

function bindDrop(zone, onFiles) {
  if (!zone) return;
  const input = zone.querySelector('input[type="file"]');
  zone.addEventListener('click', () => input?.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input?.click();
    }
  });
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('ring-2', 'ring-violet-400');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('ring-2', 'ring-violet-400'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('ring-2', 'ring-violet-400');
    const list = [...(e.dataTransfer?.files || [])];
    onFiles(list);
  });
  input?.addEventListener('change', () => {
    const list = [...(input.files || [])];
    input.value = '';
    onFiles(list);
  });
}

function init() {
  syncModeUi();
  document.querySelectorAll('input[name="wm-mode"]').forEach((el) => {
    el.addEventListener('change', syncModeUi);
  });

  bindDrop($('wm-drop'), (files) => {
    addFiles(files).catch(() => setError('画像の読み込みに失敗しました。'));
  });

  const logoInput = $('wm-logo-input');
  logoInput?.addEventListener('change', async () => {
    const file = logoInput.files?.[0];
    logoInput.value = '';
    if (!file) return;
    if (!isAcceptedImageFile(file)) {
      setError('ロゴは PNG / JPEG / WebP のみです。');
      return;
    }
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    logoUrl = URL.createObjectURL(file);
    try {
      logoImg = await loadImage(logoUrl);
      const label = $('wm-logo-name');
      if (label) label.textContent = file.name;
      setError('');
    } catch {
      setError('ロゴの読み込みに失敗しました。');
      logoImg = null;
    }
  });

  $('wm-clear')?.addEventListener('click', () => {
    revokeAll();
    renderList();
    $('wm-editor')?.classList.add('hidden');
    const label = $('wm-logo-name');
    if (label) label.textContent = '未選択';
    setStatus('');
    setError('');
  });

  $('wm-zip')?.addEventListener('click', () => {
    onDownloadZip();
  });
  $('wm-each')?.addEventListener('click', () => {
    onDownloadEach();
  });
}

if (typeof document !== 'undefined') {
  init();
}

export { POSITIONS, OPACITY_STEPS, MAX_FILES };
