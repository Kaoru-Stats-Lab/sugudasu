#!/usr/bin/env node
import assert from 'node:assert/strict';
import { syncCopyGate, copyLatestTransform } from '../assets/sg-copy-feedback.js';

const check = { checked: false };
const btn = { disabled: true };

syncCopyGate({ gateEl: null, checkEl: check, copyBtn: btn, inputLines: 10, outputLines: 1 });
assert.equal(btn.disabled, true);

check.checked = true;
syncCopyGate({ gateEl: null, checkEl: check, copyBtn: btn, inputLines: 10, outputLines: 1 });
assert.equal(check.checked, true, 'checkbox must stay checked when user acknowledges');
assert.equal(btn.disabled, false);

let computeCalls = 0;
const gateCheck = { checked: false };
try {
  await copyLatestTransform({
    computeOutput: () => {
      computeCalls += 1;
      gateCheck.checked = false;
      return 'out';
    },
    buttonEl: null,
    gate: {
      checkEl: gateCheck,
      getInputLines: () => 5,
      getOutputLines: () => 1,
    },
  });
  assert.fail('expected gate error');
} catch (e) {
  assert.equal(e.message, 'gate');
  assert.equal(computeCalls, 0, 'computeOutput must not run when gate blocks');
}

console.log('sg-copy-feedback.test.mjs: all tests passed');
