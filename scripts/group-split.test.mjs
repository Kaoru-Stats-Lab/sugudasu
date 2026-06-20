#!/usr/bin/env node
/**
 * group-split — 単体テスト
 * Run: node scripts/group-split.test.mjs
 */
import assert from 'node:assert/strict';
import {
  ROSTER_MAX,
  ROSTER_SOFT_WARN,
  SLACK_CHAR_SAFE,
  assessOutputLimits,
  assignRoundRobin,
  createDeterministicRandomFn,
  formatAnnounce,
  formatSlack,
  formatTsvLong,
  formatTsvWide,
  parseRosterText,
  resolveGroupCount,
  runGroupSplit,
  seededFullShuffle,
  validateSplitInput,
  resolveGroupsPreviewLayout,
} from '../assets/group-split.js';
import { parseTableText } from '../assets/group-split-columns.js';
import {
  appendConstraintLine,
  countNameConstraints,
  formatConstraintSummary,
  formatPairLine,
} from '../assets/group-split-constraint-form.js';

const SEED = '0123456789abcdef0123456789abcdef';

function membersFlat(result) {
  return result.groups.flatMap((g) => g.members);
}

// 名簿パース · 空行除外
{
  const p = parseRosterText('田中\n\n佐藤 \n');
  assert.deepEqual(p.lines, ['田中', '佐藤']);
  assert.equal(p.duplicates.length, 0);
}

// 重複検出（削除しない）
{
  const p = parseRosterText('A\nB\nA');
  assert.equal(p.lines.length, 3);
  assert.deepEqual(p.duplicates, ['A']);
}

// グループ数 — perSize
assert.equal(resolveGroupCount('perSize', 10, 4), 3);
assert.equal(resolveGroupCount('perSize', 8, 4), 2);

// グループ数 — groupCount
assert.equal(resolveGroupCount('groupCount', 10, 5), 5);

// バリデーション — 最小人数
{
  const v = validateSplitInput(['a', 'b', 'c'], 'groupCount', 3);
  assert.equal(v.ok, false);
  assert.equal(v.code, 'min_size');
}

// ラウンドロビン — 人数差最大1
{
  const names = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const groups = assignRoundRobin(names, 3);
  assert.deepEqual(groups.map((g) => g.length), [4, 3, 3]);
}

// 再現性 — 同一シード
{
  const roster = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const a = await runGroupSplit(roster, { mode: 'groupCount', param: 4, seedHex: SEED });
  const b = await runGroupSplit(roster, { mode: 'groupCount', param: 4, seedHex: SEED });
  assert.deepEqual(a.groups, b.groups);
  assert.equal(a.seedHex, b.seedHex);
}

// 異なるシード — 結果が変わりうる（固定 roster で比較）
{
  const roster = Array.from({ length: 12 }, (_, i) => `P${i + 1}`);
  const a = await runGroupSplit(roster, { mode: 'perSize', param: 3, seedHex: SEED });
  const b = await runGroupSplit(roster, {
    mode: 'perSize',
    param: 3,
    seedHex: 'ffffffffffffffffffffffffffffffff',
  });
  assert.notDeepEqual(a.groups, b.groups);
}

// perSize 4人1組 · 10名
{
  const roster = Array.from({ length: 10 }, (_, i) => `N${i + 1}`);
  const r = await runGroupSplit(roster, { mode: 'perSize', param: 4, seedHex: SEED });
  assert.equal(r.groupCount, 3);
  assert.equal(r.minSize, 3);
  assert.equal(r.maxSize, 4);
  assert.equal(membersFlat(r).length, 10);
}

// 全員が1グループに1回ずつ
{
  const roster = ['x', 'y', 'z', 'w'];
  const r = await runGroupSplit(roster, { mode: 'groupCount', param: 2, seedHex: SEED });
  assert.deepEqual([...membersFlat(r)].sort(), roster.sort());
}

// TSV 出力
{
  const r = await runGroupSplit(['田中', '佐藤', '山田', '鈴木'], {
    mode: 'groupCount',
    param: 2,
    seedHex: SEED,
  });
  const tsv = formatTsvLong(r);
  assert.ok(tsv.startsWith('グループ\t氏名'));
  assert.ok(tsv.includes('田中'));
}

// ワイド TSV — 人数差≤1
{
  const r = await runGroupSplit(Array.from({ length: 8 }, (_, i) => `U${i}`), {
    mode: 'groupCount',
    param: 4,
    seedHex: SEED,
  });
  const wide = formatTsvWide(r);
  assert.ok(wide);
  assert.ok(wide.includes('グループ1'));
}

