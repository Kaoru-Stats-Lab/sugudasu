import {
  addDays,
  addWorkingDays,
  clampToRange,
  countWorkingDays,
  diffDays,
  isWorkingDay,
} from './dates.mjs';
import { dependenciesEnabled } from './view-preset.mjs';

const MAX_DEPTH = 100;

function snapToWorkingDay(iso, calendar, direction = 1) {
  if (isWorkingDay(iso, calendar)) return iso;
  let cur = iso;
  for (let i = 0; i < 366; i += 1) {
    if (isWorkingDay(cur, calendar)) return cur;
    cur = addDays(cur, direction);
  }
  return iso;
}

function clampItem(it, range) {
  if (!range?.start || !range?.end || !it.start || !it.end) return;
  it.start = clampToRange(it.start, range.start, range.end);
  it.end = clampToRange(it.end, range.start, range.end);
  if (it.start > it.end) it.end = it.start;
}

/** 有向グラフに from→to を足すと循環するか */
export function wouldCreateCycle(dependencies, fromId, toId) {
  if (fromId === toId) return true;
  const adj = new Map();
  for (const d of dependencies) {
    if (!adj.has(d.from)) adj.set(d.from, []);
    adj.get(d.from).push(d.to);
  }
  if (!adj.has(fromId)) adj.set(fromId, []);
  adj.get(fromId).push(toId);

  const stack = [toId];
  const seen = new Set();
  while (stack.length) {
    const cur = stack.pop();
    if (cur === fromId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const nxt of adj.get(cur) || []) stack.push(nxt);
  }
  return false;
}

/**
 * maintain_gap: 先行の終了が動いた分だけ後続をシフト（ギャップ維持）。
 * viewState.dependenciesEnabled が true のときのみ呼ぶこと。
 */
export function propagateMaintainGap(state, originItemId, beforeEndIso) {
  if (!dependenciesEnabled(state)) return;
  const { items, dependencies, calendar = {}, projectPeriod: range } = state;
  if (!beforeEndIso) return;

  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  const walk = (fromId, prevEnd, depth) => {
    if (depth > MAX_DEPTH) return;
    const from = byId[fromId];
    if (!from?.end) return;
    const delta = diffDays(prevEnd, from.end);
    if (delta === 0) return;

    for (const dep of dependencies) {
      if (dep.from !== fromId) continue;
      if (dep.shiftMode === 'none') continue;

      const succ = byId[dep.to];
      if (!succ?.start || !succ?.end) continue;

      const succEndBefore = succ.end;
      const workingDur = countWorkingDays(succ.start, succ.end, calendar);
      let newStart = addDays(succ.start, delta);

      if (calendar.countWeekends === false) {
        newStart = snapToWorkingDay(newStart, calendar, 1);
        succ.start = newStart;
        succ.end = addWorkingDays(newStart, Math.max(0, workingDur - 1), calendar);
        succ.end = snapToWorkingDay(succ.end, calendar, -1);
        if (succ.end < succ.start) succ.end = succ.start;
      } else {
        succ.start = newStart;
        succ.end = addDays(newStart, Math.max(0, workingDur - 1));
      }

      clampItem(succ, range);

      if (succ.end !== succEndBefore) {
        walk(succ.id, succEndBefore, depth + 1);
      }
    }
  };

  walk(originItemId, beforeEndIso, 0);
}
