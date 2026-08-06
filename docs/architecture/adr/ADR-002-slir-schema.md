# ADR-002 SLIR Schema v0.1

| 項目 | 値 |
|------|-----|
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Amended** | 2026-08-06 — Inline: TextSpan → **TextNode + styleSegments**（[`../slir/ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md`](../slir/ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md) Adopt） |
| **Scope** | Smart Diff · SLIR（比較用中間表現）v0.1 |
| **Supersedes** | 初稿 TextRun Node 公開 · Identity Score 誤配置 · **TextSpan のみ案**（009 Adopt で置換） |
| **Related** | ADR-001 Origin · Product / UI Constitution · [`ARCHITECTURE.md`](../../notes/smart-diff/ARCHITECTURE.md) · ADR-003 · ADR-004 · ADR-007 Parser · ADR-008 Normalizer · Renderer Pack |

> **正本:** 本ファイル。SLIR Schema / 本 ADR 範囲の原則はここに書く。候補詳細は [`../slir/schema/SLIR-v0.1.md`](../slir/schema/SLIR-v0.1.md) と整合。

---

## Status

Accepted（009 Adopt 反映済み）

---

## Context

Smart Diff は Document A → Document B の変更確認を目的とする。  
各 Document Format（DOCX / PDF / HTML / Markdown）の固有構造を直接比較せず、比較専用中間表現 **SLIR**（Smart Logical Intermediate Representation）へ正規化する。

```text
Parser → Raw → Normalizer → SLIR（Stable Identity なし）
  → Matcher → Delta Tree → Renderer / Export（Origin 可 · ADR-001）
```

Renderer は SLIR を直接の表示正本としない。**Delta Tree 経由**。

---

## Decision

1. SLIR は意味構造ベースの Node とする。テキスト表現は **TextNode + styleSegments[]**（比較単位 = content · 属性 = style）。
2. SLIR Node は **Stable ID を保持しない**。Identity は Matcher（ADR-003）。
3. **TextRunNode は採用しない。** `<w:r>` は Parser / Normalizer が吸収する Origin / Raw 情報であり、SLIR 公開型にしない。
4. Table は MVP で **Atomic `TableNode`**。Row/Cell Diff 禁止。
5. Annotation は本文 Modified に畳まず、`AnnotationNode` として別管理。
6. Origin Metadata は隔離。Diff Engine は origin を比較対象にしない（ADR-001）。
7. Loss Aware（例: UnknownBlock + confidence）。
8. **SectionNode は optional**（semantic grouping。PDF 等に Section 概念がないため必須にしない）。

### Text 表現（009 Adopt）

```text
採用:   TextNode → styleSegments[]
不採用: TextRunNode / Paragraph→TextRun 階層 / TextSpan 断片列を正とする案
```

Rationale: SLIR の目的は比較可能な意味構造であり OpenXML 内部構造の保存ではない。Style 差分は segments で足り、Matcher の Identity 単位が安定し、DOCX 以外とも共通化できる。

---

## Principles

| Principle | 意味 |
|-----------|------|
| **Comparison First** | 比較のため。表示完全再現が目的ではない |
| **Semantic Structure First** | 意味単位。`w:p` / `w:r` を露出しない |
| **Parser Independence** | Parser 固有構造を漏らさない |
| **Origin Metadata Isolation** | origin は Renderer / Export 用（ADR-001） |
| **Loss Aware** | 推測で埋めず欠落を明示 |

---

## Schema Definition

