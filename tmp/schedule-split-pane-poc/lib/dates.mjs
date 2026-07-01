const MS_DAY = 86400000;

export function parseIso(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toIso(d) {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = parseIso(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function diffDays(aIso, bIso) {
  const a = parseIso(aIso);
  const b = parseIso(bIso);
  if (!a || !b) return 0;
  return Math.round((b - a) / MS_DAY);
}

export function durationDays(start, end) {
  return Math.max(1, diffDays(start, end) + 1);
}

export function clampIso(iso, minIso, maxIso) {
  if (minIso && iso < minIso) return minIso;
  if (maxIso && iso > maxIso) return maxIso;
  return iso;
}

/** 工期（projectPeriod）が表示範囲の SSOT。未設定時のみタスクから推定。 */
export function chartRange(state, padDays = 0) {
  const period = state.projectPeriod;
  if (period?.start && period?.end) {
    return { start: period.start, end: period.end };
  }
  return viewRangeFromItems(state.items, padDays);
}

/** @deprecated chartRange を使用 */
export function viewRange(items, padDays = 7) {
  return viewRangeFromItems(items, padDays);
}

function viewRangeFromItems(items, padDays = 7) {
  let min = null;
  let max = null;
  for (const it of items) {
    if (!it.start || !it.end) continue;
    if (!min || it.start < min) min = it.start;
    if (!max || it.end > max) max = it.end;
  }
  if (!min) {
    const t = toIso(new Date());
    min = t;
    max = addDays(t, 30);
  }
  return {
    start: addDays(min, -padDays),
    end: addDays(max, padDays),
  };
}

export function clampToRange(iso, rangeStart, rangeEnd) {
  if (!iso) return iso;
  if (rangeStart && iso < rangeStart) return rangeStart;
  if (rangeEnd && iso > rangeEnd) return rangeEnd;
  return iso;
}

export function eachDay(startIso, endIso) {
  const out = [];
  let cur = startIso;
  while (cur <= endIso) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function formatShort(iso) {
  const d = parseIso(iso);
  if (!d) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatWeekday(iso) {
  const d = parseIso(iso);
  if (!d) return '';
  return ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
}

export function isWeekend(iso) {
  const d = parseIso(iso);
  if (!d) return false;
  const w = d.getDay();
  return w === 0 || w === 6;
}

/** 現場設定: countWeekends=true なら土日も工事日。holidays は常に休工 */
export function isWorkingDay(iso, calendar = {}) {
  if (calendar?.holidays?.includes(iso)) return false;
  if (calendar?.countWeekends !== false) return true;
  return !isWeekend(iso);
}

export function isHoliday(iso, calendar = {}) {
  return Boolean(calendar?.holidays?.includes(iso));
}

export function countWorkingDays(start, end, calendar = {}) {
  if (!start || !end) return 0;
  if (calendar?.countWeekends !== false) return durationDays(start, end);
  let n = 0;
  let cur = start;
  while (cur <= end) {
    if (isWorkingDay(cur, calendar)) n += 1;
    cur = addDays(cur, 1);
  }
  return n;
}

export function addWorkingDays(iso, n, calendar = {}) {
  if (!iso || n === 0) return iso;
  if (calendar?.countWeekends !== false) return addDays(iso, n);
  let cur = iso;
  let left = Math.abs(n);
  const step = n > 0 ? 1 : -1;
  while (left > 0) {
    cur = addDays(cur, step);
    if (isWorkingDay(cur, calendar)) left -= 1;
  }
  return cur;
}

/** 終了日の翌稼働日（FS 後続の開始候補） */
export function nextWorkingDayAfter(endIso, calendar = {}) {
  let cur = addDays(endIso, 1);
  if (calendar?.countWeekends !== false) return cur;
  while (!isWorkingDay(cur, calendar)) cur = addDays(cur, 1);
  return cur;
}
