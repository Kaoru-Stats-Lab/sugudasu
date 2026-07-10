/**
 * sticky-room-app.js — 付箋ルーム UI（Phase 0: Konva · Gate 1: WebRTC 接続のみ）
 * Konva CDN ESM — 理由: 250KB gzip 目標 · npm バンドル増やさない（SSOT §Bundle）
 */
import Konva from 'https://cdn.jsdelivr.net/npm/konva@9.3.22/+esm';
import {
  copyWithFeedback,
  markCopyButtonDone,
  triggerCopyFlash,
} from './sg-copy-feedback.js';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  HEADING_COLOR_HEX,
  HEADING_COLORS,
  HEADING_FONT_SIZE,
  HEADING_HEIGHT,
  HEADING_MIN_WIDTH,
  STICKY_COLOR_HEX,
  STICKY_COLORS,
  applyRemoteCard,
  applyRemoteCardDelete,
  buildAutosavePayload,
  buildRoomUrl,
  cardBottom,
  cardsToArray,
  computeMaxBottom,
  createCard,
  createHeading,
  createRoomId,
  createRoomSession,
  findFreeGridSlot,
  buildOccupiedGridSet,
  findFreeGridIndexFromSet,
  xyToGridIndex,
  gridSlotToXY,
  formatBoardJson,
  formatBoardMarkdown,
  formatBoardTsv,
  formatConnStats,
  formatTtlRemaining,
  isHeadingCard,
  isStickyKind,
  layoutCardsInGrid,
  layoutCardsInGridAtOrigin,
  parseAutosavePayload,
  parseBoardImportJson,
  parseRoomUrl,
  removeLocalCard,
  shouldApplyRemote,
  shouldApplyRemoteDelete,
  stageHeightFromMaxBottom,
  updateCachedMaxBottom,
  upsertLocalCard,
} from './sticky-room-sync.js';

/** @type {Map<string, import('./sticky-room-sync.js').StickyCard>} */
let cards = new Map();

/** @type {Map<string, number>} */
let tombstones = new Map();

/**
 * DECISION: Stage 高さは全件走査しない。cachedMaxBottom を維持し、
 * 最下端が上へ動いた/消えたときだけ computeMaxBottom する（500〜1000 枚の drag 対策）。
 * @type {number}
 */
let cachedMaxBottom = 0;

/**
 * DECISION: 空きグリッドは occupied Set を維持。find ごとに全カードから作り直さない
 * （連続追加・stress spawn の O(n²) 回避）。横幅変化時は invalidate。
 * @type {Set<number> | null}
 */
let occupiedGridSlots = null;

/** @type {number} */
let occupiedGridWidth = 0;

/** 連続追加用ヒント（削除で手前に穴が空いたら戻す） */
let freeGridHint = 0;

/** @type {string} */
let selectedCardId = '';

/** @type {Map<string, Konva.Group>} */
const cardGroups = new Map();

/** 新規 sticky 用色 */
let selectedColor = 'yellow';
/** 新規 heading 用色 */
let selectedHeadingColor = 'black';

const MAX_UNDO = 50;
const AUTOSAVE_KEY = 'sugudasu-sticky-room-v1';
const AUTOSAVE_DEBOUNCE_MS = 400;

/**
 * @typedef {{ type: 'add', card: import('./sticky-room-sync.js').StickyCard, sync?: boolean } | { type: 'move', cardId: string, x: number, y: number, sync?: boolean } | { type: 'edit', cardId: string, text: string, sync?: boolean } | { type: 'recolor', cardId: string, color: string, sync?: boolean } | { type: 'delete', cardId: string, sync?: boolean } | { type: 'arrange', originY?: number, sync?: boolean } | { type: 'restore-snapshot', cards: import('./sticky-room-sync.js').StickyCard[], sync?: boolean } | { type: 'remote-card', card: import('./sticky-room-sync.js').StickyCard } | { type: 'remote-delete', payload: import('./sticky-room-sync.js').CardDelete } | { type: 'clear' }} BoardAction
 * @typedef {{ undo: BoardAction, redo: BoardAction }} HistoryEntry
 */

/** @type {HistoryEntry[]} */
let undoStack = [];

/** @type {HistoryEntry[]} */
let redoStack = [];

/** @type {ReturnType<typeof setTimeout> | null} */
let autosaveTimer = null;

/** @type {boolean} */
let restoringBoard = false;

/**
 * DECISION: 通信層は boardDispatch の broadcast 効果だけが触る。
 * Konva / 盤面 State は roomSession · connState を知らない。
 * @typedef {'add'|'move'|'edit'|'delete'} BoardSyncOp
 * @typedef {{ kind: 'paint', card: import('./sticky-room-sync.js').StickyCard } | { kind: 'unpaint', cardId: string } | { kind: 'status' } | { kind: 'broadcast', op: BoardSyncOp, card: import('./sticky-room-sync.js').StickyCard } | { kind: 'broadcast-delete', payload: import('./sticky-room-sync.js').CardDelete }} BoardEffect
 */

/** @type {((effect: Extract<BoardEffect, { kind: 'broadcast' } | { kind: 'broadcast-delete' }>) => void) | null} */
let syncBroadcast = null;

/**
 * @param {Extract<BoardEffect, { kind: 'broadcast' } | { kind: 'broadcast-delete' }>} effect
 */
function emitSyncBroadcast(effect) {
  syncBroadcast?.(effect);
}

/**
 * @param {BoardEffect[]} effects
 */
function applyBoardEffects(effects) {
  for (const effect of effects) {
    switch (effect.kind) {
      case 'paint':
        paintCardOnStage(effect.card);
        break;
      case 'unpaint':
        unpaintCardFromStage(effect.cardId);
        break;
      case 'status':
        refreshBoardStatus();
        updateToolbarButtons();
        ensureStageFitsContent();
        break;
      case 'broadcast':
      case 'broadcast-delete':
        emitSyncBroadcast(effect);
        break;
      default:
        break;
    }
  }
}

/**
 * Action → State → effects(render + optional broadcast)
 * @param {BoardAction} action
 * @param {{ fromHistory?: boolean, skipHistory?: boolean }} [options]
 */
