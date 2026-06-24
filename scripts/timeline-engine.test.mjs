#!/usr/bin/env node
/**
 * timeline-engine 単体テスト
 * Run: npm run test:timeline
 *
 * 各ブロックのコメント = そのテストが守っている「現場理由」（仕様書 §6-2 の受け入れ例）
 */
import assert from 'node:assert/strict';
import {
  DURATION_DELTA,
  DURATION_MAX,
  DURATION_MIN,
  applyDurationDelta,
  createEmptyState,
  defaultTimelineTemplate,
  deleteRow,
  formatPlain,
  formatTsv,
  getCurrentRowIndex,
  getDeadlineSummary,
  insertRowAfter,
  minutesUntilCurrentRowEnd,
  minutesUntilRowStart,
  moveRow,
  parseTimeToMinutes,
  recalcTimeline,
  formatMinutesToTime,
  offsetToCalendar,
  validateRow,
} from '../assets/timeline-engine.js';

// --- 時刻ユーティリティ（T0-01）---

assert.equal(parseTimeToMinutes('09:00'), 540);
assert.equal(parseTimeToMinutes('23:59'), 1439);
assert.ok(Number.isNaN(parseTimeToMinutes('24:00')));
assert.equal(formatMinutesToTime(540), '09:00');

// --- 基本連鎖（T0-02）: Excel が壊れる典型 — 2行目だけ伸ばすと3行目がずれる ---

{
  let s = createEmptyState({ startAt: '10:00', dateIso: '2026-06-24' });
  s = insertRowAfter(s, '', { title: 'A', durationMin: 15 });
  s = insertRowAfter(s, s.rows[0].id, { title: 'B', durationMin: 15 });
  s = insertRowAfter(s, s.rows[1].id, { title: 'C', durationMin: 15 });
  assert.equal(s.rows[0].startAt, '10:00');
  assert.equal(s.rows[1].startAt, '10:15');
  assert.equal(s.rows[2].startAt, '10:30');

  const rows = s.rows.map((r) => (r.id === s.rows[1].id ? { ...r, durationMin: 25 } : r));
  s = recalcTimeline({ ...s, rows }, 1);
  assert.equal(s.rows[2].startAt, '10:40', '2行目+10分で3行目が繰り下がる');
}

// --- ±5（T0-03）: 現場の最小調整単位 ---

{
  let s = createEmptyState({ startAt: '10:00' });
  s = insertRowAfter(s, '', { title: 'A', durationMin: 10 });
  s = applyDurationDelta(s, s.rows[0].id, DURATION_DELTA);
  assert.equal(s.rows[0].durationMin, 15);
  s = applyDurationDelta(s, s.rows[0].id, -DURATION_DELTA * 3);
  assert.equal(s.rows[0].durationMin, DURATION_MIN, '1分未満にはしない');
  s = applyDurationDelta(s, s.rows[0].id, DURATION_MAX);
  assert.equal(s.rows[0].durationMin, DURATION_MAX, '8h超の誤入力をクランプ');
}

// --- 差し込み・削除（T0-04 / S7）---

{
  let s = createEmptyState({ startAt: '12:00' });
  s = insertRowAfter(s, '', { title: 'ランチ', durationMin: 60 });
  s = insertRowAfter(s, s.rows[0].id, { title: '午後セッション', durationMin: 45 });
  const lunchId = s.rows[0].id;
  s = insertRowAfter(s, lunchId, {
    title: '後援挨拶',
    durationMin: 5,
    note: '〇〇財団',
  });
  assert.equal(s.rows.length, 3);
  assert.equal(s.rows[1].title, '後援挨拶');
  assert.equal(s.rows[2].startAt, '13:05', '差し込み後に後続が連鎖');

  s = deleteRow(s, s.rows[1].id);
  assert.equal(s.rows.length, 2);
  assert.equal(s.rows[1].startAt, '13:00', '削除で繰り上が');
}

// --- アンカー衝突（T0-05）: 自動圧縮しない — 人が判断する ---

