/**
 * Wave 4 — bake Projection fixtures (UI never runs Matcher).
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMParser } from "@xmldom/xmldom";
import { matchSlir } from "../matcher/engine.mjs";
import { buildDeltaTree } from "../delta/builder.mjs";
import { buildProjection } from "../projection/builder.mjs";
import { parseDocx } from "../parser/docx.mjs";
import { normalizeToSlir } from "../normalizer/to-slir.mjs";
import { parsePdf } from "../parser/pdf.mjs";
import { normalizePdfToSlir } from "../normalizer/pdf-to-slir.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "fixtures", "ui");
const assetsDir = join(__dirname, "..", "..", "assets", "smart-diff-fixtures");
mkdirSync(outDir, { recursive: true });
mkdirSync(assetsDir, { recursive: true });

function writeBoth(name, payload) {
  const json = JSON.stringify(payload, null, 2);
  writeFileSync(join(outDir, name), json);
  writeFileSync(join(assetsDir, name), json);
}

const filter = {
  content: true,
  addedDeleted: true,
  style: true,
  showModified: true,
  showAdded: true,
  showDeleted: true,
  showUnchanged: false,
};

function project(oldSlir, newSlir) {
  const matchMap = matchSlir(oldSlir, newSlir);
  const delta = buildDeltaTree(oldSlir, newSlir, matchMap);
  return buildProjection(delta, { filter });
}

// A — DOCX 第3条 30→45
{
  const xmlOpts = { DOMParser };
  const oldBytes = readFileSync(
    join(__dirname, "..", "fixtures", "docx", "A-text-change.old.docx")
  );
  const newBytes = readFileSync(
    join(__dirname, "..", "fixtures", "docx", "A-text-change.new.docx")
  );
  const oldSlir = normalizeToSlir(await parseDocx(oldBytes, xmlOpts), {
    idPrefix: "a-old",
  });
  const newSlir = normalizeToSlir(await parseDocx(newBytes, xmlOpts), {
    idPrefix: "a-new",
  });
  const projection = project(oldSlir, newSlir);
  writeBoth("A-docx-projection.json", { id: "A-docx", projection });
  console.log("A", projection.changeCount);
}

// B — PDF multipage (page origin)
{
  const oldSlir = normalizePdfToSlir(
    await parsePdf(readFileSync(join(__dirname, "..", "fixtures", "pdf", "E-multipage.old.pdf"))),
    { idPrefix: "b-old" }
  );
  const newSlir = normalizePdfToSlir(
    await parsePdf(readFileSync(join(__dirname, "..", "fixtures", "pdf", "E-multipage.new.pdf"))),
    { idPrefix: "b-new" }
  );
  const projection = project(oldSlir, newSlir);
  writeBoth("B-pdf-projection.json", { id: "B-pdf", projection });
  console.log(
    "B",
    projection.changeCount,
    projection.items.filter((i) => i.originHint?.page).map((i) => i.originHint)
  );
}

// C — Table
{
  const oldDoc = JSON.parse(
    readFileSync(join(__dirname, "..", "fixtures", "E-table-atomic.old.slir.json"), "utf8")
  );
  const newDoc = JSON.parse(
    readFileSync(join(__dirname, "..", "fixtures", "E-table-atomic.new.slir.json"), "utf8")
  );
  const projection = project(oldDoc, newDoc);
  writeBoth("C-table-projection.json", { id: "C-table", projection });
  console.log("C", projection.items.map((i) => i.changeDetail));
}

console.log("UI projection fixtures ready");
