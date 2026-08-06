/**
 * Wave 1 Delta Builder — ChangeKind from Match Map. No UI.
 * Candidate stays confidence; never force deleted+added.
 */

import { walk, nodeText } from "../matcher/engine.mjs";

function indexById(doc) {
  const map = new Map();
  function visit(n) {
    if (n && n.id) map.set(n.id, n);
    (n.children || []).forEach(visit);
  }
  visit(doc);
  return map;
}

function styleOnly(oldNode, newNode) {
  const ot = nodeText(oldNode);
  const nt = nodeText(newNode);
  if (ot !== nt) return false;
  const os = JSON.stringify(collectStyles(oldNode));
  const ns = JSON.stringify(collectStyles(newNode));
  return os !== ns;
}

function collectStyles(node) {
  const segs = [];
  function visit(n) {
    if (n.type === "text" && n.styleSegments) segs.push(n.styleSegments);
    (n.children || []).forEach(visit);
  }
  visit(node);
  return segs;
}

function contentEqual(oldNode, newNode) {
  if (oldNode.type === "table" && newNode.type === "table") {
    return oldNode.contentHash === newNode.contentHash;
  }
  if (styleOnly(oldNode, newNode)) return false;
  return nodeText(oldNode) === nodeText(newNode) && oldNode.type === newNode.type;
}

function labelFor(node) {
  if (!node) return "";
  if (node.type === "heading") return node.text || "見出し";
  if (node.type === "table") return node.extractedTextSummary || "表";
  if (node.type === "paragraph") return nodeText(node).slice(0, 40) || "段落";
  return node.type;
}

/** Display-only page/bbox hint — not used for ChangeKind. */
function originHintFrom(...nodes) {
  for (const node of nodes) {
    const pdf = node?.origin?.pdf;
    if (pdf && (pdf.page != null || pdf.bbox)) {
      return { page: pdf.page, bbox: pdf.bbox };
    }
  }
  return undefined;
}

/**
 * @param {object} oldDoc
 * @param {object} newDoc
 * @param {any[]} matchMap
 */
export function buildDeltaTree(oldDoc, newDoc, matchMap) {
  const oldIdx = indexById(oldDoc);
  const newIdx = indexById(newDoc);
  const children = [];
  let seq = 0;
  const id = () => `delta-${++seq}`;

  for (const m of matchMap) {
    if (m.confidence === "none" && m.oldNodeId && !m.newNodeId) {
      const o = oldIdx.get(m.oldNodeId);
      children.push({
        id: id(),
        kind: "deleted",
        oldNodeRef: m.oldNodeId,
        beforeText: o ? nodeText(o) : undefined,
        summary: labelFor(o),
        originHint: originHintFrom(o),
      });
      continue;
    }
    if (m.confidence === "none" && m.newNodeId && !m.oldNodeId) {
      const n = newIdx.get(m.newNodeId);
      children.push({
        id: id(),
        kind: "added",
        newNodeRef: m.newNodeId,
        afterText: n ? nodeText(n) : undefined,
        summary: labelFor(n),
        originHint: originHintFrom(n),
      });
      continue;
    }
    if (m.confidence === "high" || m.confidence === "candidate") {
      const o = oldIdx.get(m.oldNodeId);
      const n = newIdx.get(m.newNodeId);
      if (!o || !n) continue;
      // Content equal → Unchanged even if Matcher confidence is candidate.
      // Candidate is identity uncertainty, not a ChangeKind.
      if (contentEqual(o, n)) {
        children.push({
          id: id(),
          kind: "unchanged",
          oldNodeRef: m.oldNodeId,
          newNodeRef: m.newNodeId,
          confidence: m.confidence === "candidate" ? "candidate" : "high",
          matchScore: typeof m.score === "number" ? m.score : undefined,
          summary: labelFor(o),
          originHint: originHintFrom(o, n),
        });
        continue;
      }
      const detail =
        o.type === "table" && n.type === "table" && o.contentHash !== n.contentHash
          ? "table_changed"
          : styleOnly(o, n)
            ? "style_only"
            : "text_only";
      children.push({
        id: id(),
        kind: "modified",
        oldNodeRef: m.oldNodeId,
        newNodeRef: m.newNodeId,
        confidence: m.confidence,
        matchScore: typeof m.score === "number" ? m.score : undefined,
        changeDetail: detail,
        beforeText: nodeText(o),
        afterText: nodeText(n),
        summary: labelFor(o) || labelFor(n),
        originHint: originHintFrom(o, n),
        inlineChanges:
          detail === "text_only"
            ? [{ type: "replace", before: nodeText(o), after: nodeText(n) }]
            : undefined,
      });
    }
  }

  return {
    root: {
      id: "delta-root",
      kind: "unchanged",
      children,
    },
  };
}

export { labelFor };
