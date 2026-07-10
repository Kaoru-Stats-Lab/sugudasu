#!/usr/bin/env node
/**
 * sticky-room-sync — LWW 単体テスト
 * Run: npm run test:sticky-room
 */
import assert from 'node:assert/strict';
import {
  applyRemoteCard,
  applyRemoteCardDelete,
  buildRoomUrl,
  createCard,
  createCardAddMessage,
  createCardDeleteMessage,
  createCardEditMessage,
  createCardMoveMessage,
  replyToDcMessage,
  removeLocalCard,
  shouldApplyRemote,
  shouldApplyRemoteDelete,
  shouldHandleSignal,
  transitionConnState,
  upsertLocalCard,
  formatConnStats,
  formatTtlRemaining,
  computeRoomExpiresAt,
  getTtlRemainingMs,
  isRoomExpired,
  ROOM_TTL_MS,
  isValidStickyCard,
  formatBoardJson,
  formatBoardMarkdown,
  formatBoardTsv,
  buildAutosavePayload,
  parseAutosavePayload,
  parseBoardImportJson,
  computeStageHeight,
  computeMaxBottom,
  updateCachedMaxBottom,
  stageHeightFromMaxBottom,
  CARD_HEIGHT,
  STAGE_BOTTOM_PAD,
  MIN_STAGE_HEIGHT,
  findFreeGridSlot,
  buildOccupiedGridSet,
  findFreeGridIndexFromSet,
  getGridCols,
  gridSlotToXY,
  layoutCardsInGrid,
  layoutCardsInGridAtOrigin,
  snapOriginYToGrid,
  BOARD_PAD,
  createHeading,
  isHeadingCard,
  isStickyKind,
  cardBottom,
  HEADING_HEIGHT,
  parseRoomUrl,
  parseRoomDcMessage,
} from '../assets/sticky-room-sync.js';

{
  const a = createCard({ cardId: 'c1', x: 0, y: 0, updatedAt: 100 });
  const b = createCard({ cardId: 'c1', x: 10, y: 10, updatedAt: 200 });
  assert.equal(shouldApplyRemote(a, b), true);
  assert.equal(shouldApplyRemote(b, a), false);
}

{
  let cards = new Map();
  const local = createCard({ cardId: 'c1', text: 'local', updatedAt: 500 });
  cards = upsertLocalCard(cards, local);

  const stale = createCard({ cardId: 'c1', text: 'stale', updatedAt: 100 });
  cards = applyRemoteCard(cards, stale);
  assert.equal(cards.get('c1').text, 'local');

  const newer = createCard({ cardId: 'c1', text: 'remote', updatedAt: 900 });
  cards = applyRemoteCard(cards, newer);
  assert.equal(cards.get('c1').text, 'remote');
}

{
  let cards = new Map();
  const remote = createCard({ cardId: 'c2', text: 'new', updatedAt: 50 });
  cards = applyRemoteCard(cards, remote);
  assert.equal(cards.size, 1);
  assert.equal(cards.get('c2').text, 'new');
}

{
  let cards = new Map();
  cards = upsertLocalCard(cards, { cardId: 'c3', x: 5, y: 7 });
  const c = cards.get('c3');
  assert.equal(c.x, 5);
  assert.equal(c.y, 7);
  assert.ok(c.updatedAt > 0);
}

{
  const parsed = parseRoomUrl('?r=abc123&role=host');
  assert.equal(parsed.roomId, 'abc123');
  assert.equal(parsed.role, 'host');
  assert.equal(buildRoomUrl('abc123', 'host'), '?r=abc123&role=host');
}

{
  const me = 'peer-a';
  assert.equal(shouldHandleSignal({ type: 'join', peerId: me }, me), false);
  assert.equal(shouldHandleSignal({ type: 'offer', from: 'b', to: me }, me), true);
  assert.equal(shouldHandleSignal({ type: 'offer', from: 'b', to: 'other' }, me), false);
}

