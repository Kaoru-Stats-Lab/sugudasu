/**
 * /smart-diff — loads baked Projection fixtures only (public α).
 * Does not run Matcher / Delta / Parser in the browser yet.
 *
 * Export (pdf-lib / fontkit) is dynamic-imported so fixture clicks still work
 * if export deps fail to load.
 */
import { mountChangeNavigator } from "./smart-diff-navigator.js";

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

function setStatus(msg) {
  if (status) status.textContent = msg;
}

async function loadFixture(key) {
  if (!root) {
    setStatus("表示領域が見つかりません");
    return;
  }
  const url = FIXTURES[key];
  if (!url) {
    setStatus(`未知のサンプル: ${key}`);
    return;
  }
  setStatus("サンプルを読み込み中…");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`サンプル ${key} を読み込めませんでした（${res.status}）`);
  const data = await res.json();
  const projection = data.projection;
  if (!projection) throw new Error("サンプルに Projection がありません");
  currentProjection = projection;
  if (exportBtn) exportBtn.disabled = false;
  api = mountChangeNavigator(root, projection, {
    onSelect(_id, anchor) {
      setStatus(
        anchor
          ? `選択中: ${anchor.deltaId || "—"} · page=${anchor.originHint?.page ?? "—"}`
          : ""
      );
    },
  });
  const a = api?.getAnchor?.();
  const labels = { A: "契約書", B: "PDF", C: "表変更" };
  setStatus(
    a
      ? `${labels[key] || key}サンプルを表示中 · ${api.changeCount ?? ""}件`
      : `${labels[key] || key}サンプルを表示中`
  );
}

document.querySelectorAll("[data-sg-sd-fixture]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.getAttribute("data-sg-sd-fixture");
    loadFixture(key).catch((err) => {
      setStatus(String(err?.message || err));
      console.error("[smart-diff]", err);
    });
  });
});

exportBtn?.addEventListener("click", async () => {
  if (!currentProjection) {
    setStatus("先にサンプルを選んでください");
    return;
  }
  try {
    setStatus("PDF を生成しています…");
    const { downloadSmartDiffPdf } = await import("./smart-diff-export.js");
    await downloadSmartDiffPdf(currentProjection, {
      oldName: "old",
      newName: "new",
      fileBase: "smart-diff-report",
    });
    setStatus("PDFレポートをダウンロードしました");
  } catch (err) {
    setStatus(String(err?.message || err));
    console.error("[smart-diff export]", err);
  }
});

setStatus("サンプルを選ぶと変更一覧が開きます。");
