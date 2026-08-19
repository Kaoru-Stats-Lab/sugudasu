/**
 * SUGUDASU ページ抜き — UI
 * docs/notes/PDF_PICK_SPEC.md
 */
import {
  checkLimits,
  copySelectedPages,
  buildOutputFileName,
  MAX_FILE_BYTES,
  MAX_PAGES,
} from './pdf-pick-engine.js';
import { ensurePdfjs, pdfjsDocumentExtras } from './sg-pdf-vendor.js';
import { writePdfHandoff } from './sg-pdf-handoff.js';

const $ = (id) => document.getElementById(id);
const THUMB_WIDTH = 160;

/** @type {Uint8Array|null} */
let sourceBytes = null;
let sourceName = 'document.pdf';
/** @type {any} */
let pdfDoc = null;
let pageCount = 0;
/** @type {boolean[]} */
let selected = [];
/** @type {string[]} */
let thumbUrls = [];

function setError(msg) {
  const el = $('pdfp-error');
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
  const el = $('pdfp-status');
  if (el) el.textContent = msg || '';
}

function setBusy(on) {
  $('pdfp-busy')?.classList.toggle('hidden', !on);
}

function revokeThumbs() {
  for (const url of thumbUrls) URL.revokeObjectURL(url);
  thumbUrls = [];
}

function resetState() {
  sourceBytes = null;
  pdfDoc = null;
  pageCount = 0;
  selected = [];
  revokeThumbs();
  $('pdfp-work')?.classList.add('hidden');
  const grid = $('pdfp-grid');
  if (grid) grid.innerHTML = '';
}

function selectedCount() {
  return selected.filter(Boolean).length;
}

function selectedIndices() {
  const out = [];
  for (let i = 0; i < selected.length; i += 1) {
    if (selected[i]) out.push(i);
  }
  return out;
}

function syncCountUi() {
  const n = selectedCount();
  const countEl = $('pdfp-count');
  if (countEl) countEl.textContent = `${n} / ${pageCount} ページを渡す`;
  const save = /** @type {HTMLButtonElement|null} */ ($('pdfp-save'));
  const fill = /** @type {HTMLButtonElement|null} */ ($('pdfp-fill'));
  if (save) save.disabled = n === 0;
  if (fill) fill.disabled = n === 0;
}

function paintThumb(btn, on) {
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.classList.toggle('ring-violet-600', on);
  btn.classList.toggle('ring-2', on);
  btn.classList.toggle('opacity-100', on);
  btn.classList.toggle('ring-slate-200', !on);
  btn.classList.toggle('ring-1', !on);
  btn.classList.toggle('opacity-50', !on);
}

function renderGrid() {
  const grid = $('pdfp-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < pageCount; i += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'rounded-lg bg-white p-2 text-left border border-slate-200 hover:border-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600';
    btn.dataset.page = String(i);
    paintThumb(btn, selected[i]);
    const img = document.createElement('img');
    img.alt = `${i + 1}ページ`;
    img.className = 'w-full h-auto rounded border border-slate-100 bg-slate-50';
    if (thumbUrls[i]) img.src = thumbUrls[i];
    const label = document.createElement('span');
    label.className = 'mt-1.5 block text-[11px] font-semibold text-slate-700';
    label.textContent = `${i + 1}ページ`;
    btn.append(img, label);
    btn.addEventListener('click', () => {
      selected[i] = !selected[i];
      paintThumb(btn, selected[i]);
      syncCountUi();
    });
    grid.appendChild(btn);
  }
}

function setAll(on) {
  selected = selected.map(() => on);
  const grid = $('pdfp-grid');
  if (grid) {
    grid.querySelectorAll('button[data-page]').forEach((btn) => {
      const i = Number(btn.dataset.page);
      paintThumb(btn, selected[i]);
    });
  }
  syncCountUi();
}

/**
 * @param {any} pdf
 * @param {number} pageNumber1
 * @returns {Promise<string>}
 */
async function renderThumb(pdf, pageNumber1) {
  const page = await pdf.getPage(pageNumber1);
  const base = page.getViewport({ scale: 1 });
  const scale = THUMB_WIDTH / Math.max(1, base.width);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  thumbUrls[pageNumber1 - 1] = url;
  return url;
}

/**
 * @param {File} file
 */
