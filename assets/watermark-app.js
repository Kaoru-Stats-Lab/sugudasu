/**
 * SUGUDASU 透かし — UI
 * docs/notes/WATERMARK_TOOL_SPEC.md
 */
import {
  MAX_FILES,
  MAX_EDGE,
  PREVIEW_MAX_EDGE,
  OPACITY_STEPS,
  POSITIONS,
  isAcceptedImageFile,
  snapOpacity,
  normalizePosition,
  fitWithinMaxEdge,
  renderOneToPngBlob,
  buildOutputFileName,
  buildStoreZip,
  decodeImageFile,
} from './watermark-engine.js';

/** @type {{ file: File, url: string, width: number, height: number, scaled: boolean }[]} */
let items = [];
/** @type {File|null} */
let logoFile = null;
/** @type {string} */
let logoUrl = '';
/** @type {number} */
let logoNaturalW = 0;
/** @type {number} */
let logoNaturalH = 0;
/** プレビュー対象の一覧 index */
let previewIndex = 0;
/** @type {string} */
let previewObjectUrl = '';
/** @type {number} */
let previewTimer = 0;
/** @type {number} */
let previewSeq = 0;

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
    logoFile,
    logoNaturalW,
    logoNaturalH,
    position,
    opacity,
    appendWatermarkToName: Boolean($('wm-name-suffix')?.checked),
  };
}

function syncModeUi() {
  const mode = currentOpts().mode;
  const textWrap = $('wm-text-wrap');
  const logoWrap = $('wm-logo-wrap');
  if (textWrap) textWrap.classList.toggle('hidden', mode !== 'text');
  if (logoWrap) logoWrap.classList.toggle('hidden', mode !== 'logo');
  schedulePreview();
}

function revokePreview() {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = '';
  const img = /** @type {HTMLImageElement|null} */ ($('wm-preview'));
  const empty = $('wm-preview-empty');
  if (img) {
    img.removeAttribute('src');
    img.classList.add('hidden');
  }
  if (empty) empty.classList.remove('hidden');
}

function revokeAll() {
  for (const it of items) URL.revokeObjectURL(it.url);
  items = [];
  previewIndex = 0;
  revokePreview();
  if (logoUrl) URL.revokeObjectURL(logoUrl);
  logoUrl = '';
  logoFile = null;
  logoNaturalW = 0;
  logoNaturalH = 0;
}

/**
 * 透かし適用後のプレビュー（先頭 or 選択行 · 長辺 PREVIEW_MAX_EDGE）
 * DECISION: 全枚プレビューしない。会議ツールと同様「1枚見て設定を決める」。
 */
function schedulePreview() {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    refreshPreview().catch((err) => {
      console.error(err);
    });
  }, 180);
}

async function refreshPreview() {
  const img = /** @type {HTMLImageElement|null} */ ($('wm-preview'));
  const empty = $('wm-preview-empty');
  const caption = $('wm-preview-caption');
  if (!img || !empty) return;

  if (!items.length) {
    revokePreview();
    if (caption) caption.textContent = '先頭の画像 · 一覧から切替可';
    return;
  }

  if (previewIndex < 0 || previewIndex >= items.length) previewIndex = 0;
  const it = items[previewIndex];
  const opts = currentOpts();

  if (opts.mode === 'logo' && !opts.logoFile) {
    revokePreview();
    empty.textContent = 'ロゴを選ぶとプレビューが表示されます。';
    empty.classList.remove('hidden');
    if (caption) caption.textContent = it.file.name;
    return;
  }

  empty.textContent = 'プレビューを更新中…';
  empty.classList.remove('hidden');
  img.classList.add('hidden');

  const seq = ++previewSeq;
  let logoDecoded = null;
  try {
    if (opts.mode === 'logo' && opts.logoFile) {
      logoDecoded = await decodeImageFile(opts.logoFile);
    }
    const result = await renderOneToPngBlob(it.file, {
      mode: opts.mode,
      text: opts.text,
      logoBitmap: logoDecoded?.bitmap || null,
      logoNaturalW: logoDecoded?.width || opts.logoNaturalW,
      logoNaturalH: logoDecoded?.height || opts.logoNaturalH,
      position: opts.position,
      opacity: opts.opacity,
      maxEdge: PREVIEW_MAX_EDGE,
    });
    if (seq !== previewSeq) return;
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = URL.createObjectURL(result.blob);
    img.src = previewObjectUrl;
    img.classList.remove('hidden');
    empty.classList.add('hidden');
    if (caption) {
      caption.textContent = `${it.file.name} · ${result.width}×${result.height}`;
    }
  } catch (err) {
    if (seq !== previewSeq) return;
    console.error(err);
    revokePreview();
    empty.textContent = 'プレビューを作れませんでした。設定を見直してください。';
    empty.classList.remove('hidden');
  } finally {
    if (logoDecoded) logoDecoded.close();
  }
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

  // 逐次 decode（Promise.all 禁止）
  for (const file of slice) {
    let decoded = null;
    try {
      decoded = await decodeImageFile(file);
      const fitted = fitWithinMaxEdge(decoded.width, decoded.height, MAX_EDGE);
      const url = URL.createObjectURL(file);
      items.push({
        file,
        url,
        width: decoded.width,
        height: decoded.height,
        scaled: fitted.scaled,
      });
    } catch {
      setError('画像の読み込みに失敗したものがあります。');
    } finally {
      if (decoded) decoded.close();
    }
  }
  renderList();
  $('wm-editor')?.classList.remove('hidden');
  if (previewIndex >= items.length) previewIndex = Math.max(0, items.length - 1);
  schedulePreview();
  const scaledN = items.filter((x) => x.scaled).length;
  if (scaledN) {
    setStatus(`長辺 ${MAX_EDGE}px 超の画像を ${scaledN} 枚、縮小して処理します。`);
  } else {
    setStatus(`${items.length} 枚読み込み済み`);
  }
}

