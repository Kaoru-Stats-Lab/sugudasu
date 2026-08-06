/**
 * Render Projection + ViewState — display only.
 * No Diff recalculation. No SLIR/Word attribute copies.
 * @see docs/architecture/renderer/ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md
 * @see docs/architecture/renderer/ADR-011-Smart-Diff-Interaction-Architecture-v0.1.md
 */
import type { ChangeDetail, ChangeKind, DeltaConfidence } from "../delta/types";

export type HighlightRange = {
  start: number;
  end: number;
};

/** Projected from Delta — do not recompute changeKind here. */
export type ProjectedChange = {
  deltaNodeId: string;
  visibility: boolean;
  highlightRanges?: HighlightRange[];
  collapsed?: boolean;
  selected?: boolean;
  changeKind: ChangeKind;
  candidate?: boolean;
  confidence?: DeltaConfidence | number;
  changeDetail?: ChangeDetail;
  beforeText?: string;
  afterText?: string;
  summary?: string;
  /** Overlay placement only — never used to decide "what changed". */
  originHint?: {
    page?: number;
    bbox?: { x: number; y: number; width: number; height: number };
  };
};

export type FilterState = {
  content: boolean;
  addedDeleted: boolean;
  style: boolean;
  comments: boolean;
};

/** UI-only. Never write back into Delta as source of truth without Controller. */
export type ViewState = {
  selectedId?: string;
  expandedIds: string[];
  filter: FilterState;
  density?: "comfortable" | "compact";
  /** Phase1: review only. */
  activeView: "review";
};

export type RenderProjection = {
  changes: ProjectedChange[];
  view: ViewState;
};
