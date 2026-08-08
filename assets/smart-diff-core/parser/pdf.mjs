/**
 * PDF Parser — pdf.js → Raw PDF Model.
 * Does NOT emit SLIR. No OCR / AI.
 * @see docs/architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md
 */

/**
 * @param {{ getDocument: Function, GlobalWorkerOptions?: any }} pdfjs
 * @param {ArrayBuffer | Uint8Array} data
 * @param {{ disableWorker?: boolean, documentOpts?: Record<string, unknown> }} [opts]
 * @returns {Promise<import('../raw/pdf-types').PdfDocumentRaw>}
 */
export async function parsePdfWithLib(pdfjs, data, opts = {}) {
  /** @type {import('../raw/types').LossEntry[]} */
  const losses = [];

  const loadingTask = pdfjs.getDocument({
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
    useSystemFonts: true,
    isEvalSupported: false,
    disableWorker: opts.disableWorker !== false,
    ...(opts.documentOpts || {}),
  });
  const doc = await loadingTask.promise;
  const pageCount = doc.numPages;
  /** @type {import('../raw/pdf-types').PdfPageRaw[]} */
  const pages = [];

  for (let p = 1; p <= pageCount; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    /** @type {import('../raw/pdf-types').PdfTextItemRaw[]} */
    const items = [];

    for (const it of textContent.items || []) {
      if (!it || typeof it.str !== "string") continue;
      const str = it.str;
      if (!str) continue;
      const tr = it.transform || [1, 0, 0, 1, 0, 0];
      const fontSize = Math.hypot(tr[2], tr[3]) || it.height || 12;
      const x = tr[4];
      const y = tr[5];
      const width = typeof it.width === "number" ? it.width : str.length * fontSize * 0.5;
      const height = typeof it.height === "number" ? it.height : fontSize;
      items.push({
        text: str,
        x,
        y,
        width,
        height,
        fontName: it.fontName,
        fontSize,
      });
    }

    /** @type {import('../raw/pdf-types').PdfImageRaw[]} */
    const images = [];
    try {
      const ops = await page.getOperatorList();
      const fns = ops.fnArray || [];
      const args = ops.argsArray || [];
      for (let i = 0; i < fns.length; i++) {
        // paintImageXObject = 85 in many builds; also match by name if exposed
        const fn = fns[i];
        if (fn === 85 || fn === "paintImageXObject") {
          images.push({
            bbox: { x: 0, y: 0, width: viewport.width, height: viewport.height },
            name: Array.isArray(args[i]) ? String(args[i][0] || "img") : "img",
          });
        }
      }
    } catch {
      losses.push({
        type: "unsupported_feature",
        source: "pdf",
        target: "raw",
        feature: "image_ops",
        severity: "info",
        message: "Could not inspect operator list for images",
        origin: `page:${p}`,
      });
    }

    if (items.length === 0) {
      losses.push({
        type: "ocr_required",
        source: "pdf",
        target: "slir",
        feature: "ocr_required",
        severity: "warning",
        message: "No extractable text on page; OCR not performed",
        origin: `page:${p}`,
      });
      if (!images.length) {
        // Scan-like page without detectable image ops — still represent as page image
        images.push({
          bbox: { x: 0, y: 0, width: viewport.width, height: viewport.height },
          name: `page-${p}-raster`,
        });
      }
    }

    pages.push({
      pageNumber: p,
      width: viewport.width,
      height: viewport.height,
      items,
      images,
      vectors: [],
    });
  }

  await doc.destroy?.();

  return {
    format: "pdf",
    pageCount,
    pages,
    metadata: {
      parser: { name: "sugudasu-pdf-pdfjs", mode: "text+bbox" },
    },
    losses,
  };
}

/**
 * Node-friendly entry: loads pdfjs-dist legacy build.
 * @param {ArrayBuffer | Uint8Array | Buffer} bytes
 */
export async function parsePdf(bytes) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const u8 =
    bytes instanceof ArrayBuffer
      ? new Uint8Array(bytes)
      : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return parsePdfWithLib(pdfjs, u8, { disableWorker: true });
}
