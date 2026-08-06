/**
 * Raw PDF Model — pdf.js output contract.
 * NOT SLIR. Block 化は PDF Normalizer（ADR-007/008）.
 */

export type PdfBBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PdfTextItemRaw = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName?: string;
  fontSize?: number;
};

export type PdfImageRaw = {
  bbox: PdfBBox;
  name?: string;
};

export type PdfVectorRaw = {
  type: string;
};

export type PdfPageRaw = {
  pageNumber: number;
  width: number;
  height: number;
  items: PdfTextItemRaw[];
  images?: PdfImageRaw[];
  vectors?: PdfVectorRaw[];
};

export type PdfDocumentRaw = {
  format: "pdf";
  pageCount: number;
  pages: PdfPageRaw[];
  metadata?: {
    title?: string;
    parser?: { name: string; mode?: string };
  };
  /** Parser-side losses before Normalizer clustering */
  losses?: import("./types").LossEntry[];
};
