/**
 * sticky-room-sync.js — 付箋ルーム LWW 同期ロジック（Phase 0: 単機 · Phase 2+: WebRTC）
 */
import {
  clearRoomCrypto,
  decryptWireString,
  encryptWireString,
  fragmentToKey,
  generateRoomKey,
  initRoomCrypto,
  isCryptoReady,
  keyToFragment,
} from './sticky-room-crypto.js';

/**
 * DECISION: 盤上は sticky + heading の 2 種のみ（ドロー/自由テキスト禁止 · REFERENCE §オブジェクト種）
 * kind 省略は sticky（既存 JSON / 同期互換）
 * @typedef {'sticky' | 'heading'} CardKind
 * @typedef {{ cardId: string, kind?: CardKind, x: number, y: number, text: string, color: string, updatedAt: number }} StickyCard
 */

export const STICKY_COLORS = ['yellow', 'pink', 'blue', 'green'];
export const HEADING_COLORS = ['black', 'gray'];

/** @type {Record<string, string>} */
export const STICKY_COLOR_HEX = {
  yellow: '#fef08a',
  pink: '#fbcfe8',
  blue: '#bfdbfe',
  green: '#bbf7d0',
};

/** @type {Record<string, string>} */
export const HEADING_COLOR_HEX = {
  black: '#0f172a',
  gray: '#64748b',
};

export const CARD_WIDTH = 160;
export const CARD_HEIGHT = 140;
/** heading のヒット / Stage 下端計算用（見た目はテキストのみ） */
export const HEADING_FONT_SIZE = 20;
export const HEADING_HEIGHT = 36;
export const HEADING_MIN_WIDTH = 120;

/** 盤面ポリシー — 横幅固定 · 縦のみ自動拡張 · パン/ズームなし */
export const BOARD_PAD = 16;
export const GRID_GAP = 12;
export const STAGE_BOTTOM_PAD = 48;
export const MIN_STAGE_HEIGHT = 280;

/**
 * @param {number} boardWidth
 */
export function getGridCols(boardWidth) {
  return Math.max(1, Math.floor((boardWidth - BOARD_PAD * 2 + GRID_GAP) / (CARD_WIDTH + GRID_GAP)));
}

/**
 * @param {number} index
 * @param {number} boardWidth
 * @returns {{ x: number, y: number }}
 */
export function gridSlotToXY(index, boardWidth) {
  const cols = getGridCols(boardWidth);
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: BOARD_PAD + col * (CARD_WIDTH + GRID_GAP),
    y: BOARD_PAD + row * (CARD_HEIGHT + GRID_GAP),
  };
}

/**
 * グリッドに載っているとみなすセル index（ずれは近傍へ丸め）
 * @param {number} x
 * @param {number} y
 * @param {number} boardWidth
 * @returns {number | null}
 */
export function xyToGridIndex(x, y, boardWidth) {
  const cols = getGridCols(boardWidth);
  const col = Math.round((x - BOARD_PAD) / (CARD_WIDTH + GRID_GAP));
  const row = Math.round((y - BOARD_PAD) / (CARD_HEIGHT + GRID_GAP));
  if (col < 0 || row < 0 || col >= cols) return null;
  const snapped = gridSlotToXY(row * cols + col, boardWidth);
  if (Math.abs(snapped.x - x) > CARD_WIDTH / 2 || Math.abs(snapped.y - y) > CARD_HEIGHT / 2) {
    return null;
  }
  return row * cols + col;
}

/**
 * @param {StickyCard} card
 * @returns {CardKind}
 */
export function getCardKind(card) {
  return card.kind === 'heading' ? 'heading' : 'sticky';
}

/**
 * @param {StickyCard} card
 */
export function isHeadingCard(card) {
  return getCardKind(card) === 'heading';
}

/**
 * @param {StickyCard} card
 */
export function isStickyKind(card) {
  return getCardKind(card) === 'sticky';
}

/**
 * @param {StickyCard} card
 */
export function cardVisualHeight(card) {
  return isHeadingCard(card) ? HEADING_HEIGHT : CARD_HEIGHT;
}

/**
 * @param {StickyCard} card
 */
export function cardBottom(card) {
  return card.y + cardVisualHeight(card);
}

export function buildOccupiedGridSet(cards, boardWidth) {
  const list = cards instanceof Map ? cards.values() : cards;
  const occupied = new Set();
  for (const c of list) {
    // DECISION: heading はグリッド占有しない（整列・空き枠は sticky 専用）
    if (!isStickyKind(c)) continue;
    const idx = xyToGridIndex(c.x, c.y, boardWidth);
    if (idx != null) occupied.add(idx);
  }
  return occupied;
}

/**
 * Set 上の最初の空き index（O(空き位置) · has は O(1)）
 * @param {Set<number>} occupied
 * @param {number} [startHint]
 */
export function findFreeGridIndexFromSet(occupied, startHint = 0) {
  let i = Math.max(0, startHint);
  while (occupied.has(i)) i += 1;
  return i;
}

/**
 * 空きグリッドへ配置（上→左優先 · 重ね置きは手動ドラッグのみ）
 * `occupied` を渡すと再構築せず再利用（連続追加は O(1) amortized · 呼び出し側が add する）。
 * @param {Map<string, StickyCard> | Iterable<StickyCard>} cards
 * @param {number} boardWidth
 * @param {Set<number>} [occupied]
 * @param {number} [startHint]
 * @returns {{ x: number, y: number, index: number, occupied: Set<number> }}
 */
export function findFreeGridSlot(cards, boardWidth, occupied, startHint = 0) {
  const set = occupied ?? buildOccupiedGridSet(cards, boardWidth);
  const index = findFreeGridIndexFromSet(set, startHint);
  return { ...gridSlotToXY(index, boardWidth), index, occupied: set };
}

/**
 * 整列 — 既存の読み順（上→下 · 左→右）を保って詰める
 * @param {StickyCard[]} cardList
 * @param {number} boardWidth
 * @param {number} [now]
 * @returns {StickyCard[]}
 */
export function layoutCardsInGrid(cardList, boardWidth, now = Date.now()) {
  return layoutCardsInGridAtOrigin(cardList, boardWidth, BOARD_PAD, now);
}

/**
 * 指定 Y を原点にグリッド詰め（「画面に収める」用 · originY はスクロール位置から）
 * @param {StickyCard[]} cardList
 * @param {number} boardWidth
 * @param {number} originY
 * @param {number} [now]
 * @returns {StickyCard[]}
 */
