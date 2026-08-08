/**
 * DOCX high-fidelity Parser — OpenXML → Raw Document Model.
 * Does NOT emit SLIR. Header/Footer stay out of body blocks.
 * @see docs/architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md
 */

import { loadJSZip } from "../../vendor/jszip/load.mjs";
const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";

/** @param {Element | null | undefined} el */
function localName(el) {
  if (!el) return "";
  const n = el.localName || el.nodeName || "";
  return String(n).includes(":") ? String(n).split(":").pop() : String(n);
}

/** @param {Element} el @param {string} name */
function childrenNamed(el, name) {
  return Array.from(el.childNodes || []).filter(
    (c) => c.nodeType === 1 && localName(/** @type {Element} */ (c)) === name
  );
}

/** @param {Element} el @param {string} name */
function firstNamed(el, name) {
  return childrenNamed(el, name)[0] || null;
}

/** @param {Element} el @param {string} attrLocal */
function attr(el, attrLocal) {
  if (!el || !el.attributes) return "";
  for (const a of Array.from(el.attributes)) {
    const n = a.localName || a.name || "";
    const local = String(n).includes(":") ? String(n).split(":").pop() : String(n);
    if (local === attrLocal) return a.value || "";
  }
  return "";
}

/** @param {Element} root @param {string} name */
function descendantsNamed(root, name) {
  const out = [];
  function walk(n) {
    if (!n || n.nodeType !== 1) return;
    if (localName(n) === name) out.push(n);
    for (const c of Array.from(n.childNodes || [])) walk(c);
  }
  walk(root);
  return out;
}

/**
 * @param {string} xml
 * @param {{ DOMParser?: typeof DOMParser }} [opts]
 */
function parseXml(xml, opts = {}) {
  const Parser = opts.DOMParser || globalThis.DOMParser;
  if (!Parser) {
    throw new Error("DOMParser required (browser) or pass opts.DOMParser (@xmldom/xmldom)");
  }
  const doc = new Parser().parseFromString(xml, "application/xml");
  const err = doc.getElementsByTagName("parsererror")[0];
  if (err) throw new Error(`XML parse error: ${err.textContent || "unknown"}`);
  return doc;
}

/** @param {Element} rPr */
function runStyleFromRPr(rPr) {
  if (!rPr) return undefined;
  /** @type {import('../raw/types').RawRunStyle} */
  const style = {};
  const b = firstNamed(rPr, "b");
  if (b && attr(b, "val") !== "0" && attr(b, "val") !== "false") style.bold = true;
  const i = firstNamed(rPr, "i");
  if (i && attr(i, "val") !== "0" && attr(i, "val") !== "false") style.italic = true;
  if (firstNamed(rPr, "u")) style.underline = true;
  const sz = firstNamed(rPr, "sz");
  if (sz) {
    const v = Number(attr(sz, "val"));
    if (Number.isFinite(v)) style.fontSize = v / 2;
  }
  const color = firstNamed(rPr, "color");
  if (color) {
    const v = attr(color, "val");
    if (v && v.toLowerCase() !== "auto") style.color = v.toUpperCase();
  }
  return Object.keys(style).length ? style : undefined;
}

/**
 * Extract runs including soft line breaks (w:br → \n).
 * @param {Element} p
 */
function extractRuns(p) {
  /** @type {import('../raw/types').RawRun[]} */
  const runs = [];
  for (const node of Array.from(p.childNodes || [])) {
    if (node.nodeType !== 1) continue;
    const el = /** @type {Element} */ (node);
    if (localName(el) !== "r") continue;
    const rPr = firstNamed(el, "rPr");
    const style = runStyleFromRPr(rPr);
    let buf = "";
    for (const child of Array.from(el.childNodes || [])) {
      if (child.nodeType !== 1) continue;
      const c = /** @type {Element} */ (child);
      const ln = localName(c);
      if (ln === "t") buf += c.textContent || "";
      else if (ln === "br" || ln === "cr") buf += "\n";
      else if (ln === "tab") buf += "\t";
    }
    if (!buf) continue;
    runs.push({ text: buf, style });
  }
  return runs;
}

/** @param {Element} p */
function headingLevel(p) {
  const pPr = firstNamed(p, "pPr");
  if (!pPr) return null;
  const pStyle = firstNamed(pPr, "pStyle");
  const val = pStyle ? attr(pStyle, "val") : "";
  const m = /^Heading\s*(\d+)$/i.exec(val) || /^見出し\s*(\d+)$/u.exec(val);
  if (m) return Number(m[1]);
  const outline = firstNamed(pPr, "outlineLvl");
  if (outline) {
    const lvl = Number(attr(outline, "val"));
    if (Number.isFinite(lvl)) return lvl + 1;
  }
  return null;
}

