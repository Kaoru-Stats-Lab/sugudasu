/**
 * Wave 5 — Export Projection → PDF Report
 * Run:
 *   node packages/scripts/build-ui-fixtures.mjs
 *   node packages/scripts/build-export-fixtures.mjs
 *   node packages/scripts/run-wave5.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDiffReport,
  displayTypeFor,
  exportProjectionToPdf,
  reportFileName,
} from "../export/index.mjs";
import { parsePdf } from "../parser/pdf.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixDir = join(__dirname, "..", "fixtures", "export");
const outPdfDir = join(fixDir, "out");
mkdirSync(outPdfDir, { recursive: true });

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function load(name) {
  return JSON.parse(readFileSync(join(fixDir, name), "utf8"));
}

async function runA() {
  const { projection } = load("A-modified-projection.json");
  const { report, bytes } = await exportProjectionToPdf(projection, {
    oldName: "old.docx",
    newName: "new.docx",
  });
  assert(report.changeCount >= 1, "A: changeCount");
  const entry = report.entries.find(
    (e) =>
      (e.before || "").includes("30") && (e.after || "").includes("45")
  );
  assert(entry, "A: Before/After 30→45 in report");
  assert(entry.displayType === "Modified" || entry.displayType === "Candidate", "A: type");
  assert(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46, "A: %PDF");
  writeFileSync(join(outPdfDir, "A-modified_smart-diff.pdf"), bytes);
  const raw = await parsePdf(bytes);
  const text = raw.pages.map((p) => p.items.map((i) => i.text).join("")).join("\n");
  assert(text.includes("30") && text.includes("45"), "A: PDF text has 30/45");
  assert(text.includes("Before") && text.includes("After"), "A: PDF labels");
  console.log("PASS A Modified", { pages: raw.pageCount, file: reportFileName("A-modified") });
}

async function runB() {
  const { projection } = load("B-added-projection.json");
  // Hide all via filter — export must still include Added
  projection.items = projection.items.map((i) => ({ ...i, visible: false }));
  const { report, bytes } = await exportProjectionToPdf(projection, {
    oldName: "old.docx",
    newName: "new.docx",
  });
  assert(report.changeCount === 1, "B: export all changes despite filter");
  assert(report.entries[0].displayType === "Added", "B: Added");
  assert((report.entries[0].after || "").includes("序文"), "B: content");
  writeFileSync(join(outPdfDir, "B-added_smart-diff.pdf"), bytes);
  const raw = await parsePdf(bytes);
  const text = raw.pages.map((p) => p.items.map((i) => i.text).join("")).join("");
  assert(text.includes("Added") || text.includes("序文"), "B: PDF has added");
  console.log("PASS B Added (filter ignored)", { changeCount: report.changeCount });
}

async function runC() {
  const { projection } = load("C-table-projection.json");
  const { report, bytes } = await exportProjectionToPdf(projection);
  const table = report.entries.find((e) => e.displayType === "Table changed" || e.body?.includes("表"));
  assert(table, "C: table entry");
  assert(table.body === "表に変更があります", "C: table body");
  assert(!/3行|2列/.test(JSON.stringify(report)), "C: no cell coords");
  writeFileSync(join(outPdfDir, "C-table_smart-diff.pdf"), bytes);
  const raw = await parsePdf(bytes);
  const text = raw.pages.map((p) => p.items.map((i) => i.text).join("")).join("");
  assert(text.includes("表に変更があります"), "C: PDF table note");
  console.log("PASS C Table");
}

async function runD() {
  const { projection } = load("D-candidate-projection.json");
  const item = projection.items[0];
  assert(displayTypeFor(item) === "Candidate", "D: displayType Candidate");
  const { report, bytes } = await exportProjectionToPdf(projection);
  const e = report.entries[0];
  assert(e.displayType === "Candidate", "D: report Candidate");
  assert(e.body?.includes("未確定"), "D: 未確定");
  assert(e.displayType !== "Modified", "D: not Modified label");
  writeFileSync(join(outPdfDir, "D-candidate_smart-diff.pdf"), bytes);
  const raw = await parsePdf(bytes);
  const text = raw.pages.map((p) => p.items.map((i) => i.text).join("")).join("");
  assert(text.includes("Candidate") || text.includes("未確定"), "D: PDF candidate");
  assert(!text.includes("変更あり") || text.includes("Candidate"), "D: not bare 変更あり as type");
  console.log("PASS D Candidate");
}

function runBoundary() {
  const src = readFileSync(join(__dirname, "..", "export", "index.mjs"), "utf8");
  const model = readFileSync(join(__dirname, "..", "export", "report-model.mjs"), "utf8");
  const pdf = readFileSync(join(__dirname, "..", "export", "pdf-report.mjs"), "utf8");
  const all = src + model + pdf;
  assert(!/matchSlir|buildDeltaTree|normalizeToSlir|parseDocx/.test(all), "Export: no core recompute");
  // pdf-report may import parse? no
  assert(!/from ['\"].*matcher/.test(all), "no matcher");
  assert(!/from ['\"].*delta\/builder/.test(all), "no delta builder");
  console.log("PASS boundary");
}

try {
  runBoundary();
  await runA();
  await runB();
  await runC();
  await runD();
  console.log("\nWave 5 Export PDF Report: ALL PASS");
} catch (e) {
  console.error("\nFAIL:", e.message);
  console.error(e.stack);
  process.exit(1);
}