{
  let s = createEmptyState({ startAt: '10:00', dateIso: '2026-06-24' });
  s = insertRowAfter(s, '', { title: 'A', durationMin: 135 }); // 10:00–12:15
  s = insertRowAfter(s, s.rows[0].id, {
    title: '昼食（固定）',
    durationMin: 60,
    anchored: true,
    anchorAt: '12:00',
  });
  assert.equal(s.rows[1].conflict, true, '前行終了12:15 > アンカー12:00');
  assert.equal(s.rows[1].startAt, '12:00', 'それでもアンカー時刻は表示する');
}

// --- 複数日（T0-06）: 案3 — dayIndex バッジのみ ---

{
  const event = { title: '夜間', dateIso: '2026-06-24', startAt: '22:00' };
  const cal = offsetToCalendar(event, 180);
  assert.equal(cal.dayIndex, 1);
  assert.equal(cal.startAt, '01:00');

  let s = createEmptyState(event);
  s = insertRowAfter(s, '', { title: '夜枠', durationMin: 180 });
  assert.equal(s.rows[0].dayIndex, 0);
  assert.equal(s.rows[0].endAt, '01:00');
}

// --- 睡眠ダミー行: 合宿で夜を飛ばす — 翌日セクション自動挿入はしない ---
// 21:00 終了 + 12h(720分) 睡眠 = 翌 09:00（現場の「一泊」イメージ）

{
  let s = createEmptyState({ startAt: '18:00', dateIso: '2026-06-24' });
  s = insertRowAfter(s, '', { title: 'Day1 閉会', durationMin: 180 }); // 18:00–21:00
  s = insertRowAfter(s, s.rows[0].id, { title: '宿泊・睡眠', durationMin: 720 });
  s = insertRowAfter(s, s.rows[1].id, { title: 'Day2 朝会', durationMin: 30 });
  assert.equal(s.rows[2].dayIndex, 1);
  assert.equal(s.rows[2].startAt, '09:00');
}

// --- 出力（T0-07）---

{
  let s = createEmptyState({ startAt: '10:15' });
  s = insertRowAfter(s, '', { title: 'アジェンダ', durationMin: 15, note: '〇〇さん移動' });
  const plain = formatPlain(s);
  assert.ok(plain.includes('（備考：〇〇さん移動）'));
  const tsv = formatTsv(s);
  assert.ok(tsv.startsWith('開始\t終了'));
}

// --- 残り時間（T0-08）---

{
  let s = createEmptyState({ startAt: '10:00', dateIso: '2026-06-24' });
  s = insertRowAfter(s, '', { title: 'A', durationMin: 30 });
  s = insertRowAfter(s, s.rows[0].id, { title: 'B', durationMin: 30 });
  const now = new Date(2026, 5, 24, 10, 10, 0);
  assert.equal(getCurrentRowIndex(s, now), 0);
  assert.equal(minutesUntilCurrentRowEnd(s, now), 20);
  assert.equal(minutesUntilRowStart(s, s.rows[1].id, now), 20);
}

// --- validate（T0-09）---

assert.equal(validateRow({ title: '', durationMin: 5 }).ok, false);
assert.equal(validateRow({ title: 'OK', durationMin: 0 }).code, 'duration_range');

// --- テンプレ（T0-10）---

{
  const t = defaultTimelineTemplate();
  assert.ok(t.rows.length >= 3);
  assert.ok(t.rows.every((r) => r.startAt && r.endAt));
}

// --- moveRow ---

{
  let s = createEmptyState({ startAt: '09:00' });
  s = insertRowAfter(s, '', { title: '1', durationMin: 10 });
  s = insertRowAfter(s, s.rows[0].id, { title: '2', durationMin: 10 });
  s = moveRow(s, 0, 1);
  assert.equal(s.rows[0].title, '2');
}

// --- 目標終了 vs 終了予定（T1-16）---

{
  let s = createEmptyState({ startAt: '13:00' });
  s = insertRowAfter(s, '', { title: 'A', durationMin: 240 }); // 13:00–17:00
  s = { ...s, event: { ...s.event, targetEndAt: '17:30' } };
  const sum = getDeadlineSummary(s);
  assert.equal(sum?.status, 'early');
  assert.equal(sum?.deltaMin, 30);

  s = { ...s, event: { ...s.event, targetEndAt: '16:45' } };
  const over = getDeadlineSummary(s);
  assert.equal(over?.status, 'over');
  assert.equal(over?.deltaMin, -15);
}

console.log('timeline-engine: all tests passed');