/** @param {Element} p */
function listInfo(p) {
  const pPr = firstNamed(p, "pPr");
  if (!pPr) return null;
  const numPr = firstNamed(pPr, "numPr");
  if (!numPr) return null;
  const ilvl = firstNamed(numPr, "ilvl");
  const numId = firstNamed(numPr, "numId");
  return {
    listLevel: ilvl ? Number(attr(ilvl, "val") || 0) : 0,
    numId: numId ? attr(numId, "val") : "",
  };
}

/** @param {Element} tbl @param {number} index @param {import('../raw/types').LossEntry[]} losses */
function parseTable(tbl, index, losses) {
  const rows = childrenNamed(tbl, "tr");
  /** @type {string[][]} */
  const cellTexts = [];
  let hasMerged = false;
  let hasEmpty = false;
  let hasInnerBreaks = false;

  for (const tr of rows) {
    const row = [];
    for (const tc of childrenNamed(tr, "tc")) {
      const tcPr = firstNamed(tc, "tcPr");
      if (tcPr && (firstNamed(tcPr, "vMerge") || firstNamed(tcPr, "gridSpan"))) {
        hasMerged = true;
      }
      const parts = [];
      for (const p of childrenNamed(tc, "p")) {
        const runs = extractRuns(p);
        const t = runs.map((r) => r.text).join("");
        if (t.includes("\n")) hasInnerBreaks = true;
        parts.push(t);
      }
      if (parts.length > 1) hasInnerBreaks = true;
      // Join non-trailing-empty carefully: preserve inner newlines between paras
      const cell = parts.join("\n").replace(/\n+$/, "");
      if (!cell.trim()) hasEmpty = true;
      row.push(cell);
    }
    cellTexts.push(row);
  }

  if (hasMerged) {
    losses.push({
      type: "unsupported_feature",
      source: "docx",
      target: "slir",
      feature: "table_cell_merge",
      severity: "warning",
      message: "Merged cells flattened into atomic TableNode; no cell Diff",
      origin: `word/document.xml#tbl[${index}]`,
    });
  }

  const flat = cellTexts.flat();
  const summaryParts = flat.filter((t) => t && t.trim());
  return {
    kindHint: "table",
    tableSummary: summaryParts.join(" | ") || "表",
    rowCount: cellTexts.length,
    columnCount: cellTexts.reduce((m, r) => Math.max(m, r.length), 0),
    cellTexts,
    tableFlags: {
      hasMergedCells: hasMerged,
      hasEmptyCells: hasEmpty,
      hasInnerBreaks,
    },
    text: summaryParts.join(" "),
    origin: { xmlPath: `word/document.xml#tbl[${index}]` },
  };
}

/**
 * Detect drawing / pict image stubs inside a paragraph.
 * @param {Element} p
 * @param {number} pIndex
 * @param {import('../raw/types').LossEntry[]} losses
 */
function extractImagesFromParagraph(p, pIndex, losses) {
  /** @type {import('../raw/types').RawBlock[]} */
  const images = [];
  const drawings = [
    ...descendantsNamed(p, "drawing"),
    ...descendantsNamed(p, "pict"),
  ];
  let i = 0;
  for (const d of drawings) {
    const blips = descendantsNamed(d, "blip");
    let embed = "";
    for (const b of blips) {
      embed = attr(b, "embed") || attr(b, "link") || "";
      if (embed) break;
    }
    const docPr = descendantsNamed(d, "docPr")[0];
    const alt = docPr ? attr(docPr, "name") || attr(docPr, "descr") || "" : "";
    const hashSeed = embed || `inline-${pIndex}-${i}`;
    images.push({
      kindHint: "image",
      contentHash: `img:${hashSeed}`,
      alt: alt || undefined,
      text: alt || "",
      origin: { xmlPath: `word/document.xml#p[${pIndex}]/drawing[${i}]` },
    });
    losses.push({
      type: "unsupported_feature",
      source: "docx",
      target: "slir",
      feature: "image_ocr",
      severity: "info",
      message: "Image kept as ImageNode; OCR not performed",
      origin: `word/document.xml#p[${pIndex}]/drawing[${i}]`,
    });
    i += 1;
  }
  return images;
}

/**
 * @param {string} documentXml
 * @param {{ DOMParser?: typeof DOMParser, losses?: import('../raw/types').LossEntry[] }} [opts]
 */
