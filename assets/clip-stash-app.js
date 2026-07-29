/**
 * SUGUDASU 仮置き — UI
 * docs/products/clip-stash/specification.md
 */
import {
  TYPE_LABELS,
  buildCardFromPaste,
  copyCard,
  formatBytes,
  formatTimestamp,
  imageBlob,
  imageCardMeta,
  classifyInputBridge,
  inputBridgeMessage,
  isAcceptedLocalFile,
  nextSlotIndex,
  pdfBlob,
  pdfPreviewBlob,
  planMoveToSlot,
  primaryInputBridge,
  readClipboardPaste,
  readLocalFile,
  slotIndices,
  tablePreview,
  textPreview,
} from './clip-stash-engine.js';
import {
  deleteCard,
  getAllCards,
  openDb,
  putCard,
} from './clip-stash-db.js';
import { triggerCopyFlash } from './sg-copy-feedback.js';
import { ensurePdfjs } from './sg-pdf-vendor.js';

const els = {
  main: document.querySelector('main.sg-main-shell'),
  dropPanel: document.getElementById('cs-drop-panel'),
  dropZone: document.getElementById('cs-drop-zone'),
  emptyCopy: document.getElementById('cs-empty-copy'),
  filePick: document.getElementById('cs-file-pick'),
  fileInput: document.getElementById('cs-file-input'),
  board: document.getElementById('cs-board'),
  bridgeToast: document.getElementById('cs-bridge-toast'),
  preview: document.getElementById('cs-preview'),
  previewBody: document.getElementById('cs-preview-body'),
  previewType: document.getElementById('cs-preview-type'),
  status: document.getElementById('cs-status'),
};

/** @type {import('./clip-stash-engine.js').ClipStashCard[]} */
let cards = [];
/** @type {string|null} */
let selectedId = null;
/** @type {IDBDatabase|null} */
let db = null;
/** @type {string|null} */
let dragId = null;
/** @type {number|null} */
let dropSlot = null;
/** @type {{ id: string, order: number }[]|null} */
let dragPreview = null;
/** @type {Map<string, string>} */
const thumbUrls = new Map();
/** @type {boolean} */
let suppressClick = false;
/** @type {ReturnType<typeof setTimeout>|null} */
let bridgeToastTimer = null;
/** @type {string|null} */
let lastBridgeShown = null;

async function init() {
  db = await openDb();
  cards = await getAllCards(db);
  bindBoardDnD();
  bindDropZone();
  render();
}

function bindDropZone() {
  const zone = els.dropZone;
  if (!zone) return;

  zone.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('#cs-file-pick')) return;
    els.main?.focus();
  });
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      els.main?.focus();
    }
  });

  zone.addEventListener('dragenter', (e) => {
    if (!hasFilePayload(e.dataTransfer)) return;
    e.preventDefault();
    const bridge = inspectDataTransferBridge(e.dataTransfer);
    const hasAccepted = dataTransferHasAccepted(e.dataTransfer);
    zone.classList.toggle('is-dragover', hasAccepted || !bridge);
    zone.classList.toggle('is-bridge', !!bridge && !hasAccepted);
    if (bridge) showBridgeToast(bridge);
  });
  zone.addEventListener('dragover', (e) => {
    if (!hasFilePayload(e.dataTransfer)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    const bridge = inspectDataTransferBridge(e.dataTransfer);
    const hasAccepted = dataTransferHasAccepted(e.dataTransfer);
    zone.classList.toggle('is-dragover', hasAccepted || !bridge);
    zone.classList.toggle('is-bridge', !!bridge && !hasAccepted);
  });
  zone.addEventListener('dragleave', (e) => {
    if (e.relatedTarget instanceof Node && zone.contains(e.relatedTarget)) return;
    zone.classList.remove('is-dragover', 'is-bridge');
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('is-dragover', 'is-bridge');
    if (!hasFilePayload(e.dataTransfer)) return;
    void addFromFiles(e.dataTransfer?.files, e.dataTransfer);
  });

  els.filePick?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    els.fileInput?.click();
  });
  els.fileInput?.addEventListener('change', () => {
    const files = els.fileInput?.files;
    void addFromFiles(files);
    if (els.fileInput) els.fileInput.value = '';
  });
}

