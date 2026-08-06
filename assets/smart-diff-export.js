/**
 * Browser Export — Projection → DiffReport → pdf-lib PDF (local download).
 * Same rules as packages/export (all changes · no SLIR/Matcher).
 */
import { loadPdfLib } from "./sg-pdf-vendor.js";
import fontkit from "./vendor/fontkit/fontkit.es.min.js";

export function displayTypeFor(item) {
  if (item.candidate) return "Candidate";
  if (item.changeDetail === "table_changed") return "Table changed";
  if (item.kind === "added") return "Added";
  if (item.kind === "deleted") return "Deleted";
  if (item.kind === "modified") return "Modified";
  return String(item.kind || "Unknown");
}

export function buildDiffReport(projection, meta = {}) {
  const items = (projection?.items || []).filter((i) => i.kind !== "unchanged");
  const entries = items.map((item, idx) => {
    const displayType = displayTypeFor(item);
    const entry = {
      index: idx + 1,
      id: item.id,
      label: item.label || displayType,
      displayType,
      candidate: !!item.candidate,
    };
    if (item.changeDetail === "table_changed") {
      entry.body = "表に変更があります";
    } else if (item.candidate) {
      entry.body = "自動判定: 未確定\n確認してください";
      if (item.beforeText) entry.before = item.beforeText;
      if (item.afterText) entry.after = item.afterText;
    } else {
      if (item.beforeText) entry.before = item.beforeText;
      if (item.afterText) entry.after = item.afterText;
    }
    return entry;
  });
  return {
    title: meta.title || "Smart Diff Report",
    generatedAt: meta.generatedAt || new Date().toISOString(),
    sources: { oldName: meta.oldName || "old", newName: meta.newName || "new" },
    changeCount: entries.length,
    entries,
  };
}

function wrapLines(text, max = 72) {
  const raw = String(text ?? "").split(/\r?\n/);
  const out = [];
  for (const line of raw) {
    if (line.length <= max) {
      out.push(line);
      continue;
    }
    let rest = line;
    while (rest.length > max) {
      out.push(rest.slice(0, max));
      rest = rest.slice(max);
    }
    if (rest) out.push(rest);
  }
  return out.length ? out : [""];
}

/**
 * @param {object} projection
 * @param {{ oldName?: string, newName?: string, fileBase?: string }} [opts]
 */
export async function downloadSmartDiffPdf(projection, opts = {}) {
  const report = buildDiffReport(projection, opts);
  const { PDFDocument, rgb } = await loadPdfLib();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fontUrl = new URL(
    "./smart-diff-fonts/noto-sans-jp-japanese-400-normal.woff",
    import.meta.url
  ).href;
  const fontBytes = new Uint8Array(await (await fetch(fontUrl)).arrayBuffer());
  const font = await doc.embedFont(fontBytes, { subset: true });

  const margin = 48;
  const pageWidth = 595;
  const pageHeight = 842;
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const lineH = 14;

  const ensure = (n) => {
    if (y - n < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };
  const draw = (text, size = 10) => {
    for (const line of wrapLines(text, 70)) {
      ensure(lineH);
      page.drawText(line || " ", {
        x: margin,
        y: y - size,
        size,
        font,
        color: rgb(0.1, 0.12, 0.16),
        maxWidth: pageWidth - margin * 2,
      });
      y -= lineH;
    }
  };
  const rule = () => {
    ensure(10);
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.75, 0.78, 0.82),
    });
    y -= 12;
  };

  draw(report.title, 16);
  draw(`Generated: ${report.generatedAt}`, 9);
  draw(`File:\n${report.sources.oldName}\n${report.sources.newName}`);
  draw(`Changes: ${report.changeCount}`);
  rule();
  for (const entry of report.entries) {
    draw(`${entry.index}. ${entry.label}`);
    if (entry.body) draw(entry.body);
    if (entry.before != null) {
      draw("Before:");
      draw(String(entry.before));
    }
    if (entry.after != null) {
      draw("After:");
      draw(String(entry.after));
    }
    draw(`Type:\n${entry.displayType}`);
    rule();
  }

  const bytes = await doc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const a = document.createElement("a");
  const base = opts.fileBase || "smart-diff-report";
  a.href = URL.createObjectURL(blob);
  a.download = `${base}_smart-diff.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
  return report;
}
