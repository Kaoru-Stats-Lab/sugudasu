import { childrenOf, hasChildren } from './item-tree.mjs';

export { childrenOf, hasChildren };

export function visibleItems(items, collapsed = {}) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  function hiddenByCollapse(item) {
    let pid = item.parentItemId;
    while (pid) {
      if (collapsed[pid]) return true;
      pid = byId[pid]?.parentItemId;
    }
    return false;
  }

  return items.filter((item) => !hiddenByCollapse(item));
}

export function groupSpan(items, groupId) {
  const kids = childrenOf(items, groupId).filter((x) => x.start && x.end);
  if (!kids.length) return null;
  let start = kids[0].start;
  let end = kids[0].end;
  for (const k of kids) {
    if (k.start < start) start = k.start;
    if (k.end > end) end = k.end;
  }
  return { start, end };
}

export function isCollapsed(collapsed, groupId) {
  return Boolean(collapsed?.[groupId]);
}