/**
 * @param {DataTransfer|null|undefined} dt
 */
function hasFilePayload(dt) {
  if (!dt) return false;
  if (dt.types && typeof dt.types.includes === 'function') {
    return dt.types.includes('Files');
  }
  return !!(dt.files && dt.files.length);
}

/**
 * @param {DataTransfer|null|undefined} dt
 * @returns {import('./clip-stash-engine.js').InputBridgeKind|null}
 */
function inspectDataTransferBridge(dt) {
  if (!dt) return null;
  /** @type {(import('./clip-stash-engine.js').InputBridgeKind|null)[]} */
  const kinds = [];
  const items = dt.items ? Array.from(dt.items) : [];
  if (items.length) {
    for (const item of items) {
      if (item.kind !== 'file') continue;
      let isDirectory = false;
      try {
        if (typeof item.webkitGetAsEntry === 'function') {
          const entry = item.webkitGetAsEntry();
          if (entry?.isDirectory) isDirectory = true;
        }
      } catch {
        /* ignore */
      }
      const file = typeof item.getAsFile === 'function' ? item.getAsFile() : null;
      kinds.push(
        classifyInputBridge({
          name: file?.name || '',
          type: item.type || file?.type || '',
          isDirectory,
        }),
      );
    }
  } else if (dt.files?.length) {
    for (const file of Array.from(dt.files)) {
      kinds.push(classifyInputBridge({ name: file.name, type: file.type }));
    }
  }
  return primaryInputBridge(kinds);
}

/**
 * @param {DataTransfer|null|undefined} dt
 */
function dataTransferHasAccepted(dt) {
  if (!dt) return false;
  const files = dt.files ? Array.from(dt.files) : [];
  if (files.some((f) => isAcceptedLocalFile(f))) return true;
  const items = dt.items ? Array.from(dt.items) : [];
  for (const item of items) {
    if (item.kind !== 'file') continue;
    try {
      if (typeof item.webkitGetAsEntry === 'function') {
        const entry = item.webkitGetAsEntry();
        if (entry?.isDirectory) continue;
      }
    } catch {
      /* ignore */
    }
    const file = typeof item.getAsFile === 'function' ? item.getAsFile() : null;
    if (file && isAcceptedLocalFile(file)) return true;
    if (!file && item.type && isAcceptedLocalFile({ name: '', type: item.type })) return true;
  }
  return false;
}

/**
 * @param {import('./clip-stash-engine.js').InputBridgeKind} kind
 */
function showBridgeToast(kind) {
  const msg = inputBridgeMessage(kind);
  if (!msg || !els.bridgeToast) return;
  if (lastBridgeShown === msg && els.bridgeToast.classList.contains('is-visible')) {
    scheduleBridgeHide();
    return;
  }
  lastBridgeShown = msg;
  els.bridgeToast.textContent = msg;
  els.bridgeToast.classList.remove('hidden');
  els.bridgeToast.classList.add('is-visible');
  scheduleBridgeHide();
}

function scheduleBridgeHide() {
  if (bridgeToastTimer) window.clearTimeout(bridgeToastTimer);
  bridgeToastTimer = window.setTimeout(() => {
    hideBridgeToast();
  }, 4000);
}

function hideBridgeToast() {
  if (bridgeToastTimer) {
    window.clearTimeout(bridgeToastTimer);
    bridgeToastTimer = null;
  }
  lastBridgeShown = null;
  els.bridgeToast?.classList.remove('is-visible');
  els.bridgeToast?.classList.add('hidden');
}

async function loadPdfjs() {
  return ensurePdfjs();
}

