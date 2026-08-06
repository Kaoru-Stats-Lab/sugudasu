# Normalizer Design v0.1

| 項目 | 値 |
|------|-----|
| **ADR** | [`ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md`](ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md) |

> 実装コードではない。Raw → SLIR の設計契約。

---

## 1. TextNode + styleSegments（Option C）

```typescript
type StyleSeg = {
  range: [number, number]; // 半開区間推奨 [start, end)
  style: { bold?: boolean; italic?: boolean; underline?: boolean; fontSize?: number };
};

type TextNode = {
  type: "text";
  content: string;
  normalizedContent?: string;
  styleSegments?: StyleSeg[];
};

type ParagraphNode = {
  type: "paragraph";
  children: Array<TextNode | AnnotationNode>;
};
```

### Raw runs → TextNode

```text
Run(太字「重要」) + Run(通常「事項」)
  → content: "重要事項"
  → styleSegments: [{ range:[0,2], style:{bold:true} }]  // 例 · range規約は OQ-RANGE
```

比較:
- 文言: `content` / `normalizedContent`
- 書式: `styleSegments`（Delta `style_only`）

---

## 2. Table

```text
Raw table (tr/tc 可)
  → TableNode { contentHash, extractedTextSummary, rowCount?, columnCount? }
  → 子に Row/Cell を付けない
```

---

## 3. Loss Aware 規則（方針）

| 状況 | 出力 |
|------|------|
| 高確度で意味単位が復元できる | 対応 SLIR Block |
| 部分的 | Block + loss flags |
| 低確度 / 不明 | `type: "unknown"` + confidence + loss |

強制推測で silence しない。

---

## 4. Format 対応（要約）

| Format | Normalizer 重点 |
|--------|-----------------|
| DOCX | runs → TextNode+segments · p→Paragraph · tbl→Atomic |
| PDF | geometry clustering → paragraph? or unknown |
| HTML | semantic tags → Block · style → segments |
| Markdown | mdast → Block（mdast を残さない） |

---

## 5. Determinism

同一 Normalizer バージョン · 同一 Raw → 同一 SLIR（temp id を除く意味構造）。temp id 採番規則は安定させるか Matcher 非依存を明記。

---

## 6. 非責務

Match Map · Delta · color · pdf-lib · Stable Identity
