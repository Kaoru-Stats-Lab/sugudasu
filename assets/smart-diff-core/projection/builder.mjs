/**
 * Wave 1 Projection — Navigator contract. UI must not read Delta raw.
 * Filter = visibility flags only.
 */

const DEFAULT_FILTER = {
  content: true,
  addedDeleted: true,
  style: false,
  showModified: true,
  showAdded: true,
  showDeleted: true,
  showUnchanged: false,
};

function isVisible(node, filter) {
  if (node.kind === "unchanged") return !!filter.showUnchanged;
  if (node.kind === "modified") {
    if (node.changeDetail === "style_only") return !!filter.style;
    return !!filter.showModified && !!filter.content;
  }
  if (node.kind === "added") return !!filter.addedDeleted && !!filter.showAdded;
  if (node.kind === "deleted") return !!filter.addedDeleted && !!filter.showDeleted;
  return true;
}

/**
 * Navigator Projection Contract (fixed for UI consumers):
 * { items:[{ id, kind, label, visible, selected?, candidate?, ... }], changeCount, view }
 */
export function buildProjection(deltaTree, view = {}) {
  const filter = { ...DEFAULT_FILTER, ...(view.filter || {}) };
  const selectedId = view.selectedId;
  const items = [];

  for (const node of deltaTree.root?.children || []) {
      items.push({
      id: node.id,
      kind: node.kind,
      label: node.summary || node.kind,
      visible: isVisible(node, filter),
      selected: node.id === selectedId,
      candidate: node.confidence === "candidate",
      changeDetail: node.changeDetail,
      beforeText: node.beforeText,
      afterText: node.afterText,
      confidence: node.confidence,
      matchScore: node.matchScore,
      oldNodeRef: node.oldNodeRef,
      newNodeRef: node.newNodeRef,
      originHint: node.originHint || undefined,
    });
  }

  return {
    items,
    view: {
      selectedId,
      filter,
      activeView: "review",
      expandedIds: view.expandedIds || [],
    },
    changeCount: items.filter((i) => i.visible && i.kind !== "unchanged").length,
  };
}

export { DEFAULT_FILTER, isVisible };
