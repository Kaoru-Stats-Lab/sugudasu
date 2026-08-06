/**
 * Delta Tree contract — change state for humans. No UI state.
 * ChangeKind must NOT include candidate|conflict|moved|styleChanged.
 * @see docs/architecture/adr/ADR-004-delta-tree-model.md
 */
import type { TempId } from "../slir/types";

export type ChangeKind = "added" | "deleted" | "modified" | "unchanged";

export type ChangeDetail =
  | "content"
  | "text_only"
  | "style_only"
  | "text_and_style"
  | "table_changed"
  | string;

export type DeltaConfidence = "high" | "candidate";

export type InlineChange = {
  type: "replace" | "insert" | "delete";
  before?: string;
  after?: string;
};

export type DeltaNode = {
  id: string;
  kind: ChangeKind;
  /** SLIR temp ids */
  oldNodeRef?: TempId;
  newNodeRef?: TempId;
  /**
   * From Matcher. Candidate stays here — NOT a ChangeKind.
   * Do not auto-convert to deleted+added.
   */
  confidence?: DeltaConfidence;
  changeDetail?: ChangeDetail;
  beforeText?: string;
  afterText?: string;
  summary?: string;
  inlineChanges?: InlineChange[];
  children?: DeltaNode[];
};

export type DeltaTree = {
  root: DeltaNode;
};
