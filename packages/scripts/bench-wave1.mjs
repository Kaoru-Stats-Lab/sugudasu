/**
 * Wave 1 micro-bench — 1000 SLIR nodes.
 * Separates Matcher / Delta / Projection so Parser lag can be compared later.
 * Run: node packages/scripts/bench-wave1.mjs
 */
import { matchSlir } from "../matcher/engine.mjs";
import { buildDeltaTree } from "../delta/builder.mjs";
import { buildProjection } from "../projection/builder.mjs";

function makeDoc(id, mutateEvery = 0) {
  const children = [];
  for (let i = 0; i < 1000; i++) {
    if (i % 10 === 0) {
      children.push({
        id: `${id}-h-${i}`,
        type: "heading",
        level: 2,
        text: `第${Math.floor(i / 10)}条`,
      });
    } else {
      const n = mutateEvery && i % mutateEvery === 0 ? i + 1 : i;
      children.push({
        id: `${id}-p-${i}`,
        type: "paragraph",
        children: [
          {
            id: `${id}-t-${i}`,
            type: "text",
            content: `段落${n}の本文です。支払条件サンプル。`,
          },
        ],
      });
    }
  }
  return {
    id,
    type: "document",
    sourceFormat: "fixture",
    children,
  };
}

const oldDoc = makeDoc("bench-old");
const newDoc = makeDoc("bench-new", 17);

function timed(label, fn) {
  const t0 = performance.now();
  const result = fn();
  const ms = performance.now() - t0;
  return { label, ms, result };
}

const m = timed("Matcher", () => matchSlir(oldDoc, newDoc));
const d = timed("Delta", () => buildDeltaTree(oldDoc, newDoc, m.result));
const p = timed("Projection", () =>
  buildProjection(d.result, {
    filter: {
      content: true,
      addedDeleted: true,
      style: false,
      showModified: true,
      showAdded: true,
      showDeleted: true,
      showUnchanged: false,
    },
  })
);

const report = {
  nodes: 1000,
  matcherMs: Number(m.ms.toFixed(2)),
  deltaMs: Number(d.ms.toFixed(2)),
  projectionMs: Number(p.ms.toFixed(2)),
  totalMs: Number((m.ms + d.ms + p.ms).toFixed(2)),
  changeCount: p.result.changeCount,
  matchEntries: m.result.length,
};

console.log(JSON.stringify(report, null, 2));