/**
 * 1ページ目の PNG プレビューのみ生成（ボード表示キャッシュ）。元 PDF は変更しない。
 * Space では使わない（iframe 委譲）。
 * @param {ArrayBuffer} data
 * @returns {Promise<{ preview: ArrayBuffer, pageCount: number }|null>}
 */
async function makePdfPreview(data) {
  try {
    const lib = await loadPdfjs();
    const task = lib.getDocument({ data: data.slice(0) });
    const pdf = await task.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.75 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return { preview: new ArrayBuffer(0), pageCount: pdf.numPages };
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return { preview: new ArrayBuffer(0), pageCount: pdf.numPages };
    return { preview: await blob.arrayBuffer(), pageCount: pdf.numPages };
  } catch {
    return null;
  }
}

function bindBoardDnD() {
  if (!els.board) return;
  els.board.addEventListener('dragover', onBoardDragOver);
  els.board.addEventListener('dragleave', onBoardDragLeave);
  els.board.addEventListener('drop', onBoardDrop);
}

function setStatus(msg, isError = false) {
  if (!els.status) return;
  els.status.textContent = msg;
  els.status.classList.toggle('text-rose-700', isError);
  els.status.classList.toggle('text-slate-500', !isError);
}

function revokeThumbs() {
  for (const url of thumbUrls.values()) URL.revokeObjectURL(url);
  thumbUrls.clear();
}