export function layoutCardsInGridAtOrigin(cardList, boardWidth, originY, now = Date.now()) {
  const snappedY = snapOriginYToGrid(originY);
  // DECISION: 整列は sticky のみ。heading は分類ラベルとして位置を維持する
  const sorted = cardList
    .filter(isStickyKind)
    .sort((a, b) => a.y - b.y || a.x - b.x || a.cardId.localeCompare(b.cardId));
  return sorted.map((c, i) => {
    const pos = gridSlotToXY(i, boardWidth);
    return {
      ...c,
      kind: 'sticky',
      x: pos.x,
      y: snappedY + (pos.y - BOARD_PAD),
      updatedAt: now,
    };
  });
}

/**
 * スクロール位置をグリッド行の上端に丸める
 * @param {number} y
 */
export function snapOriginYToGrid(y) {
  if (y <= BOARD_PAD) return BOARD_PAD;
  const row = Math.round((y - BOARD_PAD) / (CARD_HEIGHT + GRID_GAP));
  return BOARD_PAD + Math.max(0, row) * (CARD_HEIGHT + GRID_GAP);
}

/**
 * Stage 高さ = max(最小, 最下付箋 + 余白)
 * @param {Map<string, StickyCard> | Iterable<StickyCard>} cards
 * @param {number} [minHeight]
 */
export function computeStageHeight(cards, minHeight = MIN_STAGE_HEIGHT) {
  return stageHeightFromMaxBottom(computeMaxBottom(cards), minHeight);
}

/**
 * @param {Map<string, StickyCard> | Iterable<StickyCard>} cards
 * @returns {number} max(card.y + CARD_HEIGHT); 空なら 0
 */
export function computeMaxBottom(cards) {
  const list = cards instanceof Map ? cards.values() : cards;
  let maxBottom = 0;
  for (const c of list) {
    maxBottom = Math.max(maxBottom, cardBottom(c));
  }
  return maxBottom;
}

/**
 * @param {number} maxBottom
 * @param {number} [minHeight]
 */
export function stageHeightFromMaxBottom(maxBottom, minHeight = MIN_STAGE_HEIGHT) {
  if (maxBottom <= 0) return minHeight;
  return Math.max(minHeight, maxBottom + STAGE_BOTTOM_PAD);
}

/**
 * 追加・下方向移動は O(1)。最下端カードが上へ動いた / 消えたときだけ呼び出し側でフル再計算。
 * @param {number} cachedMaxBottom
 * @param {number} prevBottom card.y + CARD_HEIGHT（移動前 · 削除時）
 * @param {number} [nextBottom] 移動後。削除なら省略
 * @returns {{ maxBottom: number, needsRescan: boolean }}
 */
export function updateCachedMaxBottom(cachedMaxBottom, prevBottom, nextBottom) {
  if (nextBottom != null) {
    if (nextBottom >= cachedMaxBottom) {
      return { maxBottom: nextBottom, needsRescan: false };
    }
    if (prevBottom >= cachedMaxBottom) {
      return { maxBottom: cachedMaxBottom, needsRescan: true };
    }
    return { maxBottom: cachedMaxBottom, needsRescan: false };
  }
  if (prevBottom >= cachedMaxBottom) {
    return { maxBottom: cachedMaxBottom, needsRescan: true };
  }
  return { maxBottom: cachedMaxBottom, needsRescan: false };
}

export function createCardId() {
  return crypto.randomUUID();
}

/**
 * @param {Partial<StickyCard>} [partial]
 * @returns {StickyCard}
 */
export function createCard(partial = {}) {
  const now = Date.now();
  const kind = partial.kind === 'heading' ? 'heading' : 'sticky';
  const defaultColor = kind === 'heading' ? 'black' : 'yellow';
  const color = partial.color ?? defaultColor;
  return {
    cardId: partial.cardId ?? createCardId(),
    kind,
    x: partial.x ?? 80,
    y: partial.y ?? 80,
    text: partial.text ?? (kind === 'heading' ? '見出し' : ''),
    color: kind === 'heading' && !HEADING_COLORS.includes(color) ? 'black' : color,
    updatedAt: partial.updatedAt ?? now,
  };
}

/**
 * @param {Partial<StickyCard>} [partial]
 * @returns {StickyCard}
 */
export function createHeading(partial = {}) {
  return createCard({ ...partial, kind: 'heading' });
}

/**
 * DECISION: LWW by client `updatedAt` (ms). Clock skew is accepted in v1 (spec §7-2).
 * @param {StickyCard | undefined} local
 * @param {StickyCard} remote
 */
export function shouldApplyRemote(local, remote) {
  if (!local) return true;
  return remote.updatedAt > local.updatedAt;
}

/**
 * @param {Map<string, StickyCard>} cards
 * @param {StickyCard} remote
 * @param {Map<string, number>} [tombstones] cardId → delete updatedAt
 * @returns {Map<string, StickyCard>}
 */
export function applyRemoteCard(cards, remote, tombstones = new Map()) {
  const tombAt = tombstones.get(remote.cardId) || 0;
  if (remote.updatedAt <= tombAt) return cards;
  const next = new Map(cards);
  const local = next.get(remote.cardId);
  if (shouldApplyRemote(local, remote)) {
    next.set(remote.cardId, { ...remote });
    // DECISION: 生存 LWW が tombstone より新しければ復活 — tombstone を外す
    if (remote.updatedAt > tombAt) {
      tombstones.delete(remote.cardId);
    }
  }
  return next;
}

/** @typedef {{ cardId: string, updatedAt: number }} CardDelete */

/**
 * @param {unknown} payload
 * @returns {payload is CardDelete}
 */
export function isValidCardDelete(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const p = /** @type {CardDelete} */ (payload);
  return typeof p.cardId === 'string' && typeof p.updatedAt === 'number';
}

/**
 * DECISION: delete LWW — remote delete wins if updatedAt > local card.updatedAt.
 * @param {StickyCard | undefined} local
 * @param {number} deleteAt
 */
export function shouldApplyRemoteDelete(local, deleteAt) {
  if (!local) return true;
  return deleteAt > local.updatedAt;
}

/**
 * @param {Map<string, StickyCard>} cards
 * @param {Map<string, number>} tombstones
 * @param {CardDelete} remote
 */