{
  assert.equal(
    transitionConnState('joining', { anyConnected: true, anyConnecting: false, anyFailed: false, waiting: false }),
    'connected'
  );
  assert.equal(
    transitionConnState('hosting', { anyConnected: false, anyConnecting: false, anyFailed: true, waiting: true }),
    'ice-failed'
  );
}

{
  const text = formatConnStats({ connectAttempts: 2, connectSuccesses: 1, iceFailures: 1, reconnectAttempts: 3, connectedPeers: 1, lastError: null });
  assert.match(text, /試行 2/);
  assert.match(text, /ICE失敗 1/);
}

{
  assert.deepEqual(replyToDcMessage({ type: 'ping', id: 7 }), { type: 'pong', id: 7 });
  assert.equal(replyToDcMessage({ type: 'ping', id: 1.5 }), null);
  assert.equal(replyToDcMessage({ type: 'card', id: 1 }), null);
  assert.deepEqual(parseRoomDcMessage('{"type":"ping","id":3}'), { type: 'ping', id: 3 });
  assert.equal(parseRoomDcMessage('{"type":"card","id":1}'), null);
}

{
  const card = createCard({ cardId: 'x1', text: 'hello' });
  assert.ok(isValidStickyCard(card));
  const msg = createCardAddMessage(card);
  assert.equal(msg.type, 'card-add');
  const parsed = parseRoomDcMessage(JSON.stringify(msg));
  assert.deepEqual(parsed, msg);
}

{
  const card = createCard({ cardId: 'm1', x: 10, y: 20 });
  const moveMsg = createCardMoveMessage(card);
  assert.equal(moveMsg.type, 'card-move');
  assert.deepEqual(parseRoomDcMessage(JSON.stringify(moveMsg)), moveMsg);
}

{
  const card = createCard({ cardId: 'e1', text: 'edited' });
  const editMsg = createCardEditMessage(card);
  assert.equal(editMsg.type, 'card-edit');
  assert.deepEqual(parseRoomDcMessage(JSON.stringify(editMsg)), editMsg);
}

{
  let cards = new Map();
  const local = createCard({ cardId: 'r1', x: 0, y: 0, updatedAt: 100 });
  cards = applyRemoteCard(cards, local);
  const moved = createCard({ cardId: 'r1', x: 50, y: 60, updatedAt: 200 });
  cards = applyRemoteCard(cards, moved);
  assert.equal(cards.get('r1').x, 50);
  assert.equal(cards.get('r1').y, 60);
}

{
  let cards = new Map();
  const local = createCard({ cardId: 'r2', text: 'old', updatedAt: 100 });
  cards = applyRemoteCard(cards, local);
  const edited = createCard({ cardId: 'r2', text: 'new', updatedAt: 300 });
  cards = applyRemoteCard(cards, edited);
  assert.equal(cards.get('r2').text, 'new');
}

{
  const local = createCard({ cardId: 'd1', updatedAt: 100 });
  assert.equal(shouldApplyRemoteDelete(local, 200), true);
  assert.equal(shouldApplyRemoteDelete(local, 50), false);
}

{
  let cards = new Map();
  let tombstones = new Map();
  cards = applyRemoteCard(cards, createCard({ cardId: 'd1', updatedAt: 100 }));
  const del = { cardId: 'd1', updatedAt: 200 };
  const result = applyRemoteCardDelete(cards, tombstones, del);
  assert.equal(result.applied, true);
  assert.equal(result.cards.has('d1'), false);
  assert.equal(result.tombstones.get('d1'), 200);
}

{
  let cards = new Map();
  let tombstones = new Map();
  cards = applyRemoteCard(cards, createCard({ cardId: 'd2', text: 'keep', updatedAt: 500 }));
  const staleDel = applyRemoteCardDelete(cards, tombstones, { cardId: 'd2', updatedAt: 100 });
  assert.equal(staleDel.applied, false);
  assert.equal(staleDel.cards.get('d2').text, 'keep');
}