async function processFile(file) {
  setError('');
  resetState();
  setStatus('');

  if (!file || (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name))) {
    setError('PDFファイルを選んでください。');
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    setError('このPDFは目安の上限を超えているため処理できません。（部分的な切り出しはしません）');
    return;
  }

  sourceName = file.name || 'document.pdf';
  setStatus('読み込み中…（初回はPDFエンジンの準備に時間がかかることがあります）');
  setBusy(true);

  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const pdfjsLib = await ensurePdfjs();
    const loadingTask = pdfjsLib.getDocument({
      data: bytes.slice(0),
      ...pdfjsDocumentExtras(),
    });
    const pdf = await loadingTask.promise;
    const n = pdf.numPages | 0;
    const gate = checkLimits(file.size, n);
    if (!gate.ok) {
      const msg =
        gate.reason === 'page_count'
          ? `このPDFは${MAX_PAGES}ページを超えているため処理できません。（部分的な切り出しはしません）`
          : 'このPDFは目安の上限を超えているため処理できません。（部分的な切り出しはしません）';
      setError(msg);
      setStatus('');
      return;
    }

    sourceBytes = bytes;
    pdfDoc = pdf;
    pageCount = n;
    selected = Array.from({ length: n }, () => false);
    thumbUrls = Array.from({ length: n }, () => '');
    $('pdfp-work')?.classList.remove('hidden');
    renderGrid();
    syncCountUi();
    setStatus(`全${n}ページ。渡すページをクリックして選んでください。`);

    for (let i = 1; i <= n; i += 1) {
      await renderThumb(pdf, i);
      const img = $('pdfp-grid')?.querySelector(`button[data-page="${i - 1}"] img`);
      if (img && thumbUrls[i - 1]) img.src = thumbUrls[i - 1];
      if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    setStatus(`全${n}ページ。渡すページをクリックして選んでください。`);
  } catch (err) {
    console.error(err);
    resetState();
    setError('このPDFは開けませんでした（暗号化・破損の可能性）。');
    setStatus('');
  } finally {
    setBusy(false);
  }
}

/**
 * @returns {Promise<{ bytes: Uint8Array, name: string } | null>}
 */
async function buildPickedPdf() {
  const indices = selectedIndices();
  if (!sourceBytes || !indices.length) return null;
  const bytes = await copySelectedPages(sourceBytes, indices);
  const name = buildOutputFileName(sourceName, indices.length, new Date());
  return { bytes, name };
}

async function savePicked() {
  setError('');
  setBusy(true);
  setStatus('PDFを作成しています…');
  try {
    const built = await buildPickedPdf();
    if (!built) return;
    const bytes = built.bytes;
    const name = built.name;
    const blob = new Blob([bytes], { type: 'application/pdf' });
    if (globalThis.SG_ANALYTICS?.downloadBlobTracked) {
      globalThis.SG_ANALYTICS.downloadBlobTracked(blob, name, 'pdf');
    } else {
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      try {
        globalThis.SUGUDASU_SHELL?.trackToolJobDone?.('pdf');
      } catch (_) {
        /* ignore */
      }
    }
    setStatus(`${selectedCount()}ページのPDFを保存しました。`);
  } catch (err) {
    console.error(err);
    setError('PDFを作成できませんでした。');
    setStatus('');
  } finally {
    setBusy(false);
  }
}

async function goPdfFill() {
  setError('');
  setBusy(true);
  setStatus('PDF記入へ渡しています…');
  try {
    const built = await buildPickedPdf();
    if (!built) return;
    const ok = await writePdfHandoff({
      toTool: 'pdf-fill',
      fromTool: 'pdf-pick',
      filename: built.name,
      bytes: built.bytes,
    });
    if (!ok) {
      setError('次の画面へ渡せませんでした。このPDFを保存して、PDF記入で開いてください。');
      setStatus('');
      return;
    }
    window.location.href = '/pdf-fill?from=pdf-pick';
  } catch (err) {
    console.error(err);
    setError('次の画面へ渡せませんでした。このPDFを保存して、PDF記入で開いてください。');
    setStatus('');
  } finally {
    setBusy(false);
  }
}

function bindDrop() {
  const zone = $('pdfp-drop');
  if (!zone) return;
  const input = /** @type {HTMLInputElement|null} */ ($('pdfp-file'));
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
    if (file) {
      try { globalThis.SG_ANALYTICS?.trackFileAccepted?.('file_drop'); } catch (_) { /* ignore */ }
      processFile(file);
    }
  });
  input?.addEventListener('change', () => {
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      try { globalThis.SG_ANALYTICS?.trackFileAccepted?.('file_pick'); } catch (_) { /* ignore */ }
      processFile(file);
    }
  });
}

function init() {
  bindDrop();
  $('pdfp-all')?.addEventListener('click', () => setAll(true));
  $('pdfp-none')?.addEventListener('click', () => setAll(false));
  $('pdfp-save')?.addEventListener('click', () => savePicked());
  $('pdfp-fill')?.addEventListener('click', () => goPdfFill());
  document.querySelectorAll('a.sg-tool-next-path__link[href*="pdf-fill"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      goPdfFill();
    });
  });
  $('pdfp-clear')?.addEventListener('click', () => {
    resetState();
    setStatus('');
    setError('');
  });
}

if (typeof document !== 'undefined') init();