export function applyRemoteCardDelete(cards, tombstones, remote) {
  const prevTomb = tombstones.get(remote.cardId) || 0;
  if (remote.updatedAt <= prevTomb) {
    return { cards, tombstones, applied: false };
  }
  const local = cards.get(remote.cardId);
  if (!shouldApplyRemoteDelete(local, remote.updatedAt)) {
    return { cards, tombstones, applied: false };
  }
  const nextCards = new Map(cards);
  const nextTomb = new Map(tombstones);
  nextCards.delete(remote.cardId);
  nextTomb.set(remote.cardId, remote.updatedAt);
  return { cards: nextCards, tombstones: nextTomb, applied: true };
}

/**
 * @param {Map<string, StickyCard>} cards
 * @param {Map<string, number>} tombstones
 * @param {string} cardId
 * @param {number} [updatedAt]
 */
export function removeLocalCard(cards, tombstones, cardId, updatedAt = Date.now()) {
  const nextCards = new Map(cards);
  const nextTomb = new Map(tombstones);
  nextCards.delete(cardId);
  nextTomb.set(cardId, updatedAt);
  return { cards: nextCards, tombstones: nextTomb, deletedAt: updatedAt };
}

/**
 * @param {Map<string, StickyCard>} cards
 * @param {Partial<StickyCard> & { cardId: string }} patch
 * @returns {Map<string, StickyCard>}
 */
export function upsertLocalCard(cards, patch) {
  const next = new Map(cards);
  const existing = next.get(patch.cardId);
  const base = existing ?? createCard({ cardId: patch.cardId });
  const merged = {
    ...base,
    ...patch,
    updatedAt: patch.updatedAt ?? Date.now(),
  };
  next.set(patch.cardId, merged);
  return next;
}

/**
 * @param {Map<string, StickyCard>} cards
 * @returns {StickyCard[]}
 */
export function cardsToArray(cards) {
  return [...cards.values()];
}

/** localStorage 自動保存 · Export 共通 */
export const AUTOSAVE_VERSION = 1;

/**
 * @param {Map<string, StickyCard>} cards
 * @returns {StickyCard[]}
 */
export function sortCardsForExport(cards) {
  return cardsToArray(cards).sort((a, b) => a.y - b.y || a.x - b.x || a.cardId.localeCompare(b.cardId));
}

/**
 * @param {Map<string, StickyCard>} cards
 */
export function formatBoardJson(cards) {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      cards: sortCardsForExport(cards),
    },
    null,
    2,
  );
}

/**
 * @param {Map<string, StickyCard>} cards
 */
export function formatBoardMarkdown(cards) {
  const list = sortCardsForExport(cards);
  if (list.length === 0) return '';
  return list
    .map((c) => {
      const t = String(c.text ?? '').replace(/\r?\n/g, ' ');
      return isHeadingCard(c) ? `## ${t}` : `- ${t}`;
    })
    .join('\n');
}

/**
 * @param {string} value
 */
function tsvCell(value) {
  return String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

/**
 * @param {Map<string, StickyCard>} cards
 */
export function formatBoardTsv(cards) {
  const list = sortCardsForExport(cards);
  const rows = ['kind\ttext\tcolor\tx\ty'];
  for (const c of list) {
    rows.push(`${getCardKind(c)}\t${tsvCell(c.text)}\t${c.color}\t${c.x}\t${c.y}`);
  }
  return rows.join('\n');
}

/**
 * @param {Map<string, StickyCard>} cards
 * @param {Map<string, number>} tombstones
 * @param {string} selectedColor
 */
export function buildAutosavePayload(cards, tombstones, selectedColor) {
  return {
    version: AUTOSAVE_VERSION,
    savedAt: Date.now(),
    selectedColor,
    cards: cardsToArray(cards),
    tombstones: [...tombstones.entries()].map(([cardId, updatedAt]) => ({ cardId, updatedAt })),
  };
}

/**
 * @param {unknown} data
 * @returns {{ cards: Map<string, StickyCard>, tombstones: Map<string, number>, selectedColor: string } | null}
 */
export function parseAutosavePayload(data) {
  if (!data || typeof data !== 'object') return null;
  const d = /** @type {Record<string, unknown>} */ (data);
  if (d.version !== AUTOSAVE_VERSION) return null;
  if (!Array.isArray(d.cards)) return null;
  const cards = new Map();
  for (const item of d.cards) {
    if (isValidStickyCard(item)) {
      const c = /** @type {StickyCard} */ (item);
      cards.set(c.cardId, c);
    }
  }
  const tombstones = new Map();
  if (Array.isArray(d.tombstones)) {
    for (const item of d.tombstones) {
      if (!item || typeof item !== 'object') continue;
      const t = /** @type {{ cardId?: string, updatedAt?: number }} */ (item);
      if (typeof t.cardId === 'string' && typeof t.updatedAt === 'number') {
        tombstones.set(t.cardId, t.updatedAt);
      }
    }
  }
  const selectedColor =
    typeof d.selectedColor === 'string' && STICKY_COLORS.includes(d.selectedColor)
      ? d.selectedColor
      : 'yellow';
  return { cards, tombstones, selectedColor };
}

/**
 * Export JSON（`formatBoardJson`）または autosave 互換を盤面スナップショットへ
 * @param {unknown} data
 * @returns {{ cards: Map<string, StickyCard>, tombstones: Map<string, number>, selectedColor: string } | null}
 */
export function parseBoardImportJson(data) {
  const asAutosave = parseAutosavePayload(data);
  if (asAutosave) return asAutosave;
  if (!data || typeof data !== 'object') return null;
  const d = /** @type {Record<string, unknown>} */ (data);
  if (d.version !== 1 || !Array.isArray(d.cards)) return null;
  const cards = new Map();
  for (const item of d.cards) {
    if (isValidStickyCard(item)) {
      const c = /** @type {StickyCard} */ (item);
      cards.set(c.cardId, c);
    }
  }
  return { cards, tombstones: new Map(), selectedColor: 'yellow' };
}

// ---------------------------------------------------------------------------
// Gate 1–2 — WebRTC + DataChannel（Gate 2: ping/pong のみ · カード同期なし）
// 理由: simple-peer は未導入 — 素の RTCPeerConnection + createDataChannel
// ---------------------------------------------------------------------------

const DC_LABEL = 'sticky-room';
const PING_TEST_COUNT = 100;
const PONG_TIMEOUT_MS = 3000;

/** @typedef {'idle'|'hosting'|'joining'|'connecting'|'connected'|'ice-failed'|'reconnecting'|'expired'|'host-ended'|'join-ended'} RoomConnState */

/** 切断 UI の正本（app が表示） */
export const ROOM_DISCONNECT_REASONS = /** @type {const} */ ([
  'host-ended',
  'join-ended',
  'ice-failed',
  'expired',
]);

/** @typedef {'host'|'join'} RoomRole */

/**
 * @typedef {{ connectAttempts: number, connectSuccesses: number, iceFailures: number, reconnectAttempts: number, connectedPeers: number, lastError: string | null }} ConnStats
 */

/** @typedef {{ type: string, peerId?: string, from?: string, to?: string }} SignalMessage */

const STUN_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
const SIGNAL_EVENT = 'sticky-signal';
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000];
const MAX_RECONNECT = 4;

