#!/usr/bin/env node
/**
 * slot-board-engine — 単体テスト
 * Run: node scripts/slot-board-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  parsePasteRows,
  parseBox1Rules,
  parseBox2Candidates,
  encodeRestoreCode,
  decodeRestoreCode,
  buildStateFromRows,
  deleteLaneMovingToUnknown,
  computeLaneStats,
  isAllWithinLimits,
  moveCandidate,
  undoLast,
  createEmptyProject,
  exportProjectJson,
  importProjectJson,
  buildOutputText,
  UNKNOWN_LANE,
  CODE_PREFIX,
  SCHEMA_VERSION,
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
  const rules = parseBox1Rules('最優秀賞=1\n優秀賞:3\nS\t2\n');
  assert.equal(rules.length, 3);
  assert.equal(rules[0].title, '最優秀賞');
  assert.equal(rules[0].capacity, 1);
  assert.equal(rules[1].capacity, 3);
  assert.equal(rules[2].title, 'S');
  assert.equal(rules[2].capacity, 2);
}

{
  const rows = parseBox2Candidates('太郎\n花子\t理由');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, '太郎');
  assert.equal(rows[1].rawText.includes('理由'), true);
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
  assert.equal(decoded.state.lanes.length, state.lanes.length);
  assert.equal(decoded.state.candidates.length, state.items.length);
}

{
  const project = createEmptyProject();
  const lanes = [
    { id: 'a', projectId: project.id, title: 'S', capacity: 1, order: 0 },
    { id: 'b', projectId: project.id, title: 'A', capacity: 10, order: 1 },
  ];
  const candidates = [
    { id: '1', projectId: project.id, name: 'x', laneId: 'a', status: 'assigned', rawText: 'x', order: 0, isMaskedOverride: null },
    { id: '2', projectId: project.id, name: 'y', laneId: 'a', status: 'assigned', rawText: 'y', order: 1, isMaskedOverride: null },
  ];
  const stats = computeLaneStats(lanes, candidates);
  assert.equal(stats[0].over, 1);
  assert.equal(isAllWithinLimits(stats), false);
  lanes[0].capacity = null;
  assert.equal(isAllWithinLimits(computeLaneStats(lanes, candidates)), true);
}

{
  const project = createEmptyProject();
  let lanes = [
    { id: 's', projectId: project.id, title: 'S', capacity: 3, order: 0 },
  ];
  let candidates = [
    {
      id: '1',
      projectId: project.id,
      name: '佐藤',
      laneId: null,
      status: 'pool',
      rawText: '佐藤',
      order: 0,
      isMaskedOverride: null,
    },
  ];
  let historyLogs = [];
  const moved = moveCandidate(
    { project, lanes, candidates, historyLogs },
    '1',
    'assigned',
    's'
  );
  assert.ok(moved);
  candidates = moved.candidates;
  historyLogs = moved.historyLogs;
  assert.equal(candidates[0].status, 'assigned');
  assert.equal(historyLogs.length, 1);

  const undone = undoLast({ project, lanes, candidates, historyLogs });
  assert.ok(undone);
  assert.equal(undone.candidates[0].status, 'pool');
  assert.equal(undone.historyLogs.length, 0);
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
  assert.ok(next.lanes.some((l) => l.name === UNKNOWN_LANE || l.title === UNKNOWN_LANE));
}

{
  const project = createEmptyProject('テスト');
  const lanes = [{ id: 'l1', projectId: project.id, title: 'S', capacity: 2, order: 0 }];
  const candidates = [
    {
      id: 'c1',
      projectId: project.id,
      laneId: 'l1',
      status: 'assigned',
      name: 'A',
      rawText: 'A',
      order: 0,
      isMaskedOverride: null,
    },
  ];
  const json = exportProjectJson({ project, lanes, candidates, historyLogs: [] });
  const imported = importProjectJson(json);
  assert.notEqual(imported.project.id, project.id);
  assert.notEqual(imported.lanes[0].id, 'l1');
  assert.equal(imported.candidates[0].name, 'A');
  assert.equal(imported.candidates[0].status, 'assigned');
  assert.equal(imported.lanes[0].title, 'S');

  const ppt = buildOutputText(imported.candidates, imported.lanes, { assigned: true }, 'ppt');
  assert.ok(ppt.includes('S'));
  assert.ok(ppt.includes('\tA'));
}

assert.equal(SCHEMA_VERSION, 2);
console.log('slot-board-engine.test.mjs: OK');
