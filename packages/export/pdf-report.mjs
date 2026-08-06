/**
 * DiffReport → PDF bytes (pdf-lib). Local only.
 * Does not read SLIR / run Matcher.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_FONT = join(
  __dirname,
  "..",
  "..",
  "node_modules",
  "@fontsource",
  "noto-sans-jp",
  "files",
  "noto-sans-jp-japanese-400-normal.woff"
);

/**
 * @param {string} text
 * @param {number} max
 */
function wrapLines(text, max = 72) {
  const raw = String(text ?? "").split(/\r?\n/);
  /** @type {string[]} */
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
 * @param {object} report DiffReport
 * @param {{ fontBytes?: Uint8Array }} [opts]
 * @returns {Promise<Uint8Array>}
 */
export async function renderDiffReportPdf(report, opts = {}) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fontBytes =
    opts.fontBytes ||
    new Uint8Array(readFileSync(DEFAULT_FONT));
  const font = await doc.embedFont(fontBytes, { subset: true });

  const margin = 48;
  const pageWidth = 595;
  const pageHeight = 842;
  const contentWidth = pageWidth - margin * 2;
  const fontSize = 10;
  const titleSize = 16;
  const lineH = 14;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (need) => {
    if (y - need < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const draw = (text, size = fontSize, color = rgb(0.1, 0.12, 0.16)) => {
    const lines = wrapLines(text, Math.floor(contentWidth / (size * 0.55)));
    for (const line of lines) {
      ensureSpace(lineH);
      page.drawText(line || " ", {
        x: margin,
        y: y - size,
        size,
        font,
        color,
        maxWidth: contentWidth,
      });
      y -= lineH;
    }
  };

  const rule = () => {
    ensureSpace(10);
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.75, 0.78, 0.82),
    });
    y -= 12;
  };

  draw(report.title || "Smart Diff Report", titleSize);
  y -= 4;
  draw(`Generated: ${report.generatedAt || ""}`, 9, rgb(0.4, 0.45, 0.5));
  draw(
    `File:\n${report.sources?.oldName || "old"}\n${report.sources?.newName || "new"}`
  );
  draw(`Changes: ${report.changeCount ?? 0}`);
  rule();

  for (const entry of report.entries || []) {
    ensureSpace(lineH * 6);
    draw(`${entry.index}. ${entry.label}`);
    if (entry.body) {
      draw(entry.body);
    }
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

  const pdf = await doc.save();
  return pdf instanceof Uint8Array ? pdf : new Uint8Array(pdf);
}

export { DEFAULT_FONT };
