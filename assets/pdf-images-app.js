/**
 * SUGUDASU PDF画像抽出 — UI
 * docs/notes/PDF_IMAGE_EXTRACT_SPEC.md
 */
import {
  extractEmbeddedImages,
  formatPagesLabel,
  formatPageRangeLabel,
  buildStoreZip,
  buildZipRangeFileName,
  computePageRange,
  MAX_FILE_BYTES,
  MAX_PAGES,
} from './pdf-images-engine.js';

const $ = (id) => document.getElementById(id);

/** @type {import('./pdf-images-engine.js').ExtractedImage[]} */
let images = [];
let sourceName = 'document.pdf';
/** @type {ArrayBuffer|null} */
let pendingData = null;
/** @type {any} */
let pendingPdf = null;
/** @type {any} */
let pendingPdfjs = null;
let pendingPageCount = 0;
/** @type {{ start: number, end: number, count: number }|null} */
let lastRange = null;

function vendorUrl(rel) {
  return new URL(`./vendor/pdfjs/${rel}`, import.meta.url).href;
}

function setError(msg) {
  const el = $('pdfi-error');
  if (!el) return;
  if (!msg) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = msg;
  el.classList.remove('hidden');
}

function setStartError(msg) {
  const el = $('pdfi-start-error');
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
  const el = $('pdfi-status');
  if (el) el.textContent = msg || '';
}

function setCount(n) {
  const el = $('pdfi-count');
  if (!el) return;
  el.textContent = `${n}件抽出`;
  el.classList.toggle('text-slate-400', n === 0);
}

function revokeThumbs() {
  for (const img of images) {
    if (img.thumbUrl) URL.revokeObjectURL(img.thumbUrl);
  }
  images = [];
}