function boardDispatch(action, options = {}) {
  const fromHistory = options.fromHistory === true;
  const skipHistory =
    options.skipHistory === true ||
    fromHistory ||
    action.type === 'remote-card' ||
    action.type === 'remote-delete' ||
    action.type === 'clear';

  if (!skipHistory) {
    const entry = buildHistoryEntry(action);
    if (entry) {
      undoStack.push(entry);
      if (undoStack.length > MAX_UNDO) undoStack.shift();
      redoStack = [];
    }
  }

  /** @type {BoardEffect[]} */
  const effects = [];

  switch (action.type) {
    case 'add': {
      if (tombstones.has(action.card.cardId)) {
        const nextTomb = new Map(tombstones);
        nextTomb.delete(action.card.cardId);
        tombstones = nextTomb;
      }
      cards = upsertLocalCard(cards, action.card);
      bumpCachedMaxBottom(cardBottom(action.card));
      if (isStickyKind(action.card)) {
        noteOccupiedGridChange(getBoardWidth(), undefined, undefined, action.card.x, action.card.y);
      }
      effects.push({ kind: 'paint', card: action.card });
      if (action.sync !== false) {
        effects.push({ kind: 'broadcast', op: 'add', card: action.card });
      }
      effects.push({ kind: 'status' });
      break;
    }
    case 'move': {
      const prevCard = cards.get(action.cardId);
      const prevBottom = prevCard ? cardBottom(prevCard) : 0;
      const prevX = prevCard?.x;
      const prevY = prevCard?.y;
      cards = upsertLocalCard(cards, {
        cardId: action.cardId,
        x: action.x,
        y: action.y,
      });
      const card = cards.get(action.cardId);
      if (!card) break;
      noteMaxBottomChange(prevBottom, cardBottom(card));
      if (isStickyKind(card)) {
        noteOccupiedGridChange(getBoardWidth(), prevX, prevY, card.x, card.y);
      }
      effects.push({ kind: 'paint', card });
      if (action.sync !== false) {
        effects.push({ kind: 'broadcast', op: 'move', card });
      }
      effects.push({ kind: 'status' });
      break;
    }
    case 'edit': {
      cards = upsertLocalCard(cards, { cardId: action.cardId, text: action.text });
      const card = cards.get(action.cardId);
      if (!card) break;
      effects.push({ kind: 'paint', card });
      if (action.sync !== false) {
        effects.push({ kind: 'broadcast', op: 'edit', card });
      }
      effects.push({ kind: 'status' });
      break;
    }
    case 'recolor': {
      const existing = cards.get(action.cardId);
      if (!existing || existing.color === action.color) break;
      cards = upsertLocalCard(cards, { cardId: action.cardId, color: action.color });
      const card = cards.get(action.cardId);
      if (!card) break;
      effects.push({ kind: 'paint', card });
      if (action.sync !== false) {
        effects.push({ kind: 'broadcast', op: 'edit', card });
      }
      effects.push({ kind: 'status' });
      break;
    }
    case 'arrange': {
      const originY = typeof action.originY === 'number' ? action.originY : undefined;
      const laid =
        originY != null
          ? layoutCardsInGridAtOrigin(cardsToArray(cards), getBoardWidth(), originY)
          : layoutCardsInGrid(cardsToArray(cards), getBoardWidth());
      for (const next of laid) {
        cards = upsertLocalCard(cards, {
          cardId: next.cardId,
          x: next.x,
          y: next.y,
          updatedAt: next.updatedAt,
        });
        const card = cards.get(next.cardId);
        if (!card) continue;
        effects.push({ kind: 'paint', card });
        if (action.sync !== false) {
          effects.push({ kind: 'broadcast', op: 'move', card });
        }
      }
      resyncCachedMaxBottom();
      invalidateOccupiedGrid();
      effects.push({ kind: 'status' });
      break;
    }
    case 'restore-snapshot': {
      const nextMap = new Map();
      for (const c of action.cards) {
        nextMap.set(c.cardId, { ...c });
      }
      for (const id of [...cardGroups.keys()]) {
        if (!nextMap.has(id)) effects.push({ kind: 'unpaint', cardId: id });
      }
      cards = nextMap;
      for (const card of cards.values()) {
        effects.push({ kind: 'paint', card });
        if (action.sync !== false) {
          effects.push({ kind: 'broadcast', op: 'move', card });
        }
      }
      if (selectedCardId && !cards.has(selectedCardId)) selectedCardId = '';
      resyncCachedMaxBottom();
      invalidateOccupiedGrid();
      effects.push({ kind: 'status' });
      break;
    }
    case 'delete': {
      const victim = cards.get(action.cardId);
      const prevBottom = victim ? cardBottom(victim) : 0;
      const prevX = victim?.x;
      const prevY = victim?.y;
      const wasSticky = victim ? isStickyKind(victim) : false;
      const result = removeLocalCard(cards, tombstones, action.cardId);
      cards = result.cards;
      tombstones = result.tombstones;
      noteMaxBottomChange(prevBottom);
      if (wasSticky) noteOccupiedGridChange(getBoardWidth(), prevX, prevY);
      effects.push({ kind: 'unpaint', cardId: action.cardId });
      if (action.sync !== false) {
        effects.push({
          kind: 'broadcast-delete',
          payload: { cardId: action.cardId, updatedAt: result.deletedAt },
        });
      }
      effects.push({ kind: 'status' });
      break;
    }
    case 'remote-card': {
      observeRemoteCard(action.card);
      const prev = cards.get(action.card.cardId);
      const prevBottom = prev ? cardBottom(prev) : 0;
      const { changed, card } = mergeRemoteCardToMap(action.card);
      if (changed && card) {
        if (prev) {
          noteMaxBottomChange(prevBottom, cardBottom(card));
          if (isStickyKind(prev) || isStickyKind(card)) {
            noteOccupiedGridChange(
              getBoardWidth(),
              isStickyKind(prev) ? prev.x : undefined,
              isStickyKind(prev) ? prev.y : undefined,
              isStickyKind(card) ? card.x : undefined,
              isStickyKind(card) ? card.y : undefined,
            );
          }
        } else {
          bumpCachedMaxBottom(cardBottom(card));
          if (isStickyKind(card)) {
            noteOccupiedGridChange(getBoardWidth(), undefined, undefined, card.x, card.y);
          }
        }
        effects.push({ kind: 'paint', card });
      }
      effects.push({ kind: 'status' });
      break;
    }
    case 'remote-delete': {
      observeRemoteCardDelete(action.payload);
      const victim = cards.get(action.payload.cardId);
      const prevBottom = victim ? cardBottom(victim) : 0;
      if (!mergeRemoteDeleteToMap(action.payload)) break;
      noteMaxBottomChange(prevBottom);
      if (victim && isStickyKind(victim)) {
        noteOccupiedGridChange(getBoardWidth(), victim.x, victim.y);
      }
      effects.push({ kind: 'unpaint', cardId: action.payload.cardId });
      effects.push({ kind: 'status' });
      break;
    }
    case 'clear': {
      for (const cardId of [...cardGroups.keys()]) {
        effects.push({ kind: 'unpaint', cardId });
      }
      cards = new Map();
      tombstones = new Map();
      selectedCardId = '';
      cachedMaxBottom = 0;
      invalidateOccupiedGrid();
      undoStack = [];
      redoStack = [];
      clearAutosaveStorage();
      effects.push({ kind: 'status' });
      break;
    }
    default:
      break;
  }

  applyBoardEffects(effects);

  if (action.type !== 'clear' && !restoringBoard) {
    scheduleAutosave();
  }
}

/**
 * 通信ブリッジ — createRoomSession との接続点（盤面・Konva はここを知らない）
 * @param {ReturnType<typeof createRoomSession>} session
 */
function attachSyncBroadcast(session) {
  syncBroadcast = (effect) => {
    if (session.getState() !== 'connected') return;
    if (effect.kind === 'broadcast-delete') {
      session.sendCardDelete(effect.payload);
      return;
    }
    const { op, card } = effect;
    if (op === 'add') session.sendCardAdd(card);
    else if (op === 'move') session.sendCardMove(card);
    else if (op === 'edit') session.sendCardEdit(card);
    else if (op === 'delete') session.sendCardDelete({ cardId: card.cardId, updatedAt: card.updatedAt });
  };
}

function detachSyncBroadcast() {
  syncBroadcast = null;
}

// --- Undo / Redo · localStorage · Export（同期と独立 · boardDispatch 正本） ---

/**
 * @param {BoardAction} action
 * @returns {HistoryEntry | null}
 */
function buildHistoryEntry(action) {
  switch (action.type) {
    case 'add':
      return {
        undo: { type: 'delete', cardId: action.card.cardId },
        redo: { type: 'add', card: { ...action.card } },
      };
    case 'delete': {
      const card = cards.get(action.cardId);
      if (!card) return null;
      return {
        undo: { type: 'add', card: { ...card } },
        redo: { type: 'delete', cardId: action.cardId },
      };
    }
    case 'move': {
      const prev = cards.get(action.cardId);
      if (!prev) return null;
      return {
        undo: { type: 'move', cardId: action.cardId, x: prev.x, y: prev.y },
        redo: { type: 'move', cardId: action.cardId, x: action.x, y: action.y },
      };
    }
    case 'edit': {
      const prev = cards.get(action.cardId);
      if (!prev) return null;
      return {
        undo: { type: 'edit', cardId: action.cardId, text: prev.text },
        redo: { type: 'edit', cardId: action.cardId, text: action.text },
      };
    }
    case 'recolor': {
      const prev = cards.get(action.cardId);
      if (!prev || prev.color === action.color) return null;
      return {
        undo: { type: 'recolor', cardId: action.cardId, color: prev.color },
        redo: { type: 'recolor', cardId: action.cardId, color: action.color },
      };
    }
    case 'arrange': {
      if (cards.size === 0) return null;
      const before = cardsToArray(cards).map((c) => ({ ...c }));
      const originY = typeof action.originY === 'number' ? action.originY : undefined;
      const after =
        originY != null
          ? layoutCardsInGridAtOrigin(before, getBoardWidth(), originY)
          : layoutCardsInGrid(before, getBoardWidth());
      return {
        undo: { type: 'restore-snapshot', cards: before },
        redo: { type: 'restore-snapshot', cards: after },
      };
    }
    default:
      return null;
  }
}

function undoBoard() {
  if (isBoardLocked() || undoStack.length === 0) return;
  const entry = undoStack.pop();
  redoStack.push(entry);
  boardDispatch(entry.undo, { fromHistory: true });
}

function redoBoard() {
  if (isBoardLocked() || redoStack.length === 0) return;
  const entry = redoStack.pop();
  undoStack.push(entry);
  boardDispatch(entry.redo, { fromHistory: true });
}

function scheduleAutosave() {
  if (restoringBoard || connState === 'expired') return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    persistBoardToStorage();
  }, AUTOSAVE_DEBOUNCE_MS);
}

function persistBoardToStorage() {
  try {
    const payload = buildAutosavePayload(cards, tombstones, selectedColor);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
  } catch {
    /* quota · private mode */
  }
}

function clearAutosaveStorage() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    /* ignore */
  }
}

function restoreBoardFromSnapshot(
  /** @type {Map<string, import('./sticky-room-sync.js').StickyCard>} */ nextCards,
  /** @type {Map<string, number>} */ nextTombstones,
  color,
) {
  restoringBoard = true;
  for (const cardId of [...cardGroups.keys()]) {
    unpaintCardFromStage(cardId);
  }
  cards = nextCards;
  tombstones = nextTombstones;
  selectedColor = color;
  selectedCardId = '';
  resyncCachedMaxBottom();
  invalidateOccupiedGrid();
  for (const card of cards.values()) {
    paintCardOnStage(card);
  }
  undoStack = [];
  redoStack = [];
  restoringBoard = false;
  refreshBoardStatus();
  updateToolbarButtons();
  updateColorChips();
  ensureStageFitsContent();
}

function loadAutosaveFromStorage() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return false;
    const parsed = parseAutosavePayload(JSON.parse(raw));
    if (!parsed) return false;
    restoreBoardFromSnapshot(parsed.cards, parsed.tombstones, parsed.selectedColor);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} filename
 * @param {string} text
 * @param {string} mime
 */
function downloadTextFile(filename, text, mime = 'application/octet-stream') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  triggerCopyFlash();
}

/** @type {Konva.Stage | null} */
let stage = null;

/** @type {Konva.Layer | null} */
let layer = null;

/** @type {ReturnType<typeof createRoomSession> | null} */
let roomSession = null;

/** @type {import('./sticky-room-sync.js').RoomConnState} */
let connState = 'idle';

/** @type {boolean} */
let cryptoReady = false;

/** v1 限定 — 同期ログ（v2 で SYNC_LOG_V1 = false または削除） */
const SYNC_LOG_V1 = true;

/**
 * @param {'card'|'delete'} kind
 * @param {unknown} payload
 */
function logSyncReceived(kind, payload) {
  if (!SYNC_LOG_V1) return;
  console.log('[sticky-room sync] received', kind, payload);
}

