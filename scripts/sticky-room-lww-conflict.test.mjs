#!/usr/bin/env node
/**
 * LWW 競合テスト — A/B 同時編集を N 回 · 収束を検証
 * Run: npm run test:sticky-room:lww
 *      npm run test:sticky-room  （同梱）
 */
import assert from 'node:assert/strict';
import {
  applyRemoteCard,
  applyRemoteCardDelete,
  createCard,
  removeLocalCard,
  upsertLocalCard,
} from '../assets/sticky-room-sync.js';

const ROUNDS = Number(process.env.STICKY_ROOM_LWW_ROUNDS || 1000);

/**
 * @param {Map<string, import('../assets/sticky-room-sync.js').StickyCard>} cards
 * @param {Map<string, number>} tombstones
 * @param {{ type: 'card', patch: Partial<import('../assets/sticky-room-sync.js').StickyCard> & { cardId: string } } | { type: 'delete', cardId: string, updatedAt: number }} action
 */
function applyLocalAction(cards, tombstones, action) {
  if (action.type === 'card') {
    const tombAt = tombstones.get(action.patch.cardId) || 0;
    const ts = action.patch.updatedAt ?? Date.now();
    if (ts <= tombAt) {
      return { cards, tombstones };
    }
    let tombs = tombstones;
    if (tombs.has(action.patch.cardId)) {
      const nextTomb = new Map(tombs);
      nextTomb.delete(action.patch.cardId);
      tombs = nextTomb;
    }
    return {
      cards: upsertLocalCard(cards, action.patch),
      tombstones: tombs,
    };
  }
  const removed = removeLocalCard(cards, tombstones, action.cardId, action.updatedAt);
  return { cards: removed.cards, tombstones: removed.tombstones };
}

/**
 * @param {Map<string, import('../assets/sticky-room-sync.js').StickyCard>} localCards
 * @param {Map<string, number>} localTombs
 * @param {Map<string, import('../assets/sticky-room-sync.js').StickyCard>} remoteCards
 * @param {Map<string, number>} remoteTombs
 */
function mergeRemoteState(localCards, localTombs, remoteCards, remoteTombs) {
  let cards = new Map(localCards);
  let tombstones = new Map(localTombs);
  for (const card of remoteCards.values()) {
    cards = applyRemoteCard(cards, card, tombstones);
  }
  for (const [cardId, updatedAt] of remoteTombs) {
    const result = applyRemoteCardDelete(cards, tombstones, { cardId, updatedAt });
    cards = result.cards;
    tombstones = result.tombstones;
  }
  return { cards, tombstones };
}

/**
 * 同期済み状態から A/B が同時編集 → 相互にリモート適用（v1 LWW パイプライン）
 * @param {{ cards: Map<string, import('../assets/sticky-room-sync.js').StickyCard>, tombstones: Map<string, number> }} synced
 * @param {Parameters<typeof applyLocalAction>[2]} editA
 * @param {Parameters<typeof applyLocalAction>[2]} editB
 */
function simulateConcurrentRound(synced, editA, editB) {
  const afterA = applyLocalAction(synced.cards, synced.tombstones, editA);
  const afterB = applyLocalAction(synced.cards, synced.tombstones, editB);

  const stateA = mergeRemoteState(afterA.cards, afterA.tombstones, afterB.cards, afterB.tombstones);
  const stateB = mergeRemoteState(afterB.cards, afterB.tombstones, afterA.cards, afterA.tombstones);

  return { stateA, stateB };
}

/**
 * @param {Map<string, import('../assets/sticky-room-sync.js').StickyCard>} cards
 */
function serializeCards(cards) {
  return [...cards.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, c]) => [id, { ...c }]);
}

/**
 * @param {Map<string, number>} tombstones
 */
