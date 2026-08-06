# SLIR Schema v0.1（Accepted Candidate · ADR-009）

| 項目 | 値 |
|------|-----|
| **ADR** | [`../ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md`](../ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md) · 正本 [`../../adr/ADR-002-slir-schema.md`](../../adr/ADR-002-slir-schema.md) |
| **Normalizer** | ADR-008 Option C |
| **Status** | **Accepted-aligned**（009 Adopt） |

> 実装ファイルではない。**TextRunNode なし** · **TextNode + styleSegments**。

---

## Hierarchy

```text
DocumentNode
 ├ SectionNode?
 ├ HeadingNode
 ├ ParagraphNode
 │    ├ TextNode
 │    └ AnnotationNode（または兄弟 Attach）
 ├ ListNode
 │    └ ListItemNode
 ├ TableNode          ← Atomic · 子に Row/Cell なし
 ├ ImageNode
 └ UnknownNode
```

---

## Core types

```typescript
type TempId = string; // Stable Identity ではない

type Style = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
};

type StyleSegment = {
  start: number;
  end: number;
  style: Style;
};

type OriginReference = {
  // Diff Engine 非消費（ADR-001）
  page?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  xmlPath?: string;
  domPath?: string;
};

type TextNode = {
  type: "text";
  content: string;
  styleSegments?: StyleSegment[];
  origin?: OriginReference;
};

type ParagraphNode = {
  id: TempId;
  type: "paragraph";
  children: Array<TextNode | AnnotationNode>;
};

type TableNode = {
  id: TempId;
  type: "table";
  contentHash?: string;
  extractedTextSummary?: string;
  rowCount?: number;
  columnCount?: number;
  // NO children: Row/Cell
};

type AnnotationNode = {
  id: TempId;
  type: "annotation";
  targetRef?: TempId;
  kind?: "comment" | string;
  text: string;
};

type UnknownNode = {
  id: TempId;
  type: "unknown";
  confidence?: number;
  loss?: string[];
  text?: string;
  origin?: OriginReference;
};
```

---

## Forbidden on any SLIR node

```text
stableId as identity
changeKind / added / deleted / modified
highlightColor / displayPosition / expanded / collapsed
matchScore / matchMap / deltaSubtree
w:r / OpenXML element types as node.type
TableRow / TableCell as diff nodes
```