function renderList() {
  const list = $('wm-list');
  if (!list) return;
  list.innerHTML = '';
  items.forEach((it, idx) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className =
      'w-full text-left flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ' +
      (idx === previewIndex
        ? 'border-violet-400 bg-violet-50'
        : 'border-slate-200 bg-white hover:bg-slate-50');
    row.setAttribute('data-preview-idx', String(idx));
    row.innerHTML = `
      <img src="${it.url}" alt="" class="h-12 w-12 object-cover rounded border border-slate-100 pointer-events-none">
      <div class="min-w-0 flex-1 pointer-events-none">
        <p class="text-xs font-semibold text-slate-800 truncate">${escapeHtml(it.file.name)}</p>
        <p class="text-[10px] text-slate-500">${it.width}×${it.height}${it.scaled ? ' · 縮小予定' : ''}${idx === previewIndex ? ' · プレビュー中' : ''}</p>
      </div>
      <span class="text-[11px] font-semibold text-rose-700 hover:underline" data-remove="${idx}" role="button" tabindex="0">外す</span>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-preview-idx]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const t = /** @type {HTMLElement} */ (e.target);
      if (t.closest('[data-remove]')) return;
      previewIndex = Number(btn.getAttribute('data-preview-idx'));
      renderList();
      schedulePreview();
    });
  });
  list.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const i = Number(btn.getAttribute('data-remove'));
      const [removed] = items.splice(i, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      if (previewIndex >= items.length) previewIndex = Math.max(0, items.length - 1);
      else if (previewIndex > i) previewIndex -= 1;
      renderList();
      if (!items.length) {
        $('wm-editor')?.classList.add('hidden');
        revokePreview();
        setStatus('');
      } else {
        setStatus(`${items.length} 枚`);
        schedulePreview();
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
 * @returns {Promise<{ name: string, data: Uint8Array, blob: Blob }[]|null>}
 */
async function processAll() {
  if (!items.length) {
    setError('画像を追加してください。');
    return null;
  }
  const opts = currentOpts();
  if (opts.mode === 'logo' && !opts.logoFile) {
    setError('ロゴ画像を選んでください。');
    return null;
  }
  setError('');
  setStatus('処理中…');

  /** ロゴは1回 decode して使い回す（本体画像は逐次） */
  let logoDecoded = null;
  const usedNames = new Set();
  const outFiles = [];

  try {
    if (opts.mode === 'logo' && opts.logoFile) {
      logoDecoded = await decodeImageFile(opts.logoFile);
    }

    for (const it of items) {
      const result = await renderOneToPngBlob(it.file, {
        mode: opts.mode,
        text: opts.text,
        logoBitmap: logoDecoded?.bitmap || null,
        logoNaturalW: logoDecoded?.width || opts.logoNaturalW,
        logoNaturalH: logoDecoded?.height || opts.logoNaturalH,
        position: opts.position,
        opacity: opts.opacity,
      });
      const name = buildOutputFileName({
        sourceName: it.file.name,
        appendWatermarkToName: opts.appendWatermarkToName,
        mode: opts.mode,
        text: opts.text,
        logoFileName: logoFile?.name || '',
        usedNames,
      });
      const data = new Uint8Array(await result.blob.arrayBuffer());
      outFiles.push({ name, data, blob: result.blob });
    }
    return outFiles;
  } finally {
    if (logoDecoded) logoDecoded.close();
  }
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

/**
 * @param {HTMLElement|null} zone
 * @param {(files: File[]) => void} onFiles
 * @param {HTMLInputElement|null} [externalInput]
 */
function bindDrop(zone, onFiles, externalInput) {
  if (!zone) return;
  const input = externalInput || zone.querySelector('input[type="file"]');
  zone.addEventListener('click', () => input?.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input?.click();
    }
  });
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('is-dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('is-dragover');
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
  }, /** @type {HTMLInputElement|null} */ ($('wm-file')));

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
    logoFile = file;
    logoUrl = URL.createObjectURL(file);
    let decoded = null;
    try {
      decoded = await decodeImageFile(file);
      logoNaturalW = decoded.width;
      logoNaturalH = decoded.height;
      const label = $('wm-logo-name');
      if (label) label.textContent = file.name;
      setError('');
      schedulePreview();
    } catch {
      setError('ロゴの読み込みに失敗しました。');
      logoFile = null;
      logoNaturalW = 0;
      logoNaturalH = 0;
      schedulePreview();
    } finally {
      if (decoded) decoded.close();
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

  $('wm-text')?.addEventListener('input', schedulePreview);
  document.querySelectorAll('input[name="wm-position"], input[name="wm-opacity"]').forEach((el) => {
    el.addEventListener('change', schedulePreview);
  });
}

if (typeof document !== 'undefined') {
  init();
}

export { POSITIONS, OPACITY_STEPS, MAX_FILES };
