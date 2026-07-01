import { addDays, clampToRange, diffDays, durationDays, parseIso } from './dates.mjs';
import { propagateMaintainGap, wouldCreateCycle } from './dependency-engine.mjs';
import { isContainer, isDescendant } from './item-tree.mjs';
import { defaultViewState, dependenciesEnabled } from './view-preset.mjs';

function cloneState(state) {
  const cal = state.calendar || { countWeekends: true, holidays: [] };
  return {
    projectPeriod: state.projectPeriod ? { ...state.projectPeriod } : null,
    calendar: {
      ...cal,
      holidays: [...(cal.holidays || [])],
    },
    ui: state.ui ? { ...state.ui } : { showDates: true, theme: 'light' },
    collapsed: state.collapsed ? { ...state.collapsed } : {},
    viewState: state.viewState
      ? {
          ...state.viewState,
          presets: { ...state.viewState.presets },
          filters: [...(state.viewState.filters || [])],
          dependenciesEnabled: state.viewState.dependenciesEnabled === true,
        }
      : defaultViewState(),
    properties: (state.properties || []).map((p) => ({ ...p })),
    items: state.items.map((it) => ({
      ...it,
      values: it.values ? { ...it.values } : {},
    })),
    dependencies: (state.dependencies || []).map((d) => ({ ...d })),
  };
}

function isDated(it) {
  return Boolean(it?.start && it?.end);
}

/**
 * Phase A stub — move / resize / 工期 / UI / view preset / 休工日。
 * 依存: データ常時保持 · 自動シフトは viewState.dependenciesEnabled（既定 OFF）。
 */