{
  let cards = new Map();
  let tombstones = new Map();
  cards = applyRemoteCard(cards, createCard({ cardId: 'd3', updatedAt: 100 }));
  const removed = removeLocalCard(cards, tombstones, 'd3', 200);
  cards = removed.cards;
  tombstones = removed.tombstones;
  const resurrect = applyRemoteCard(cards, createCard({ cardId: 'd3', text: 'nope', updatedAt: 150 }), tombstones);
  assert.equal(resurrect.has('d3'), false);
}

{
  let cards = new Map();
  let tombstones = new Map();
  cards = applyRemoteCard(cards, createCard({ cardId: 'd3b', updatedAt: 100 }));
  const removed = removeLocalCard(cards, tombstones, 'd3b', 200);
  cards = removed.cards;
  tombstones = removed.tombstones;
  cards = applyRemoteCard(cards, createCard({ cardId: 'd3b', text: 'back', updatedAt: 300 }), tombstones);
  assert.equal(cards.get('d3b').text, 'back');
  assert.equal(tombstones.has('d3b'), false);
}

{
  const delMsg = createCardDeleteMessage({ cardId: 'd4', updatedAt: 99 });
  assert.equal(delMsg.type, 'card-delete');
  assert.deepEqual(parseRoomDcMessage(JSON.stringify(delMsg)), delMsg);
}

{
  const now = 1_700_000_000_000;
  assert.equal(computeRoomExpiresAt(now), now + ROOM_TTL_MS);
  assert.equal(getTtlRemainingMs(now + 90_000, now), 90_000);
  assert.equal(getTtlRemainingMs(now + 90_000, now + 90_000), 0);
  assert.equal(isRoomExpired(now + 1, now + 2), true);
  assert.equal(isRoomExpired(now + 10, now), false);
  assert.equal(formatTtlRemaining(0), '0:00');
  assert.equal(formatTtlRemaining(65_000), '1:05');
  assert.equal(formatTtlRemaining(3_661_000), '1:01:01');
}

{
  let cards = new Map();
  cards = upsertLocalCard(cards, createCard({ cardId: 'e1', text: 'A', color: 'pink', x: 10, y: 20 }));
  cards = upsertLocalCard(cards, createCard({ cardId: 'e2', text: 'B\nline', color: 'blue', x: 5, y: 5 }));

  const json = JSON.parse(formatBoardJson(cards));
  assert.equal(json.version, 1);
  assert.equal(json.cards.length, 2);
  assert.equal(json.cards[0].cardId, 'e2');

  const md = formatBoardMarkdown(cards);
  assert.match(md, /^- B line/);
  assert.match(md, /- A/);

  const tsv = formatBoardTsv(cards);
  assert.equal(tsv.split('\n')[0], 'kind\ttext\tcolor\tx\ty');
  assert.match(tsv, /sticky\tB line\tblue\t5\t5/);

  const tombstones = new Map([['gone', 999]]);
  const saved = buildAutosavePayload(cards, tombstones, 'green');
  assert.equal(saved.version, 1);
  assert.equal(saved.selectedColor, 'green');
  const restored = parseAutosavePayload(saved);
  assert.ok(restored);
  assert.equal(restored.cards.size, 2);
  assert.equal(restored.tombstones.get('gone'), 999);
  assert.equal(restored.selectedColor, 'green');

  const exported = JSON.parse(formatBoardJson(cards));
  const imported = parseBoardImportJson(exported);
  assert.ok(imported);
  assert.equal(imported.cards.size, 2);
  assert.equal(imported.cards.get('e1')?.text, 'A');
  assert.equal(imported.tombstones.size, 0);
}