function imageThumbUrl(card) {
  if (card.type === 'image') {
    const cached = thumbUrls.get(card.id);
    if (cached) return cached;
    const blob = imageBlob(card);
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    thumbUrls.set(card.id, url);
    return url;
  }
  if (card.type === 'pdf') {
    const cached = thumbUrls.get(card.id);
    if (cached) return cached;
    const blob = pdfPreviewBlob(card);
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    thumbUrls.set(card.id, url);
    return url;
  }
  return '';
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cardBySlot(slot) {
  return cards.find((c) => c.order === slot) || null;
}

function cardBodyHtml(card) {
  if (card.type === 'text') {
    const p = textPreview(card.text || '');
    return `<pre class="cs-card__body">${esc(p.body)}</pre>
      <p class="cs-card__meta">${p.charCount} 文字 · ${p.lineCount} 行</p>`;
  }
  if (card.type === 'table') {
    const p = tablePreview(card.tableTsv || '');
    return `<pre class="cs-card__body">${esc(p.body)}</pre>
      <p class="cs-card__meta">${p.rows} 行 · ${p.cols} 列</p>`;
  }
  if (card.type === 'url') {
    const img = card.urlOgImage
      ? `<img src="${esc(card.urlOgImage)}" alt="" class="cs-card__og" loading="lazy" referrerpolicy="no-referrer">`
      : '<div class="cs-card__og cs-card__og--placeholder"></div>';
    return `${img}
      <p class="cs-card__title">${esc(card.urlTitle || '')}</p>
      <p class="cs-card__url">${esc(card.url || '')}</p>`;
  }
  if (card.type === 'image') {
    const src = imageThumbUrl(card);
    const { format } = imageCardMeta(card);
    const w = card.imageWidth;
    const h = card.imageHeight;
    const dim =
      Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0
        ? `<p class="cs-card__meta">${w}×${h}</p>`
        : '';
    return `<img src="${esc(src)}" alt="" class="cs-card__thumb">
      <p class="cs-card__format">${esc(format)}</p>
      ${dim}`;
  }
  if (card.type === 'pdf') {
    const src = imageThumbUrl(card);
    const thumb = src
      ? `<img src="${esc(src)}" alt="" class="cs-card__thumb">`
      : '<div class="cs-card__og cs-card__og--placeholder" aria-hidden="true"></div>';
    return `${thumb}
      <p class="cs-card__format">PDF</p>
      <p class="cs-card__pdf-name">${esc(card.pdfName || 'PDF')}</p>`;
  }
  if (card.type === 'color') {
    const hex = card.colorHex || '#000000';
    return `<div class="cs-card__swatch" style="background:${esc(hex)}"></div>
      <p class="cs-card__hex">${esc(hex.toUpperCase())}</p>`;
  }
  return '';
}

function clearDropGuide() {
  dropSlot = null;
  dragPreview = null;
  els.board?.classList.remove('is-drag-active');
  clearSlidePreview();
  els.board?.querySelectorAll('.cs-slot.is-drop-target').forEach((el) => {
    el.classList.remove('is-drop-target');
  });
}

function applyDropGuide() {
  if (!els.board) return;
  els.board.querySelectorAll('.cs-slot').forEach((el) => {
    el.classList.toggle('is-drop-target', dropSlot !== null && Number(el.dataset.slot) === dropSlot);
  });
}

function clearSlidePreview() {
  if (!els.board) return;
  els.board.querySelectorAll('.cs-card').forEach((el) => {
    el.style.transition = '';
    el.style.transform = '';
    el.classList.remove('is-slide-preview');
  });
}

/**
 * DnD 中はドラッグ元 DOM を壊さず、入れ替え相手だけスライドプレビュー。
 * 空白への移動では他カードは動かさない。
 * @param {{ id: string, order: number }[]} planned
 */
function applySlidePreview(planned) {
  if (!els.board || !dragId) return;
  const fromCard = cards.find((c) => c.id === dragId);
  if (!fromCard) return;
  const plannedFrom = planned.find((p) => p.id === dragId);
  if (!plannedFrom || plannedFrom.order === fromCard.order) {
    clearSlidePreview();
    return;
  }
  const swapId = planned.find((p) => p.id !== dragId && p.order === fromCard.order)?.id;
  const swapPartner = swapId ? cards.find((c) => c.id === swapId) : null;
  // 空白ドロップ: 他カードは動かさない
  if (!swapPartner) {
    clearSlidePreview();
    return;
  }

  const slotRect = (slot) => {
    const el = els.board.querySelector(`.cs-slot[data-slot="${slot}"]`);
    return el ? el.getBoundingClientRect() : null;
  };
  const el = els.board.querySelector(`.cs-card[data-id="${swapPartner.id}"]`);
  if (!(el instanceof HTMLElement)) return;
  const fromRect = slotRect(swapPartner.order);
  const toRect = slotRect(fromCard.order);
  if (!fromRect || !toRect) return;
  const dx = toRect.left - fromRect.left;
  const dy = toRect.top - fromRect.top;
  el.classList.add('is-slide-preview');
  el.style.transition = 'transform 0.16s ease';
  el.style.transform = dx || dy ? `translate(${dx}px, ${dy}px)` : '';
}

function renderCard(card, slotEl) {
  const isSelected = card.id === selectedId;
  const btn = document.createElement('article');
  btn.className = 'cs-card sg-card';
  btn.dataset.id = card.id;
  btn.draggable = isSelected;
  btn.tabIndex = 0;
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-label', `${TYPE_LABELS[card.type]} カード`);
  if (isSelected) btn.classList.add('is-selected');
  btn.innerHTML = `
    <button type="button" class="cs-card__delete" aria-label="削除" title="削除">×</button>
    <header class="cs-card__head">
      <span class="cs-card__type">${TYPE_LABELS[card.type]}</span>
      <time class="cs-card__time">${esc(formatTimestamp(card.createdAt))}</time>
    </header>
    ${cardBodyHtml(card)}
  `;

  btn.querySelector('.cs-card__delete')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    void deleteCardById(card.id);
  });

  btn.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('.cs-card__delete')) return;
    e.preventDefault();
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    selectCard(card.id, { rerender: false });
    els.board?.querySelectorAll('.cs-card').forEach((el) => {
      el.classList.toggle('is-selected', el.dataset.id === card.id);
      el.draggable = el.dataset.id === card.id;
    });
  });
  btn.addEventListener('dblclick', (e) => {
    if (e.target instanceof Element && e.target.closest('.cs-card__delete')) return;
    e.preventDefault();
    void copyAndFeedback(card.id, true);
  });
  btn.addEventListener('dragstart', (e) => {
    if (card.id !== selectedId) {
      e.preventDefault();
      return;
    }
    dragId = card.id;
    dropSlot = null;
    btn.classList.add('is-dragging');
    els.board?.classList.add('is-drag-active');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.id);
    }
  });
  btn.addEventListener('dragend', () => {
    dragId = null;
    btn.classList.remove('is-dragging');
    clearDropGuide();
    suppressClick = true;
    window.setTimeout(() => {
      suppressClick = false;
    }, 0);
  });

  slotEl.appendChild(btn);
}

