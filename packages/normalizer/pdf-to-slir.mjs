/**
 * PDF Normalizer — Raw PDF Model → SLIR + Loss Report.
 * Does NOT invent perfect layout. Section nodes forbidden.
 * @see docs/architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md
 */

function makeIdFactory(prefix = "pdf") {
  let i = 0;
  return () => `${prefix}-${++i}`;
}

function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Cluster text items into reading lines (top→bottom visually).
 * PDF y is often bottom-up; we sort by descending y.
 * @param {import('../raw/pdf-types').PdfTextItemRaw[]} items
 */
export function clusterLines(items) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  /** @type {Array<{ y: number, fontSize: number, items: typeof items }>} */
  const lines = [];
  for (const it of sorted) {
    const fs = it.fontSize || 12;
    const last = lines[lines.length - 1];
    const thresh = Math.max(2, (last?.fontSize || fs) * 0.35);
    if (last && Math.abs(last.y - it.y) <= thresh) {
      last.items.push(it);
      last.fontSize = Math.max(last.fontSize, fs);
    } else {
      lines.push({ y: it.y, fontSize: fs, items: [it] });
    }
  }
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
  }
  return lines;
}

/**
 * Detect two major x-columns on a page.
 * @param {import('../raw/pdf-types').PdfTextItemRaw[]} items
 * @param {number} pageWidth
 */
export function detectTwoColumn(items, pageWidth) {
  if (items.length < 6 || pageWidth <= 0) return false;
  const mid = pageWidth / 2;
  const gap = pageWidth * 0.02;
  const left = items.filter((i) => i.x + (i.width || 0) * 0.5 < mid - gap);
  const right = items.filter((i) => i.x >= mid + gap);
  if (left.length < 3 || right.length < 3) return false;
  const ySpan = (arr) => {
    const ys = arr.map((i) => i.y);
    return Math.max(...ys) - Math.min(...ys);
  };
  return ySpan(left) > 20 && ySpan(right) > 20;
}

/**
 * Heuristic table: ≥2 lines with ≥2 similarly spaced x columns.
 * @param {ReturnType<typeof clusterLines>} lines
 */
export function detectTableCandidate(lines) {
  const multi = lines.filter((l) => l.items.length >= 2);
  if (multi.length < 2) return null;
  // Compare x positions across lines
  const colXs = multi[0].items.map((i) => i.x);
  let alignedRows = 0;
  for (const line of multi) {
    if (line.items.length < 2) continue;
    let hits = 0;
    for (const it of line.items) {
      if (colXs.some((cx) => Math.abs(cx - it.x) < 12)) hits++;
    }
    if (hits >= 2) alignedRows++;
  }
  if (alignedRows < 2) return null;
  const cellTexts = multi.map((l) => l.items.map((i) => i.text));
  return {
    rowCount: cellTexts.length,
    columnCount: Math.max(...cellTexts.map((r) => r.length)),
    cellTexts,
    summary: cellTexts.flat().join(" | "),
  };
}

/**
 * @param {import('../raw/pdf-types').PdfDocumentRaw} pdfRaw
 * @param {{ idPrefix?: string }} [opts]
 * @returns {{ slir: object, losses: import('../raw/types').LossEntry[] }}
 */