{
  const w = 520;
  assert.ok(getGridCols(w) >= 2);
  const a = gridSlotToXY(0, w);
  const b = gridSlotToXY(1, w);
  assert.ok(a.x < b.x);
  assert.equal(a.y, b.y);

  let cards = new Map();
  cards = upsertLocalCard(cards, createCard({ cardId: 'g1', x: a.x, y: a.y }));
  const free = findFreeGridSlot(cards, w);
  assert.equal(free.x, b.x);
  assert.equal(free.y, b.y);
  assert.equal(free.index, 1);

  const occupied = buildOccupiedGridSet(cards, w);
  occupied.add(free.index);
  const free2 = findFreeGridSlot(cards, w, occupied, free.index);
  assert.equal(free2.index, 2);
  assert.equal(findFreeGridIndexFromSet(occupied, 0), 2);

  const laid = layoutCardsInGrid(
    [
      createCard({ cardId: 'z', x: 500, y: 400, text: 'z' }),
      createCard({ cardId: 'a', x: 10, y: 10, text: 'a' }),
    ],
    w,
    1000,
  );
  assert.equal(laid[0].cardId, 'a');
  assert.equal(laid[0].x, a.x);
  assert.equal(laid[0].y, a.y);

  const originY = snapOriginYToGrid(400);
  const fit = layoutCardsInGridAtOrigin(
    [
      createCard({ cardId: 'f1', x: 10, y: 900 }),
      createCard({ cardId: 'f2', x: 20, y: 950 }),
    ],
    w,
    400,
    2000,
  );
  assert.equal(fit[0].y, originY);
  assert.equal(fit[0].x, a.x);
  assert.equal(fit[1].x, b.x);
  assert.equal(fit[1].y, originY);
  const cols = getGridCols(w);
  const fitWrap = layoutCardsInGridAtOrigin(
    Array.from({ length: cols + 1 }, (_, i) =>
      createCard({ cardId: `r${i}`, x: i * 10, y: 900 + i }),
    ),
    w,
    400,
    2000,
  );
  assert.ok(fitWrap[cols].y > fitWrap[0].y);
  assert.equal(snapOriginYToGrid(0), BOARD_PAD);

  const heading = createHeading({ cardId: 'h1', x: 10, y: 20, text: '課題' });
  assert.equal(heading.kind, 'heading');
  assert.equal(heading.color, 'black');
  assert.equal(isHeadingCard(heading), true);
  assert.equal(isStickyKind(heading), false);
  assert.equal(cardBottom(heading), 20 + HEADING_HEIGHT);

  const mixed = layoutCardsInGrid(
    [
      createCard({ cardId: 's1', x: 500, y: 400 }),
      createHeading({ cardId: 'h2', x: 10, y: 10, text: '営業' }),
      createCard({ cardId: 's2', x: 10, y: 10 }),
    ],
    w,
    3000,
  );
  assert.equal(mixed.length, 2);
  assert.ok(mixed.every((c) => c.kind === 'sticky'));
  assert.equal(mixed[0].cardId, 's2');

  const occ = buildOccupiedGridSet(
    [createHeading({ cardId: 'h3', x: a.x, y: a.y }), createCard({ cardId: 's3', x: a.x, y: a.y })],
    w,
  );
  assert.equal(occ.has(0), true);
  assert.equal(occ.size, 1);

  assert.equal(
    formatBoardMarkdown(
      new Map([
        ['h', createHeading({ cardId: 'h', text: '課題', y: 0 })],
        ['s', createCard({ cardId: 's', text: 'メモ', y: 100 })],
      ]),
    ),
    '## 課題\n- メモ',
  );

  assert.equal(
    computeStageHeight(new Map([['z', createCard({ cardId: 'z', y: 400 })]])),
    400 + CARD_HEIGHT + STAGE_BOTTOM_PAD,
  );

  {
    let cached = 0;
    cached = updateCachedMaxBottom(cached, 0, 100).maxBottom;
    assert.equal(cached, 100);
    let r = updateCachedMaxBottom(cached, 50, 80);
    assert.equal(r.needsRescan, false);
    assert.equal(r.maxBottom, 100);
    r = updateCachedMaxBottom(cached, 100, 60);
    assert.equal(r.needsRescan, true);
    r = updateCachedMaxBottom(cached, 100);
    assert.equal(r.needsRescan, true);
    r = updateCachedMaxBottom(cached, 40);
    assert.equal(r.needsRescan, false);
    assert.equal(stageHeightFromMaxBottom(100), MIN_STAGE_HEIGHT);
    assert.equal(stageHeightFromMaxBottom(400), 400 + STAGE_BOTTOM_PAD);
  }
}

console.log('sticky-room-sync.test.mjs: OK');
