/**
 * Wave 2.5 — 実務 DOCX smoke + Loss Report.
 * Run:
 *   node packages/scripts/build-docx-smoke-fixtures.mjs
 *   node packages/scripts/run-wave2.5.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMParser } from "@xmldom/xmldom";
import { parseDocx } from "../parser/docx.mjs";
import { normalizeWithReport } from "../normalizer/to-slir.mjs";
import { matchSlir } from "../matcher/engine.mjs";
import { buildDeltaTree } from "../delta/builder.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const smokeDir = join(__dirname, "..", "fixtures", "docx", "smoke");
const xmlOpts = { DOMParser };

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function typesOf(slir) {
  const out = [];
  function walk(n) {
    if (!n || typeof n !== "object") return;
    if (n.type) out.push(n.type);
    (n.children || []).forEach(walk);
  }
  walk(slir);
  return out;
}

async function load(name, idPrefix) {
  const bytes = readFileSync(join(smokeDir, name));
  const raw = await parseDocx(bytes, xmlOpts);
  const { slir, losses } = normalizeWithReport(raw, { idPrefix });
  return { raw, slir, losses };
}

async function pair(oldName, newName) {
  const o = await load(oldName, "old");
  const n = await load(newName, "new");
  const matchMap = matchSlir(o.slir, n.slir);
  const delta = buildDeltaTree(o.slir, n.slir, matchMap);
  return { ...o, newRaw: n.raw, newSlir: n.slir, newLosses: n.losses, delta };
}

async function t1() {
  const { slir, newSlir, delta } = await pair(
    "T1-contract.old.docx",
    "T1-contract.new.docx"
  );
  const t = typesOf(slir);
  assert(t.includes("heading"), "T1: heading");
  assert(t.includes("paragraph"), "T1: paragraph");
  assert(t.includes("list"), "T1: list");
  assert(t.includes("listItem"), "T1: listItem");
  assert(!t.includes("textRun") && !JSON.stringify(slir).includes("TextRunNode"), "T1: no TextRunNode");
  const added = delta.root.children.filter((c) => c.kind === "added");
  assert(added.length >= 1, "T1: list item or text change Added/Modified present");
  console.log("PASS T1 contract", {
    types: [...new Set(t)],
    deltaKinds: delta.root.children.map((c) => c.kind),
  });
}

async function t2() {
  const { newSlir, newLosses, delta } = await pair(
    "T2-policy.old.docx",
    "T2-policy.new.docx"
  );
  const texts = [];
  function walk(n) {
    if (n?.type === "text") texts.push(n);
    (n?.children || []).forEach(walk);
  }
  walk(newSlir);
  assert(texts.length >= 1, "T2: TextNode");
  const styled = texts.find((t) => t.styleSegments?.length);
  assert(styled, "T2: styleSegments");
  assert(
    styled.styleSegments.some((s) => s.style?.bold && s.style?.underline),
    "T2: bold+underline"
  );
  assert(
    styled.styleSegments.some((s) => s.style?.color),
    "T2: color in segments (provisional)"
  );
  assert(
    newLosses.some((l) => l.feature === "text_color"),
    "T2: color Loss info"
  );
  const soft = texts.find((t) => t.content.includes("\n"));
  assert(soft, "T2: soft break → newline in content");
  assert(
    delta.root.children.some((c) => c.kind === "modified"),
    "T2: modified (style/content)"
  );
  console.log("PASS T2 policy", {
    segments: styled.styleSegments,
    lossFeatures: newLosses.map((l) => l.feature),
  });
}

async function t3() {
  const { slir, raw, losses, delta } = await pair(
    "T3-pasted-table.old.docx",
    "T3-pasted-table.new.docx"
  );
  const table = slir.children.find((c) => c.type === "table");
  assert(table, "T3: TableNode");
  assert(!table.children?.length, "T3: atomic");
  const block = raw.blocks.find((b) => b.kindHint === "table");
  assert(block.tableFlags?.hasMergedCells, "T3: merge flag");
  assert(block.tableFlags?.hasEmptyCells, "T3: empty cell flag");
  assert(
    block.cellTexts.some((row) => row.some((c) => c.includes("\n"))),
    "T3: inner breaks in cellTexts"
  );
  assert(
    losses.some((l) => l.feature === "table_cell_merge"),
    "T3: merge Loss"
  );
  assert(
    delta.root.children.some(
      (c) => c.kind === "modified" && c.changeDetail === "table_changed"
    ),
    "T3: table_changed"
  );
  console.log("PASS T3 pasted-table", {
    summary: table.extractedTextSummary,
    flags: block.tableFlags,
  });
}

async function t4() {
  const { slir, raw, losses, delta } = await pair(
    "T4-chrome.old.docx",
    "T4-chrome.new.docx"
  );
  const json = JSON.stringify(slir);
  assert(!json.includes("社外秘"), "T4: header text not in SLIR body");
  assert(!json.includes("ページ番号"), "T4: footer text not in SLIR body");
  assert(raw.chrome?.headers?.length >= 1, "T4: chrome.headers snapshot");
  assert(raw.chrome?.footers?.length >= 1, "T4: chrome.footers snapshot");
  assert(
    losses.some((l) => l.feature === "header_footer" && l.severity === "warning"),
    "T4: header_footer Loss"
  );
  assert(
    delta.root.children.some(
      (c) =>
        c.kind === "modified" &&
        (c.beforeText || "").includes("30") &&
        (c.afterText || "").includes("45")
    ),
    "T4: body text still diffs"
  );
  console.log("PASS T4 chrome", {
    headers: raw.chrome.headers,
    footers: raw.chrome.footers,
  });
}

async function t5() {
  const { slir, losses, delta } = await pair(
    "T5-image.old.docx",
    "T5-image.new.docx"
  );
  const img = slir.children.find((c) => c.type === "image");
  assert(img, "T5: ImageNode");
  assert(img.contentHash, "T5: contentHash");
  assert(
    losses.some((l) => l.feature === "image_ocr" && l.severity === "info"),
    "T5: OCR not performed Loss"
  );
  // alt name change may yield modified image
  assert(delta.root.children.length >= 1, "T5: delta produced");
  console.log("PASS T5 image", { image: img, delta: delta.root.children.map((c) => c.kind) });
}

try {
  await t1();
  await t2();
  await t3();
  await t4();
  await t5();
  console.log("\nWave 2.5 DOCX real smoke: ALL PASS");
} catch (e) {
  console.error("\nFAIL:", e.message);
  console.error(e.stack);
  process.exit(1);
}
