# Delta Tree Schema v0.1

| 項目 | 値 |
|------|-----|
| **ADR** | [`ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md`](ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md) |
| **Accepted** | [`../adr/ADR-004-delta-tree-model.md`](../adr/ADR-004-delta-tree-model.md) |

> 実装コードではない。Schema と責務境界のみ。

---

## DeltaNode

```typescript
type ChangeKind =
  | "Unchanged"
  | "Added"
  | "Deleted"
  | "Modified";

/** Candidate は changeKind を増やさない。保持は metadata / confidence */
type ChangeDetail =
  | "text_only"
  | "style_only"
  | "text_and_style"
  | "table_changed"
  | "content"
  | string;

interface DeltaNode {
  id: string;
  changeKind: ChangeKind;
  beforeNodeReference?: string; // SLIR temp id
  afterNodeReference?: string;
  children?: DeltaNode[];
  metadata?: {
    changeDetail?: ChangeDetail;
    /** Matcher Score 60–84 等。自動 Modified/Added+Deleted 化しない */
    candidate?: boolean;
    confidence?: "high" | "candidate" | number;
    beforeText?: string;
    afterText?: string;
    summary?: string;
  };
}

interface DeltaTree {
  root: DeltaNode;
}
```

### Accepted 互換

| Pack | Accepted |
|------|----------|
| changeKind | kind（lowercase 可） |
| before/afterNodeReference | oldNodeRef / newNodeRef |
| changeDetail: style_only | changeReason: "style" |
| candidate / confidence | confidence: "candidate" |

---

## Match Map → Delta（要約）

| Match | Delta |
|-------|-------|
| high + 同一内容 | Unchanged |
| high + 差 | Modified（+ changeDetail） |
| candidate 60–84 | 保持（candidate フラグ等）· **非** 自動 Modified 確定 · **非** Added+Deleted |
| old only | Deleted |
| new only | Added |

---

## Annotation / Table / Style

```text
Paragraph: Unchanged
Annotation: Added

Table: Modified + changeDetail: table_changed

Style only: Modified + changeDetail: style_only
```

---

## Forbidden on Delta

color · layout · animation · UI state · PDF 生成レイアウト · Cell Delta · Conflict · Moved（Phase1）
