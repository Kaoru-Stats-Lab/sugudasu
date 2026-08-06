/**
 * Wave 2: DOCX → Raw → SLIR → Wave 1 Core assertions.
 * Run:
 *   node packages/scripts/build-docx-fixtures.mjs
 *   node packages/scripts/run-wave2.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMParser } from "@xmldom/xmldom";
import { parseDocx } from "../parser/docx.mjs";
import { normalizeToSlir } from "../normalizer/to-slir.mjs";
import { matchSlir } from "../matcher/engine.mjs";
import { buildDeltaTree } from "../delta/builder.mjs";
import { buildProjection } from "../projection/builder.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docxDir = join(__dirname, "..", "fixtures", "docx");
const xmlOpts = { DOMParser };

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function loadSlir(name, idPrefix) {
  const bytes = readFileSync(join(docxDir, name));
  const raw = await parseDocx(bytes, xmlOpts);
  return { raw, slir: normalizeToSlir(raw, { idPrefix }) };
}

async function pipeline(oldName, newName) {
  const oldP = await loadSlir(oldName, "old");
  const newP = await loadSlir(newName, "new");
  const matchMap = matchSlir(oldP.slir, newP.slir);
  const delta = buildDeltaTree(oldP.slir, newP.slir, matchMap);
  const projection = buildProjection(delta, {
    filter: {
      content: true,
      addedDeleted: true,
      style: true,
      showModified: true,
      showAdded: true,
      showDeleted: true,
      showUnchanged: false,
    },
  });
  return {
    oldRaw: oldP.raw,
    newRaw: newP.raw,
    oldSlir: oldP.slir,
    newSlir: newP.slir,
    matchMap,
    delta,
    projection,
    children: delta.root.children,
  };
}

function kinds(children) {
  return children.map((c) => ({
    kind: c.kind,
    detail: c.changeDetail,
    summary: c.summary,
  }));
}

async function runA() {
  const { children, oldRaw, oldSlir } = await pipeline(
    "A-text-change.old.docx",
    "A-text-change.new.docx"
  );
  assert(oldRaw.format === "docx", "A: Raw format docx");
  assert(
    !JSON.stringify(oldRaw).includes('"type":"paragraph"') ||
      oldRaw.blocks.every((b) => b.kindHint),
    "A: Raw uses kindHint not SLIR type as contract"
  );
  assert(
    oldSlir.children.some((c) => c.type === "heading"),
    "A: SLIR has heading"
  );
  const mod = children.filter((c) => c.kind === "modified");
  assert(mod.length >= 1, "A: Modified");
  assert(
    mod.some(
      (c) =>
        (c.beforeText || "").includes("30") && (c.afterText || "").includes("45")
    ),
    "A: 30→45"
  );
  console.log("PASS A DOCX text-change", kinds(children));
}

async function runB() {
  const { children } = await pipeline(
    "B-front-insert.old.docx",
    "B-front-insert.new.docx"
  );
  for (const a of ["第1条", "第2条", "第3条"]) {
    const hit = children.find((c) => c.summary === a);
    assert(hit, `B: missing ${a}`);
    assert(hit.kind === "unchanged", `B: ${a} Unchanged, got ${hit.kind}`);
  }
  assert(
    children.some(
      (c) => c.kind === "added" && (c.afterText || c.summary || "").includes("序文")
    ),
    "B: intro Added"
  );
  console.log("PASS B DOCX front-insert", kinds(children));
}

async function runC() {
  const { children, newSlir } = await pipeline(
    "C-style-only.old.docx",
    "C-style-only.new.docx"
  );
  const text = newSlir.children
    .flatMap((c) => c.children || [])
    .find((t) => t.type === "text");
  assert(text?.styleSegments?.some((s) => s.style?.bold), "C: bold segments in SLIR");
  const mod = children.filter((c) => c.kind === "modified");
  assert(mod.length === 1, `C: 1 Modified, got ${mod.length}`);
  assert(mod[0].changeDetail === "style_only", `C: style_only got ${mod[0].changeDetail}`);
  console.log("PASS C DOCX style-only", kinds(children));
}

async function runD() {
  const { children, oldSlir } = await pipeline("D-table.old.docx", "D-table.new.docx");
  const table = oldSlir.children.find((c) => c.type === "table");
  assert(table, "D: TableNode");
  assert(table.contentHash, "D: contentHash");
  assert(!table.children?.length, "D: atomic — no cell children");
  const mod = children.filter((c) => c.kind === "modified");
  assert(mod.length === 1, "D: 1 Modified table");
  assert(mod[0].changeDetail === "table_changed", "D: table_changed");
  console.log("PASS D DOCX table-atomic", kinds(children));
}

try {
  await runA();
  await runB();
  await runC();
  await runD();
  console.log("\nWave 2 DOCX → Core: ALL PASS");
} catch (e) {
  console.error("\nFAIL:", e.message);
  process.exit(1);
}