/** Gate 8 — ルーム生存時間（ホスト開始から · サーバーに状態は残さない） */
export const ROOM_TTL_MS = 3 * 60 * 60 * 1000;

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * テスト用 TTL 上書き（`?longevity=1&ttlMs=` · `?stress=1&ttlMs=`）
 */
export function getRoomTtlMs() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('longevity') === '1' || params.has('stress')) {
      const raw = params.get('ttlMs');
      if (raw) {
        const n = Number.parseInt(raw, 10);
        if (Number.isFinite(n) && n >= 30_000) return n;
      }
    }
  }
  return ROOM_TTL_MS;
}

/**
 * @param {number} [now]
 */
export function computeRoomExpiresAt(now = Date.now()) {
  return now + getRoomTtlMs();
}

/**
 * 長時間シナリオ用 — 2h 放置後の残り TTL（本番 3h TTL 前提）
 * @param {number} hostStartedAt
 * @param {number} [now]
 */
export function ttlRemainingAfterLongIdle(hostStartedAt, now = Date.now()) {
  const expiresAt = hostStartedAt + ROOM_TTL_MS;
  return {
    expiresAt,
    remainingMs: getTtlRemainingMs(expiresAt, now),
    expired: isRoomExpired(expiresAt, now),
    idleMs: now - hostStartedAt,
  };
}

/** 長時間テスト定数（ドキュメント · 手動検証用） */
export const LONGEVITY_IDLE_MS = TWO_HOURS_MS;

/**
 * TTL 1 ステップ（テスト · 注入 clock 用）
 * @param {number} expiresAt
 * @param {boolean} roomExpired
 * @param {number} nowMs
 */
export function stepTtlCheck(expiresAt, roomExpired, nowMs) {
  if (roomExpired || !expiresAt) {
    return { roomExpired: true, remainingMs: 0, shouldExpire: false };
  }
  const remainingMs = getTtlRemainingMs(expiresAt, nowMs);
  if (remainingMs <= 0) {
    return { roomExpired: true, remainingMs: 0, shouldExpire: true };
  }
  return { roomExpired: false, remainingMs, shouldExpire: false };
}

/**
 * @param {number} expiresAt
 * @param {number} [now]
 */
export function getTtlRemainingMs(expiresAt, now = Date.now()) {
  if (!expiresAt) return 0;
  return Math.max(0, expiresAt - now);
}

/**
 * @param {number} expiresAt
 * @param {number} [now]
 */
export function isRoomExpired(expiresAt, now = Date.now()) {
  return expiresAt > 0 && now >= expiresAt;
}

/**
 * @param {number} ms
 */
export function formatTtlRemaining(ms) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

const EMPTY_STATS = /** @type {ConnStats} */ ({
  connectAttempts: 0,
  connectSuccesses: 0,
  iceFailures: 0,
  reconnectAttempts: 0,
  connectedPeers: 0,
  lastError: null,
});

/**
 * @param {string} [search]
 */
export function parseRoomUrl(search = '') {
  const params = new URLSearchParams(search);
  const roomId = (params.get('r') || '').trim();
  const role = params.get('role') === 'host' ? 'host' : 'join';
  return { roomId, role };
}

/**
 * @param {string} roomId
 * @param {RoomRole} role
 */
export function buildRoomUrl(roomId, role) {
  const params = new URLSearchParams();
  params.set('r', roomId);
  if (role === 'host') params.set('role', 'host');
  return `?${params.toString()}`;
}

export function createRoomId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

export function createPeerId() {
  return crypto.randomUUID();
}

/**
 * @param {SignalMessage | null | undefined} msg
 * @param {string} myPeerId
 */
export function shouldHandleSignal(msg, myPeerId) {
  if (!msg || typeof msg !== 'object' || !msg.type) return false;
  if (msg.peerId === myPeerId) return false;
  if (msg.from === myPeerId) return false;
  const targeted = ['offer', 'answer', 'ice'];
  if (targeted.includes(msg.type)) {
    return Boolean(msg.to && msg.to === myPeerId);
  }
  return true;
}

/**
 * DECISION: aggregate UI state from per-peer RTCPeerConnection — any `connected` ⇒ connected.
 * @param {RoomConnState} state
 * @param {{ anyConnected: boolean, anyConnecting: boolean, anyFailed: boolean, waiting: boolean }} flags
 */
export function transitionConnState(state, flags) {
  if (flags.anyConnected) return 'connected';
  if (flags.anyFailed && !flags.anyConnecting) return 'ice-failed';
  if (flags.anyConnecting) return 'connecting';
  if (flags.waiting) return state === 'joining' ? 'joining' : 'hosting';
  return state;
}

/**
 * @param {ConnStats} stats
 */
export function formatConnStats(stats) {
  return `試行 ${stats.connectAttempts} · 成功 ${stats.connectSuccesses} · ICE失敗 ${stats.iceFailures} · 再接続 ${stats.reconnectAttempts}`;
}

/** @typedef {{ type: 'ping', id: number } | { type: 'pong', id: number } | { type: 'card-add', card: StickyCard } | { type: 'card-move', card: StickyCard } | { type: 'card-edit', card: StickyCard } | { type: 'card-delete', cardId: string, updatedAt: number }} RoomDcMessage */

/**
 * @param {unknown} card
 * @returns {card is StickyCard}
 */
export function isValidStickyCard(card) {
  if (!card || typeof card !== 'object') return false;
  const c = /** @type {StickyCard} */ (card);
  if (
    typeof c.cardId !== 'string' ||
    typeof c.x !== 'number' ||
    typeof c.y !== 'number' ||
    typeof c.text !== 'string' ||
    typeof c.color !== 'string' ||
    typeof c.updatedAt !== 'number'
  ) {
    return false;
  }
  if (c.kind != null && c.kind !== 'sticky' && c.kind !== 'heading') return false;
  return true;
}

