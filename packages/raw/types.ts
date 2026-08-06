/**
 * Raw Document Model — Parser output contract.
 * NOT SLIR. Matcher/Delta must not consume this.
 * @see docs/architecture/parser/parser-design.md
 */

export type RawFormat = "docx" | "pdf" | "html" | "markdown" | string;

export type RawRunStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  /** OpenXML w:color — compare extension; formal SLIR Style ADR TBD */
  color?: string;
};

export type RawRun = {
  text: string;
  style?: RawRunStyle;
};

export type RawOrigin = {
  xmlPath?: string;
  paragraphIndex?: number;
  page?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  domPath?: string;
  sourcePosition?: number;
};

export type RawAnnotation = {
  kind?: string;
  text: string;
};

/** Loss = recognized out-of-scope, not silent drop. */
export type LossSeverity = "info" | "warning" | "error";

export type LossEntry = {
  type: string;
  source: string;
  target: string;
  severity: LossSeverity;
  feature?: string;
  message?: string;
  origin?: string;
  /** Optional confidence for uncertain geometry (PDF reading order etc.) */
  confidence?: number;
};

export type RawBlock = {
  kindHint?:
    | "paragraph"
    | "heading"
    | "list"
    | "listItem"
    | "table"
    | "image"
    | "unknown"
    | string;
  text?: string;
  runs?: RawRun[];
  level?: number;
  /** list / listItem */
  listLevel?: number;
  ordered?: boolean;
  numId?: string;
  tableSummary?: string;
  rowCount?: number;
  columnCount?: number;
  cellTexts?: string[][];
  /** merge / empty / soft-break hints for hash + Loss */
  tableFlags?: {
    hasMergedCells?: boolean;
    hasEmptyCells?: boolean;
    hasInnerBreaks?: boolean;
  };
  /** image */
  contentHash?: string;
  alt?: string;
  origin?: RawOrigin;
  annotations?: RawAnnotation[];
  raw?: unknown;
};

export type RawDocumentModel = {
  format: RawFormat;
  metadata?: {
    title?: string;
    parser?: { name: string; mode?: "simple" | "high-fidelity" };
  };
  blocks: RawBlock[];
  /** Header/Footer snapshots — not SLIR body */
  chrome?: {
    headers?: Array<{ part: string; text: string }>;
    footers?: Array<{ part: string; text: string }>;
  };
  losses?: LossEntry[];
  originMetadata?: Record<string, unknown>;
};
