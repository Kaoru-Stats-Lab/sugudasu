/**
 * Wave 1 Matcher — identity candidates only. No ChangeKind.
 * ADR-003 · Score 30/25/30/15 · thresholds 85 / 60
 */

const WEIGHTS = { heading: 30, context: 25, text: 30, position: 15 };
const SAME_MIN = 85;
const CANDIDATE_MIN = 60;

function walk(node, path = [], out = []) {
  if (!node || typeof node !== "object") return out;
  const type = node.type;
  if (type && type !== "document" && type !== "text" && type !== "annotation") {
    out.push({
      id: node.id,
      type,
      text: nodeText(node),
      headingText: type === "heading" ? node.text || "" : "",
      level: node.level,
      contentHash: node.contentHash,
      rowCount: node.rowCount,
      columnCount: node.columnCount,
      path: path.join("/"),
      indexInParent: path.length ? Number(path[path.length - 1]) : 0,
      parentPath: path.slice(0, -1).join("/"),
    });
  }
  const children = node.children;
  if (Array.isArray(children)) {
    children.forEach((c, i) => walk(c, path.concat(String(i)), out));
  }
  return out;
}

function nodeText(node) {
  if (node.type === "heading") return String(node.text || "");
  if (node.type === "table") return String(node.extractedTextSummary || node.contentHash || "");
  if (node.type === "paragraph" || node.type === "listItem") {
    return (node.children || [])
      .filter((c) => c.type === "text")
      .map((c) => c.content || "")
      .join("");
  }
  return "";
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const prev = new Array(n + 1);
  const cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = cur[j];
  }
  return prev[n];
}

function textSim(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return Math.max(0, 1 - dist / Math.max(a.length, b.length));
}

function headingScore(o, n) {
  if (o.type === "heading" && n.type === "heading") {
    if (o.text === n.text && o.level === n.level) return WEIGHTS.heading;
    if (o.text === n.text || o.level === n.level) return WEIGHTS.heading / 2;
    return 0;
  }
  return 0;
}

function scorePair(o, n, oList, nList) {
  if (o.type !== n.type) return 0;
  let s = 0;
  s += headingScore(o, n);
  // Root children share parentPath "" — treat as same context (not falsy-skip)
  if (o.parentPath === n.parentPath) s += WEIGHTS.context;
  else {
    const oCtx = oList.find((x) => x.path === o.parentPath);
    const nCtx = nList.find((x) => x.path === n.parentPath);
    if (oCtx && nCtx && oCtx.type === nCtx.type) s += WEIGHTS.context * 0.3;
  }
  if (o.type === "table" && n.type === "table") {
    if (o.contentHash === n.contentHash) s += WEIGHTS.text;
    else {
      // Atomic identity: summary / shape — contentHash delta is Delta's job
      const summarySim = textSim(o.text, n.text);
      const sameShape =
        o.rowCount != null &&
        o.rowCount === n.rowCount &&
        o.columnCount != null &&
        o.columnCount === n.columnCount;
      const struct = sameShape ? 0.7 : 0.35;
      s += Math.max(summarySim, struct) * WEIGHTS.text;
    }
  } else {
    s += textSim(o.text, n.text) * WEIGHTS.text;
  }
  const oPos = oList.indexOf(o);
  const nPos = nList.indexOf(n);
  const posSim =
    1 - Math.min(1, Math.abs(oPos - nPos) / Math.max(oList.length, nList.length, 1));
  s += posSim * WEIGHTS.position;
  return Math.round(s);
}

/**
 * Identity candidates only — never emits ChangeKind.
 * @returns {import('../matcher/types').MatchMap} conceptually
 */
export function matchSlir(oldDoc, newDoc) {
  const oldNodes = walk(oldDoc);
  const newNodes = walk(newDoc);
  const usedNew = new Set();
  const matchedOld = new Set();
  /** @type {any[]} */
  const map = [];

  // Pass 1: exact type+text → Stable Identity under front-insert (Fixture C)
  for (const o of oldNodes) {
    if (!o.text) continue;
    const exact = newNodes.find(
      (n) => !usedNew.has(n.id) && n.type === o.type && n.text === o.text
    );
    if (!exact) continue;
    let score = scorePair(o, exact, oldNodes, newNodes);
    if (o.text === exact.text) score = Math.max(score, SAME_MIN);
    usedNew.add(exact.id);
    matchedOld.add(o.id);
    map.push({
      oldNodeId: o.id,
      newNodeId: exact.id,
      score,
      confidence: score >= SAME_MIN ? "high" : "candidate",
    });
  }

  // Pass 2: best score among remaining
  for (const o of oldNodes) {
    if (matchedOld.has(o.id)) continue;
    let best = null;
    let bestScore = -1;
    for (const n of newNodes) {
      if (usedNew.has(n.id)) continue;
      if (o.type !== n.type) continue;
      const sc = scorePair(o, n, oldNodes, newNodes);
      if (sc > bestScore) {
        bestScore = sc;
        best = n;
      }
    }
    if (best && bestScore >= CANDIDATE_MIN) {
      usedNew.add(best.id);
      matchedOld.add(o.id);
      map.push({
        oldNodeId: o.id,
        newNodeId: best.id,
        score: bestScore,
        confidence: bestScore >= SAME_MIN ? "high" : "candidate",
      });
    } else {
      map.push({ oldNodeId: o.id, newNodeId: null, confidence: "none" });
    }
  }

  for (const n of newNodes) {
    if (!usedNew.has(n.id)) {
      map.push({ oldNodeId: null, newNodeId: n.id, confidence: "none" });
    }
  }
  return map;
}

export { walk, nodeText, textSim, WEIGHTS, SAME_MIN, CANDIDATE_MIN };