export function normalizePdfWithReport(pdfRaw, opts = {}) {
  const id = makeIdFactory(opts.idPrefix || "pdf");
  /** @type {import('../raw/types').LossEntry[]} */
  const losses = [...(pdfRaw.losses || [])];
  /** @type {any[]} */
  const children = [];

  for (const page of pdfRaw.pages || []) {
    const pageOrigin = { page: page.pageNumber };

    if (detectTwoColumn(page.items || [], page.width)) {
      losses.push({
        type: "reading_order_uncertain",
        source: "pdf",
        target: "slir",
        feature: "reading_order_uncertain",
        severity: "warning",
        message: "Two-column layout suspected; reading order may be wrong",
        origin: `page:${page.pageNumber}`,
      });
      // confidence as parallel field on last loss (architect example)
      losses[losses.length - 1].confidence = 0.62;
    }

    const lines = clusterLines(page.items || []);
    const table = detectTableCandidate(lines);

    if (table) {
      losses.push({
        type: "table_structure_unknown",
        source: "pdf",
        target: "slir",
        feature: "table_structure_unknown",
        severity: "warning",
        message: "PDF table inferred from geometry only; cell Diff forbidden",
        origin: `page:${page.pageNumber}`,
      });
      const payload = JSON.stringify(table);
      children.push({
        id: id(),
        type: "table",
        rowCount: table.rowCount,
        columnCount: table.columnCount,
        contentHash: fnv1a(payload),
        extractedTextSummary: table.summary || "表",
        origin: {
          sourceFormat: "pdf",
          pdf: { page: page.pageNumber },
        },
      });
      // Skip emitting overlapping paragraph lines that formed the table
      continue;
    }

    // Group lines into paragraph/heading blocks by vertical gap
    /** @type {typeof lines[]} */
    const groups = [];
    for (const line of lines) {
      const g = groups[groups.length - 1];
      const gap = g
        ? Math.abs(g[g.length - 1].y - line.y)
        : Infinity;
      const paraGap = Math.max(14, (line.fontSize || 12) * 1.4);
      if (!g || gap > paraGap) groups.push([line]);
      else g.push(line);
    }

    for (const group of groups) {
      const text = group
        .map((l) => l.items.map((i) => i.text).join(""))
        .join("\n")
        .trim();
      if (!text) continue;
      const maxFs = Math.max(...group.map((l) => l.fontSize || 12));
      const medianFs =
        [...group.map((l) => l.fontSize || 12)].sort((a, b) => a - b)[
          Math.floor(group.length / 2)
        ] || 12;
      const pageMedian =
        lines.map((l) => l.fontSize || 12).sort((a, b) => a - b)[
          Math.floor(lines.length / 2)
        ] || 12;
      const isHeading =
        maxFs >= pageMedian * 1.35 || (maxFs >= 16 && text.length < 80);

      const bbox = {
        x: Math.min(...group.flatMap((l) => l.items.map((i) => i.x))),
        y: Math.min(...group.flatMap((l) => l.items.map((i) => i.y))),
        width: 0,
        height: 0,
      };

      if (isHeading) {
        children.push({
          id: id(),
          type: "heading",
          level: maxFs >= pageMedian * 1.8 ? 1 : 2,
          text: text.replace(/\n/g, " "),
          origin: {
            sourceFormat: "pdf",
            pdf: { page: page.pageNumber, bbox },
          },
        });
      } else {
        const textId = id();
        children.push({
          id: id(),
          type: "paragraph",
          children: [
            {
              id: textId,
              type: "text",
              content: text.replace(/\n/g, ""),
            },
          ],
          origin: {
            sourceFormat: "pdf",
            pdf: { page: page.pageNumber, bbox },
          },
        });
      }
    }

    // Images / scan pages
    for (const img of page.images || []) {
      children.push({
        id: id(),
        type: "image",
        contentHash: fnv1a(`pdf-p${page.pageNumber}-${img.name || "img"}`),
        alt: img.name,
        origin: {
          sourceFormat: "pdf",
          pdf: { page: page.pageNumber, bbox: img.bbox },
        },
      });
    }
  }

  // Guard: never emit section
  if (children.some((c) => c.type === "section")) {
    throw new Error("PDF Normalizer must not emit Section nodes");
  }

  return {
    slir: {
      id: id(),
      type: "document",
      sourceFormat: "pdf",
      children,
    },
    losses,
  };
}

export function normalizePdfToSlir(pdfRaw, opts = {}) {
  return normalizePdfWithReport(pdfRaw, opts).slir;
}

export { fnv1a };
