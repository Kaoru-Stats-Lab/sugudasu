/**
 * Matcher output contract — identity only. No ChangeKind.
 * @see docs/architecture/adr/ADR-003-matcher-engine.md
 */
import type { TempId } from "../slir/types";

export type MatchConfidence = "high" | "candidate" | "none";

/** Same (≥85) or Candidate (60–84). */
export type MatchEntry = {
  oldNodeId: TempId;
  newNodeId: TempId;
  score: number;
  confidence: "high" | "candidate";
};

/** Different — material for Added/Deleted in Delta. */
export type UnmatchedEntry = {
  oldNodeId: TempId | null;
  newNodeId: TempId | null;
  confidence: "none";
};

export type MatchMap = Array<MatchEntry | UnmatchedEntry>;

/** Weights — single SSOT numbers (ADR-003). Algorithms live elsewhere. */
export const IDENTITY_SCORE_WEIGHTS = {
  heading: 30,
  context: 25,
  text: 30,
  position: 15,
} as const;

export const IDENTITY_SCORE_THRESHOLDS = {
  sameMin: 85,
  candidateMin: 60,
} as const;
