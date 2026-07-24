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
  nextSlotIndex,
  readClipboardPaste,
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

const els = {
  main: document.querySelector('main.sg-main-shell'),
  dropPanel: document.getElementById('cs-drop-panel'),
  dropZone: document.getElementById('cs-drop-zone'),
  board: document.getElementById('cs-board'),
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
/** @type {Map<string, string>} */
const thumbUrls = new Map();
/** @type {boolean} */
let suppressClick = false;

async function init() {
  db = await openDb();
  cards = await getAllCards(db);
  bindBoardDnD();
  bindDropZone();
  render();
}

function bindDropZone() {
  els.dropZone?.addEventListener('click', () => {
    els.main?.focus();
  });
  els.dropZone?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      els.main?.focus();
    }
  });
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
  if (card.type !== 'image') return '';
  const cached = thumbUrls.get(card.id);
  if (cached) return cached;
  const blob = imageBlob(card);
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  thumbUrls.set(card.id, url);
  return url;
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
    return `<img src="${esc(src)}" alt="" class="cs-card__thumb">
      <p class="cs-card__format">${esc(format)}</p>
      <p class="cs-card__meta">${card.imageWidth || '?'}×${card.imageHeight || '?'} · ${formatBytes(card.imageBytes)}</p>`;
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
  els.board?.classList.remove('is-drag-active');
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
  els.dropPanel?.classList.toggle('hidden', hasCards);
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
      slotEl.setAttribute('aria-hidden', 'true');
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
    clearDropGuide();
    return;
  }

  if (dropSlot === slot) return;
  dropSlot = slot;
  els.board.classList.add('is-drag-active');
  applyDropGuide();
}

function onBoardDragLeave(e) {
  if (!els.board || !dragId) return;
  if (e.relatedTarget instanceof Node && els.board.contains(e.relatedTarget)) return;
  clearDropGuide();
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
  const other = cards.find((c) => c.order === targetSlot);
  const fromSlot = fromCard.order;
  fromCard.order = targetSlot;
  await putCard(db, fromCard);
  if (other) {
    other.order = fromSlot;
    await putCard(db, other);
  }
  cards = await getAllCards(db);
  selectedId = fromId;
  render();
}

async function addFromPaste(dt) {
  const paste = await readClipboardPaste(dt);
  if (!paste) {
    setStatus('貼り付け内容を認識できませんでした。', true);
    return;
  }
  if (!db) return;
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
    setStatus('コピーしました');
    if (closePreviewAfter) closePreview();
  } catch {
    if (card.type === 'image') {
      setStatus('このブラウザでは画像のコピーに非対応です。', true);
    } else {
      setStatus('コピーに失敗しました。', true);
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

function openPreview() {
  const card = cards.find((c) => c.id === selectedId);
  if (!card || !els.preview || !els.previewBody) return;
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
  } else if (card.type === 'color') {
    els.previewBody.innerHTML = `<div class="cs-preview__swatch" style="background:${esc(card.colorHex || '#000')}"></div>
      <p class="cs-preview__hex">${esc((card.colorHex || '').toUpperCase())}</p>`;
  }
  els.preview.classList.remove('hidden');
  document.body.classList.add('cs-preview-open');
}

function closePreview() {
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
