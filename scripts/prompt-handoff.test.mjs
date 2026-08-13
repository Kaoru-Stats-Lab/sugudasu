#!/usr/bin/env node
/**
 * prompt-handoff — 単体テスト
 * Run: node scripts/prompt-handoff.test.mjs
 */
import assert from 'node:assert/strict';
import {
  PROMPT_PRESETS,
  ANTI_HALLUCINATION_LINES,
  buildHandoffPrompt,
} from '../assets/prompt-handoff.js';

assert.equal(Object.keys(PROMPT_PRESETS).length, 2);
assert.ok(PROMPT_PRESETS.table_explain);
assert.ok(PROMPT_PRESETS.diff_explain);
assert.ok(ANTI_HALLUCINATION_LINES.length >= 4);

{
  const empty = buildHandoffPrompt({ presetId: 'table_explain', paste: '' });
  assert.equal(empty.ok, false);
}

{
  const built = buildHandoffPrompt({
    presetId: 'table_explain',
    paste: 'name,age\nA,1',
    purpose: 'チーム共有',
  });
  assert.equal(built.ok, true);
  assert.ok(built.prompt.includes('入力に無い事実'));
  assert.ok(built.prompt.includes('列や行に現れない'));
  assert.ok(built.prompt.includes('name,age'));
  assert.ok(built.prompt.includes('チーム共有'));
  assert.ok(built.prompt.includes('# 制約'));
}

{
  const built = buildHandoffPrompt({
    presetId: 'diff_explain',
    paste: '- old\n+ new',
  });
  assert.equal(built.ok, true);
  assert.ok(built.prompt.includes('差分に現れない'));
  assert.ok(!built.prompt.includes('# 目的'));
}

console.log('prompt-handoff.test.mjs: OK');
