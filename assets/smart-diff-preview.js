/**
 * /smart-diff — browser DOCX/PDF compare + sample fixtures.
 * Pipeline: parse → SLIR → Matcher → Delta → Projection → Navigator.
 * Export (pdf-lib / fontkit) is dynamic-imported so compare still works if export fails.
 */
import { mountChangeNavigator } from "./smart-diff-navigator.js";
import { compareDocumentBytes, detectDocKind } from "./smart-diff-pipeline.js";

const MAX_BYTES = 25 * 1024 * 1024;

const FIXTURES = {
  A: new URL("./smart-diff-fixtures/A-docx-projection.json", import.meta.url).href,
  B: new URL("./smart-diff-fixtures/B-pdf-projection.json", import.meta.url).href,
  C: new URL("./smart-diff-fixtures/C-table-projection.json", import.meta.url).href,
};

const root = document.getElementById("sg-sd-navigator-root");
const status = document.getElementById("sg-sd-anchor-status");
const exportBtn = document.getElementById("sg-sd-export-pdf");
const compareBtn = document.getElementById("sg-sd-compare");
const lossEl = document.getElementById("sg-sd-loss-note");

/** @type {ReturnType<typeof mountChangeNavigator> | null} */
let api = null;
/** @type {object | null} */
let currentProjection = null;
/** @type {{ oldName: string, newName: string }} */
let exportMeta = { oldName: "old", newName: "new" };

/** @type {{ file: File, bytes: ArrayBuffer, kind: "docx"|"pdf" } | null} */
let oldSlot = null;
/** @type {{ file: File, bytes: ArrayBuffer, kind: "docx"|"pdf" } | null} */
let newSlot = null;

function setStatus(msg) {
  if (status) status.textContent = msg;
}

function setLossNote(losses) {
  if (!lossEl) return;
  const list = Array.isArray(losses) ? losses.filter(Boolean) : [];
  if (!list.length) {
    lossEl.hidden = true;
    lossEl.textContent = "";
    return;
  }
  const kinds = [...new Set(list.map((l) => l.kind || l.code || "loss"))].slice(0, 6);
  lossEl.hidden = false;
  lossEl.textContent = `読み取りで欠けうる範囲があります（${kinds.join(" · ")}）。判断できる範囲か自分で確認してください。`;
}

function updateCompareEnabled() {
  if (!compareBtn) return;
  compareBtn.disabled = !(oldSlot && newSlot);
}

/**
 * @param {HTMLElement | null} zone
 * @param {HTMLElement | null} labelEl
 * @param {(slot: { file: File, bytes: ArrayBuffer, kind: "docx"|"pdf" }) => void} onPick
 */
function bindDropZone(zone, labelEl, onPick) {
  if (!zone) return;
  const input = zone.querySelector('input[type="file"]');

  const applyFile = async (file, source = "file_pick") => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setStatus("ファイルが大きすぎます（25MBまで）");
      return;
    }
    const kind = detectDocKind(file.name, file.type);
    if (!kind) {
      setStatus("DOCX または PDF を選んでください");
      return;
    }
    try {
      const bytes = await file.arrayBuffer();
      try {
        globalThis.SG_ANALYTICS?.trackFileAccepted?.(source);
      } catch (_) {
        /* ignore */
      }
      onPick({ file, bytes, kind });
      if (labelEl) {
        labelEl.textContent = `${file.name}（${kind.toUpperCase()}）`;
      }
      zone.classList.add("is-filled");
      updateCompareEnabled();
      if (oldSlot && newSlot && oldSlot.kind !== newSlot.kind) {
        setStatus("旧と新は同じ形式（DOCX同士、またはPDF同士）にしてください");
        if (compareBtn) compareBtn.disabled = true;
      } else {
        setStatus(
          oldSlot && newSlot
            ? "「変更を確認」で比較できます"
            : "もう一方のファイルを選んでください"
        );
      }
    } catch (err) {
      setStatus(String(err?.message || err));
    }
  };

  zone.addEventListener("click", () => input?.click());
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input?.click();
    }
  });
  input?.addEventListener("click", (e) => e.stopPropagation());
  input?.addEventListener("change", () => {
    const f = input.files?.[0];
    applyFile(f, "file_pick");
    input.value = "";
  });
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("is-dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-dragover"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("is-dragover");
    const f = e.dataTransfer?.files?.[0];
    applyFile(f, "file_drop");
  });
}

function showProjection(projection, statusMsg, losses) {
  if (!root) {
    setStatus("表示領域が見つかりません");
    return;
  }
  currentProjection = projection;
  if (exportBtn) exportBtn.disabled = false;
  setLossNote(losses);
  api = mountChangeNavigator(root, projection, {
    onSelect(_id, anchor) {
      if (!anchor) return;
      setStatus(
        `選択中: ${anchor.deltaId || "—"} · page=${anchor.originHint?.page ?? "—"}`
      );
    },
  });
  setStatus(statusMsg);
}

async function loadFixture(key) {
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
  exportMeta = { oldName: "sample-old", newName: "sample-new" };
  const labels = { A: "契約書", B: "PDF", C: "表変更" };
  showProjection(
    projection,
    `${labels[key] || key}サンプルを表示中 · ${projection.changeCount ?? ""}件`,
    data.losses || []
  );
}

async function runCompare() {
  if (!oldSlot || !newSlot) {
    setStatus("旧・新のファイルを両方選んでください");
    return;
  }
  if (oldSlot.kind !== newSlot.kind) {
    setStatus("旧と新は同じ形式（DOCX同士、またはPDF同士）にしてください");
    return;
  }
  if (compareBtn) compareBtn.disabled = true;
  setStatus("比較しています…（ブラウザ内）");
  setLossNote([]);
  try {
    const result = await compareDocumentBytes({
      oldBytes: oldSlot.bytes,
      newBytes: newSlot.bytes,
      kind: oldSlot.kind,
      oldName: oldSlot.file.name,
      newName: newSlot.file.name,
    });
    exportMeta = { oldName: result.oldName, newName: result.newName };
    showProjection(
      result.projection,
      `${result.kind.toUpperCase()} 比較完了 · 変更 ${result.changeCount ?? 0}件`,
      result.losses
    );
  } catch (err) {
    setStatus(String(err?.message || err));
    console.error("[smart-diff compare]", err);
  } finally {
    updateCompareEnabled();
  }
}

bindDropZone(
  document.getElementById("sg-sd-drop-old"),
  document.getElementById("sg-sd-old-label"),
  (slot) => {
    oldSlot = slot;
  }
);
bindDropZone(
  document.getElementById("sg-sd-drop-new"),
  document.getElementById("sg-sd-new-label"),
  (slot) => {
    newSlot = slot;
  }
);

compareBtn?.addEventListener("click", () => {
  runCompare();
});

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
    setStatus("先にファイルを比較するか、サンプルを選んでください");
    return;
  }
  try {
    setStatus("PDF を生成しています…");
    const { downloadSmartDiffPdf } = await import("./smart-diff-export.js");
    await downloadSmartDiffPdf(currentProjection, {
      oldName: exportMeta.oldName,
      newName: exportMeta.newName,
      fileBase: "smart-diff-report",
    });
    setStatus("PDFレポートをダウンロードしました");
  } catch (err) {
    setStatus(String(err?.message || err));
    console.error("[smart-diff export]", err);
  }
});

setStatus("旧・新の DOCX または PDF を選び、「変更を確認」を押してください。");
updateCompareEnabled();
