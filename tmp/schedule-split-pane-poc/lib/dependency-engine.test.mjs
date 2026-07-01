import assert from 'node:assert/strict';
import { createSampleItems } from './sample-data.mjs';
import { wouldCreateCycle } from './dependency-engine.mjs';
import { applyOp } from './engine-stub.mjs';
import { dependenciesEnabled } from './view-preset.mjs';
import { addDays } from './dates.mjs';

function item(state, id) {
  return state.items.find((i) => i.id === id);
}

let s = createSampleItems();
assert.equal(dependenciesEnabled(s), false);
assert.ok(s.dependencies.length >= 4, 'sample has sequential deps per group');

// OFF: 終了日変更しても後続は動かない
const kussoOff = item(s, 'g1-kusso');
const kusakuStartBefore = item(s, 'g1-kusaku').start;
s = applyOp(s, {
  type: 'resize_bar',
  itemId: 'g1-kusso',
  edge: 'end',
  iso: addDays(kussoOff.end, 3),
});
assert.equal(item(s, 'g1-kusaku').start, kusakuStartBefore);

// ON: 同じ操作で後続が追随
s = applySample(s, { type: 'set_dependencies_enabled', enabled: true });
assert.equal(dependenciesEnabled(s), true);
const kussoOn = item(s, 'g1-kusso');
const kusakuStart = item(s, 'g1-kusaku').start;
s = applyOp(s, {
  type: 'resize_bar',
  itemId: 'g1-kusso',
  edge: 'end',
  iso: addDays(kussoOn.end, 3),
});
assert.notEqual(item(s, 'g1-kusaku').start, kusakuStart);

// 循環検出
assert.equal(wouldCreateCycle([{ from: 'a', to: 'b' }], 'b', 'a'), true);
assert.equal(wouldCreateCycle([{ from: 'a', to: 'b' }], 'a', 'c'), false);

console.log('dependency-engine.test.mjs OK');

function applySample(state, op) {
  return applyOp(state, op);
}