function render() {
  revokeThumbs();
  if (!els.board) return;
  els.board.innerHTML = '';
  const hasCards = cards.length > 0;
  els.dropPanel?.classList.toggle('is-empty', !hasCards);
  els.dropPanel?.classList.remove('hidden');
  els.board.classList.toggle('hidden', !hasCards);

  slotIndices(cards).forEach((slot) => {
    const slotEl = document.createElement('div');
    slotEl.className = 'cs-slot';
    slotEl.dataset.slot = String(slot);
    const card = cardBySlot(slot);
    if (card) {
      renderCard(card, slotEl);
    } else {
      slotEl.classList.add('cs-slot--empty');
      slotEl.setAttribute('aria-label', `空きスロット ${slot + 1}`);
    }
    els.board.appendChild(slotEl);
  });

  applyDropGuide();
}

function selectCard(id, { rerender = true } = {}) {
  selectedId = id;
  if (rerender) render();
}

function slotFromEvent(e) {
  const slotEl = e.target instanceof Element ? e.target.closest('.cs-slot') : null;
  if (!slotEl) return null;
  const slot = Number(slotEl.dataset.slot);
  return Number.isFinite(slot) ? slot : null;
}

function onBoardDragOver(e) {
  if (!dragId || !els.board) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

  const slot = slotFromEvent(e);
  const fromCard = cards.find((c) => c.id === dragId);
  if (slot === null || !fromCard || fromCard.order === slot) {
    if (dropSlot !== null) {
      dropSlot = null;
      dragPreview = null;
      clearSlidePreview();
      applyDropGuide();
    }
    els.board.classList.add('is-drag-active');
    return;
  }

  if (dropSlot === slot) return;
  dropSlot = slot;
  dragPreview = planMoveToSlot(cards, dragId, slot);
  els.board.classList.add('is-drag-active');
  applyDropGuide();
  applySlidePreview(dragPreview);
}

function onBoardDragLeave(e) {
  if (!els.board || !dragId) return;
  if (e.relatedTarget instanceof Node && els.board.contains(e.relatedTarget)) return;
  dropSlot = null;
  dragPreview = null;
  clearSlidePreview();
  applyDropGuide();
}

function onBoardDrop(e) {
  e.preventDefault();
  const from = dragId || e.dataTransfer?.getData('text/plain');
  const slot = dropSlot ?? slotFromEvent(e);
  clearDropGuide();
  if (!from || slot === null) return;
  void moveCardToSlot(from, slot);
}

async function moveCardToSlot(fromId, targetSlot) {
  const fromCard = cards.find((c) => c.id === fromId);
  if (!fromCard || fromCard.order === targetSlot || !db) return;
  const planned = planMoveToSlot(cards, fromId, targetSlot);
  const changed = planned.filter((p) => {
    const cur = cards.find((c) => c.id === p.id);
    return cur && cur.order !== p.order;
  });
  if (!changed.length) return;

  for (const p of changed) {
    const card = cards.find((c) => c.id === p.id);
    if (!card) continue;
    card.order = p.order;
    await putCard(db, card);
  }
  cards = await getAllCards(db);
  selectedId = fromId;
  render();
}

