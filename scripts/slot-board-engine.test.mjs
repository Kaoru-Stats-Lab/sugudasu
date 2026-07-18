#!/usr/bin/env node
/**
 * slot-board-engine — 単体テスト
 * Run: node scripts/slot-board-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  parsePasteRows,
  encodeRestoreCode,
  decodeRestoreCode,
  buildStateFromRows,
  deleteLaneMovingToUnknown,
  computeLaneStats,
  isAllWithinLimits,
  UNKNOWN_LANE,
  CODE_PREFIX,
} from '../assets/slot-board-engine.js';

{
  const rows = parsePasteRows('佐藤\tS\n鈴木\n壊れた行だけ\n');
  assert.equal(rows.length, 3);
  assert.equal(rows[0].name, '佐藤');
  assert.equal(rows[0].laneName, 'S');
  assert.equal(rows[1].laneName, UNKNOWN_LANE);
  assert.equal(rows[2].laneName, UNKNOWN_LANE);
}

{
  const rows = parsePasteRows('太郎\tA\n花子\tB');
  const state = buildStateFromRows(rows);
  assert.equal(state.items.length, 2);
  state.lanes[0].limit = 1;
  const code = encodeRestoreCode(state);
  assert.ok(code.startsWith(CODE_PREFIX));
  const decoded = decodeRestoreCode(code);
  assert.equal(decoded.ok, true);
  assert.equal(decoded.state.version, 1);
  assert.equal(decoded.state.lanes.length, state.lanes.length);
  assert.equal(decoded.state.items.length, state.items.length);
  assert.deepEqual(
    decoded.state.lanes.map((l) => ({ name: l.name, limit: l.limit })),
    state.lanes.map((l) => ({ name: l.name, limit: l.limit }))
  );
  assert.deepEqual(
    decoded.state.items.map((i) => i.name),
    state.items.map((i) => i.name)
  );
  assert.deepEqual(
    decoded.state.items.map((i) => i.laneId),
    state.items.map((i) => i.laneId)
  );
}

{
  const lanes = [
    { id: 'a', name: 'S', limit: 1 },
    { id: 'b', name: 'A', limit: 10 },
  ];
  const items = [
    { id: '1', name: 'x', laneId: 'a' },
    { id: '2', name: 'y', laneId: 'a' },
  ];
  const stats = computeLaneStats(lanes, items);
  assert.equal(stats[0].over, 1);
  assert.equal(isAllWithinLimits(stats), false);
  lanes[0].limit = null;
  assert.equal(isAllWithinLimits(computeLaneStats(lanes, items)), true);
}

{
  const lanes = [
    { id: 's', name: 'S', limit: 3 },
    { id: 'a', name: 'A', limit: null },
  ];
  const items = [
    { id: '1', name: '佐藤', laneId: 's' },
    { id: '2', name: '鈴木', laneId: 's' },
  ];
  const next = deleteLaneMovingToUnknown(lanes, items, 's');
  assert.equal(next.items.length, 2);
  assert.ok(next.lanes.some((l) => l.name === UNKNOWN_LANE));
  const unk = next.lanes.find((l) => l.name === UNKNOWN_LANE);
  assert.ok(next.items.every((it) => it.laneId === unk.id));
}

console.log('slot-board-engine.test.mjs: OK');
