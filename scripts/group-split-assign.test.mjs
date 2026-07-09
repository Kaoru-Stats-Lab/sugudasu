#!/usr/bin/env node
/**
 * group-split-assign-engine — 単体テスト
 * Run: node scripts/group-split-assign.test.mjs
 */
import assert from 'node:assert/strict';
import {
  POOL_ID,
  buildAssignFromInput,
  buildGreedyAssignment,
  createAssignState,
  exportAssignSnapshot,
  importAssignSnapshot,
  movePerson,
  parseAssignRosterText,
  parseSlotsText,
  prefScore,
  satisfactionPercent,
  slotStatus,
} from '../assets/group-split-assign-engine.js';

const SLOTS = `部署A\t4\n部署B\t2`;
const ROSTER = `氏名\t第1\t第2\t第3\n佐藤\t部署A\t部署B\t部署C\n田中\t部署B\t部署A\t部署C\n鈴木\t部署A\t部署A\t部署B`;

{
  const slots = parseSlotsText(SLOTS);
  assert.equal(slots.length, 2);
  assert.equal(slots[0].capacity, 4);
}

{
  const slots = parseSlotsText(SLOTS);
  const nameToId = new Map(slots.map((s) => [s.name, s.id]));
  const { people } = parseAssignRosterText(ROSTER, { slotNameToId: nameToId });
  assert.equal(people.length, 3);
  assert.equal(people[0].prefs[0], '部署A');
}

{
  const built = buildAssignFromInput(SLOTS, ROSTER, { preset: 'hr' });
  assert.equal(built.ok, true);
  const st = built.state;
  assert.ok(st.poolCount >= 0);
  assert.ok(satisfactionPercent(st) >= 0);
}

{
  const slots = parseSlotsText(SLOTS);
  const nameToId = new Map(slots.map((s) => [s.name, s.id]));
  const { people } = parseAssignRosterText(ROSTER, { slotNameToId: nameToId });
  people.forEach((p) => {
    p.prefRankBySlot = new Map();
    p.prefs.forEach((pref, i) => {
      const sid = nameToId.get(pref);
      if (sid) p.prefRankBySlot.set(sid, i + 1);
    });
  });
  let st = createAssignState({ slots, people });
  const person = people[0];
  const from = st.assignment.get(person.id);
  const { state: next, command } = movePerson(st, person.id, POOL_ID);
  assert.ok(command);
  assert.equal(next.poolCount, st.poolCount + (from === POOL_ID ? 0 : 1));
  st = next;
  const slotB = slots.find((s) => s.name === '部署B');
  const beforeB = st.slotCounts.get(slotB.id) || 0;
  const moved = movePerson(st, person.id, slotB.id);
  assert.equal(moved.state.slotCounts.get(slotB.id), beforeB + 1);
}

{
  const built = buildAssignFromInput(SLOTS, ROSTER);
  const json = exportAssignSnapshot(built.state);
  const restored = importAssignSnapshot(json);
  assert.equal(restored.people.length, built.state.people.length);
  assert.equal(restored.satisfactionTotal, built.state.satisfactionTotal);
}

{
  const slots = parseSlotsText('SKU-A\t2\t10\nSKU-B\t5\t3');
  const nameToId = new Map(slots.map((s) => [s.name, s.id]));
  const { people } = parseAssignRosterText('会員\tSKU-A\tSKU-B\n一般\tSKU-B\tSKU-A', { slotNameToId: nameToId });
  people.forEach((p) => {
    p.prefRankBySlot = new Map();
    p.prefs.forEach((pref, i) => {
      const sid = nameToId.get(pref);
      if (sid) p.prefRankBySlot.set(sid, i + 1);
    });
  });
  const st = createAssignState({ slots, people });
  const a = slotStatus(st, slots[0].id);
  assert.ok(a.capacity === 2);
}

console.log('group-split-assign.test.mjs: OK');
