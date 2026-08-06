/**
 * Wave 5 — Projection → DiffReport → PDF
 * exportAllChanges ignores UI filter visibility.
 */

export { buildDiffReport, displayTypeFor, reportFileName } from "./report-model.mjs";
export { renderDiffReportPdf } from "./pdf-report.mjs";

import { buildDiffReport } from "./report-model.mjs";
import { renderDiffReportPdf } from "./pdf-report.mjs";

/**
 * @param {object} projection
 * @param {{ oldName?: string, newName?: string, title?: string, fontBytes?: Uint8Array }} [opts]
 */
export async function exportProjectionToPdf(projection, opts = {}) {
  // Force export of all changes: rebuild visibility flags to "show all"
  const items = (projection.items || []).map((i) => ({
    ...i,
    visible: i.kind !== "unchanged",
  }));
  const forExport = {
    ...projection,
    items,
    changeCount: items.filter((i) => i.kind !== "unchanged").length,
  };
  const report = buildDiffReport(forExport, {
    oldName: opts.oldName,
    newName: opts.newName,
    title: opts.title,
  });
  const bytes = await renderDiffReportPdf(report, { fontBytes: opts.fontBytes });
  return { report, bytes };
}