```typescript
/** 木走査用の一時 id。Stable Identity ではない → ADR-003 */
type TempId = string;

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

/** 意味単位のテキスト。TextRunNode ではない */
type TextNode = {
  type: "text";
  content: string;
  styleSegments?: StyleSegment[];
};

type OriginMetadata = {
  pdf?: {
    page: number;
    bbox: { x: number; y: number; width: number; height: number };
  };
};

type SlirNodeBase = {
  tempId: TempId;
  type: string;
  origin?: OriginMetadata;
  confidence?: number;
  loss?: string[];
};

type DocumentNode = SlirNodeBase & {
  type: "document";
  children: Array<
    | SectionNode
    | HeadingNode
    | ParagraphNode
    | ListNode
    | TableNode
    | AnnotationNode
    | UnknownBlock
  >;
};

/** optional semantic grouping（必須ではない） */
type SectionNode = SlirNodeBase & {
  type: "section";
  children: Array<
    | HeadingNode
    | ParagraphNode
    | ListNode
    | TableNode
    | AnnotationNode
    | UnknownBlock
  >;
};

type HeadingNode = SlirNodeBase & {
  type: "heading";
  level: number;
  text: string;
  children?: TextNode[];
};

type ParagraphNode = SlirNodeBase & {
  type: "paragraph";
  children: Array<TextNode | AnnotationNode>;
};

type ListNode = SlirNodeBase & {
  type: "list";
  ordered?: boolean;
  items: Array<{
    tempId: TempId;
    children?: Array<TextNode | ListNode | AnnotationNode>;
  }>;
};

type TableNode = SlirNodeBase & {
  type: "table";
  rowCount: number;
  columnCount: number;
  contentHash: string;
};

type AnnotationNode = SlirNodeBase & {
  type: "annotation";
  targetRef: TempId;
  kind: "comment" | string;
  text: string;
};

type UnknownBlock = SlirNodeBase & {
  type: "unknown";
  reason?: string;
  text?: string;
};
```

### Paragraph + TextNode（例）

```json
{
  "type": "paragraph",
  "children": [
    {
      "type": "text",
      "content": "契約期間は1年間とする",
      "styleSegments": [
        { "start": 5, "end": 8, "style": { "bold": true } }
      ]
    }
  ]
}
```

### 禁止形

```text
Paragraph
 └ TextRunNode   ← 禁止

Table
 ├ Row
 └ Cell         ← MVP 禁止（Phase2）

SLIR 上の ChangeKind / Stable ID / UI 属性 / Match 結果
```

### Stable Identity

- `tempId` のみ。Path ID / UUID-as-Identity 禁止
- Identity Score / Candidate は **ADR-003**（SLIR に confidence:candidate を載せない）

### Table / Annotation / Origin

Atomic Table · Annotation 分離 · Origin 非比較 — 従来どおり。

---

## Non Goals

- Table Cell Diff · Track Changes 完全対応（Phase1 で特別扱いしない）
- Layout 完全再現 · PDF ページ単位比較 · AI Semantic
- UI / ChangeKind / Diff 結果の混入

---

## Consequences

**メリット:** 意味中心 · Style Diff 可能 · 形式横断 · Word エンジン化回避  
**デメリット:** Normalizer 実装が必要 · segments 規約（range 単位は実装詳細）

---

## Intent

形式固有木の直接 Diff と TextRun Node 公開は OpenXML 漏洩と Engine 肥大を招く。**TextNode + styleSegments**、Atomic Table、Annotation 分離、Identity の Matcher 委譲により比較核を固定する。

## Rejected Alternatives

- TextRunNode / Paragraph→TextRun 階層
- TextSpan 断片列を正とする案（009 以前 Accepted）
- Path ID / UUID-as-Identity
- MVP Row/Cell Diff
- Annotation → 本文 Modified
- Identity Score を本 ADR に閉じる
- Renderer が SLIR を表示正本とする

## Future Revisit

- Table Diff 昇格 · Score 改定 · range 単位の実装規約固定 · Track Changes（Product）

---

## Validation

| 項目 | 結果 |
|------|------|
| TextNode + styleSegments | OK（009 Adopt） |
| TextRunNode 非採用 | OK |
| Table Atomic | OK |
| Stable ID = Matcher | OK |
| `<w:r>` 非露出 | OK |
| UI/Diff 非混入 | OK |