function clearPending() {
  pendingData = null;
  pendingPdf = null;
  pendingPdfjs = null;
  pendingPageCount = 0;
  $('pdfi-range')?.classList.add('hidden');
  setStartError('');
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * @returns {{ ok: true, start: number, end: number, count: number } | { ok: false }}
 */
function syncRangeUi() {
  const startEl = $('pdfi-start');
  const raw = startEl ? startEl.value : '1';
  const range = computePageRange(raw, pendingPageCount, MAX_PAGES);
  const rangeLabel = $('pdfi-range-label');
  const extractBtn = $('pdfi-extract');
  const totalEl = $('pdfi-total-pages');
  if (totalEl) totalEl.textContent = `全${pendingPageCount}ページ`;
  if (startEl) startEl.max = String(Math.max(1, pendingPageCount));

  if (!range.ok) {
    setStartError(`開始ページは 1〜${pendingPageCount} の整数で指定してください。`);
    if (rangeLabel) rangeLabel.textContent = '—';
    if (extractBtn) {
      extractBtn.disabled = true;
      extractBtn.textContent = '抽出不可';
      extractBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    return { ok: false };
  }

  setStartError('');
  const label = formatPageRangeLabel(range.start, range.end);
  if (rangeLabel) rangeLabel.textContent = `${label}（${range.count}ページ）`;
  if (extractBtn) {
    extractBtn.disabled = false;
    extractBtn.textContent = `${label}を抽出`;
    extractBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
  return range;
}

function renderList() {
  const list = $('pdfi-list');
  if (!list) return;
  list.innerHTML = '';
  setCount(images.length);

  for (const img of images) {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2';
    const badge = img.format === 'jpg' ? 'JPEG' : 'PNG';
    const badgeClass = img.format === 'jpg'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-sky-50 text-sky-800 border-sky-200';
    row.innerHTML = `
      <img src="${img.thumbUrl}" alt="" class="h-14 w-14 object-contain rounded border border-slate-100 bg-slate-50">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold text-slate-800 truncate">${escapeHtml(img.fileName)}</p>
        <p class="text-[10px] text-slate-500">${img.width}×${img.height} · ${formatPagesLabel(img.pages)}</p>
      </div>
      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}">${badge}</span>
      <button type="button" class="text-[11px] font-semibold text-blue-700 hover:underline" data-dl="${img.id}">保存</button>
    `;
    list.appendChild(row);
  }

  list.querySelectorAll('[data-dl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-dl');
      const img = images.find((x) => x.id === id);
      if (img) downloadBlob(img.blob, img.fileName);
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

async function loadPdfjs() {
  const mod = await import(vendorUrl('pdf.mjs'));
  return mod;
}

/**
 * @param {number} pageFrom
 */
async function runExtract(pageFrom) {
  if (!pendingData || !pendingPdfjs) return;
  const gate = computePageRange(pageFrom, pendingPageCount, MAX_PAGES);
  if (!gate.ok) {
    syncRangeUi();
    return;
  }

  setError('');
  revokeThumbs();
  renderList();
  $('pdfi-results')?.classList.add('hidden');
  setStatus('抽出中…');
  $('pdfi-busy')?.classList.remove('hidden');

  try {
    const result = await extractEmbeddedImages(pendingPdfjs, pendingData, {
      sourceName,
      workerSrc: vendorUrl('pdf.worker.mjs'),
      wasmUrl: vendorUrl('wasm/'),
      pageFrom: gate.start,
      pdf: pendingPdf || undefined,
    });
    images = result.images;
    lastRange = result.range;
    $('pdfi-results')?.classList.remove('hidden');
    renderList();

    const rangeLabel = formatPageRangeLabel(result.range.start, result.range.end);
    if (!images.length) {
      setStatus(
        result.skippedSmall
          ? `抽出範囲 ${rangeLabel}：埋め込み画像は見つかりませんでした（ごく小さいものは除外）。`
          : `抽出範囲 ${rangeLabel}：埋め込み画像は見つかりませんでした。ページに図が見えても、図形として描かれている場合があります。`
      );
    } else {
      let msg = `抽出範囲 ${rangeLabel}（全${result.pageCount}ページ中）から ${images.length}件`;
      if (result.skippedSmall) msg += `（小さい画像 ${result.skippedSmall}件は除外）`;
      setStatus(msg);
    }
  } catch (err) {
    console.error(err);
    const code = err?.code || err?.message;
    if (code === 'file_size') {
      setError('このPDFは目安の上限を超えているため処理できません。（部分的な抽出はしません）');
    } else if (code === 'start_page') {
      setStartError(`開始ページは 1〜${pendingPageCount} の整数で指定してください。`);
    } else {
      setError('このPDFは開けませんでした（暗号化・破損の可能性）。');
    }
    setStatus('');
  } finally {
    $('pdfi-busy')?.classList.add('hidden');
  }
}

/**
 * @param {File} file
 */
async function processFile(file) {
  setError('');
  revokeThumbs();
  renderList();
  $('pdfi-results')?.classList.add('hidden');
  clearPending();
  lastRange = null;

  if (!file || file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    setError('PDFファイルを選んでください。');
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    setError('このPDFは目安の上限を超えているため処理できません。（部分的な抽出はしません）');
    return;
  }

  sourceName = file.name || 'document.pdf';
  setStatus('読み込み中…（初回はPDFエンジンの準備に時間がかかることがあります）');
  $('pdfi-busy')?.classList.remove('hidden');

  try {
    const buf = await file.arrayBuffer();
    const pdfjsLib = await loadPdfjs();
    pdfjsLib.GlobalWorkerOptions.workerSrc = vendorUrl('pdf.worker.mjs');
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buf),
      wasmUrl: vendorUrl('wasm/'),
    });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages | 0;

    pendingData = buf;
    pendingPdf = pdf;
    pendingPdfjs = pdfjsLib;
    pendingPageCount = pageCount;

    if (pageCount > MAX_PAGES) {
      $('pdfi-busy')?.classList.add('hidden');
      const startEl = $('pdfi-start');
      if (startEl) startEl.value = '1';
      $('pdfi-range')?.classList.remove('hidden');
      syncRangeUi();
      setStatus(`全${pageCount}ページです。一度に処理できる幅は${MAX_PAGES}ページです。開始ページを指定して抽出してください。`);
      return;
    }

    await runExtract(1);
  } catch (err) {
    console.error(err);
    clearPending();
    setError('このPDFは開けませんでした（暗号化・破損の可能性）。');
    setStatus('');
    $('pdfi-busy')?.classList.add('hidden');
  }
}

function bindDrop() {
  const zone = $('pdfi-drop');
  if (!zone) return;
  const input = /** @type {HTMLInputElement|null} */ ($('pdfi-file') || zone.querySelector('input[type="file"]'));
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
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  });
  input?.addEventListener('change', () => {
    const file = input.files?.[0];
    input.value = '';
    if (file) processFile(file);
  });
}

function init() {
  bindDrop();
  $('pdfi-start')?.addEventListener('input', () => syncRangeUi());
  $('pdfi-start')?.addEventListener('change', () => syncRangeUi());
  $('pdfi-extract')?.addEventListener('click', () => {
    const range = syncRangeUi();
    if (!range.ok) return;
    runExtract(range.start);
  });
  $('pdfi-zip')?.addEventListener('click', async () => {
    if (!images.length || !lastRange) return;
    const files = [];
    for (const img of images) {
      const data = new Uint8Array(await img.blob.arrayBuffer());
      files.push({ name: img.fileName, data });
    }
    const zip = buildStoreZip(files);
    const zipName = buildZipRangeFileName(
      sourceName,
      lastRange.start,
      lastRange.end,
      images.length,
      new Date()
    );
    downloadBlob(new Blob([zip], { type: 'application/zip' }), zipName);
  });
  $('pdfi-clear')?.addEventListener('click', () => {
    revokeThumbs();
    renderList();
    clearPending();
    lastRange = null;
    $('pdfi-results')?.classList.add('hidden');
    setStatus('');
    setError('');
  });
}

if (typeof document !== 'undefined') init();