export function applyOp(state, op) {
  const next = cloneState(state);
  const { items, dependencies, projectPeriod: range } = next;
  const calendar = next.calendar || {};

  const clampItem = (it) => {
    if (!range?.start || !range?.end || !it.start || !it.end) return;
    it.start = clampToRange(it.start, range.start, range.end);
    it.end = clampToRange(it.end, range.start, range.end);
    if (it.start > it.end) it.end = it.start;
  };

  const maybePropagate = (itemId, beforeEnd) => {
    if (!dependenciesEnabled(next)) return;
    propagateMaintainGap(next, itemId, beforeEnd);
  };

  if (op.type === 'edit_project_period') {
    next.projectPeriod = { start: op.start, end: op.end };
    if (next.projectPeriod.start > next.projectPeriod.end) {
      next.projectPeriod.end = next.projectPeriod.start;
    }
    items.forEach(clampItem);
    return next;
  }

  if (op.type === 'set_calendar') {
    next.calendar = { ...next.calendar, ...op.patch };
    if (op.patch?.holidays) next.calendar.holidays = [...op.patch.holidays];
    return next;
  }

  if (op.type === 'toggle_holiday') {
    const set = new Set(next.calendar.holidays || []);
    if (set.has(op.iso)) set.delete(op.iso);
    else set.add(op.iso);
    next.calendar.holidays = [...set].sort();
    return next;
  }

  if (op.type === 'set_ui') {
    next.ui = { ...next.ui, ...op.patch };
    return next;
  }

  if (op.type === 'add_property') {
    const p = op.property;
    if (!p?.id || !p?.label) return state;
    if (next.properties.some((x) => x.id === p.id)) return state;
    next.properties.push({
      id: p.id,
      label: p.label,
      kind: p.kind || 'text',
      tier: p.tier || 'ops',
    });
    return next;
  }

  if (op.type === 'set_preset') {
    next.viewState.activePreset = op.preset;
    return next;
  }

  if (op.type === 'set_dependencies_enabled') {
    next.viewState.dependenciesEnabled = Boolean(op.enabled);
    return next;
  }

  if (op.type === 'toggle_group') {
    next.collapsed = { ...next.collapsed, [op.groupId]: !next.collapsed[op.groupId] };
    return next;
  }

  if (op.type === 'edit_property') {
    const it = items.find((x) => x.id === op.itemId);
    if (!it || isContainer(it)) return state;
    it.values = { ...it.values, [op.propId]: op.value };
    return next;
  }

  if (op.type === 'move_bar') {
    const it = items.find((x) => x.id === op.itemId);
    if (!it || !isDated(it)) return state;
    const beforeEnd = it.end;
    const dur = durationDays(it.start, it.end);
    it.start = addDays(it.start, op.deltaDays);
    it.end = addDays(it.start, dur - 1);
    clampItem(it);
    maybePropagate(it.id, beforeEnd);
    return next;
  }

  if (op.type === 'resize_bar') {
    const it = items.find((x) => x.id === op.itemId);
    if (!it || !isDated(it)) return state;
    const beforeEnd = it.end;
    if (op.edge === 'start') {
      let start = op.iso;
      if (parseIso(start) > parseIso(it.end)) start = it.end;
      it.start = start;
    } else {
      let end = op.iso;
      if (parseIso(end) < parseIso(it.start)) end = it.start;
      it.end = end;
    }
    clampItem(it);
    maybePropagate(it.id, beforeEnd);
    return next;
  }

  if (op.type === 'edit_cell') {
    const it = items.find((x) => x.id === op.itemId);
    if (!it || isContainer(it)) return state;
    const beforeEnd = it.end;
    it[op.field] = op.value;
    if (op.field === 'start' && it.end && it.start > it.end) it.end = it.start;
    if (op.field === 'end' && it.start && it.end < it.start) it.start = it.end;
    clampItem(it);
    maybePropagate(it.id, beforeEnd);
    return next;
  }

  if (op.type === 'add_dependency') {
    const from = items.find((x) => x.id === op.from);
    const to = items.find((x) => x.id === op.to);
    if (!from || !to || !isDated(from) || !isDated(to)) return state;
    if (op.from === op.to) return state;
    const scopeA = from.scopeId ?? from.zoneId;
    const scopeB = to.scopeId ?? to.zoneId;
    if (scopeA && scopeB && scopeA !== scopeB) return state;
    if (dependencies.some((d) => d.from === op.from && d.to === op.to)) return state;
    if (wouldCreateCycle(dependencies, op.from, op.to)) return state;
    dependencies.push({
      id: `d${Date.now()}`,
      from: op.from,
      to: op.to,
      scopeId: scopeA || scopeB || null,
      shiftMode: 'maintain_gap',
    });
    return next;
  }

  if (op.type === 'remove_dependency') {
    next.dependencies = dependencies.filter((d) => d.id !== op.id);
    return next;
  }

  if (op.type === 'insert_item') {
    const today = range?.start || new Date().toISOString().slice(0, 10);
    const makeContainer = op.asContainer || op.asParent;
    if (!op.parentItemId && makeContainer) {
      const id = `g${Date.now()}`;
      items.push({
        id,
        parentItemId: null,
        scopeId: id,
        visibility: 'both',
        title: op.title || '新規',
        start: null,
        end: null,
        status: '',
        assignee: '',
        values: {},
      });
      return next;
    }

    const parentId = op.parentItemId ?? null;
    const parent = parentId ? items.find((x) => x.id === parentId) : null;
    const asContainer = Boolean(op.asContainer);
    const newItem = {
      id: `i${Date.now()}`,
      parentItemId: parentId,
      scopeId: parent?.scopeId || parentId || `i${Date.now()}`,
      visibility: op.visibility || 'both',
      title: op.title || (asContainer ? '新規グループ' : '新規'),
      start: asContainer ? null : today,
      end: asContainer ? null : today,
      status: asContainer ? '' : '未着手',
      assignee: '',
      values: {},
    };

    if (!parentId) {
      items.push(newItem);
      return next;
    }

    const parentIdx = items.findIndex((x) => x.id === parentId);
    let insertAt = parentIdx + 1;
    while (insertAt < items.length && isDescendant(items, items[insertAt], parentId)) {
      insertAt += 1;
    }
    items.splice(insertAt, 0, newItem);
    return next;
  }

  if (op.type === 'edit_title') {
    const it = items.find((x) => x.id === op.itemId);
    if (!it) return state;
    it.title = op.title;
    return next;
  }

  if (op.type === 'delete_item') {
    const targetId = op.itemId;
    const removeIds = new Set([targetId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const it of items) {
        if (it.parentItemId && removeIds.has(it.parentItemId) && !removeIds.has(it.id)) {
          removeIds.add(it.id);
          changed = true;
        }
      }
    }
    next.items = items.filter((it) => !removeIds.has(it.id));
    next.dependencies = dependencies.filter(
      (d) => !removeIds.has(d.from) && !removeIds.has(d.to),
    );
    const collapsed = { ...(next.collapsed || {}) };
    for (const id of removeIds) delete collapsed[id];
    next.collapsed = collapsed;
    return next;
  }

  return next;
}

export function deltaDaysFromDrag(dx, colWidth) {
  return Math.round(dx / colWidth);
}