/**
 * Gate 3 — 新規付箋追加のみ DataChannel で送る
 * @param {StickyCard} card
 */
export function createCardAddMessage(card) {
  return { type: 'card-add', card };
}

/**
 * Gate 4 — 付箋移動（x/y）を DataChannel で送る
 * @param {StickyCard} card
 */
export function createCardMoveMessage(card) {
  return { type: 'card-move', card };
}

/**
 * Gate 5 — 付箋テキスト編集を DataChannel で送る
 * @param {StickyCard} card
 */
export function createCardEditMessage(card) {
  return { type: 'card-edit', card };
}

/**
 * Gate 6 — 付箋削除を DataChannel で送る
 * @param {CardDelete} payload
 */
export function createCardDeleteMessage(payload) {
  return { type: 'card-delete', cardId: payload.cardId, updatedAt: payload.updatedAt };
}

/**
 * Gate 2 — `{type:"ping"}` のみ受け付け、pong を返す。
 * @param {unknown} msg
 * @returns {Extract<RoomDcMessage, { type: 'pong' }> | null}
 */
export function replyToDcMessage(msg) {
  if (!msg || typeof msg !== 'object') return null;
  const m = /** @type {{ type?: string, id?: unknown }} */ (msg);
  if (m.type === 'ping' && typeof m.id === 'number' && Number.isInteger(m.id) && m.id >= 0) {
    return { type: 'pong', id: m.id };
  }
  return null;
}

/**
 * @param {unknown} msg
 * @returns {RoomDcMessage | null}
 */
export function parseRoomDcObject(msg) {
  if (!msg || typeof msg !== 'object') return null;
  const m = /** @type {Record<string, unknown>} */ (msg);
  if ((m.type === 'ping' || m.type === 'pong') && typeof m.id === 'number') {
    return /** @type {RoomDcMessage} */ (m);
  }
  if (m.type === 'card-add' && isValidStickyCard(m.card)) {
    return { type: 'card-add', card: /** @type {StickyCard} */ (m.card) };
  }
  if (m.type === 'card-move' && isValidStickyCard(m.card)) {
    return { type: 'card-move', card: /** @type {StickyCard} */ (m.card) };
  }
  if (m.type === 'card-edit' && isValidStickyCard(m.card)) {
    return { type: 'card-edit', card: /** @type {StickyCard} */ (m.card) };
  }
  if (m.type === 'card-delete' && isValidCardDelete(m)) {
    return {
      type: 'card-delete',
      cardId: String(m.cardId),
      updatedAt: Number(m.updatedAt),
    };
  }
  return null;
}

/**
 * @param {string | ArrayBuffer | Blob} raw
 * @returns {RoomDcMessage | null}
 */
