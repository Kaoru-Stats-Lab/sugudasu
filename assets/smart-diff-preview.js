/**
 * /smart-diff — loads baked Projection fixtures only (public α).
 * Does not run Matcher / Delta / Parser in the browser yet.
 */
import { mountChangeNavigator } from "./smart-diff-navigator.js";
import { downloadSmartDiffPdf } from "./smart-diff-export.js";

const FIXTURES = {
  A: new URL("./smart-diff-fixtures/A-docx-projection.json", import.meta.url).href,
  B: new URL("./smart-diff-fixtures/B-pdf-projection.json", import.meta.url).href,
  C: new URL("./smart-diff-fixtures/C-table-projection.json", import.meta.url).href,
};

const root = document.getElementById("sg-sd-navigator-root");
const status = document.getElementById("sg-sd-anchor-status");
const exportBtn = document.getElementById("sg-sd-export-pdf");
/** @type {ReturnType<typeof mountChangeNavigator> | null} */
let api = null;
/** @type {object | null} */
let currentProjection = null;

async function loadFixture(key) {
  if (!root) return;
  const url = FIXTURES[key];
  if (!url) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fixture ${key} missing`);
  const data = await res.json();
  const projection = data.projection;
  currentProjection = projection;
  if (exportBtn) exportBtn.disabled = false;
  api = mountChangeNavigator(root, projection, {
    onSelect(_id, anchor) {
      if (status) {
        status.textContent = anchor
          ? `Anchor deltaId=${anchor.deltaId} · semantic=${anchor.semanticNodeId || "—"} · page=${anchor.originHint?.page ?? "—"}`
          : "";
      }
    },
  });
  if (status && api) {
    const a = api.getAnchor?.();
    status.textContent = a
      ? `Loaded ${key} · Anchor deltaId=${a.deltaId} · page=${a.originHint?.page ?? "—"}`
      : `Loaded ${key}`;
  }
}

document.querySelectorAll("[data-sg-sd-fixture]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.getAttribute("data-sg-sd-fixture");
    loadFixture(key).catch((err) => {
      if (status) status.textContent = String(err.message || err);
    });
  });
});

exportBtn?.addEventListener("click", async () => {
  if (!currentProjection) return;
  try {
    if (status) status.textContent = "PDF を生成しています…";
    // Export = all changes (ignore current UI filter) — rebuild from original fixture items
    await downloadSmartDiffPdf(currentProjection, {
      oldName: "old",
      newName: "new",
      fileBase: "smart-diff-report",
    });
    if (status) status.textContent = "PDFレポートをダウンロードしました（全変更 · Filter 非依存）";
  } catch (err) {
    if (status) status.textContent = String(err?.message || err);
  }
});