function serializeTombs(tombstones) {
  return [...tombstones.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * @param {ReturnType<typeof simulateConcurrentRound>['stateA']} a
 * @param {ReturnType<typeof simulateConcurrentRound>['stateB']} b
 * @param {number} round
 * @param {string} label
 */
function assertConverged(a, b, round, label) {
  try {
    assert.deepEqual(serializeCards(a.cards), serializeCards(b.cards), `${label} cards @${round}`);
    assert.deepEqual(serializeTombs(a.tombstones), serializeTombs(b.tombstones), `${label} tombs @${round}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`${msg}\nA=${JSON.stringify(serializeCards(a.cards))}\nB=${JSON.stringify(serializeCards(b.cards))}`);
  }
}

/** @type {{ cards: Map<string, import('../assets/sticky-room-sync.js').StickyCard>, tombstones: Map<string, number> }} */
let synced = {
  cards: new Map(),
  tombstones: new Map(),
};

const CARD_A = 'card-a';
const CARD_B = 'card-b';

for (let i = 0; i < ROUNDS; i += 1) {
  const base = 10_000 + i * 20;
  const scenario = i % 8;

  if (synced.cards.size === 0) {
    synced = {
      cards: upsertLocalCard(
        synced.cards,
        createCard({ cardId: CARD_A, text: 'seed-a', x: 10, y: 10, updatedAt: 1000 }),
      ),
      tombstones: new Map(synced.tombstones),
    };
    synced.cards = upsertLocalCard(
      synced.cards,
      createCard({ cardId: CARD_B, text: 'seed-b', x: 200, y: 40, updatedAt: 1001 }),
    );
  }

  /** @type {Parameters<typeof applyLocalAction>[2]} */
  let editA;
  /** @type {Parameters<typeof applyLocalAction>[2]} */
  let editB;

  switch (scenario) {
    case 0: {
      // 同カード · テキスト — B の updatedAt が新しい
      editA = { type: 'card', patch: { cardId: CARD_A, text: `A-${i}`, updatedAt: base } };
      editB = { type: 'card', patch: { cardId: CARD_A, text: `B-${i}`, updatedAt: base + 1 } };
      break;
    }
    case 1: {
      // 同カード · テキスト — A が新しい
      editA = { type: 'card', patch: { cardId: CARD_A, text: `A-win-${i}`, updatedAt: base + 2 } };
      editB = { type: 'card', patch: { cardId: CARD_A, text: `B-lose-${i}`, updatedAt: base } };
      break;
    }
    case 2: {
      // 同カード · 移動 vs テキスト（別フィールド · 同 timestamp は後着拒否 → 先にマージした側が残る可能性）
      // 厳密 LWW はカード全体の updatedAt — 別 ts で検証
      editA = { type: 'card', patch: { cardId: CARD_A, x: 20 + i, updatedAt: base + 3 } };
      editB = { type: 'card', patch: { cardId: CARD_A, y: 30 + i, updatedAt: base + 5 } };
      break;
    }
    case 3: {
      // 別カード同時編集
      editA = { type: 'card', patch: { cardId: CARD_A, text: `only-A-${i}`, updatedAt: base + 1 } };
      editB = { type: 'card', patch: { cardId: CARD_B, text: `only-B-${i}`, updatedAt: base + 2 } };
      break;
    }
    case 4: {
      // 削除 vs 編集（同カード · 削除が新しければ削除勝ち）
      editA = { type: 'delete', cardId: CARD_A, updatedAt: base + 4 };
      editB = { type: 'card', patch: { cardId: CARD_A, text: `survive-${i}`, updatedAt: base + 2 } };
      break;
    }
    case 5: {
      // 編集 vs 削除（編集が新しければ残る）
      editA = { type: 'card', patch: { cardId: CARD_B, text: `keep-${i}`, updatedAt: base + 6 } };
      editB = { type: 'delete', cardId: CARD_B, updatedAt: base + 3 };
      break;
    }
    case 6: {
      // 削除 vs 削除（遅い tombstone が勝つ）
      editA = { type: 'delete', cardId: CARD_A, updatedAt: base + 1 };
      editB = { type: 'delete', cardId: CARD_A, updatedAt: base + 2 };
      break;
    }
    default: {
      // 削除後の復活試行（tombstone より古い add は却下）
      editA = { type: 'delete', cardId: CARD_A, updatedAt: base + 10 };
      editB = { type: 'card', patch: { cardId: CARD_A, text: `resurrect-${i}`, updatedAt: base + 5 } };
      break;
    }
  }

  const { stateA, stateB } = simulateConcurrentRound(synced, editA, editB);
  assertConverged(stateA, stateB, i, `scenario-${scenario}`);

  // 次ラウンドは収束結果から再開（A/B 同じ）
  synced = {
    cards: new Map(stateA.cards),
    tombstones: new Map(stateA.tombstones),
  };

  // カードが全滅したら次ラウンドで再シード
  if (synced.cards.size === 0 && i < ROUNDS - 1) {
    synced.tombstones = new Map();
  }
}

console.log(`sticky-room-lww-conflict.test.mjs: OK (${ROUNDS} rounds · A↔B simultaneous edit · converged)`);