export function parseRoomDcMessage(raw) {
  if (typeof raw !== 'string') return null;
  try {
    return parseRoomDcObject(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return null;
}

/** @deprecated use parseRoomDcMessage */
export function parseDcMessage(raw) {
  const msg = parseRoomDcMessage(raw);
  if (msg?.type === 'ping' || msg?.type === 'pong') return msg;
  return null;
}

/**
 * @typedef {{ sent: number, received: number, ok: boolean }} PingTestResult
 */

/**
 * @typedef {Object} RoomSessionCallbacks
 * @property {(state: RoomConnState, detail?: string) => void} [onStateChange]
 * @property {(stats: ConnStats) => void} [onStatsChange]
 * @property {(card: StickyCard) => void} [onCardRemote]
 * @property {(payload: CardDelete) => void} [onCardDelete]
 * @property {(ready: boolean) => void} [onCryptoReady]
 * @property {(expiresAt: number) => void} [onTtlChange]
 * @property {(remainingMs: number, expiresAt: number) => void} [onTtlTick]
 * @property {() => void} [onTtlExpired]
 */

/**
 * Gate 1 セッション — Host / Join / Connected（カード同期なし）
 * @param {RoomSessionCallbacks} [callbacks]
 * @param {{ now?: () => number }} [options]
 */
export function createRoomSession(callbacks = {}, options = {}) {
  const now = options.now ?? (() => Date.now());
  let destroyed = false;
  let roomId = '';
  /** @type {RoomRole} */
  let role = 'join';
  let peerId = createPeerId();
  /** @type {RoomConnState} */
  let connState = 'idle';
  /** @type {ConnStats} */
  let stats = { ...EMPTY_STATS };

  /** @type {import('@supabase/supabase-js').SupabaseClient | null} */
  let supabase = null;
  /** @type {import('@supabase/supabase-js').RealtimeChannel | null} */
  let channel = null;
  /** @type {Map<string, RTCPeerConnection>} */
  const peerConnections = new Map();
  /** @type {Map<string, RTCDataChannel>} */
  const dataChannels = new Map();
  /** @type {Map<number, () => void>} */
  const pongWaiters = new Map();
  /** @type {Map<string, number>} */
  const reconnectCounts = new Map();
  /** @type {Map<string, ReturnType<typeof setTimeout>>} */
  const reconnectTimers = new Map();
  /** @type {Set<string>} */
  const remotePeerIds = new Set();
  let hostPeerId = '';
  /** @type {Map<string, boolean>} */
  const peerWasConnected = new Map();
  let expiresAt = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let ttlTimer = null;
  let roomExpired = false;
  let hadPeerConnection = false;

  async function enterHostEnded(detail) {
    if (roomExpired || connState === 'host-ended') return;
    for (const t of reconnectTimers.values()) clearTimeout(t);
    reconnectTimers.clear();
    for (const remotePeerId of [...peerConnections.keys()]) {
      closePeer(remotePeerId);
    }
    if (channel && supabase) {
      await supabase.removeChannel(channel);
    }
    channel = null;
    destroyed = true;
    setState('host-ended', detail || 'ホストがルームを終了しました');
  }

  async function enterJoinEnded(remotePeerId, detail) {
    if (roomExpired) return;
    closePeer(remotePeerId);
    remotePeerIds.delete(remotePeerId);
    if (connState !== 'join-ended') {
      setState('join-ended', detail || '参加者がルームから退出しました');
    }
  }

  function onReconnectExhausted(remotePeerId) {
    const was = peerWasConnected.get(remotePeerId);
    if (!was) return;
    if (role === 'join') {
      void enterHostEnded('ホストとの接続を復旧できませんでした');
    } else if (role === 'host') {
      void enterJoinEnded(remotePeerId, '参加者との接続を復旧できませんでした');
    }
  }

  function clearTtlTimer() {
    if (ttlTimer) clearTimeout(ttlTimer);
    ttlTimer = null;
  }

  function applyExpiresAt(at) {
    if (!at || roomExpired) return;
    expiresAt = at;
    scheduleTtlCheck();
    callbacks.onTtlChange?.(expiresAt);
  }

  function scheduleTtlCheck() {
    clearTtlTimer();
    if (!expiresAt || roomExpired) return;

    const tick = () => {
      if (roomExpired || destroyed) return;
      const remaining = getTtlRemainingMs(expiresAt, now());
      callbacks.onTtlTick?.(remaining, expiresAt);
      if (remaining <= 0) {
        void expireRoom();
        return;
      }
      ttlTimer = setTimeout(tick, 1000);
    };
    tick();
  }

  /** テスト用 — 注入 clock で TTL を進める（本番 UI からは呼ばない） */
  function tickTtl() {
    if (roomExpired || destroyed) return { expired: true, remainingMs: 0 };
    const remaining = getTtlRemainingMs(expiresAt, now());
    callbacks.onTtlTick?.(remaining, expiresAt);
    if (remaining <= 0) {
      void expireRoom();
      return { expired: true, remainingMs: 0 };
    }
    return { expired: false, remainingMs: remaining };
  }

  async function teardown() {
    destroyed = true;
    clearTtlTimer();
    pongWaiters.clear();
    clearRoomCrypto();
    callbacks.onCryptoReady?.(false);
    for (const remotePeerId of [...peerConnections.keys()]) {
      closePeer(remotePeerId);
    }
    if (channel && supabase) {
      await supabase.removeChannel(channel);
    }
    channel = null;
    supabase = null;
  }

  async function expireRoom() {
    if (roomExpired || destroyed) return;
    roomExpired = true;
    callbacks.onTtlExpired?.();
    await teardown();
    setState('expired', 'ルームの有効期限が切れました');
  }

  function setState(next, detail) {
    connState = next;
    callbacks.onStateChange?.(next, detail);
  }

  function replaceRoomUrl(query) {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    window.history.replaceState(null, '', `${window.location.pathname}${query}${hash}`);
  }

  async function ensureRoomCryptoForHost() {
    let key = fragmentToKey(typeof window !== 'undefined' ? window.location.hash : '');
    if (!key) key = generateRoomKey();
    await initRoomCrypto(key);
    if (typeof window !== 'undefined') {
      const frag = keyToFragment(key);
      if (window.location.hash !== frag) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}${frag}`
        );
      }
    }
    callbacks.onCryptoReady?.(true);
  }

  async function ensureRoomCryptoForJoin() {
    const key = fragmentToKey(typeof window !== 'undefined' ? window.location.hash : '');
    if (!key) {
      throw new Error('ルーム鍵がありません。ホストから共有された URL（#k=… 付き）を開いてください');
    }
    await initRoomCrypto(key);
    callbacks.onCryptoReady?.(true);
  }

  function bumpStats(patch) {
    stats = { ...stats, ...patch };
    callbacks.onStatsChange?.({ ...stats });
  }

  function countConnectedPeers() {
    let n = 0;
    for (const pc of peerConnections.values()) {
      if (pc.connectionState === 'connected') n += 1;
    }
    return n;
  }

  function refreshAggregateState() {
    if (
      roomExpired ||
      connState === 'expired' ||
      connState === 'host-ended' ||
      connState === 'join-ended' ||
      connState === 'ice-failed'
    ) {
      return;
    }
    const connected = countConnectedPeers();
    bumpStats({ connectedPeers: connected });
    const flags = {
      anyConnected: connected > 0,
      anyConnecting: [...peerConnections.values()].some(
        (pc) => pc.connectionState === 'connecting' || pc.connectionState === 'new'
      ),
      anyFailed: [...peerConnections.values()].some(
        (pc) => pc.connectionState === 'failed' || pc.iceConnectionState === 'failed'
      ),
      waiting: role === 'host' ? remotePeerIds.size === 0 : !hostPeerId,
    };
    const next = transitionConnState(connState, flags);
    setState(next);
  }

  async function initSupabase() {
    const { loadSyncPublicConfig, isSyncConfigured } = await import('./sync-public-config.js');
    const config = await loadSyncPublicConfig();
    if (!isSyncConfigured(config)) {
      throw new Error('Supabase 未設定 — .env.sync.local で build:pages:sync を実行してください');
    }
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm');
    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async function sendSignal(payload) {
    if (!channel || destroyed) return;
    await channel.send({
      type: 'broadcast',
      event: SIGNAL_EVENT,
      payload,
    });
  }

  function clearReconnectTimer(remotePeerId) {
    const t = reconnectTimers.get(remotePeerId);
    if (t) clearTimeout(t);
    reconnectTimers.delete(remotePeerId);
  }

  function closePeer(remotePeerId) {
    clearReconnectTimer(remotePeerId);
    peerWasConnected.delete(remotePeerId);
    const dc = dataChannels.get(remotePeerId);
    if (dc) {
      dc.onmessage = null;
      dc.onopen = null;
      dc.onclose = null;
      dc.close();
      dataChannels.delete(remotePeerId);
    }
    const pc = peerConnections.get(remotePeerId);
    if (pc) {
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onicecandidate = null;
      pc.close();
    }
    peerConnections.delete(remotePeerId);
  }

  async function sendDc(remotePeerId, msg) {
    if (roomExpired) return false;
    const dc = dataChannels.get(remotePeerId);
    if (!dc || dc.readyState !== 'open') return false;
    const wire = await encryptWireString(msg);
    dc.send(wire);
    return true;
  }

  async function broadcastDc(msg) {
    if (roomExpired) return false;
    let sent = false;
    for (const remotePeerId of dataChannels.keys()) {
      if (await sendDc(remotePeerId, msg)) sent = true;
    }
    return sent;
  }

  async function handleDcIncoming(remotePeerId, raw) {
    let decoded;
    try {
      decoded = await decryptWireString(raw);
    } catch {
      return;
    }
    const msg = parseRoomDcObject(decoded);
    if (!msg) return;

    const reply = replyToDcMessage(msg);
    if (reply) {
      await sendDc(remotePeerId, reply);
      return;
    }

    if (msg.type === 'pong') {
      const waiter = pongWaiters.get(msg.id);
      if (waiter) {
        pongWaiters.delete(msg.id);
        waiter();
      }
      return;
    }

    // DECISION: Gate 3–6 — JSON まで。LWW/描画は app 層（observe → Map → paint）。
    if (msg.type === 'card-add' || msg.type === 'card-move' || msg.type === 'card-edit') {
      callbacks.onCardRemote?.(msg.card);
      return;
    }
    if (msg.type === 'card-delete') {
      callbacks.onCardDelete?.({ cardId: msg.cardId, updatedAt: msg.updatedAt });
    }
  }

  function wireDataChannel(dc, remotePeerId) {
    dataChannels.set(remotePeerId, dc);

    dc.onopen = () => {
      refreshAggregateState();
    };

    dc.onmessage = (ev) => {
      void handleDcIncoming(remotePeerId, typeof ev.data === 'string' ? ev.data : '');
    };

    dc.onclose = () => {
      if (dataChannels.get(remotePeerId) === dc) {
        dataChannels.delete(remotePeerId);
      }
      refreshAggregateState();
    };
  }

  function getOpenDataChannel() {
    for (const dc of dataChannels.values()) {
      if (dc.readyState === 'open') return dc;
    }
    return null;
  }

  function getOpenDataChannelPeerId() {
    for (const [remotePeerId, dc] of dataChannels.entries()) {
      if (dc.readyState === 'open') return remotePeerId;
    }
    return null;
  }

  function waitForDataChannelOpen(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const existing = getOpenDataChannel();
      if (existing) {
        resolve(existing);
        return;
      }
      const deadline = setTimeout(() => {
        clearInterval(timer);
        reject(new Error('DataChannel open timeout'));
      }, timeoutMs);
      const timer = setInterval(() => {
        const dc = getOpenDataChannel();
        if (dc) {
          clearTimeout(deadline);
          clearInterval(timer);
          resolve(dc);
        }
      }, 50);
    });
  }

  function waitForPong(id) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pongWaiters.delete(id);
        reject(new Error(`pong timeout id=${id}`));
      }, PONG_TIMEOUT_MS);
      pongWaiters.set(id, () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  /**
   * Gate 2 検証 — ping を count 回送り pong が全部返ることを確認
   * @param {number} [count]
   * @returns {Promise<PingTestResult>}
   */
  async function runPingTest(count = PING_TEST_COUNT) {
    await waitForDataChannelOpen();
    const remotePeerId = getOpenDataChannelPeerId();
    if (!remotePeerId) throw new Error('DataChannel peer missing');

    let received = 0;
    for (let id = 0; id < count; id += 1) {
      const ping = /** @type {RoomDcMessage} */ ({ type: 'ping', id });
      const sent = await sendDc(remotePeerId, ping);
      if (!sent) throw new Error(`ping send failed id=${id}`);
      await waitForPong(id);
      received += 1;
    }

    return { sent: count, received, ok: received === count };
  }

  /**
   * Gate 3 — 付箋追加のみ全接続ピアへ送信
   * @param {StickyCard} card
   */
  function sendCardAdd(card) {
    if (!isValidStickyCard(card)) return false;
    void broadcastDc(createCardAddMessage(card));
    return true;
  }

  function sendCardMove(card) {
    if (!isValidStickyCard(card)) return false;
    void broadcastDc(createCardMoveMessage(card));
    return true;
  }

  function sendCardEdit(card) {
    if (!isValidStickyCard(card)) return false;
    void broadcastDc(createCardEditMessage(card));
    return true;
  }

  function sendCardDelete(payload) {
    if (!isValidCardDelete(payload)) return false;
    void broadcastDc(createCardDeleteMessage(payload));
    return true;
  }

  function wirePc(pc, remotePeerId) {
    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      sendSignal({
        type: 'ice',
        from: peerId,
        to: remotePeerId,
        candidate: ev.candidate.toJSON(),
      });
    };

    pc.onconnectionstatechange = () => {
      if (destroyed) return;
      const st = pc.connectionState;
      const was = peerWasConnected.get(remotePeerId) || false;
      if (st === 'connected' && !was) {
        peerWasConnected.set(remotePeerId, true);
        hadPeerConnection = true;
        bumpStats({ connectSuccesses: stats.connectSuccesses + 1 });
        refreshAggregateState();
      } else if (st !== 'connected') {
        peerWasConnected.set(remotePeerId, false);
      }
      if (st === 'disconnected') {
        setState('reconnecting', remotePeerId.slice(0, 8));
        scheduleReconnect(remotePeerId);
      } else if (st === 'failed') {
        bumpStats({
          iceFailures: stats.iceFailures + 1,
          lastError: `ICE failed (${remotePeerId.slice(0, 8)})`,
        });
        setState('ice-failed', stats.lastError || undefined);
        scheduleReconnect(remotePeerId);
      } else if (st === 'connected') {
        reconnectCounts.set(remotePeerId, 0);
      } else {
        refreshAggregateState();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        bumpStats({ iceFailures: stats.iceFailures + 1, lastError: 'ICE connection failed' });
      }
    };
  }

  /**
   * DECISION: host が createDataChannel — joiner は ondatachannel（Gate 2 · カードはまだ送らない）
   * @param {string} remotePeerId
   * @param {boolean} isInitiator
   */
  async function createPcForPeer(remotePeerId, isInitiator) {
    closePeer(remotePeerId);
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

    if (isInitiator) {
      const dc = pc.createDataChannel(DC_LABEL, { ordered: true });
      wireDataChannel(dc, remotePeerId);
    } else {
      pc.ondatachannel = (ev) => {
        wireDataChannel(ev.channel, remotePeerId);
      };
    }

    wirePc(pc, remotePeerId);
    peerConnections.set(remotePeerId, pc);
    bumpStats({ connectAttempts: stats.connectAttempts + 1 });
    setState('connecting');

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal({ type: 'offer', from: peerId, to: remotePeerId, sdp: offer });
    }
    refreshAggregateState();
    return pc;
  }

  async function handleOffer(msg) {
    const pc = await createPcForPeer(msg.from, false);
    await pc.setRemoteDescription(msg.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendSignal({ type: 'answer', from: peerId, to: msg.from, sdp: answer });
  }

  async function handleAnswer(msg) {
    const pc = peerConnections.get(msg.from);
    if (!pc) return;
    await pc.setRemoteDescription(msg.sdp);
    refreshAggregateState();
  }

  async function handleIce(msg) {
    const pc = peerConnections.get(msg.from);
    if (!pc || !msg.candidate) return;
    try {
      await pc.addIceCandidate(msg.candidate);
    } catch {
      /* stale candidate after renegotiation */
    }
  }

  async function handleJoin(msg) {
    if (role !== 'host') return;
    remotePeerIds.add(msg.peerId);
    await sendSignal({ type: 'host-ready', peerId, expiresAt });
    await createPcForPeer(msg.peerId, true);
  }

  async function handleRejoin(msg) {
    if (role !== 'host') return;
    remotePeerIds.add(msg.peerId);
    await createPcForPeer(msg.peerId, true);
  }

  async function handleSignal(raw) {
    const msg = /** @type {SignalMessage & Record<string, unknown>} */ (raw);
    if (!shouldHandleSignal(msg, peerId)) return;

    try {
      switch (msg.type) {
        case 'host-ready':
          hostPeerId = msg.peerId || '';
          if (typeof msg.expiresAt === 'number' && msg.expiresAt > 0) {
            applyExpiresAt(msg.expiresAt);
          }
          if (role === 'join') {
            await sendSignal({ type: 'join', peerId });
          }
          break;
        case 'join':
          await handleJoin(/** @type {{ peerId: string }} */ (msg));
          break;
        case 'rejoin':
          await handleRejoin(/** @type {{ peerId: string }} */ (msg));
          break;
        case 'offer':
          await handleOffer(/** @type {{ from: string, sdp: RTCSessionDescriptionInit }} */ (msg));
          break;
        case 'answer':
          await handleAnswer(/** @type {{ from: string, sdp: RTCSessionDescriptionInit }} */ (msg));
          break;
        case 'ice':
          await handleIce(/** @type {{ from: string, candidate: RTCIceCandidateInit }} */ (msg));
          break;
        case 'host-leave':
          if (role === 'join' && msg.peerId && msg.peerId === hostPeerId) {
            await enterHostEnded('ホストがルームを終了しました');
          }
          break;
        case 'join-leave':
          if (role === 'host' && msg.peerId) {
            await enterJoinEnded(msg.peerId, '参加者がルームから退出しました');
          }
          break;
        default:
          break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      bumpStats({ lastError: message });
      setState('ice-failed', message);
    }
  }

  function scheduleReconnect(remotePeerId) {
    clearReconnectTimer(remotePeerId);
    const count = reconnectCounts.get(remotePeerId) || 0;
    if (count >= MAX_RECONNECT) {
      onReconnectExhausted(remotePeerId);
      return;
    }

    const delay = RECONNECT_DELAYS_MS[Math.min(count, RECONNECT_DELAYS_MS.length - 1)];
    reconnectCounts.set(remotePeerId, count + 1);
    bumpStats({ reconnectAttempts: stats.reconnectAttempts + 1 });

    const timer = setTimeout(async () => {
      if (destroyed) return;
      if (role === 'host') {
        await createPcForPeer(remotePeerId, true);
      } else if (hostPeerId) {
        await sendSignal({ type: 'rejoin', peerId });
        setState('reconnecting');
      }
    }, delay);
    reconnectTimers.set(remotePeerId, timer);
  }

  async function subscribeChannel(id) {
    if (!supabase) throw new Error('Supabase client missing');
    roomId = id;
    channel = supabase.channel(`sticky-room:${id}`, {
      config: { broadcast: { ack: false } },
    });

    channel.on('broadcast', { event: SIGNAL_EVENT }, ({ payload }) => {
      handleSignal(payload);
    });

    await new Promise((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`Realtime channel ${status}`));
        }
      });
    });
  }

  async function startHost(id) {
    if (destroyed) return;
    role = 'host';
    peerId = createPeerId();
    stats = { ...EMPTY_STATS };
    roomExpired = false;
    expiresAt = computeRoomExpiresAt(now());
    await initSupabase();
    await ensureRoomCryptoForHost();
    setState('hosting');
    await subscribeChannel(id);

    applyExpiresAt(expiresAt);
    await sendSignal({ type: 'host-ready', peerId, expiresAt });
    replaceRoomUrl(buildRoomUrl(id, 'host'));
    refreshAggregateState();
  }

  async function startJoin(id) {
    if (destroyed) return;
    role = 'join';
    peerId = createPeerId();
    stats = { ...EMPTY_STATS };
    roomExpired = false;
    await initSupabase();
    await ensureRoomCryptoForJoin();
    setState('joining');
    await subscribeChannel(id);

    await sendSignal({ type: 'join', peerId });
    replaceRoomUrl(buildRoomUrl(id, 'join'));
    refreshAggregateState();
  }

  async function manualReconnect() {
    if (destroyed || connState === 'idle' || roomExpired) return;
    bumpStats({ reconnectAttempts: stats.reconnectAttempts + 1 });
    if (role === 'host') {
      for (const remotePeerId of remotePeerIds) {
        reconnectCounts.set(remotePeerId, 0);
        await createPcForPeer(remotePeerId, true);
      }
    } else {
      reconnectCounts.clear();
      await sendSignal({ type: 'rejoin', peerId });
      setState('reconnecting');
    }
  }

  async function leaveRoom() {
    if (destroyed || connState === 'idle' || roomExpired) return;
    try {
      if (role === 'host') {
        await sendSignal({ type: 'host-leave', peerId });
      } else {
        await sendSignal({ type: 'join-leave', peerId });
      }
    } catch {
      /* tab close · network gone */
    }
    await teardown();
    setState('idle');
  }

  async function dismissJoinEnded() {
    if (connState !== 'join-ended' || role !== 'host') return;
    destroyed = false;
    setState('hosting');
    refreshAggregateState();
  }

  async function destroy() {
    await teardown();
    setState('idle');
  }

  return {
    getState: () => connState,
    getStats: () => ({ ...stats }),
    getPeerId: () => peerId,
    getRoomId: () => roomId,
    getRole: () => role,
    getExpiresAt: () => expiresAt,
    getTtlRemainingMs: () => getTtlRemainingMs(expiresAt, now()),
    isRoomExpired: () => roomExpired || isRoomExpired(expiresAt, now()),
    tickTtl,
    startHost,
    startJoin,
    manualReconnect,
    runPingTest,
    sendCardAdd,
    sendCardMove,
    sendCardEdit,
    sendCardDelete,
    isRoomCryptoReady: () => isCryptoReady(),
    leaveRoom,
    dismissJoinEnded,
    destroy,
  };
}
