/**
 * Projection → DiffReport (pure). No SLIR / Matcher / Delta.
 * Export ignores UI filter visibility — all non-unchanged items.
 */

/**
 * @param {object} item
 */
export function displayTypeFor(item) {
  if (item.candidate) return "Candidate";
  if (item.changeDetail === "table_changed") return "Table changed";
  if (item.kind === "added") return "Added";
  if (item.kind === "deleted") return "Deleted";
  if (item.kind === "modified") return "Modified";
  return String(item.kind || "Unknown");
}

/**
 * @param {import('../projection/CONTRACT.md')} projection
 * @param {{ oldName?: string, newName?: string, title?: string, generatedAt?: string }} [meta]
 */
export function buildDiffReport(projection, meta = {}) {
  const items = (projection?.items || []).filter((i) => i.kind !== "unchanged");
  /** @type {any[]} */
  const entries = [];
  let index = 0;
  for (const item of items) {
    index += 1;
    const displayType = displayTypeFor(item);
    /** @type {any} */
    const entry = {
      index,
      id: item.id,
      label: item.label || displayType,
      displayType,
      candidate: !!item.candidate,
    };
    if (item.changeDetail === "table_changed") {
      entry.body = "表に変更があります";
    } else if (item.candidate) {
      entry.body = "自動判定: 未確定\n確認してください";
      entry.before = item.beforeText || undefined;
      entry.after = item.afterText || undefined;
    } else {
      if (item.beforeText != null && item.beforeText !== "") entry.before = item.beforeText;
      if (item.afterText != null && item.afterText !== "") entry.after = item.afterText;
      if (item.kind === "added" && item.afterText) entry.after = item.afterText;
      if (item.kind === "deleted" && item.beforeText) entry.before = item.beforeText;
    }
    entries.push(entry);
  }

  return {
    title: meta.title || "Smart Diff Report",
    generatedAt: meta.generatedAt || new Date().toISOString(),
    sources: {
      oldName: meta.oldName || "old",
      newName: meta.newName || "new",
    },
    changeCount: entries.length,
    entries,
  };
}

/**
 * Suggest download filename.
 * @param {string} [base]
 */
export function reportFileName(base) {
  const b = String(base || "smart-diff-report")
    .replace(/\.pdf$/i, "")
    .replace(/[^\w.\-\u3040-\u30ff\u3400-\u9fff]+/g, "_");
  return `${b}_smart-diff.pdf`;
}
