/**
 * Smoke: browser-prepared DOCX core → Projection (Node + xmldom + jszip).
 * Run: node scripts/smart-diff-browser-smoke.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMParser } from "@xmldom/xmldom";
import JSZip from "jszip";
import { parseDocx } from "../assets/smart-diff-core/parser/docx.mjs";
import { normalizeWithReport } from "../assets/smart-diff-core/normalizer/to-slir.mjs";
import { matchSlir } from "../assets/smart-diff-core/matcher/engine.mjs";
import { buildDeltaTree } from "../assets/smart-diff-core/delta/builder.mjs";
import { buildProjection } from "../assets/smart-diff-core/projection/builder.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const oldPath = join(root, "packages/fixtures/docx/A-text-change.old.docx");
const newPath = join(root, "packages/fixtures/docx/A-text-change.new.docx");

async function toSlir(path, prefix) {
  const bytes = readFileSync(path);
  const raw = await parseDocx(bytes, { DOMParser, JSZip });
  return normalizeWithReport(raw, { idPrefix: prefix }).slir;
}

const oldSlir = await toSlir(oldPath, "old");
const newSlir = await toSlir(newPath, "new");
const matchMap = matchSlir(oldSlir, newSlir);
const delta = buildDeltaTree(oldSlir, newSlir, matchMap);
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

if (!projection?.changeCount || projection.changeCount < 1) {
  console.error("FAIL: expected changeCount >= 1", projection);
  process.exit(1);
}
console.log("PASS smart-diff browser smoke", {
  changeCount: projection.changeCount,
  items: projection.items?.length,
});