// 1000名 cap
{
  const big = Array.from({ length: ROSTER_MAX + 1 }, (_, i) => `U${i}`);
  const v = validateSplitInput(big, 'perSize', 4);
  assert.equal(v.ok, false);
  assert.equal(v.code, 'over_max');
}

// perSize — 100名·4人1組（25組）は GROUP_MAX(50) 超えでも OK
{
  const roster = Array.from({ length: 100 }, (_, i) => `P${i}`);
  const v = validateSplitInput(roster, 'perSize', 4);
  assert.equal(v.ok, true);
  assert.equal(v.groupCount, 25);
}

// assessOutputLimits — 小規模は Slack 上限内
{
  const r = await runGroupSplit(Array.from({ length: 40 }, (_, i) => `N${i}`), {
    mode: 'groupCount',
    param: 5,
    seedHex: SEED,
  });
  const lim = assessOutputLimits(r);
  assert.equal(lim.slackOverLimit, false);
  assert.equal(lim.tsvRecommended, false);
}

// 結果 DOM — 組数に応じたスクロール枠
{
  const free = resolveGroupsPreviewLayout(5);
  assert.equal(free.scroll, false);
  assert.equal(free.maxHeightRem, null);
  const scroll = resolveGroupsPreviewLayout(15);
  assert.equal(scroll.scroll, true);
  assert.equal(scroll.maxHeightRem, 10 * 4.25);
}

// Phase B — 固定班で定員超過
{
  const roster = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const r = await runGroupSplit(roster.join('\n'), {
    mode: 'perSize',
    param: 4,
    seedHex: SEED,
    constraintsInput: {
      bundlesText: 'A,B,C',
    },
  });
  assert.equal(r.phase, 'B');
  const bundleGroup = r.groups.find((g) => g.members.includes('A'));
  assert.ok(bundleGroup);
  assert.ok(bundleGroup.size >= 3);
}

// Phase B — 離すペア
{
  const roster = ['田中', '佐藤', '山田', '鈴木', '高橋', '伊藤'];
  const r = await runGroupSplit(roster.join('\n'), {
    mode: 'groupCount',
    param: 3,
    seedHex: SEED,
    constraintsInput: {
      pairsText: '田中,佐藤',
    },
  });
  const gTanaka = r.groups.find((g) => g.members.includes('田中'));
  const gSato = r.groups.find((g) => g.members.includes('佐藤'));
  assert.notEqual(gTanaka.id, gSato.id);
}

// Phase B — 空グループを残さない（15名·3人1組·固定班+離すペア）
{
  const roster = `田中 昭光
柴本 力
中村 かつら
石岡 裕子
薬師寺 環
木村 一
飯野 潤也
佐藤 のぞみ
黒石 宏和
松澤 晃
丸山 涼太
坂倉 幸太郎
松本 あゆ美
佐藤 拓
木俣 英介`;
  const r = await runGroupSplit(roster, {
    mode: 'perSize',
    param: 3,
    seedHex: SEED,
    constraintsInput: {
      bundlesText: '佐藤 のぞみ, 黒石 宏和',
      pairsText: '丸山 涼太, 坂倉 幸太郎',
    },
  });
  assert.equal(r.rosterCount, 15);
  assert.equal(r.groupCount, 5);
  assert.ok(r.groups.every((g) => g.size > 0), 'empty group must not remain');
  assert.equal(membersFlat(r).length, 15);
  const gMaru = r.groups.find((g) => g.members.includes('丸山 涼太'));
  const gSaka = r.groups.find((g) => g.members.includes('坂倉 幸太郎'));
  assert.notEqual(gMaru.id, gSaka.id);
  const bundleGroup = r.groups.find((g) => g.members.includes('佐藤 のぞみ'));
  assert.ok(bundleGroup.members.includes('黒石 宏和'));
}

// Phase B — 固定配置
{
  const roster = ['M1', 'M2', 'A', 'B', 'C', 'D'];
  const r = await runGroupSplit(roster.join('\n'), {
    mode: 'groupCount',
    param: 2,
    seedHex: SEED,
    constraintsInput: {
      fixedText: 'M1=1\nM2=2',
    },
  });
  assert.ok(r.groups[0].members.includes('M1'));
  assert.ok(r.groups[1].members.includes('M2'));
}