async function addFromPaste(dt) {
  const paste = await readClipboardPaste(dt);
  if (!paste) {
    showBridgeToast('generic');
    return;
  }
  await commitPaste(paste);
}

/**
 * @param {FileList|File[]|null|undefined} fileList
 * @param {DataTransfer|null|undefined} [dt]
 */
async function addFromFiles(fileList, dt) {
  const files = fileList ? Array.from(fileList) : [];
  const folderBridge =
    dt && inspectDataTransferBridge(dt) === 'folder'
      ? /** @type {const} */ ('folder')
      : null;

  if (folderBridge) {
    showBridgeToast('folder');
    return;
  }

  if (!files.length) {
    const bridge = inspectDataTransferBridge(dt) || 'generic';
    showBridgeToast(bridge);
    return;
  }

  const bridgeKinds = files
    .filter((f) => !isAcceptedLocalFile(f))
    .map((f) => classifyInputBridge({ name: f.name, type: f.type }));
  const bridge = primaryInputBridge(bridgeKinds);
  const accepted = files.filter((f) => isAcceptedLocalFile(f));

  if (!accepted.length) {
    showBridgeToast(bridge || 'generic');
    return;
  }

  for (const file of accepted) {
    const paste = await readLocalFile(file);
    if (!paste) continue;
    await commitPaste(paste);
  }

  if (bridge) showBridgeToast(bridge);
  else setStatus('');
}

/**
 * Clipboard / Drag / Picker 共通のカード生成。
 * @param {object} paste
 */
async function commitPaste(paste) {
  if (!db) return;
  // ボード用サムネは表示キャッシュのみ（PDF 本体は変更しない）
  if (paste.kind === 'pdf' && paste.pdfData && !paste.pdfPreviewData) {
    const thumb = await makePdfPreview(paste.pdfData);
    if (thumb?.preview?.byteLength) {
      paste.pdfPreviewData = thumb.preview;
      paste.pdfPageCount = thumb.pageCount;
    }
  }
  const card = buildCardFromPaste(paste, nextSlotIndex(cards));
  await putCard(db, card);
  cards = await getAllCards(db);
  selectedId = card.id;
  render();
  setStatus('');
}

async function copyAndFeedback(id, closePreviewAfter = false) {
  const card = cards.find((c) => c.id === id);
  if (!card) return;
  try {
    await copyCard(card);
    triggerCopyFlash();
    setStatus('コピーしました');
    if (closePreviewAfter) closePreview();
  } catch {
    if (card.type === 'image') {
      setStatus('画像のコピーができませんでした。プレビューから確認してください。');
    } else if (card.type === 'pdf') {
      setStatus('PDFのコピーができませんでした。プレビューから確認してください。');
    } else {
      setStatus('コピーできませんでした。もう一度お試しください。');
    }
  }
}

async function deleteCardById(id) {
  if (!db) return;
  await deleteCard(db, id);
  cards = await getAllCards(db);
  if (selectedId === id) selectedId = null;
  render();
  setStatus('');
}

async function deleteSelected() {
  if (!selectedId) return;
  await deleteCardById(selectedId);
}

function isPreviewOpen() {
  return els.preview && !els.preview.classList.contains('hidden');
}

/** @type {string|null} */
let previewObjectUrl = null;