export function parseDocumentXml(documentXml, opts = {}) {
  const doc = parseXml(documentXml, opts);
  const body =
    doc.getElementsByTagNameNS(W_NS, "body")[0] ||
    Array.from(doc.getElementsByTagName("*")).find((e) => localName(e) === "body");
  if (!body) throw new Error("w:body not found");

  /** @type {import('../raw/types').LossEntry[]} */
  const losses = opts.losses || [];
  /** @type {import('../raw/types').RawBlock[]} */
  const blocks = [];
  let pIndex = 0;
  let tblIndex = 0;

  for (const node of Array.from(body.childNodes || [])) {
    if (node.nodeType !== 1) continue;
    const el = /** @type {Element} */ (node);
    const name = localName(el);
    if (name === "sectPr") continue;

    if (name === "tbl") {
      blocks.push(parseTable(el, tblIndex++, losses));
      continue;
    }

    if (name !== "p") {
      losses.push({
        type: "unsupported_feature",
        source: "docx",
        target: "slir",
        feature: `body_${name}`,
        severity: "info",
        message: `Skipped body element <${name}>`,
      });
      continue;
    }

    const images = extractImagesFromParagraph(el, pIndex, losses);
    const runs = extractRuns(el);
    const text = runs.map((r) => r.text).join("");
    const level = headingLevel(el);
    const list = listInfo(el);
    const origin = {
      xmlPath: `word/document.xml#p[${pIndex}]`,
      paragraphIndex: pIndex,
    };
    pIndex += 1;

    for (const img of images) blocks.push(img);

    if (!text.trim() && !level && !list) continue;

    if (level != null) {
      blocks.push({
        kindHint: "heading",
        level,
        text,
        runs,
        origin,
        annotations: [],
      });
      continue;
    }

    if (list) {
      blocks.push({
        kindHint: "listItem",
        text,
        runs,
        listLevel: list.listLevel,
        numId: list.numId,
        ordered: true, // refined later if numbering.xml present
        origin,
        annotations: [],
      });
      continue;
    }

    if (runs.some((r) => r.style?.color)) {
      losses.push({
        type: "style_extension",
        source: "docx",
        target: "slir",
        feature: "text_color",
        severity: "info",
        message: "Color carried in styleSegments as provisional compare extension",
        origin: origin.xmlPath,
      });
    }

    blocks.push({
      kindHint: "paragraph",
      text,
      runs,
      origin,
      annotations: [],
    });
  }

  return { blocks, losses };
}

/**
 * Extract plain text from header/footer part — not SLIR body.
 * @param {string} xml
 * @param {{ DOMParser?: typeof DOMParser }} opts
 */
function extractChromeText(xml, opts) {
  try {
    const doc = parseXml(xml, opts);
    const texts = [];
    for (const t of Array.from(doc.getElementsByTagName("*"))) {
      if (localName(t) === "t") texts.push(t.textContent || "");
    }
    return texts.join("").trim();
  } catch {
    return "";
  }
}

/**
 * @param {JSZip} zip
 * @param {{ DOMParser?: typeof DOMParser }} opts
 * @param {import('../raw/types').LossEntry[]} losses
 */
async function readChrome(zip, opts, losses) {
  /** @type {Array<{ part: string, text: string }>} */
  const headers = [];
  /** @type {Array<{ part: string, text: string }>} */
  const footers = [];

  for (const name of Object.keys(zip.files)) {
    if (!name.startsWith("word/") || name.includes("_rels")) continue;
    const base = name.split("/").pop() || "";
    if (/^header\d*\.xml$/i.test(base)) {
      const xml = await zip.file(name).async("string");
      const text = extractChromeText(xml, opts);
      headers.push({ part: name, text });
    }
    if (/^footer\d*\.xml$/i.test(base)) {
      const xml = await zip.file(name).async("string");
      const text = extractChromeText(xml, opts);
      footers.push({ part: name, text });
    }
  }

  if (headers.length || footers.length) {
    losses.push({
      type: "unsupported_feature",
      source: "docx",
      target: "slir",
      feature: "header_footer",
      severity: "warning",
      message: "Header/Footer excluded from SLIR body; snapshot in chrome/originMetadata",
    });
  }

  return { headers, footers };
}

/**
 * @param {ArrayBuffer | Uint8Array | Buffer} bytes
 * @param {{ DOMParser?: typeof DOMParser }} [opts]
 * @returns {Promise<import('../raw/types').RawDocumentModel>}
 */
export async function parseDocx(bytes, opts = {}) {
  const JSZip = opts?.JSZip || (await loadJSZip());
  const zip = await JSZip.loadAsync(bytes);
  const entry = zip.file("word/document.xml");
  if (!entry) throw new Error("word/document.xml missing");
  const documentXml = await entry.async("string");
  /** @type {import('../raw/types').LossEntry[]} */
  const losses = [];
  const { blocks } = parseDocumentXml(documentXml, {
    ...opts,
    losses,
  });

  const chrome = await readChrome(zip, opts, losses);

  return {
    format: "docx",
    metadata: {
      parser: { name: "sugudasu-docx-openxml", mode: "high-fidelity" },
    },
    blocks,
    chrome: {
      headers: chrome.headers,
      footers: chrome.footers,
    },
    losses,
    originMetadata: {
      source: "docx",
      hasDocumentXml: true,
      headerParts: chrome.headers.map((h) => h.part),
      footerParts: chrome.footers.map((f) => f.part),
    },
  };
}

export { localName, extractRuns, headingLevel, listInfo };