// Phase B — 制約矛盾（赤旗）
{
  let threw = false;
  try {
    await runGroupSplit('A\nB\nC\nD', {
      mode: 'groupCount',
      param: 2,
      constraintsInput: {
        fixedText: 'A=1\nB=1',
        pairsText: 'A,B',
      },
    });
  } catch (e) {
    threw = true;
    assert.equal(e.code, 'constraint_invalid');
  }
  assert.ok(threw);
}

// Phase B — タグ列 TSV
{
  const text = '氏名\tタグ\n田中\t営業\n佐藤\t人事\n山田\t営業\n鈴木\t人事';
  const r = await runGroupSplit(text, {
    mode: 'groupCount',
    param: 2,
    seedHex: SEED,
  });
  const tsv = formatTsvLong(r);
  assert.ok(tsv.includes('タグ'));
  assert.ok(tsv.includes('営業'));
}

// 再現性 — 制約あり
{
  const roster = ['A', 'B', 'C', 'D', 'E', 'F'];
  const opts = {
    mode: 'groupCount',
    param: 2,
    seedHex: SEED,
    constraintsInput: { pairsText: 'A,B' },
  };
  const a = await runGroupSplit(roster.join('\n'), opts);
  const b = await runGroupSplit(roster.join('\n'), opts);
  assert.deepEqual(a.groups.map((g) => g.members), b.groups.map((g) => g.members));
}

assert.equal(ROSTER_MAX, 250);

// Phase C — 複数列パース
{
  const table = parseTableText('氏名\t所属\t性別\n田中\t営業\t男');
  assert.equal(table.headers.length, 3);
  assert.equal(table.rows.length, 1);
  assert.equal(table.hasHeader, true);
}

// Phase C — 属性分散（所属）
{
  const roster = `氏名\t所属\t性別
田中\t営業\t男
佐藤\t人事\t女
山田\t営業\t男
鈴木\t人事\t女
高橋\t営業\t男
伊藤\t人事\t女`;
  const r = await runGroupSplit(roster, {
    mode: 'groupCount',
    param: 3,
    seedHex: SEED,
    constraintsInput: {
      attrRules: [
        { columnIndex: 1, label: '所属', spread: true, requiredEach: [] },
        { columnIndex: 2, label: '性別', spread: true, requiredEach: [] },
      ],
    },
  });
  assert.equal(r.phase, 'C');
  assert.equal(r.rosterCount, 6);
  assert.equal(r.attrLabels.length, 2);
  for (const g of r.groups) {
    if (g.members.length === 2) {
      const depts = g.members.map((m) => r.memberAttrs[m].所属);
      assert.notEqual(depts[0], depts[1], `group ${g.id} should mix 所属`);
    }
  }
  const tsv = formatTsvLong(r);
  assert.ok(tsv.includes('所属'));
  assert.ok(tsv.includes('性別'));
}

// Phase C — 各組必須属性値
{
  const roster = `氏名\t役職
A\t役員
B\t一般
C\t役員
D\t一般
E\t役員
F\t一般`;
  const r = await runGroupSplit(roster, {
    mode: 'groupCount',
    param: 3,
    seedHex: SEED,
    constraintsInput: {
      attrRules: [
        { columnIndex: 1, label: '役職', spread: false, requiredEach: ['役員'] },
      ],
    },
  });
  assert.equal(r.phase, 'C');
  for (const g of r.groups) {
    assert.ok(g.members.some((m) => r.memberAttrs[m].役職 === '役員'));
  }
}

// constraint-form
{
  const c = countNameConstraints('A,B\nC,D', 'X=1', 'P,Q');
  assert.equal(c.bundles, 2);
  assert.equal(c.fixed, 1);
  assert.equal(c.pairs, 1);
  assert.ok(formatConstraintSummary(c).includes('固定班 2件'));
  assert.equal(appendConstraintLine('', 'a, b'), 'a, b');
  assert.equal(formatPairLine('丸山 涼太', '坂倉 幸太郎'), '丸山 涼太, 坂倉 幸太郎');
}
{
  const src = ['a', 'b', 'c', 'd'];
  const fn = createDeterministicRandomFn(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]));
  const out = seededFullShuffle(src, fn);
  assert.deepEqual([...out].sort(), src.sort());
}

// Slack / 告知にセッション名
{
  const r = await runGroupSplit(['A', 'B', 'C', 'D'], {
    mode: 'groupCount',
    param: 2,
    sessionLabel: '研修Day2',
    seedHex: SEED,
  });
  assert.ok(formatSlack(r).includes('研修Day2'));
  assert.ok(formatAnnounce(r).includes('研修Day2'));
}

console.log('group-split.test.mjs: all passed');
