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
  applyLineOperations,
  hasLineOps,
  formatLineOpsBanner,
  buildPreviewDiff,
  highlightLineDiffHtml,
  maskEmailLocal,
  maskNamePart,
  formatMaskBanner,
  parseNormalizeDate,
  formatDateUnifyBanner,
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

// sql_in
{
  const r = normalizeText('user_a\nuser_b\n', { preset: 'sql_in' });
  assert.equal(r.output, "'user_a', 'user_b'");
  assert.equal(r.outputLines, 1);
}
{
  const r = normalizeText("O'Brien\n00234", { preset: 'sql_in' });
  assert.equal(r.output, "'O''Brien', '00234'");
}
{
  const r = normalizeText('a\tb\nc', { preset: 'sql_in' });
  assert.equal(r.output, "'a', 'b', 'c'");
}

// tab_to_comma
{
  const r = normalizeText('a\tb\nc\td', { preset: 'tab_to_comma' });
  assert.equal(r.output, 'a,b,c,d');
  assert.equal(r.outputLines, 1);
}
{
  const r = normalizeText('Ａ\tＢ', { preset: 'tab_to_comma' });
  assert.equal(r.output, 'A,B');
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
assert.equal(PRESET_DEFAULTS.sql_in.mode, 'sql_in');
assert.equal(PRESET_DEFAULTS.tab_to_comma.mode, 'tab_to_comma');
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

// Phase C — line sort (string)
{
  const r = normalizeText('b\na\nc', {
    preset: 'ec_form',
    toggles: { ascii: false, space: false, hyphen: false },
    lineOps: { sort: { enabled: true, direction: 'asc' } },
  });
  assert.equal(r.output, 'a\nb\nc');
}

// Phase C — line sort (numeric)
{
  const r = normalizeText('10\n2\n1', {
    preset: 'ec_form',
    toggles: { ascii: false, space: false, hyphen: false },
    lineOps: { sort: { enabled: true, direction: 'asc', numeric: true } },
  });
  assert.equal(r.output, '1\n2\n10');
}

// Phase C — dedupe exact
{
  const r = normalizeText('a\na\nb', {
    preset: 'ec_form',
    toggles: { ascii: false, space: false, hyphen: false },
    lineOps: { dedupe: { enabled: true } },
  });
  assert.equal(r.output, 'a\nb');
  assert.equal(r.outputLines, 2);
  assert.equal(r.lineCountMatch, false);
}

// Phase C — dedupe ignore case/width
{
  const r = normalizeText('A\nＡ\nb', {
    preset: 'ec_form',
    toggles: { ascii: false, space: false, hyphen: false },
    lineOps: { dedupe: { enabled: true, ignoreCaseWidth: true } },
  });
  assert.equal(r.output, 'A\nb');
}

// Phase C — filter include
{
  const r = normalizeText('foo@x.com\nbar@y.com\nfoo@test.com', {
    preset: 'ec_form',
    toggles: { ascii: false, space: false, hyphen: false },
    lineOps: { filter: { enabled: true, keyword: '@x.com', mode: 'include' } },
  });
  assert.equal(r.output, 'foo@x.com');
}

// Phase C — filter exclude
{
  const r = normalizeText('ok\nskip me\nfine', {
    preset: 'ec_form',
    toggles: { ascii: false, space: false, hyphen: false },
    lineOps: { filter: { enabled: true, keyword: 'skip', mode: 'exclude' } },
  });
  assert.equal(r.output, 'ok\nfine');
}

// Phase C — sql_in with dedupe before join
{
  const r = normalizeText('a\na\nb', {
    preset: 'sql_in',
    lineOps: { dedupe: { enabled: true } },
  });
  assert.equal(r.output, "'a', 'b'");
}

assert.equal(hasLineOps({ sort: { enabled: true } }), true);
assert.equal(hasLineOps({}), false);
assert.deepEqual(
  applyLineOperations(['c', 'b', 'a'], { sort: { enabled: true } }).lines,
  ['a', 'b', 'c'],
);

// Phase C — line ops stats
{
  const r = applyLineOperations(['a', 'a', 'b'], { dedupe: { enabled: true } });
  assert.equal(r.stats.dedupeRemoved, 1);
  assert.deepEqual(r.lines, ['a', 'b']);
}
{
  const r = applyLineOperations(['keep', 'drop', 'keep2'], {
    filter: { enabled: true, keyword: 'keep', mode: 'include' },
  });
  assert.equal(r.stats.filteredRemoved, 1);
  assert.deepEqual(r.lines, ['keep', 'keep2']);
}
{
  const r = normalizeText('a\na\nskip\nb', {
    preset: 'ec_form',
    toggles: { ascii: false, space: false, hyphen: false },
    lineOps: {
      filter: { enabled: true, keyword: 'skip', mode: 'exclude' },
      dedupe: { enabled: true },
    },
  });
  assert.equal(r.lineOpsStats.filteredRemoved, 1);
  assert.equal(r.lineOpsStats.dedupeRemoved, 1);
  assert.equal(r.lineOpsAfterLines, 2);
}
assert.equal(
  formatLineOpsBanner({ inputLines: 10, lineOpsAfterLines: 7, lineOpsStats: { filteredRemoved: 0, dedupeRemoved: 3, emptyRemoved: 0 } }),
  '重複行を 3 件削除（10 行 → 7 行）',
);

// Phase C — trim + remove empty
{
  const r = normalizeText('  a  \n\nb', {
    preset: 'ec_form',
    toggles: { ascii: false, space: false, hyphen: false },
    lineOps: { trim: { enabled: true }, removeEmpty: { enabled: true } },
  });
  assert.equal(r.output, 'a\nb');
  assert.equal(r.lineOpsStats.emptyRemoved, 1);
}

// preview diff
{
  const rows = buildPreviewDiff('ＡＢＣ\nxyz', 'ABC\nxyz', 5);
  assert.equal(rows[0].changed, true);
  assert.equal(rows[1].changed, false);
  assert.ok(highlightLineDiffHtml('Ａ', 'A').includes('<mark'));
}

// paste scan — header row (A03)
{
  const s = scanPasteWarnings('名前\n山田\n佐藤');
  assert.ok(s.banners.some((b) => b.id === 'header-row'));
  assert.equal(s.hasHeaderRow, true);
}

// paste scan — control chars (E01)
{
  const s = scanPasteWarnings('ok\nbad\u0001line');
  assert.ok(s.banners.some((b) => b.id === 'control-chars'));
  assert.deepEqual(s.controlLines, [2]);
}

// Phase D — mask email (legacy preset id)
{
  const r = normalizeText('yamada.taro@example.com\nnot-an-email', { preset: 'mask_email' });
  assert.equal(r.output, 'ya***@example.com\nnot-an-email');
  assert.equal(r.lineCountMatch, true);
  assert.equal(r.maskStats.maskedLines, 1);
  assert.equal(r.maskOpsApplied, true);
}

// Phase D — maskOps multi-select
{
  const r = normalizeText('yamada.taro@example.com\n090-1234-5678', {
    preset: 'ec_form',
    toggles: { ascii: false, space: false, hyphen: false },
    maskOps: { email: true, phone: true },
  });
  assert.equal(r.output, 'ya***@example.com\n090-****-5678');
  assert.equal(r.maskStats.maskedLines, 2);
}
assert.equal(maskEmailLocal('a@x.com'), 'a***@x.com');
assert.equal(maskEmailLocal('ab@x.com'), 'ab***@x.com');

// Phase D — mask phone
{
  const r = normalizeText('090-1234-5678', { preset: 'mask_phone' });
  assert.equal(r.output, '090-****-5678');
}
{
  const r = normalizeText('09012345678', { preset: 'mask_phone' });
  assert.equal(r.output, '090****5678');
}

// Phase D — mask name
{
  const r = normalizeText('山田 太郎', { preset: 'mask_name' });
  assert.equal(r.output, '山* 太*');
}
assert.equal(maskNamePart('山田'), '山*');

// date_unify preset
{
  assert.equal(parseNormalizeDate('2026/7/1').value, '2026/07/01');
  assert.equal(parseNormalizeDate('2026-07-01').value, '2026/07/01');
  assert.equal(parseNormalizeDate('2026.7.11').value, '2026/07/11');
  assert.equal(parseNormalizeDate('2026年7月11日').value, '2026/07/11');
  assert.equal(parseNormalizeDate('R8/7/11').value, '2026/07/11');
  assert.equal(parseNormalizeDate('令和8年7月11日').value, '2026/07/11');

  const yy = parseNormalizeDate('26/7/11');
  assert.equal(yy.ok, true);
  assert.equal(yy.value, '2026/07/11');
  assert.ok(yy.warning);

  const md = parseNormalizeDate('7/11', { now: new Date(2026, 0, 1) });
  assert.equal(md.ok, true);
  assert.equal(md.value, '2026/07/11');
  assert.ok(md.warning);

  const serial = parseNormalizeDate('46210');
  assert.equal(serial.ok, false);
  assert.equal(serial.value, '46210');
  assert.ok(serial.error);

  const junk = parseNormalizeDate('ABC123');
  assert.equal(junk.ok, false);
  assert.equal(junk.value, 'ABC123');

  const heisei = parseNormalizeDate('平成30年7月11日');
  assert.equal(heisei.ok, false);
  assert.equal(heisei.value, '平成30年7月11日');

  const batch = normalizeText('2026/7/1\n46210\nR8/7/11\n平成30年1月1日', { preset: 'date_unify' });
  assert.equal(batch.output, '2026/07/01\n46210\n2026/07/11\n平成30年1月1日');
  assert.equal(batch.dateStats.ok, 2);
  assert.equal(batch.dateStats.error, 2);
  assert.equal(batch.lineCountMatch, true);
  assert.ok(formatDateUnifyBanner(batch).includes('失敗'));
  assert.equal(PRESET_DEFAULTS.date_unify.mode, 'date_unify');
}

assert.equal(formatMaskBanner({ preset: 'ec_form', maskOpsApplied: true, maskStats: { maskedLines: 3 } }), '3 行に伏字を適用しました（行数は変わりません）');

console.log('text-normalize.test.mjs: all tests passed');