/**
 * @param {'card'|'delete'} kind
 * @param {unknown} payload
 * @param {Record<string, unknown>} [meta]
 */
function logSyncMerged(kind, payload, meta) {
  if (!SYNC_LOG_V1) return;
  console.log('[sticky-room sync] merged', kind, payload, meta ?? '');
}

/**
 * @param {'card'|'delete'} kind
 * @param {unknown} payload
 * @param {Record<string, unknown>} reason
 */
function logSyncIgnored(kind, payload, reason) {
  if (!SYNC_LOG_V1) return;
  console.log('[sticky-room sync] ignored (LWW)', kind, payload, reason);
}

const CONN_LABELS = {
  idle: '未接続',
  hosting: 'ホスト待機',
  joining: '参加中',
  connecting: '接続中…',
  connected: '接続済み',
  'ice-failed': 'ICE 失敗',
  reconnecting: '再接続中…',
  expired: '期限切れ',
  'host-ended': 'ホスト終了',
  'join-ended': '参加者退出',
};

/** @type {Record<string, { title: string, body: string }>} */
const DISCONNECT_COPY = {
  'host-ended': {
    title: 'ホストがルームを終了しました',
    body: '同期は切れました。付箋はこの端末に残ります。1人でも編集を続けられます。',
  },
  'join-ended': {
    title: '参加者が退出しました',
    body: 'ホストとして待機を続けます。別の参加者が参加 URL から入れます。',
  },
  'ice-failed': {
    title: '接続に失敗しました',
    body: 'Wi-Fi 切断 · タブ複製 · ファイアウォールなどが原因のことがあります（TURN 未対応 · v1）。',
  },
  expired: {
    title: 'ルームの有効期限が切れました',
    body: '付箋と鍵は破棄されました。新しいルームをホストしてください。',
  },
};

const els = {
  board: /** @type {HTMLElement | null} */ (null),
  status: /** @type {HTMLElement | null} */ (null),
  addBtn: /** @type {HTMLButtonElement | null} */ (null),
  addStickyBtn: /** @type {HTMLButtonElement | null} */ (null),
  addHeadingBtn: /** @type {HTMLButtonElement | null} */ (null),
  addWrap: /** @type {HTMLDetailsElement | null} */ (null),
  deleteBtn: /** @type {HTMLButtonElement | null} */ (null),
  arrangeBtn: /** @type {HTMLButtonElement | null} */ (null),
  fitViewBtn: /** @type {HTMLButtonElement | null} */ (null),
  arrangeWrap: /** @type {HTMLDetailsElement | null} */ (null),
  colorBar: /** @type {HTMLElement | null} */ (null),
  lobby: /** @type {HTMLElement | null} */ (null),
  soloBar: /** @type {HTMLElement | null} */ (null),
  connPanel: /** @type {HTMLElement | null} */ (null),
  connState: /** @type {HTMLElement | null} */ (null),
  connStats: /** @type {HTMLElement | null} */ (null),
  connError: /** @type {HTMLElement | null} */ (null),
  hostBtn: /** @type {HTMLButtonElement | null} */ (null),
  joinBtn: /** @type {HTMLButtonElement | null} */ (null),
  joinInput: /** @type {HTMLInputElement | null} */ (null),
  reconnectBtn: /** @type {HTMLButtonElement | null} */ (null),
  roomLink: /** @type {HTMLElement | null} */ (null),
  pingBtn: /** @type {HTMLButtonElement | null} */ (null),
  pingResult: /** @type {HTMLElement | null} */ (null),
  cryptoBadge: /** @type {HTMLElement | null} */ (null),
  ttlBadge: /** @type {HTMLElement | null} */ (null),
  ttlExpired: /** @type {HTMLElement | null} */ (null),
  disconnectBanner: /** @type {HTMLElement | null} */ (null),
  disconnectTitle: /** @type {HTMLElement | null} */ (null),
  disconnectBody: /** @type {HTMLElement | null} */ (null),
  disconnectActions: /** @type {HTMLElement | null} */ (null),
  leaveBtn: /** @type {HTMLButtonElement | null} */ (null),
  copyWrap: /** @type {HTMLDetailsElement | null} */ (null),
  copySelectedBtn: /** @type {HTMLButtonElement | null} */ (null),
  copyAllBtn: /** @type {HTMLButtonElement | null} */ (null),
  copyToast: /** @type {HTMLElement | null} */ (null),
  undoBtn: /** @type {HTMLButtonElement | null} */ (null),
  redoBtn: /** @type {HTMLButtonElement | null} */ (null),
  exportWrap: /** @type {HTMLDetailsElement | null} */ (null),
  exportJsonBtn: /** @type {HTMLButtonElement | null} */ (null),
  exportMdBtn: /** @type {HTMLButtonElement | null} */ (null),
  exportTsvBtn: /** @type {HTMLButtonElement | null} */ (null),
  importJsonBtn: /** @type {HTMLButtonElement | null} */ (null),
  importFile: /** @type {HTMLInputElement | null} */ (null),
};

function setStatus(text) {
  if (els.status) els.status.textContent = text;
}

function isBoardLocked() {
  return connState === 'expired';
}

function updateTtlDisplay(remainingMs) {
  if (!els.ttlBadge) return;
  if (!remainingMs && connState !== 'expired') {
    els.ttlBadge.classList.add('hidden');
    return;
  }
  els.ttlBadge.textContent =
    connState === 'expired'
      ? '残り 0:00'
      : `残り ${formatTtlRemaining(remainingMs)}`;
  els.ttlBadge.classList.remove('hidden');
  els.ttlBadge.dataset.state = remainingMs <= 5 * 60 * 1000 ? 'warn' : 'ok';
}

function clearBoard() {
  boardDispatch({ type: 'clear' });
}

function setBoardLocked(locked) {
  if (els.addStickyBtn) els.addStickyBtn.disabled = locked;
  if (els.addHeadingBtn) els.addHeadingBtn.disabled = locked;
  if (els.addWrap) els.addWrap.classList.toggle('sticky-room-menu-disabled', locked);
  if (els.deleteBtn && locked) els.deleteBtn.disabled = true;
  if (els.arrangeBtn && locked) els.arrangeBtn.disabled = true;
  if (els.fitViewBtn && locked) els.fitViewBtn.disabled = true;
  if (els.colorBar) {
    els.colorBar.querySelectorAll('button').forEach((btn) => {
      btn.disabled = locked;
    });
  }
  updateToolbarButtons();
  for (const group of cardGroups.values()) {
    group.draggable(!locked);
    group.listening(!locked);
  }
  layer?.batchDraw();
}

function isDisconnectState() {
  return (
    connState === 'host-ended' ||
    connState === 'join-ended' ||
    connState === 'ice-failed' ||
    connState === 'expired'
  );
}

function clearDisconnectBanner() {
  if (els.disconnectBanner) {
    els.disconnectBanner.classList.add('hidden');
    els.disconnectBanner.dataset.reason = '';
  }
  if (els.disconnectActions) els.disconnectActions.innerHTML = '';
  if (els.connError) {
    els.connError.classList.add('hidden');
    els.connError.textContent = '';
  }
  if (els.ttlExpired) els.ttlExpired.classList.add('hidden');
}

/**
 * @param {string} [detail]
 */
