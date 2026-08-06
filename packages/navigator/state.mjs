/**
 * Wave 1 Navigator State helpers — Change Navigator driven.
 */

export function visibleChanges(items) {
  return items.filter((i) => i.visible && i.kind !== "unchanged");
}

export function navigatorNextId(items, selectedId) {
  const list = visibleChanges(items);
  if (!list.length) return null;
  const idx = list.findIndex((i) => i.id === selectedId);
  return list[(idx + 1) % list.length].id;
}

export function navigatorPrevId(items, selectedId) {
  const list = visibleChanges(items);
  if (!list.length) return null;
  const idx = list.findIndex((i) => i.id === selectedId);
  return list[(idx <= 0 ? list.length : idx) - 1].id;
}

/** Semantic anchor — not pixel scroll. */
export function navigatorAnchor(items, selectedId) {
  const item = items.find((i) => i.id === selectedId);
  if (!item) return null;
  return {
    deltaId: item.id,
    deltaNodeId: item.id,
    semanticNodeId: item.newNodeRef || item.oldNodeRef || null,
    kind: item.kind,
    originHint: item.originHint ?? null,
  };
}

/** Apply filter visibility without deleting items (DOM-safe). */
export function applyFilterVisibility(items, filter) {
  return items.map((item) => ({
    ...item,
    visible: (() => {
      if (item.kind === "unchanged") return !!filter.showUnchanged;
      if (item.kind === "modified") {
        if (item.changeDetail === "style_only") return !!filter.style;
        return !!filter.showModified && filter.content !== false;
      }
      if (item.kind === "added") return !!filter.addedDeleted && !!filter.showAdded;
      if (item.kind === "deleted") return !!filter.addedDeleted && !!filter.showDeleted;
      return true;
    })(),
  }));
}
