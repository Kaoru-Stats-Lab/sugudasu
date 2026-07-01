/** Notion sub-items 相当 — parentItemId の木構造ユーティリティ */

export function childrenOf(items, parentId) {
  return items.filter((x) => x.parentItemId === parentId);
}

export function hasChildren(items, id) {
  return items.some((x) => x.parentItemId === id);
}

/** 自身に工期を持たない集約行（工区名など任意ラベル） */
export function isContainer(item) {
  return !item.start && !item.end;
}

/** 表・折りたたみ対象の親行 */
export function isBranchRow(item, items) {
  return isContainer(item) || hasChildren(items, item.id);
}

export function itemDepth(item, items) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  let depth = 0;
  let pid = item.parentItemId;
  while (pid) {
    depth += 1;
    pid = byId[pid]?.parentItemId;
  }
  return depth;
}

export function belongsToSubtree(item, rootId, items) {
  if (item.id === rootId) return true;
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  let pid = item.parentItemId;
  while (pid) {
    if (pid === rootId) return true;
    pid = byId[pid]?.parentItemId;
  }
  return false;
}

export function isDescendant(items, item, ancestorId) {
  return belongsToSubtree(item, ancestorId, items);
}

export function rootAncestorId(item, items) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  let cur = item;
  let root = null;
  while (cur) {
    if (!cur.parentItemId) root = cur.id;
    cur = cur.parentItemId ? byId[cur.parentItemId] : null;
  }
  return root;
}