function renderDisconnectBanner(detail) {
  if (!els.disconnectBanner || !isDisconnectState()) {
    clearDisconnectBanner();
    return;
  }
  const reason = connState;
  const copy = DISCONNECT_COPY[reason];
  if (!copy) return;

  els.disconnectBanner.dataset.reason = reason;
  if (els.disconnectTitle) {
    els.disconnectTitle.textContent = copy.title;
  }
  if (els.disconnectBody) {
    els.disconnectBody.textContent = detail || copy.body;
  }
  if (els.disconnectActions) {
    els.disconnectActions.innerHTML = '';
    const addBtn = (label, className, onClick) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sticky-room-disconnect-btn ${className}`;
      btn.textContent = label;
      btn.addEventListener('click', onClick);
      els.disconnectActions?.appendChild(btn);
    };

    if (reason === 'host-ended') {
      addBtn('1人で続ける', 'sticky-room-disconnect-btn-primary', () => dismissDisconnectToSolo());
      addBtn('ルームから出る', 'sticky-room-disconnect-btn-secondary', () => void leaveRoomAndReset());
    } else if (reason === 'join-ended') {
      addBtn('了解', 'sticky-room-disconnect-btn-primary', () => void dismissJoinEndedUi());
    } else if (reason === 'ice-failed') {
      addBtn('再接続', 'sticky-room-disconnect-btn-primary', () => void roomSession?.manualReconnect());
      addBtn('ルームから出る', 'sticky-room-disconnect-btn-secondary', () => void leaveRoomAndReset());
    } else if (reason === 'expired') {
      addBtn('新しいルームを作る', 'sticky-room-disconnect-btn-primary', () => {
        clearDisconnectBanner();
        roomSession = null;
        connState = 'idle';
        cryptoReady = false;
        updateConnUi();
        void startHost();
      });
    }
  }
  els.disconnectBanner.classList.remove('hidden');
}

function dismissDisconnectToSolo() {
  clearDisconnectBanner();
  connState = 'idle';
  detachSyncBroadcast();
  roomSession = null;
  if (els.connPanel) els.connPanel.classList.add('hidden');
  if (els.soloBar) els.soloBar.classList.remove('hidden');
  window.history.replaceState(null, '', window.location.pathname);
  refreshBoardStatus();
  updateConnUi();
}

async function dismissJoinEndedUi() {
  clearDisconnectBanner();
  await roomSession?.dismissJoinEnded();
  connState = roomSession?.getState() ?? 'hosting';
  updateConnUi();
}

async function leaveRoomAndReset() {
  await roomSession?.leaveRoom();
  detachSyncBroadcast();
  roomSession = null;
  connState = 'idle';
  cryptoReady = false;
  clearDisconnectBanner();
  window.history.replaceState(null, '', window.location.pathname);
  updateConnUi();
}

function handleRoomExpired() {
  clearBoard();
  setBoardLocked(true);
  updateTtlDisplay(0);
  renderDisconnectBanner();
  if (els.roomLink) els.roomLink.classList.add('hidden');
  if (window.location.hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
  roomSession = null;
  detachSyncBroadcast();
}

function updateConnUi(detail) {
  if (els.connState) {
    els.connState.textContent = CONN_LABELS[connState] || connState;
    els.connState.dataset.state = connState;
  }
  if (els.reconnectBtn) {
    const show = connState === 'reconnecting';
    els.reconnectBtn.classList.toggle('hidden', !show);
  }
  if (els.leaveBtn) {
    const showLeave =
      connState === 'hosting' ||
      connState === 'joining' ||
      connState === 'connecting' ||
      connState === 'connected' ||
      connState === 'reconnecting';
    els.leaveBtn.classList.toggle('hidden', !showLeave);
  }
  if (els.pingBtn) {
    els.pingBtn.classList.toggle('hidden', connState !== 'connected');
    els.pingBtn.disabled = connState !== 'connected';
  }
  if (els.ttlExpired) {
    els.ttlExpired.classList.add('hidden');
  }
  renderDisconnectBanner(detail);
  setBoardLocked(isBoardLocked());
  if (els.cryptoBadge) {
    els.cryptoBadge.textContent = cryptoReady ? 'E2E 暗号化 ON' : 'E2E 未設定';
    els.cryptoBadge.dataset.state = cryptoReady ? 'on' : 'off';
    els.cryptoBadge.classList.toggle('hidden', connState === 'idle');
  }
  if (els.soloBar) {
    const showSolo = connState === 'idle';
    els.soloBar.classList.toggle('hidden', !showSolo);
  }
  if (els.connPanel) {
    const showConn = connState !== 'idle';
    els.connPanel.classList.toggle('hidden', !showConn);
  }
  if (els.connError) {
    els.connError.classList.add('hidden');
  }
  refreshBoardStatus();
}

function refreshBoardStatus() {
  const stickies = cardsToArray(cards).filter(isStickyKind).length;
  const headings = cards.size - stickies;
  const parts = [`付箋 ${stickies} 枚`];
  if (headings > 0) parts.push(`見出し ${headings}`);
  const cardPart = parts.join(' · ');
  if (connState === 'idle') {
    setStatus(cardPart);
    return;
  }
  const syncPart =
    connState === 'expired'
      ? ' · ルーム期限切れ'
      : connState === 'host-ended'
        ? ' · 同期オフ'
        : connState === 'join-ended'
          ? ' · 参加者退出'
          : connState === 'ice-failed'
            ? ' · 接続失敗'
            : connState === 'connected'
              ? cryptoReady
                ? ' · 同期中（E2E）'
                : ' · 同期中'
              : connState === 'hosting'
                ? ' · 参加待ち'
                : connState === 'joining' || connState === 'connecting'
                  ? ' · 接続中…'
                  : connState === 'reconnecting'
                    ? ' · 再接続中…'
                    : '';
  setStatus(`${cardPart}${syncPart}`);
}

function updateRoomLink(roomId, role) {
  if (!els.roomLink || !roomId) return;
  const origin = window.location.origin + window.location.pathname;
  const hash = window.location.hash || '';
  const joinUrl = `${origin}${buildRoomUrl(roomId, 'join')}${hash}`;
  els.roomLink.innerHTML = role === 'host'
    ? `参加用 URL（鍵付き）: <a href="${joinUrl}" class="underline text-violet-800 break-all">${joinUrl}</a>`
    : `ルーム ID: <code class="text-xs">${roomId}</code>${cryptoReady ? ' · 鍵 OK' : ''}`;
  els.roomLink.classList.remove('hidden');
}

async function ensureSession() {
  if (roomSession) return roomSession;
  roomSession = createRoomSession({
    onStateChange: (state, detail) => {
      connState = state;
      updateConnUi(detail);
    },
    onStatsChange: (stats) => {
      if (els.connStats) els.connStats.textContent = formatConnStats(stats);
    },
    onCardRemote: (remoteCard) => {
      boardDispatch({ type: 'remote-card', card: remoteCard });
    },
    onCardDelete: (payload) => {
      boardDispatch({ type: 'remote-delete', payload });
    },
    onCryptoReady: (ready) => {
      cryptoReady = ready;
      updateConnUi();
    },
    onTtlChange: () => {
      updateTtlDisplay(roomSession?.getTtlRemainingMs() ?? 0);
    },
    onTtlTick: (remainingMs) => {
      updateTtlDisplay(remainingMs);
    },
    onTtlExpired: () => {
      handleRoomExpired();
      updateConnUi('ルームの有効期限が切れました');
    },
  });
  attachSyncBroadcast(roomSession);
  window.addEventListener('beforeunload', () => {
    void roomSession?.leaveRoom();
  });
  return roomSession;
}

async function startHost() {
  const session = await ensureSession();
  const roomId = createRoomId();
  try {
    await session.startHost(roomId);
    updateRoomLink(roomId, 'host');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    connState = 'ice-failed';
    updateConnUi(msg);
  }
}

async function startJoin(roomId) {
  const id = roomId.trim();
  if (!id) return;
  const session = await ensureSession();
  try {
    await session.startJoin(id);
    updateRoomLink(id, 'join');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    connState = 'ice-failed';
    updateConnUi(msg);
  }
}

async function runPingTest() {
  if (!roomSession || connState !== 'connected') return;
  if (els.pingBtn) {
    els.pingBtn.disabled = true;
    els.pingBtn.textContent = 'Ping 送信中…';
  }
  if (els.pingResult) {
    els.pingResult.textContent = '';
    els.pingResult.classList.remove('hidden', 'sticky-room-ping-ok', 'sticky-room-ping-fail');
  }
  try {
    const result = await roomSession.runPingTest(100);
    if (els.pingResult) {
      els.pingResult.textContent = result.ok
        ? `Gate 2 OK — ${result.received}/${result.sent} pong`
        : `Gate 2 FAIL — ${result.received}/${result.sent} pong`;
      els.pingResult.classList.add(result.ok ? 'sticky-room-ping-ok' : 'sticky-room-ping-fail');
      els.pingResult.classList.remove('hidden');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (els.pingResult) {
      els.pingResult.textContent = `Gate 2 FAIL — ${msg}`;
      els.pingResult.classList.add('sticky-room-ping-fail');
      els.pingResult.classList.remove('hidden');
    }
  } finally {
    if (els.pingBtn) {
      els.pingBtn.disabled = connState !== 'connected';
      els.pingBtn.textContent = 'Ping 100回テスト';
    }
  }
}

async function tryAutoJoinFromUrl() {
  const { roomId, role } = parseRoomUrl(window.location.search);
  if (!roomId) return;
  if (role === 'host') {
    const session = await ensureSession();
    try {
      await session.startHost(roomId);
      updateRoomLink(roomId, 'host');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      connState = 'ice-failed';
      updateConnUi(msg);
    }
    return;
  }
  await startJoin(roomId);
}

function getBoardWidth() {
  const wrap = els.board?.parentElement;
  return wrap?.clientWidth || window.innerWidth || 800;
}

/**
 * 盤面ポリシー: 横幅 = 画面幅固定 · 高さ = cachedMaxBottom から算出（パン/ズームなし）
 */
function getBoardSize() {
  const width = getBoardWidth();
  const height = stageHeightFromMaxBottom(cachedMaxBottom);
  return { width, height };
}

/** @param {number} bottom */
function bumpCachedMaxBottom(bottom) {
  if (bottom > cachedMaxBottom) cachedMaxBottom = bottom;
}

function resyncCachedMaxBottom() {
  cachedMaxBottom = computeMaxBottom(cards);
}

/**
 * @param {number} prevBottom
 * @param {number} [nextBottom]
 */
function noteMaxBottomChange(prevBottom, nextBottom) {
  const result = updateCachedMaxBottom(cachedMaxBottom, prevBottom, nextBottom);
  if (result.needsRescan) {
    resyncCachedMaxBottom();
    return;
  }
  cachedMaxBottom = result.maxBottom;
}

function invalidateOccupiedGrid() {
  occupiedGridSlots = null;
  occupiedGridWidth = 0;
  freeGridHint = 0;
}

/**
 * @param {number} width
 * @returns {Set<number>}
 */
function ensureOccupiedGrid(width) {
  if (!occupiedGridSlots || occupiedGridWidth !== width) {
    occupiedGridSlots = buildOccupiedGridSet(cards, width);
    occupiedGridWidth = width;
    freeGridHint = findFreeGridIndexFromSet(occupiedGridSlots, 0);
  }
  return occupiedGridSlots;
}

/**
 * @param {number} width
 * @returns {{ x: number, y: number, index: number }}
 */
function claimFreeGridSlot(width) {
  const set = ensureOccupiedGrid(width);
  const found = findFreeGridSlot(cards, width, set, freeGridHint);
  set.add(found.index);
  freeGridHint = found.index + 1;
  return found;
}

/**
 * @param {number} width
 * @param {number} [prevX]
 * @param {number} [prevY]
 * @param {number} [nextX]
 * @param {number} [nextY]
 */
function noteOccupiedGridChange(width, prevX, prevY, nextX, nextY) {
  if (!occupiedGridSlots || occupiedGridWidth !== width) return;
  if (prevX != null && prevY != null) {
    const prevIdx = xyToGridIndex(prevX, prevY, width);
    if (prevIdx != null) {
      occupiedGridSlots.delete(prevIdx);
      if (prevIdx < freeGridHint) freeGridHint = prevIdx;
    }
  }
  if (nextX != null && nextY != null) {
    const nextIdx = xyToGridIndex(nextX, nextY, width);
    if (nextIdx != null) occupiedGridSlots.add(nextIdx);
  }
}

/**
 * Stage / #sticky-room-board の高さを内容に合わせて更新
 * @param {{ scrollIntoView?: boolean }} [opts]
 */
function ensureStageFitsContent(opts = {}) {
  if (!stage || !els.board) return;
  const width = getBoardWidth();
  if (occupiedGridWidth && occupiedGridWidth !== width) {
    invalidateOccupiedGrid();
  }
  const height = stageHeightFromMaxBottom(cachedMaxBottom);
  const prevH = stage.height();
  stage.width(width);
  stage.height(height);
  els.board.style.height = `${height}px`;
  stage.batchDraw();
  if (opts.scrollIntoView && height > prevH) {
    const wrap = els.board.parentElement;
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
  }
}

function updateDeleteButton() {
  if (!els.deleteBtn) return;
  const hasSelection = Boolean(selectedCardId && cards.has(selectedCardId));
  els.deleteBtn.disabled = !hasSelection;
}

function updateArrangeButton() {
  const stickyCount = cardsToArray(cards).filter(isStickyKind).length;
  const emptyOrLocked = isBoardLocked() || stickyCount === 0;
  if (els.arrangeBtn) els.arrangeBtn.disabled = emptyOrLocked;
  if (els.fitViewBtn) els.fitViewBtn.disabled = emptyOrLocked;
  if (els.arrangeWrap) {
    els.arrangeWrap.classList.toggle('sticky-room-menu-disabled', emptyOrLocked);
  }
}

function updateToolbarButtons() {
  updateDeleteButton();
  updateArrangeButton();
  updateCopyMenu();
  updateExportMenu();
  updateUndoRedoButtons();
  updateColorChips();
}

function updateUndoRedoButtons() {
  const locked = isBoardLocked();
  if (els.undoBtn) els.undoBtn.disabled = locked || undoStack.length === 0;
  if (els.redoBtn) els.redoBtn.disabled = locked || redoStack.length === 0;
}

function updateExportMenu() {
  const hasCards = cards.size > 0;
  const locked = isBoardLocked();
  if (els.exportJsonBtn) els.exportJsonBtn.disabled = !hasCards || locked;
  if (els.exportMdBtn) els.exportMdBtn.disabled = !hasCards || locked;
  if (els.exportTsvBtn) els.exportTsvBtn.disabled = !hasCards || locked;
  if (els.importJsonBtn) els.importJsonBtn.disabled = locked;
}

/**
 * 色チップのハイライト対象（選択中は対象オブジェクトの色 · 未選択は新規 sticky 用）
 */
function getActiveChipColor() {
  if (selectedCardId && cards.has(selectedCardId)) {
    const card = cards.get(selectedCardId);
    if (!card) return selectedColor;
    return card.color;
  }
  return selectedColor;
}

function updateColorChips() {
  if (!els.colorBar) return;
  const selected = selectedCardId ? cards.get(selectedCardId) : null;
  const selectingHeading = Boolean(selected && isHeadingCard(selected));
  const palette = selectingHeading ? HEADING_COLORS : STICKY_COLORS;
  const active = selectingHeading
    ? selected?.color ?? selectedHeadingColor
    : getActiveChipColor();

  els.colorBar.setAttribute(
    'aria-label',
    selectingHeading ? '選択中の見出しの色' : selected ? '選択中の付箋の色' : '新規付箋の色',
  );

  // DECISION: heading 選択時だけ黒/グレーチップに切替（装飾は増やさない）
  const existing = [...els.colorBar.querySelectorAll('.sticky-room-color-chip')];
  const existingKeys = existing.map((el) => /** @type {HTMLElement} */ (el).dataset.color);
  const needsRebuild =
    existingKeys.length !== palette.length || palette.some((c, i) => existingKeys[i] !== c);
  if (needsRebuild) {
    els.colorBar.innerHTML = '';
    for (const color of palette) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sticky-room-color-chip';
      btn.dataset.color = color;
      const hex = selectingHeading
        ? HEADING_COLOR_HEX[color] || HEADING_COLOR_HEX.black
        : STICKY_COLOR_HEX[color] || STICKY_COLOR_HEX.yellow;
      btn.style.backgroundColor = hex;
      btn.title = color;
      btn.setAttribute('aria-label', `色: ${color}`);
      btn.setAttribute('aria-pressed', String(color === active));
      btn.addEventListener('click', () => {
        applyColorChip(color);
      });
      els.colorBar.appendChild(btn);
    }
    return;
  }

  els.colorBar.querySelectorAll('.sticky-room-color-chip').forEach((el) => {
    const btn = /** @type {HTMLButtonElement} */ (el);
    btn.setAttribute('aria-pressed', String(btn.dataset.color === active));
  });
}

/**
 * @param {string} color
 */
function applyColorChip(color) {
  if (isBoardLocked()) return;
  const selected = selectedCardId ? cards.get(selectedCardId) : null;
  if (selected && isHeadingCard(selected)) {
    if (!HEADING_COLORS.includes(color)) return;
    boardDispatch({ type: 'recolor', cardId: selected.cardId, color });
    selectedHeadingColor = color;
    return;
  }
  if (!STICKY_COLORS.includes(color)) return;
  if (selected) {
    boardDispatch({ type: 'recolor', cardId: selected.cardId, color });
    return;
  }
  selectedColor = color;
  updateColorChips();
}

/**
 * 盤面上の並び（上→下 · 左→右）で付箋を並べる
 * @returns {import('./sticky-room-sync.js').StickyCard[]}
 */
function getCardsSortedForCopy() {
  return cardsToArray(cards).sort((a, b) => a.y - b.y || a.x - b.x || a.cardId.localeCompare(b.cardId));
}

/**
 * @param {import('./sticky-room-sync.js').StickyCard} card
 */
function formatStickyCardPlainText(card) {
  const t = String(card.text ?? '');
  return isHeadingCard(card) ? `【${t}】` : t;
}

/**
 * @param {import('./sticky-room-sync.js').StickyCard[]} list
 */
function formatStickyCardsPlainText(list) {
  return list.map(formatStickyCardPlainText).join('\n');
}

/**
 * @param {string} text
 * @param {HTMLButtonElement | null} buttonEl
 * @param {{ toastPrefix?: string }} [options]
 */
async function copyStickyPayload(text, buttonEl, options = {}) {
  const payload = String(text ?? '');
  if (!payload) {
    try {
      await navigator.clipboard.writeText('');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = '';
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    triggerCopyFlash();
    if (buttonEl) {
      markCopyButtonDone(buttonEl, { copiedLabel: 'コピーしました', fallbackLabel: buttonEl.textContent || 'コピー' });
    }
    if (els.copyToast) {
      els.copyToast.hidden = false;
      els.copyToast.className = 'sticky-room-copy-toast sg-copy-toast text-[11px] leading-relaxed rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2';
      els.copyToast.innerHTML =
        '<strong class="text-emerald-800">クリップボードを更新しました。</strong> 空の付箋（0 文字）';
    }
    return;
  }
  await copyWithFeedback(payload, buttonEl, {
    copiedLabel: 'コピーしました',
    toastEl: els.copyToast,
    toastPrefix: options.toastPrefix ?? '付箋',
    lineCount: payload.split('\n').length,
  });
}

function updateCopyMenu() {
  const hasSelection = Boolean(selectedCardId && cards.has(selectedCardId));
  const hasCards = cards.size > 0;
  if (els.copySelectedBtn) els.copySelectedBtn.disabled = !hasSelection;
  if (els.copyAllBtn) els.copyAllBtn.disabled = !hasCards;
}

function closeCopyMenu() {
  if (els.copyWrap) els.copyWrap.open = false;
}

function closeExportMenu() {
  if (els.exportWrap) els.exportWrap.open = false;
}

async function copySelectedSticky() {
  const card = selectedCardId ? cards.get(selectedCardId) : null;
  if (!card) return;
  closeCopyMenu();
  await copyStickyPayload(formatStickyCardPlainText(card), els.copySelectedBtn, { toastPrefix: '選択付箋' });
}

async function copyAllStickies() {
  if (cards.size === 0) return;
  closeCopyMenu();
  const payload = formatStickyCardsPlainText(getCardsSortedForCopy());
  await copyStickyPayload(payload, els.copyAllBtn, { toastPrefix: `全付箋 ${cards.size} 枚` });
}

function bindCopyMenu() {
  els.copySelectedBtn?.addEventListener('click', () => {
    void copySelectedSticky();
  });
  els.copyAllBtn?.addEventListener('click', () => {
    void copyAllStickies();
  });
  document.addEventListener('click', (e) => {
    const target = /** @type {Node | null} */ (e.target);
    if (els.copyWrap?.open && target && !els.copyWrap.contains(target)) {
      closeCopyMenu();
    }
    if (els.exportWrap?.open && target && !els.exportWrap.contains(target)) {
      closeExportMenu();
    }
  });
}

function exportBoardJson() {
  if (cards.size === 0) return;
  closeExportMenu();
  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(`sticky-room-${stamp}.json`, formatBoardJson(cards), 'application/json');
  if (els.exportJsonBtn) {
    markCopyButtonDone(els.exportJsonBtn, { copiedLabel: '保存しました', fallbackLabel: 'JSON をダウンロード' });
  }
}

async function exportBoardMarkdown() {
  if (cards.size === 0) return;
  closeExportMenu();
  await copyStickyPayload(formatBoardMarkdown(cards), els.exportMdBtn, { toastPrefix: 'Markdown' });
}

async function exportBoardTsv() {
  if (cards.size === 0) return;
  closeExportMenu();
  await copyStickyPayload(formatBoardTsv(cards), els.exportTsvBtn, { toastPrefix: 'TSV' });
}

/**
 * @param {string} raw
 * @returns {boolean}
 */
function importBoardFromJsonText(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    window.alert('JSON の形式が正しくありません');
    return false;
  }
  const parsed = parseBoardImportJson(data);
  if (!parsed || parsed.cards.size === 0) {
    window.alert('読み込める付箋がありません（Export の JSON を選んでください）');
    return false;
  }
  if (cards.size > 0) {
    const ok = window.confirm(
      `現在の付箋 ${cards.size} 枚を破棄し、${parsed.cards.size} 枚を読み込みます。よろしいですか？`,
    );
    if (!ok) return false;
  }
  restoreBoardFromSnapshot(parsed.cards, parsed.tombstones, parsed.selectedColor);
  ensureStageFitsContent();
  scheduleAutosave();
  triggerCopyFlash();
  if (els.copyToast) {
    els.copyToast.hidden = false;
    els.copyToast.className =
      'sticky-room-copy-toast sg-copy-toast text-[11px] leading-relaxed rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2';
    els.copyToast.innerHTML = `<strong class="text-emerald-800">読み込みました。</strong> 付箋 ${parsed.cards.size} 枚`;
  }
  return true;
}

function openImportFilePicker() {
  if (isBoardLocked()) return;
  closeExportMenu();
  els.importFile?.click();
}

function bindExportMenu() {
  els.exportJsonBtn?.addEventListener('click', () => {
    exportBoardJson();
  });
  els.importJsonBtn?.addEventListener('click', () => {
    openImportFilePicker();
  });
  els.importFile?.addEventListener('change', () => {
    const file = els.importFile?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      importBoardFromJsonText(text);
      if (els.importFile) els.importFile.value = '';
    };
    reader.onerror = () => {
      window.alert('ファイルを読めませんでした');
      if (els.importFile) els.importFile.value = '';
    };
    reader.readAsText(file, 'utf-8');
  });
  els.exportMdBtn?.addEventListener('click', () => {
    void exportBoardMarkdown();
  });
  els.exportTsvBtn?.addEventListener('click', () => {
    void exportBoardTsv();
  });
}

function bindUndoRedo() {
  els.undoBtn?.addEventListener('click', () => {
    undoBoard();
  });
  els.redoBtn?.addEventListener('click', () => {
    redoBoard();
  });
}

function setSelectedCard(cardId) {
  const prevGroup = selectedCardId ? cardGroups.get(selectedCardId) : null;
  if (prevGroup) {
    const prevRect = prevGroup.findOne('.sticky-card-rect');
    if (prevRect && 'stroke' in prevRect) {
      const prevCard = cards.get(selectedCardId);
      if (prevCard && isHeadingCard(prevCard)) {
        prevRect.stroke('transparent');
        prevRect.strokeWidth(0);
      } else {
        prevRect.stroke('#cbd5e1');
        prevRect.strokeWidth(1);
      }
    }
  }

  selectedCardId = cardId && cards.has(cardId) ? cardId : '';

  if (selectedCardId) {
    const group = cardGroups.get(selectedCardId);
    const rect = group?.findOne('.sticky-card-rect');
    if (rect && 'stroke' in rect) {
      rect.stroke('#6366f1');
      rect.strokeWidth(2);
    }
  }

  updateToolbarButtons();
  layer?.batchDraw();
}

function removeCardFromStage(cardId) {
  const group = cardGroups.get(cardId);
  if (group) {
    group.destroy();
    cardGroups.delete(cardId);
    layer?.batchDraw();
  }
}

// --- リモート受信パイプライン（WebRTC/JSON は sync 層 · ここは 3 段に分離） ---

/**
 * 段階 1 — 受信観測（v1 同期ログ: received）
 * @param {import('./sticky-room-sync.js').StickyCard} remoteCard
 */
function observeRemoteCard(remoteCard) {
  logSyncReceived('card', remoteCard);
}

/**
 * 段階 2 — Map 更新のみ（merged / ignored をログ）
 * @param {import('./sticky-room-sync.js').StickyCard} remoteCard
 * @returns {{ changed: boolean, card: import('./sticky-room-sync.js').StickyCard | null }}
 */
function mergeRemoteCardToMap(remoteCard) {
  const tombAt = tombstones.get(remoteCard.cardId) || 0;
  if (remoteCard.updatedAt <= tombAt) {
    logSyncIgnored('card', remoteCard, { reason: 'tombstone', tombAt });
    return { changed: false, card: null };
  }
  const prev = cards.get(remoteCard.cardId);
  if (prev && !shouldApplyRemote(prev, remoteCard)) {
    logSyncIgnored('card', remoteCard, {
      reason: 'lww',
      localUpdatedAt: prev.updatedAt,
      remoteUpdatedAt: remoteCard.updatedAt,
    });
    return { changed: false, card: null };
  }
  cards = applyRemoteCard(cards, remoteCard, tombstones);
  const applied = cards.get(remoteCard.cardId) ?? null;
  if (applied) {
    logSyncMerged('card', applied, { hadLocal: Boolean(prev) });
  }
  return { changed: Boolean(applied), card: applied };
}

/** @param {import('./sticky-room-sync.js').CardDelete} payload */
function observeRemoteCardDelete(payload) {
  logSyncReceived('delete', payload);
}

/**
 * @param {import('./sticky-room-sync.js').CardDelete} payload
 * @returns {boolean}
 */
function mergeRemoteDeleteToMap(payload) {
  const prevTomb = tombstones.get(payload.cardId) || 0;
  if (payload.updatedAt <= prevTomb) {
    logSyncIgnored('delete', payload, { reason: 'tombstone', tombAt: prevTomb });
    return false;
  }
  const local = cards.get(payload.cardId);
  if (!shouldApplyRemoteDelete(local, payload.updatedAt)) {
    logSyncIgnored('delete', payload, {
      reason: 'lww',
      localUpdatedAt: local?.updatedAt ?? null,
      remoteUpdatedAt: payload.updatedAt,
    });
    return false;
  }
  const result = applyRemoteCardDelete(cards, tombstones, payload);
  if (!result.applied) return false;
  cards = result.cards;
  tombstones = result.tombstones;
  logSyncMerged('delete', payload, { hadLocal: Boolean(local) });
  return true;
}

/**
 * @param {string} cardId
 */
function unpaintCardFromStage(cardId) {
  removeCardFromStage(cardId);
  if (selectedCardId === cardId) {
    setSelectedCard('');
  }
}

/**
 * 段階 3 — Map の内容を Konva に反映（cards Map は読むだけ）
 * @param {import('./sticky-room-sync.js').StickyCard} card
 */
function paintCardOnStage(card) {
  if (!layer) return;
  const group = cardGroups.get(card.cardId);
  if (!group || group.getAttr('cardKind') !== (card.kind === 'heading' ? 'heading' : 'sticky')) {
    renderCard(card);
    return;
  }
  group.position({ x: card.x, y: card.y });
  const textNode = group.findOne('.sticky-card-text');
  if (textNode && 'text' in textNode) {
    if (isHeadingCard(card)) {
      textNode.text(card.text || '見出し');
      textNode.fill(HEADING_COLOR_HEX[card.color] || HEADING_COLOR_HEX.black);
      const hit = group.findOne('.sticky-card-rect');
      if (hit && 'width' in hit) {
        const tw = typeof textNode.getTextWidth === 'function' ? textNode.getTextWidth() : HEADING_MIN_WIDTH;
        hit.width(Math.max(HEADING_MIN_WIDTH, tw + 8));
      }
    } else {
      textNode.text(card.text || 'ダブルクリックで編集');
    }
  }
  if (!isHeadingCard(card)) {
    const rect = group.findOne('.sticky-card-rect');
    if (rect && 'fill' in rect) {
      rect.fill(STICKY_COLOR_HEX[card.color] || STICKY_COLOR_HEX.yellow);
    }
  }
  layer.batchDraw();
}

// --- 盤面描画（Konva）— 通信を知らない · boardDispatch からだけ呼ぶ ---

/**
 * @param {import('./sticky-room-sync.js').StickyCard} card
 */
function buildHeadingGroup(card) {
  const fill = HEADING_COLOR_HEX[card.color] || HEADING_COLOR_HEX.black;
  const group = new Konva.Group({
    x: card.x,
    y: card.y,
    draggable: true,
    id: card.cardId,
    cardKind: 'heading',
  });

  const text = new Konva.Text({
    name: 'sticky-card-text',
    x: 4,
    y: 6,
    text: card.text || '見出し',
    fontSize: HEADING_FONT_SIZE,
    fontStyle: 'bold',
    fontFamily: 'system-ui, sans-serif',
    fill,
    listening: false,
  });

  const hitW = Math.max(HEADING_MIN_WIDTH, text.getTextWidth() + 8);
  // DECISION: 見た目はテキストのみ。透明 Rect は選択・ドラッグ用ヒット領域
  const hit = new Konva.Rect({
    name: 'sticky-card-rect',
    width: hitW,
    height: HEADING_HEIGHT,
    fill: 'rgba(0,0,0,0.001)',
    stroke: 'transparent',
    strokeWidth: 0,
  });

  group.add(hit);
  group.add(text);

  group.on('click tap', (e) => {
    e.cancelBubble = true;
    setSelectedCard(card.cardId);
  });

  group.on('dragend', () => {
    boardDispatch({
      type: 'move',
      cardId: card.cardId,
      x: Math.round(group.x()),
      y: Math.round(group.y()),
    });
  });

  group.on('dblclick dbltap', () => {
    const current = cards.get(card.cardId);
    const next = window.prompt('見出し', current?.text || '');
    if (next === null) return;
    boardDispatch({ type: 'edit', cardId: card.cardId, text: next.trim() || '見出し' });
  });

  return group;
}

/**
 * @param {import('./sticky-room-sync.js').StickyCard} card
 */
function buildStickyGroup(card) {
  const hex = STICKY_COLOR_HEX[card.color] || STICKY_COLOR_HEX.yellow;
  const group = new Konva.Group({
    x: card.x,
    y: card.y,
    draggable: true,
    id: card.cardId,
    cardKind: 'sticky',
  });

  const rect = new Konva.Rect({
    name: 'sticky-card-rect',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fill: hex,
    stroke: '#cbd5e1',
    strokeWidth: 1,
    cornerRadius: 4,
    shadowColor: 'rgba(15,23,42,0.12)',
    shadowBlur: 6,
    shadowOffset: { x: 0, y: 2 },
    shadowOpacity: 0.8,
  });

  const text = new Konva.Text({
    name: 'sticky-card-text',
    x: 10,
    y: 10,
    width: CARD_WIDTH - 20,
    height: CARD_HEIGHT - 20,
    text: card.text || 'ダブルクリックで編集',
    fontSize: 14,
    fontFamily: 'system-ui, sans-serif',
    fill: '#1e293b',
    wrap: 'word',
    listening: false,
  });

  group.add(rect);
  group.add(text);

  group.on('click tap', (e) => {
    e.cancelBubble = true;
    setSelectedCard(card.cardId);
  });

  group.on('dragend', () => {
    boardDispatch({
      type: 'move',
      cardId: card.cardId,
      x: Math.round(group.x()),
      y: Math.round(group.y()),
    });
  });

  group.on('dblclick dbltap', () => {
    const current = cards.get(card.cardId);
    const next = window.prompt('付箋のテキスト', current?.text || '');
    if (next === null) return;
    boardDispatch({ type: 'edit', cardId: card.cardId, text: next });
  });

  return group;
}

/**
 * @param {import('./sticky-room-sync.js').StickyCard} card
 */
function buildCardGroup(card) {
  return isHeadingCard(card) ? buildHeadingGroup(card) : buildStickyGroup(card);
}

/**
 * @param {import('./sticky-room-sync.js').StickyCard} card
 */
function renderCard(card) {
  if (!layer) return;
  const existing = cardGroups.get(card.cardId);
  if (existing) {
    existing.destroy();
    cardGroups.delete(card.cardId);
  }
  const group = buildCardGroup(card);
  cardGroups.set(card.cardId, group);
  layer.add(group);
  layer.batchDraw();
}

function resizeStage() {
  ensureStageFitsContent();
}

function addCardAtFreeSlot() {
  if (isBoardLocked()) return;
  closeAddMenu();
  const pos = claimFreeGridSlot(getBoardWidth());
  const card = createCard({
    x: pos.x,
    y: pos.y,
    color: selectedColor,
    text: '',
    kind: 'sticky',
  });
  boardDispatch({ type: 'add', card });
  ensureStageFitsContent({ scrollIntoView: true });
}

function addHeadingNearView() {
  if (isBoardLocked()) return;
  closeAddMenu();
  const scrollTop = getBoardScrollTop();
  const card = createHeading({
    x: 24,
    y: Math.max(16, Math.round(scrollTop) + 24),
    color: selectedHeadingColor,
    text: '見出し',
  });
  boardDispatch({ type: 'add', card });
  ensureStageFitsContent();
  setSelectedCard(card.cardId);
}

function closeAddMenu() {
  if (els.addWrap) els.addWrap.open = false;
}

function bindAddMenu() {
  els.addStickyBtn?.addEventListener('click', addCardAtFreeSlot);
  els.addHeadingBtn?.addEventListener('click', addHeadingNearView);
  document.addEventListener('click', (e) => {
    if (!els.addWrap?.open) return;
    const target = /** @type {Node | null} */ (e.target);
    if (target && els.addWrap.contains(target)) return;
    closeAddMenu();
  });
}

function closeArrangeMenu() {
  if (els.arrangeWrap) els.arrangeWrap.open = false;
}

function getBoardScrollTop() {
  const wrap = els.board?.parentElement;
  return wrap?.scrollTop ?? 0;
}

function arrangeBoard() {
  if (isBoardLocked() || cardsToArray(cards).filter(isStickyKind).length === 0) return;
  closeArrangeMenu();
  boardDispatch({ type: 'arrange' });
  ensureStageFitsContent();
  const wrap = els.board?.parentElement;
  if (wrap) wrap.scrollTop = 0;
}

/** いま見えている範囲の上端へグリッド詰め（散らばった付箋を一発で戻す） */
function fitCardsToView() {
  if (isBoardLocked() || cardsToArray(cards).filter(isStickyKind).length === 0) return;
  closeArrangeMenu();
  const scrollTop = getBoardScrollTop();
  boardDispatch({ type: 'arrange', originY: scrollTop });
  ensureStageFitsContent();
  const wrap = els.board?.parentElement;
  if (wrap) wrap.scrollTop = scrollTop;
}

function bindArrangeMenu() {
  els.arrangeBtn?.addEventListener('click', () => {
    arrangeBoard();
  });
  els.fitViewBtn?.addEventListener('click', () => {
    fitCardsToView();
  });
  document.addEventListener('click', (e) => {
    if (!els.arrangeWrap?.open) return;
    const target = /** @type {Node | null} */ (e.target);
    if (target && els.arrangeWrap.contains(target)) return;
    closeArrangeMenu();
  });
}

function deleteSelectedCard() {
  if (isBoardLocked()) return;
  if (!selectedCardId || !cards.has(selectedCardId)) return;
  boardDispatch({ type: 'delete', cardId: selectedCardId });
}

function bindColorChips() {
  if (!els.colorBar) return;
  els.colorBar.innerHTML = '';
  for (const color of STICKY_COLORS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sticky-room-color-chip';
    btn.dataset.color = color;
    btn.style.backgroundColor = STICKY_COLOR_HEX[color];
    btn.title = color;
    btn.setAttribute('aria-label', `色: ${color}`);
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      applyColorChip(color);
    });
    els.colorBar.appendChild(btn);
  }
  updateColorChips();
}

function initStage() {
  if (!els.board) return;
  const { width, height } = getBoardSize();
  els.board.style.height = `${height}px`;

  stage = new Konva.Stage({
    container: 'sticky-room-board',
    width,
    height,
  });
  layer = new Konva.Layer();
  stage.add(layer);

  stage.on('click tap', (e) => {
    if (e.target === stage) {
      setSelectedCard('');
    }
  });

  window.addEventListener('resize', resizeStage);
  window.addEventListener('keydown', (e) => {
    const tag = /** @type {HTMLElement} */ (e.target).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undoBoard();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redoBoard();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCardId) {
      e.preventDefault();
      deleteSelectedCard();
    }
  });
}

function bindLobby() {
  els.hostBtn?.addEventListener('click', () => {
    startHost();
  });

  els.joinBtn?.addEventListener('click', () => {
    startJoin(els.joinInput?.value || '');
  });

  els.reconnectBtn?.addEventListener('click', async () => {
    await roomSession?.manualReconnect();
  });

  els.pingBtn?.addEventListener('click', () => {
    runPingTest();
  });

  els.leaveBtn?.addEventListener('click', () => {
    void leaveRoomAndReset();
  });
}

// --- P2 ストレステスト（?stress=1 · ?stress=auto · window.__stickyRoomStress） ---

const STRESS_QUERY =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const STRESS_MODE = Boolean(STRESS_QUERY?.has('stress'));

/**
 * @param {number[]} values
 * @param {number} p
 */
function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function parseStressCounts() {
  const raw = STRESS_QUERY?.get('counts');
  if (!raw) return [100, 200, 500];
  const parsed = raw
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return parsed.length > 0 ? parsed : [100, 200, 500];
}

function getMemorySnapshot() {
  const mem = performance.memory;
  if (!mem) {
    return { available: false, usedMb: null, totalMb: null };
  }
  return {
    available: true,
    usedMb: Math.round((mem.usedJSHeapSize / 1048576) * 10) / 10,
    totalMb: Math.round((mem.totalJSHeapSize / 1048576) * 10) / 10,
  };
}

function clearBoardForStress() {
  boardDispatch({ type: 'clear' });
}

/**
 * @param {number} count
 */
function spawnStressCards(count) {
  const wasRestoring = restoringBoard;
  restoringBoard = true;
  const width = getBoardWidth();
  const t0 = performance.now();
  let next = new Map(cards);
  const occupied = buildOccupiedGridSet(next, width);
  let hint = findFreeGridIndexFromSet(occupied, 0);
  /** @type {import('./sticky-room-sync.js').StickyCard[]} */
  const toPaint = [];
  for (let i = 0; i < count; i += 1) {
    const found = findFreeGridSlot(next, width, occupied, hint);
    occupied.add(found.index);
    hint = found.index + 1;
    const card = createCard({
      x: found.x,
      y: found.y,
      color: STICKY_COLORS[i % STICKY_COLORS.length],
      text: `S${i + 1}`,
    });
    next = upsertLocalCard(next, card);
    toPaint.push(card);
  }
  cards = next;
  resyncCachedMaxBottom();
  occupiedGridSlots = occupied;
  occupiedGridWidth = width;
  freeGridHint = hint;
  for (const card of toPaint) {
    paintCardOnStage(card);
  }
  restoringBoard = wasRestoring;
  ensureStageFitsContent();
  refreshBoardStatus();
  updateToolbarButtons();
  scheduleAutosave();
  return { count: cards.size, spawnMs: Math.round(performance.now() - t0) };
}

/**
 * @param {number} [sampleMs]
 */
function measureIdleFps(sampleMs = 1500) {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    const tick = (now) => {
      frames += 1;
      layer?.batchDraw();
      if (now - start >= sampleMs) {
        const durationMs = now - start;
        resolve({
          fps: Math.round((frames / durationMs) * 1000 * 10) / 10,
          frames,
          durationMs: Math.round(durationMs),
        });
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/**
 * @param {number} [dragFrames]
 */
async function measureDragStress(dragFrames = 90) {
  const list = getCardsSortedForCopy();
  if (list.length === 0 || !layer) {
    return null;
  }
  const target = list[Math.floor(list.length / 2)];
  const group = cardGroups.get(target.cardId);
  if (!group) return null;

  const frameMs = [];
  const start = performance.now();
  for (let i = 0; i < dragFrames; i += 1) {
    const t0 = performance.now();
    const nx = Math.round(target.x + Math.sin(i * 0.22) * 72);
    const ny = Math.round(target.y + Math.cos(i * 0.17) * 56);
    group.position({ x: nx, y: ny });
    layer.batchDraw();
    frameMs.push(performance.now() - t0);
    await new Promise((r) => requestAnimationFrame(r));
  }
  boardDispatch(
    {
      type: 'move',
      cardId: target.cardId,
      x: Math.round(group.x()),
      y: Math.round(group.y()),
      sync: false,
    },
    { skipHistory: true },
  );

  const durationMs = performance.now() - start;
  const avg = frameMs.reduce((a, b) => a + b, 0) / frameMs.length;
  return {
    dragFps: Math.round((dragFrames / durationMs) * 1000 * 10) / 10,
    frameMsAvg: Math.round(avg * 100) / 100,
    frameMsP95: Math.round(percentile(frameMs, 95) * 100) / 100,
    durationMs: Math.round(durationMs),
    frames: dragFrames,
  };
}

/**
 * @param {number} cardCount
 */
async function runStressCase(cardCount) {
  clearBoardForStress();
  const spawn = spawnStressCards(cardCount);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const memory = getMemorySnapshot();
  const idleFps = await measureIdleFps(1500);
  const drag = await measureDragStress(90);
  return {
    cardCount,
    spawnMs: spawn.spawnMs,
    cardsOnBoard: spawn.count,
    memory,
    idleFps,
    drag,
  };
}

/**
 * @param {number[]} [counts]
 */
async function runStressSuite(counts = [100, 200, 500]) {
  /** @type {Awaited<ReturnType<typeof runStressCase>>[]} */
  const results = [];
  for (const n of counts) {
    const row = await runStressCase(n);
    results.push(row);
    console.log('[sticky-room stress]', n, row);
  }
  return results;
}

/**
 * @param {Awaited<ReturnType<typeof runStressCase>>} row
 */
function formatStressRow(row) {
  const drag = row.drag;
  const mem = row.memory.available ? `${row.memory.usedMb}` : 'n/a';
  return [
    String(row.cardCount).padStart(4),
    String(row.spawnMs).padStart(7),
    String(row.idleFps.fps).padStart(8),
    drag ? String(drag.dragFps).padStart(8) : '     n/a',
    drag ? String(drag.frameMsP95).padStart(11) : '        n/a',
    mem.padStart(8),
  ].join(' | ');
}

/**
 * @param {Awaited<ReturnType<typeof runStressCase>>[]} results
 */
function printStressTable(results) {
  const header = ['枚数', 'spawn ms', 'idle FPS', 'drag FPS', 'drag p95 ms', 'heap MB'].join(' | ');
  const rule = '-'.repeat(header.length);
  const lines = [header, rule, ...results.map(formatStressRow)];
  console.log(`\n[sticky-room stress]\n${lines.join('\n')}\n`);
  return lines.join('\n');
}

function installStressHarness() {
  document.body.classList.add('sticky-room-stress-mode');
  if (els.soloBar) els.soloBar.classList.add('hidden');

  const panel = document.createElement('aside');
  panel.className = 'sticky-room-stress-panel';
  panel.setAttribute('aria-label', 'ストレステスト');
  panel.innerHTML = `
<h2>Stress (P2)</h2>
<p>100 / 200 / 500 枚 · FPS · Drag · Memory</p>
<div class="sticky-room-stress-actions">
  <button type="button" data-stress-count="100">100枚</button>
  <button type="button" data-stress-count="200">200枚</button>
  <button type="button" data-stress-count="500">500枚</button>
  <button type="button" data-stress-suite="1">一式実行</button>
</div>
<pre id="sticky-room-stress-out">待機中…</pre>`;
  document.body.appendChild(panel);

  const out = /** @type {HTMLPreElement} */ (panel.querySelector('#sticky-room-stress-out'));

  const api = {
    runStressCase,
    runStressSuite,
    spawnStressCards,
    measureIdleFps,
    measureDragStress,
    getMemorySnapshot,
    clearBoardForStress,
    printStressTable,
  };
  window.__stickyRoomStress = api;

  panel.querySelectorAll('[data-stress-count]').forEach((btn) => {
    btn.addEventListener('click', () => {
      void (async () => {
        const n = Number(btn.getAttribute('data-stress-count'));
        out.textContent = `計測中… ${n}枚`;
        const row = await runStressCase(n);
        out.textContent = formatStressRow(row);
      })();
    });
  });
  panel.querySelector('[data-stress-suite]')?.addEventListener('click', () => {
    void (async () => {
      out.textContent = '一式計測中…';
      const results = await runStressSuite([100, 200, 500]);
      out.textContent = printStressTable(results);
      window.__stickyRoomStressResults = results;
    })();
  });
}

async function init() {
  els.board = document.getElementById('sticky-room-board');
  els.status = document.getElementById('sticky-room-status');
  els.addWrap = /** @type {HTMLDetailsElement | null} */ (document.getElementById('sticky-room-add-wrap'));
  els.addStickyBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-add'));
  els.addHeadingBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-add-heading'));
  els.addBtn = els.addStickyBtn;
  els.deleteBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-delete'));
  els.arrangeBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-arrange'));
  els.fitViewBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-fit-view'));
  els.arrangeWrap = /** @type {HTMLDetailsElement | null} */ (document.getElementById('sticky-room-arrange-wrap'));
  els.colorBar = document.getElementById('sticky-room-colors');
  els.soloBar = document.getElementById('sticky-room-solo-bar');
  els.lobby = els.soloBar;
  els.connPanel = document.getElementById('sticky-room-conn');
  els.connState = document.getElementById('sticky-room-conn-state');
  els.connStats = document.getElementById('sticky-room-conn-stats');
  els.connError = document.getElementById('sticky-room-conn-error');
  els.hostBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-host'));
  els.joinBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-join'));
  els.joinInput = /** @type {HTMLInputElement | null} */ (document.getElementById('sticky-room-join-id'));
  els.reconnectBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-reconnect'));
  els.roomLink = document.getElementById('sticky-room-room-link');
  els.pingBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-ping-test'));
  els.pingResult = document.getElementById('sticky-room-ping-result');
  els.cryptoBadge = document.getElementById('sticky-room-crypto-badge');
  els.ttlBadge = document.getElementById('sticky-room-ttl');
  els.ttlExpired = document.getElementById('sticky-room-ttl-expired');
  els.disconnectBanner = document.getElementById('sticky-room-disconnect');
  els.disconnectTitle = document.getElementById('sticky-room-disconnect-title');
  els.disconnectBody = document.getElementById('sticky-room-disconnect-body');
  els.disconnectActions = document.getElementById('sticky-room-disconnect-actions');
  els.leaveBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-leave'));
  els.copyWrap = /** @type {HTMLDetailsElement | null} */ (document.getElementById('sticky-room-copy-wrap'));
  els.copySelectedBtn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById('sticky-room-copy-selected')
  );
  els.copyAllBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-copy-all'));
  els.copyToast = document.getElementById('sticky-room-copy-toast');
  els.undoBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-undo'));
  els.redoBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-redo'));
  els.exportWrap = /** @type {HTMLDetailsElement | null} */ (document.getElementById('sticky-room-export-wrap'));
  els.exportJsonBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-export-json'));
  els.exportMdBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-export-md'));
  els.exportTsvBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-export-tsv'));
  els.importJsonBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('sticky-room-import-json'));
  els.importFile = /** @type {HTMLInputElement | null} */ (document.getElementById('sticky-room-import-file'));

  bindColorChips();
  bindLobby();
  bindCopyMenu();
  bindExportMenu();
  bindAddMenu();
  bindArrangeMenu();
  bindUndoRedo();
  initStage();
  if (!STRESS_MODE) {
    loadAutosaveFromStorage();
  }

  els.deleteBtn?.addEventListener('click', deleteSelectedCard);

  updateToolbarButtons();
  updateConnUi();

  if (STRESS_MODE) {
    installStressHarness();
    if (STRESS_QUERY?.get('stress') === 'auto') {
      window.__stickyRoomStressResults = await runStressSuite(parseStressCounts());
      printStressTable(window.__stickyRoomStressResults);
    }
    return;
  }

  await tryAutoJoinFromUrl();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
} else {
  init();
}
