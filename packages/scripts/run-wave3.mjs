/**
 * Wave 3 — PDF → Raw → Normalizer → SLIR (+ Core sample) + regressions gate.
 * Run:
 *   node packages/scripts/build-pdf-fixtures.mjs
 *   node packages/scripts/run-wave3.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePdf } from "../parser/pdf.mjs";
import { normalizePdfWithReport } from "../normalizer/pdf-to-slir.mjs";
import { matchSlir } from "../matcher/engine.mjs";
import { buildDeltaTree } from "../delta/builder.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfDir = join(__dirname, "..", "fixtures", "pdf");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function typesOf(slir) {
  const out = [];
  function walk(n) {
    if (!n?.type) return;
    out.push(n.type);
    (n.children || []).forEach(walk);
  }
  walk(slir);
  return out;
}

async function load(name, idPrefix) {
  const bytes = readFileSync(join(pdfDir, name));
  const raw = await parsePdf(bytes);
  const { slir, losses } = normalizePdfWithReport(raw, { idPrefix });
  return { raw, slir, losses };
}

async function pair(a, b) {
  const o = await load(a, "old");
  const n = await load(b, "new");
  const matchMap = matchSlir(o.slir, n.slir);
  const delta = buildDeltaTree(o.slir, n.slir, matchMap);
  return { o, n, delta };
}

async function runA() {
  const { o, n, delta } = await pair("A-contract.old.pdf", "A-contract.new.pdf");
  const t = typesOf(o.slir);
  assert(t.includes("heading"), "A: Heading");
  assert(t.includes("paragraph"), "A: Paragraph");
  assert(!t.includes("section"), "A: no Section");
  assert(
    delta.root.children.some(
      (c) =>
        c.kind === "modified" &&
        (c.beforeText || "").includes("30") &&
        (c.afterText || "").includes("45")
    ),
    "A: 30→45 via Core"
  );
  console.log("PASS A contract", { types: [...new Set(t)] });
}

async function runB() {
  const { o } = await pair("B-two-column.old.pdf", "B-two-column.new.pdf");
  assert(
    o.losses.some((l) => l.type === "reading_order_uncertain" || l.feature === "reading_order_uncertain"),
    "B: reading_order_uncertain Loss"
  );
  assert(!JSON.stringify(o.slir).includes("reading_order"), "B: Loss not in SLIR body");
  console.log("PASS B two-column", {
    losses: o.losses.filter((l) => l.feature === "reading_order_uncertain"),
  });
}

async function runC() {
  const { o, delta } = await pair("C-table.old.pdf", "C-table.new.pdf");
  const table = o.slir.children.find((c) => c.type === "table");
  assert(table, "C: TableNode");
  assert(!table.children?.length, "C: atomic");
  assert(
    o.losses.some((l) => l.feature === "table_structure_unknown"),
    "C: table_structure_unknown"
  );
  assert(
    delta.root.children.some(
      (c) => c.kind === "modified" && c.changeDetail === "table_changed"
    ),
    "C: table_changed"
  );
  console.log("PASS C table", { summary: table.extractedTextSummary });
}

async function runD() {
  const { o } = await pair("D-scan.old.pdf", "D-scan.new.pdf");
  const types = typesOf(o.slir);
  assert(!types.includes("text") || !o.slir.children.some((c) => c.type === "paragraph"), "D: no text paragraphs preferred");
  const hasTextNode = types.includes("text");
  assert(!hasTextNode, "D: no TextNode");
  assert(types.includes("image"), "D: ImageNode");
  assert(
    o.losses.some((l) => l.type === "ocr_required" || l.feature === "ocr_required"),
    "D: ocr_required"
  );
  console.log("PASS D scan", { types: [...new Set(types)], losses: o.losses.map((l) => l.feature || l.type) });
}

async function runE() {
  const { o, delta } = await pair("E-multipage.old.pdf", "E-multipage.new.pdf");
  assert(o.raw.pageCount === 2, "E: 2 pages in Raw");
  assert(!typesOf(o.slir).includes("section"), "E: Section forbidden");
  const pages = new Set();
  function walk(n) {
    if (n?.origin?.pdf?.page) pages.add(n.origin.pdf.page);
    (n?.children || []).forEach(walk);
  }
  walk(o.slir);
  assert(pages.has(1) && pages.has(2), "E: page origin preserved");
  assert(
    delta.root.children.some((c) => c.kind === "modified"),
    "E: page1 body modified"
  );
  console.log("PASS E multipage", { pages: [...pages], types: [...new Set(typesOf(o.slir))] });
}

try {
  await runA();
  await runB();
  await runC();
  await runD();
  await runE();
  console.log("\nWave 3 PDF → SLIR: ALL PASS");
} catch (e) {
  console.error("\nFAIL:", e.message);
  console.error(e.stack);
  process.exit(1);
}
