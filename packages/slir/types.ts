/**
 * SLIR types — comparison contract only.
 * Origin is isolated; do not put wordXmlPath / pdfX on semantic nodes as required fields.
 * @see docs/architecture/adr/ADR-002-slir-schema.md
 */
import type { SlirNodeType, SourceFormat } from "./schema";

/** Temporary tree id. NOT Stable Identity (Matcher / ADR-003). */
export type TempId = string;

export type Style = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
};

/** Half-open [start, end) preferred; unit is implementation detail (ADR OQ-RANGE). */
export type StyleSegment = {
  start: number;
  end: number;
  style: Style;
};

/**
 * Format-specific locate info. Diff Engine MUST NOT compare this.
 * @see docs/notes/smart-diff/ADR-001-origin-metadata.md
 */
export type OriginMetadata = {
  sourceFormat?: SourceFormat;
  docx?: { xmlPath?: string; paragraphIndex?: number; runIndex?: number };
  pdf?: {
    page?: number;
    bbox?: { x: number; y: number; width: number; height: number };
  };
  html?: { domPath?: string };
  markdown?: { sourcePosition?: number };
};

export type LossAware = {
  confidence?: number;
  loss?: string[];
};

export type SlirNodeBase = {
  id: TempId;
  type: SlirNodeType;
  origin?: OriginMetadata;
  lossAware?: LossAware;
};

/** Meaning unit. Not TextRunNode / not <w:r>. */
export type TextNode = SlirNodeBase & {
  type: "text";
  content: string;
  styleSegments?: StyleSegment[];
};

export type AnnotationNode = SlirNodeBase & {
  type: "annotation";
  kind?: "comment" | string;
  text: string;
  targetRef?: TempId;
};

export type HeadingNode = SlirNodeBase & {
  type: "heading";
  level: number;
  text: string;
  children?: TextNode[];
};

export type ParagraphNode = SlirNodeBase & {
  type: "paragraph";
  children: Array<TextNode | AnnotationNode>;
};

export type ListItemNode = SlirNodeBase & {
  type: "listItem";
  children?: Array<TextNode | ListNode | AnnotationNode>;
};

export type ListNode = SlirNodeBase & {
  type: "list";
  ordered?: boolean;
  children: ListItemNode[];
};

/** Atomic — no Row/Cell children in Phase1. */
export type TableNode = SlirNodeBase & {
  type: "table";
  rowCount?: number;
  columnCount?: number;
  contentHash: string;
  extractedTextSummary?: string;
};

export type ImageNode = SlirNodeBase & {
  type: "image";
  contentHash?: string;
  alt?: string;
};

export type UnknownNode = SlirNodeBase & {
  type: "unknown";
  text?: string;
  reason?: string;
};

export type SectionNode = SlirNodeBase & {
  type: "section";
  children: Array<
    | HeadingNode
    | ParagraphNode
    | ListNode
    | TableNode
    | ImageNode
    | AnnotationNode
    | UnknownNode
    | SectionNode
  >;
};

export type DocumentNode = SlirNodeBase & {
  type: "document";
  sourceFormat?: SourceFormat;
  metadata?: { title?: string };
  children: Array<
    | SectionNode
    | HeadingNode
    | ParagraphNode
    | ListNode
    | TableNode
    | ImageNode
    | AnnotationNode
    | UnknownNode
  >;
};

export type SlirNode =
  | DocumentNode
  | SectionNode
  | HeadingNode
  | ParagraphNode
  | TextNode
  | ListNode
  | ListItemNode
  | TableNode
  | ImageNode
  | AnnotationNode
  | UnknownNode;

export type SlirDocument = DocumentNode;
