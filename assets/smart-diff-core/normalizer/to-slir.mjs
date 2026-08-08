/**
 * Normalizer — Raw Document Model → SLIR + Loss Report.
 * Only place that emits SLIR. No Diff / Identity / ChangeKind.
 * @see docs/architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md
 */

/**
 * @param {string} s
 */
function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function makeIdFactory(prefix = "n") {
  let i = 0;
  return () => `${prefix}-${++i}`;
}

/**
 * @param {import('../raw/types').RawRun[] | undefined} runs
 * @param {string} [fallbackText]
 * @param {string} id
 */
export function runsToTextNode(runs, fallbackText = "", id) {
  const list = runs && runs.length ? runs : [{ text: fallbackText || "" }];
  let content = "";
  /** @type {Array<{ start: number, end: number, style: object }>} */
  const styleSegments = [];
  for (const run of list) {
    const t = run.text || "";
    if (!t) continue;
    const start = content.length;
    content += t;
    const end = content.length;
    const style = run.style || {};
    if (Object.keys(style).length) {
      const prev = styleSegments[styleSegments.length - 1];
      if (prev && prev.end === start && JSON.stringify(prev.style) === JSON.stringify(style)) {
        prev.end = end;
      } else {
        styleSegments.push({ start, end, style: { ...style } });
      }
    }
  }
  if (!content && fallbackText) content = fallbackText;
  /** @type {any} */
  const node = { id, type: "text", content };
  if (styleSegments.length) node.styleSegments = styleSegments;
  return node;
}

/**
 * @param {import('../raw/types').RawBlock} block
 * @param {string} format
 * @param {() => string} id
 */
function paragraphFromBlock(block, format, id) {
  const textId = id();
  const paraId = id();
  const textNode = runsToTextNode(block.runs, block.text || "", textId);
  /** @type {any[]} */
  const paraChildren = [textNode];
  for (const a of block.annotations || []) {
    if (!a?.text) continue;
    paraChildren.push({
      id: id(),
      type: "annotation",
      kind: a.kind || "comment",
      text: a.text,
    });
  }
  return {
    id: paraId,
    type: "paragraph",
    children: paraChildren,
    origin: block.origin
      ? {
          sourceFormat: format,
          docx: {
            xmlPath: block.origin.xmlPath,
            paragraphIndex: block.origin.paragraphIndex,
          },
        }
      : undefined,
  };
}

/**
 * @param {import('../raw/types').RawDocumentModel} raw
 * @param {{ idPrefix?: string }} [opts]
 * @returns {{ slir: object, losses: import('../raw/types').LossEntry[] }}
 */
export function normalizeWithReport(raw, opts = {}) {
  const id = makeIdFactory(opts.idPrefix || "slir");
  /** @type {any[]} */
  const children = [];
  /** @type {import('../raw/types').LossEntry[]} */
  const losses = [...(raw.losses || [])];
  const format = raw.format || "docx";
  const blocks = raw.blocks || [];

  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    const hint = block.kindHint || "paragraph";

    if (hint === "listItem") {
      const items = [];
      const ordered = !!block.ordered;
      while (i < blocks.length && blocks[i].kindHint === "listItem") {
        const li = blocks[i];
        const textNode = runsToTextNode(li.runs, li.text || "", id());
        items.push({
          id: id(),
          type: "listItem",
          children: [textNode],
        });
        i += 1;
      }
      children.push({
        id: id(),
        type: "list",
        ordered,
        children: items,
      });
      continue;
    }

    if (hint === "table") {
      const cells = block.cellTexts || [];
      const payload = JSON.stringify({
        rows: block.rowCount ?? cells.length,
        cols: block.columnCount,
        cells,
        flags: block.tableFlags || {},
        summary: block.tableSummary || block.text || "",
      });
      children.push({
        id: id(),
        type: "table",
        rowCount: block.rowCount ?? cells.length,
        columnCount: block.columnCount ?? (cells[0]?.length || 0),
        contentHash: fnv1a(payload),
        extractedTextSummary: block.tableSummary || block.text || "表",
        origin: block.origin
          ? { sourceFormat: format, docx: { xmlPath: block.origin.xmlPath } }
          : undefined,
      });
      i += 1;
      continue;
    }

    if (hint === "image") {
      children.push({
        id: id(),
        type: "image",
        contentHash: block.contentHash || fnv1a(block.alt || "image"),
        alt: block.alt,
        origin: block.origin
          ? { sourceFormat: format, docx: { xmlPath: block.origin.xmlPath } }
          : undefined,
      });
      i += 1;
      continue;
    }

    if (hint === "heading") {
      children.push({
        id: id(),
        type: "heading",
        level: block.level || 1,
        text: block.text || "",
        origin: block.origin
          ? {
              sourceFormat: format,
              docx: {
                xmlPath: block.origin.xmlPath,
                paragraphIndex: block.origin.paragraphIndex,
              },
            }
          : undefined,
      });
      i += 1;
      continue;
    }

    if (hint === "unknown") {
      children.push({
        id: id(),
        type: "unknown",
        text: block.text || "",
        reason: "raw_kind_unknown",
        lossAware: { confidence: 0.3, loss: ["kind_uncertain"] },
      });
      losses.push({
        type: "loss_aware",
        source: format,
        target: "slir",
        feature: "unknown_block",
        severity: "warning",
        message: "Emitted unknown node with lossAware",
      });
      i += 1;
      continue;
    }

    // paragraph (default) — never TextRunNode
    children.push(paragraphFromBlock(block, format, id));
    i += 1;
  }

  if (raw.chrome?.headers?.length || raw.chrome?.footers?.length) {
    // Ensure Loss exists even if parser forgot
    if (!losses.some((l) => l.feature === "header_footer")) {
      losses.push({
        type: "unsupported_feature",
        source: "docx",
        target: "slir",
        feature: "header_footer",
        severity: "warning",
        message: "Header/Footer excluded from SLIR body",
      });
    }
  }

  const slir = {
    id: id(),
    type: "document",
    sourceFormat: format === "docx" ? "docx" : format,
    metadata: raw.metadata?.title ? { title: raw.metadata.title } : undefined,
    children,
  };

  return { slir, losses };
}

/**
 * @param {import('../raw/types').RawDocumentModel} raw
 * @param {{ idPrefix?: string }} [opts]
 */
export function normalizeToSlir(raw, opts = {}) {
  return normalizeWithReport(raw, opts).slir;
}

export { fnv1a };
