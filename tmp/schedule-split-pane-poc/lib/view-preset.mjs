import { childrenOf, isContainer } from './item-tree.mjs';
import { visibleItems } from './visible-items.mjs';

export { childrenOf };

export function defaultViewState() {
  return {
    activePreset: 'site',
    /** Q-INS-01 A: 依存の自動シフトは opt-in · 既定 OFF */
    dependenciesEnabled: false,
    presets: {
      submit: { hideVisibility: ['site'], hidePropertyTiers: ['ops'] },
      site: { hideVisibility: [], hidePropertyTiers: [] },
    },
    filters: [],
  };
}

export function dependenciesEnabled(state) {
  return state.viewState?.dependenciesEnabled === true;
}

export function activePreset(state) {
  return state.viewState?.activePreset || 'site';
}

export function itemVisibility(item) {
  return item.visibility || 'both';
}

/** submit プリセットで行を出すか */
export function isItemInPreset(item, preset) {
  const v = itemVisibility(item);
  if (preset === 'submit') return v === 'submit' || v === 'both';
  return true;
}

export function filterItemsForPreset(items, collapsed, preset) {
  return visibleItems(items, collapsed).filter((it) => isItemInPreset(it, preset));
}

export function visibleProperties(properties, preset) {
  if (!properties?.length) return [];
  if (preset === 'submit') return properties.filter((p) => p.tier !== 'ops');
  return properties;
}

/** ops 行が親（提出行）の期間からはみ出す — Q-VW-02 */
export function findOverflowWarnings(items) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const warnings = [];

  for (const item of items) {
    if (itemVisibility(item) !== 'site' || !item.parentItemId) continue;
    const parent = byId[item.parentItemId];
    if (!parent?.start || !parent?.end || isContainer(parent)) continue;
    if (!item.start || !item.end) continue;
    if (item.start < parent.start || item.end > parent.end) {
      warnings.push({
        opsId: item.id,
        parentId: parent.id,
        message: `「${item.title}」が提出行「${parent.title}」（${parent.start}〜${parent.end}）からはみ出しています`,
      });
    }
  }
  return warnings;
}

function datedLeaves(items, id, preset) {
  const out = [];
  for (const k of childrenOf(items, id)) {
    if (k.start && k.end && isItemInPreset(k, preset)) out.push(k);
    out.push(...datedLeaves(items, k.id, preset));
  }
  return out;
}

export function groupSpanForPreset(items, groupId, preset) {
  const kids = datedLeaves(items, groupId, preset);
  if (!kids.length) return null;
  let start = kids[0].start;
  let end = kids[0].end;
  for (const k of kids) {
    if (k.start < start) start = k.start;
    if (k.end > end) end = k.end;
  }
  return { start, end };
}

/** 提出 Export 対象行（PoC · PDF 正本のプレビュー用） */
export function submitExportItems(state) {
  return filterItemsForPreset(state.items, state.collapsed, 'submit').filter(
    (it) => !isContainer(it),
  );
}
