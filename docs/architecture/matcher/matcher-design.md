# Matcher Engine Design v0.1

| 項目 | 値 |
|------|-----|
| **ADR** | [`ADR-003-Smart-Diff-Matcher-Engine-v0.1.md`](ADR-003-Smart-Diff-Matcher-Engine-v0.1.md) |
| **Accepted** | [`../adr/ADR-003-matcher-engine.md`](../adr/ADR-003-matcher-engine.md) |

> Score / Threshold の数値正本は ADR（Accepted と一致）。本ファイルは Feature・Flow・出力契約の詳細。実装コードではない。

---

## Output — Match Map（Accepted 整合）

```typescript
type MatchConfidence = "high" | "candidate" | "none";

type MatchEntry = {
  oldNodeId: string; // SLIR temp id
  newNodeId: string;
  score: number;
  confidence: "high" | "candidate"; // Same / Candidate
};

type UnmatchedEntry = {
  oldNodeId: string | null;
  newNodeId: string | null;
  confidence: "none"; // Added / Deleted の材料
};

type MatchMap = Array<MatchEntry | UnmatchedEntry>;
```

Pack 用語: high ≒ Same · candidate ≒ Modified Candidate · none ≒ Different（片側）。

---

## Feature Notes

### Heading（30）

level + normalized text。完全/部分/なしの配点細則は実装時に固定（ADR は Weight のみ正本）。

### Context（25）

前後 Heading / 隣接 Block。同一文言の複数出現の識別。

### Text（30）

Paragraph / TextRun。diff-match-patch の Semantic Cleanup 後類似度を候補とする。style は Identity 主因に混ぜない（Delta の changeReason）。

### Position（15）

Document order · Section 内相対を優先。主判定にしない。

---

## Flow（詳細）

1. Type filter（Paragraph vs Table は比較しない）
2. Block layer candidates
3. Score
4. Threshold → relationship
5. Inline（TextRun）は Block Match 後
6. Annotation は本文 Match と分離
7. Table = Atomic only

---

## Handoff to Delta（決めないこと）

Candidate の Delta kind / UI ラベル / 自動確定 = **ADR-004**。

本 Design は「candidate を Map に残す」まで。
