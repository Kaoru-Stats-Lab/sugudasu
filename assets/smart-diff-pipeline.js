/**
 * Browser Smart Diff pipeline — DOCX/PDF bytes → Projection.
 * Uses assets/smart-diff-core (prepared from packages/).
 */
import { parseDocx } from "./smart-diff-core/parser/docx.mjs";
import { parsePdfWithLib } from "./smart-diff-core/parser/pdf.mjs";
import { normalizeToSlir, normalizeWithReport } from "./smart-diff-core/normalizer/to-slir.mjs";
import {
  normalizePdfToSlir,
  normalizePdfWithReport,
} from "./smart-diff-core/normalizer/pdf-to-slir.mjs";
import { matchSlir } from "./smart-diff-core/matcher/engine.mjs";
import { buildDeltaTree } from "./smart-diff-core/delta/builder.mjs";
import { buildProjection } from "./smart-diff-core/projection/builder.mjs";
import { ensurePdfjs, pdfjsDocumentExtras } from "./sg-pdf-vendor.js";

const DEFAULT_FILTER = {
  content: true,
  addedDeleted: true,
  style: true,
  showModified: true,
  showAdded: true,
  showDeleted: true,
  showUnchanged: false,
};

/**
 * @param {string} name
 * @param {string} [mime]
 * @returns {"docx"|"pdf"|null}
 */
export function detectDocKind(name = "", mime = "") {
  const n = String(name).toLowerCase();
  const m = String(mime).toLowerCase();
  if (n.endsWith(".docx") || m.includes("wordprocessingml") || m.includes("officedocument.wordprocessingml")) {
    return "docx";
  }
  if (n.endsWith(".pdf") || m === "application/pdf" || m.includes("application/pdf")) {
    return "pdf";
  }
  return null;
}

/**
 * @param {ArrayBuffer|Uint8Array} bytes
 * @param {"docx"|"pdf"} kind
 * @param {string} idPrefix
 */
async function toSlirWithLosses(bytes, kind, idPrefix) {
  const u8 =
    bytes instanceof Uint8Array
      ? bytes
      : new Uint8Array(bytes);

  if (kind === "docx") {
    const raw = await parseDocx(u8, { DOMParser: globalThis.DOMParser });
    const { slir, losses } = normalizeWithReport(raw, { idPrefix });
    return { slir, losses: losses || [], format: "docx" };
  }

  const pdfjs = await ensurePdfjs();
  const raw = await parsePdfWithLib(pdfjs, u8, {
    disableWorker: false,
    documentOpts: pdfjsDocumentExtras(),
  });
  const { slir, losses } = normalizePdfWithReport(raw, { idPrefix });
  return {
    slir,
    losses: [...(raw.losses || []), ...(losses || [])],
    format: "pdf",
  };
}

/**
 * @param {{
 *   oldBytes: ArrayBuffer|Uint8Array,
 *   newBytes: ArrayBuffer|Uint8Array,
 *   kind: "docx"|"pdf",
 *   oldName?: string,
 *   newName?: string,
 * }} input
 */
export async function compareDocumentBytes(input) {
  const { oldBytes, newBytes, kind } = input;
  if (kind !== "docx" && kind !== "pdf") {
    throw new Error("DOCX 同士、または PDF 同士で比較してください");
  }

  const oldP = await toSlirWithLosses(oldBytes, kind, "old");
  const newP = await toSlirWithLosses(newBytes, kind, "new");
  const matchMap = matchSlir(oldP.slir, newP.slir);
  const delta = buildDeltaTree(oldP.slir, newP.slir, matchMap);
  const projection = buildProjection(delta, { filter: { ...DEFAULT_FILTER } });

  return {
    kind,
    projection,
    losses: [...oldP.losses, ...newP.losses],
    changeCount: projection.changeCount,
    oldName: input.oldName || "旧",
    newName: input.newName || "新",
  };
}

export { normalizeToSlir, normalizePdfToSlir, DEFAULT_FILTER };
