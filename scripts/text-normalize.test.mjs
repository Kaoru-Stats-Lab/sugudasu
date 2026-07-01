#!/usr/bin/env node
/**
 * 文字列正規化 — 単体テスト
 * Run: node scripts/text-normalize.test.mjs
 */
import assert from 'node:assert/strict';
import {
  countLines,
  isOverLineLimit,
  normalizeText,
  countChanges,
  hasLeadingZeroCodes,
  LINE_LIMIT,
  PRESET_DEFAULTS,
} from '../assets/text-normalize.js';
import { scanPasteWarnings } from '../assets/sg-paste-scan.js';

// 行数カウント
assert.equal(countLines(''), 0);
assert.equal(countLines('a'), 1);
assert.equal(countLines('a\nb\n'), 3);
assert.equal(countLines('a\nb'), 2);

// 500行 cap
{
  const text = Array.from({ length: 500 }, (_, i) => `row${i}`).join('\n');
  assert.equal(isOverLineLimit(text), false);
  const over = text + '\nrow500';
  assert.equal(isOverLineLimit(over), true);
  assert.equal(LINE_LIMIT, 500);
}

// 行数不変 · 英数半角
{
  const input = 'ＡＢＣ123\nＸＹＺ';
  const r = normalizeText(input, { preset: 'ec_form' });
  assert.equal(r.inputLines, r.outputLines);
  assert.equal(r.output, 'ABC123\nXYZ');
  assert.ok(r.changeCount > 0);
}

// 先頭ゼロ維持
{
  const r = normalizeText('00123\n00045', { preset: 'ec_form' });
  assert.equal(r.output, '00123\n00045');
  assert.ok(hasLeadingZeroCodes('00123'));
}

// 長音保護（ハイフン統一 ON）
{
  const r = normalizeText('レーザー\nＡ－Ｂ', { preset: 'csv_roster' });
  assert.ok(r.output.includes('レーザー'), 'katakana long vowel preserved');
  assert.ok(r.output.includes('A-B') || r.output.includes('Ａ-Ｂ'), 'dash normalized');
}

// タブ列維持
{
  const input = '姓\t名\n山田\t太郎';
  const r = normalizeText(input, { preset: 'csv_roster' });
  assert.ok(r.output.includes('\t'));
  assert.equal(r.inputLines, r.outputLines);
}

// 空白 trim（csv_roster）
{
  const r = normalizeText('  hello  \n  world  ', { preset: 'csv_roster' });
  assert.equal(r.output, 'hello\nworld');
}

// 全角英数プリセット
{
  const r = normalizeText('ABC-123', { preset: 'fullwidth_ascii' });
  assert.ok(r.output.includes('Ａ') || r.output.includes('Ｂ'));
}

// comma_join
{
  const r = normalizeText('a@x.com\nb@y.com\n', { preset: 'comma_join' });
  assert.equal(r.output, 'a@x.com,b@y.com');
  assert.equal(r.inputLines, 3);
  assert.equal(r.outputLines, 1);
  assert.equal(r.lineCountMatch, false);
}

// name_trim
{
  const r = normalizeText('山田　太郎\n山田 太郎', { preset: 'name_trim' });
  assert.equal(r.output, '山田太郎\n山田太郎');
  assert.equal(r.inputLines, r.outputLines);
}

// プリセット default toggles
assert.equal(PRESET_DEFAULTS.ec_form.hyphen, false);
assert.equal(PRESET_DEFAULTS.csv_roster.hyphen, true);
assert.equal(PRESET_DEFAULTS.comma_join.mode, 'comma_join');
assert.equal(PRESET_DEFAULTS.name_trim.mode, 'name_trim');

// トグル上書き
{
  const r = normalizeText('Ａ－Ｂ', {
    preset: 'ec_form',
    toggles: { hyphen: true },
  });
  assert.ok(r.output.includes('-'));
}

// countChanges
assert.equal(countChanges('abc', 'abc'), 0);
assert.equal(countChanges('abc', 'abd'), 1);

// paste scan — replacement char
{
  const s = scanPasteWarnings('正常\n欠落\uFFFD行');
  assert.ok(s.banners.some((b) => b.id === 'replacement'));
  assert.deepEqual(s.replacementLines, [2]);
}

// paste scan — leading zero flag
{
  const s = scanPasteWarnings('00123');
  assert.equal(s.hasLeadingZero, true);
}

console.log('text-normalize.test.mjs: all tests passed');