function openPreview() {
  const card = cards.find((c) => c.id === selectedId);
  if (!card || !els.preview || !els.previewBody) return;
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
  const panel = els.preview.querySelector('.cs-preview__panel');
  panel?.classList.toggle('cs-preview__panel--pdf', card.type === 'pdf');
  els.previewType.textContent = TYPE_LABELS[card.type];
  if (card.type === 'text') {
    els.previewBody.innerHTML = `<pre class="cs-preview__pre">${esc(card.text || '')}</pre>`;
  } else if (card.type === 'table') {
    els.previewBody.innerHTML = `<pre class="cs-preview__pre">${esc(card.tableTsv || '')}</pre>`;
  } else if (card.type === 'url') {
    const img = card.urlOgImage
      ? `<img src="${esc(card.urlOgImage)}" alt="" class="cs-preview__og" referrerpolicy="no-referrer">`
      : '';
    const href = esc(card.url || '');
    els.previewBody.innerHTML = `${img}
      <p class="cs-preview__title">${esc(card.urlTitle || '')}</p>
      <p class="cs-preview__url"><a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a></p>`;
  } else if (card.type === 'image') {
    const src = imageThumbUrl(card);
    const { format } = imageCardMeta(card);
    els.previewBody.innerHTML = `<img src="${esc(src)}" alt="" class="cs-preview__img">
      <p class="cs-preview__meta">${esc(format)} · ${card.imageWidth || '?'}×${card.imageHeight || '?'} · ${formatBytes(card.imageBytes)}</p>`;
  } else if (card.type === 'pdf') {
    els.previewBody.innerHTML = buildPdfPreviewHtml(card);
  } else if (card.type === 'color') {
    els.previewBody.innerHTML = `<div class="cs-preview__swatch" style="background:${esc(card.colorHex || '#000')}"></div>
      <p class="cs-preview__hex">${esc((card.colorHex || '').toUpperCase())}</p>`;
  }
  els.preview.classList.remove('hidden');
  document.body.classList.add('cs-preview-open');
}

/**
 * Space PDF: コンテナをブラウザ標準ビューアへ委譲（ADR-CS-003）。
 *
 * DECISION: Space では PDF→画像化・Canvas・pdf.js 描画をしない。
 * Blob URL + iframe（`#toolbar=0&navpanes=0&view=FitH`）のみ。
 * ボード上の1ページ目 PNG は表示専用キャッシュ（元データは常に PDF）。
 *
 * @param {import('./clip-stash-engine.js').ClipStashCard} card
 */
function buildPdfPreviewHtml(card) {
  const blob = pdfBlob(card);
  const pages = Number(card.pdfPageCount) > 0 ? Number(card.pdfPageCount) : 0;
  const meta = `<p class="cs-preview__meta">PDF · ${esc(card.pdfName || '')}${
    pages > 1 ? ` · ${pages}ページ` : ''
  } · ${formatBytes(card.pdfBytes)}</p>`;

  if (!blob) {
    return '<p class="cs-preview__meta">PDF を表示できません</p>';
  }
  previewObjectUrl = URL.createObjectURL(blob);
  const viewerSrc = `${previewObjectUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width`;
  return `${meta}
    <iframe class="cs-preview__pdf" title="PDFプレビュー" src="${esc(viewerSrc)}"></iframe>`;
}

function closePreview() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
  els.preview?.querySelector('.cs-preview__panel')?.classList.remove('cs-preview__panel--pdf');
  els.preview?.classList.add('hidden');
  document.body.classList.remove('cs-preview-open');
}

document.addEventListener('paste', (e) => {
  if (isPreviewOpen()) return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  e.preventDefault();
  void addFromPaste(e.clipboardData);
});

document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.key === 'Escape') {
    if (isPreviewOpen()) {
      e.preventDefault();
      closePreview();
    }
    return;
  }

  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    if (isPreviewOpen()) return;
    if (!selectedId) return;
    openPreview();
    return;
  }

  if (isPreviewOpen()) return;

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!selectedId) return;
    e.preventDefault();
    void deleteSelected();
  }
});

els.preview?.addEventListener('dblclick', () => {
  if (!selectedId) return;
  void copyAndFeedback(selectedId, true);
});

els.preview?.addEventListener('click', (e) => {
  if (e.target === els.preview || e.target?.classList?.contains('cs-preview__backdrop')) {
    closePreview();
  }
});

void init();
