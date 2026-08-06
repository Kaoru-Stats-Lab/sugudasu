/**
 * SLIR Schema constants / node type union.
 * ADR-002 Accepted · ADR-009 Adopt. Not OpenXML / PDF geometry.
 */
export const SLIR_SCHEMA_VERSION = "0.1" as const;

export type SlirNodeType =
  | "document"
  | "section"
  | "heading"
  | "paragraph"
  | "text"
  | "list"
  | "listItem"
  | "table"
  | "image"
  | "annotation"
  | "unknown";

export type SourceFormat = "docx" | "pdf" | "html" | "markdown" | string;
