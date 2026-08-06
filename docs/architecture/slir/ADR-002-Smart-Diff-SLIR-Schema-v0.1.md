# ADR-002

| 項目 | 値 |
|------|-----|
| **Title** | Smart Diff SLIR Schema v0.1 |
| **Status** | **Superseded（方針）** → [`ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md`](ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md) |
| **Date** | 2026-08-06 |
| **Decision Makers** | Board（レビュー後に Accepted 化判断） |
| **Related** | [`../../notes/smart-diff/PRODUCT_CONSTITUTION.md`](../../notes/smart-diff/PRODUCT_CONSTITUTION.md) · [`../../notes/smart-diff/ADR-001-origin-metadata.md`](../../notes/smart-diff/ADR-001-origin-metadata.md) · Matcher [`../adr/ADR-003-matcher-engine.md`](../adr/ADR-003-matcher-engine.md) · Delta [`../adr/ADR-004-delta-tree-model.md`](../adr/ADR-004-delta-tree-model.md) |
| **Schema 詳細** | [`schema/SLIR-v0.1.md`](schema/SLIR-v0.1.md)（**009 正本 · TextNode+segments**） |
| **Rejected** | [`decisions/rejected-alternatives.md`](decisions/rejected-alternatives.md) |
| **Accepted 現行（変更禁止）** | [`../adr/ADR-002-slir-schema.md`](../adr/ADR-002-slir-schema.md) |

> **方針更新:** 本 Draft の **TextRunNode 採用**は ADR-008/009 により **TextNode + styleSegments** へ置き換え。  
> 歴史文書として残すが、**新しい設計正本は ADR-009**。Accepted は Board Adopt まで TextSpan。

---

## 1. Status

**Superseded（Inline 方針）** — 詳細判断は [`ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md`](ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md) · Board Brief [`BOARD_ADOPT_BRIEF_ADR-009.md`](BOARD_ADOPT_BRIEF_ADR-009.md)

---

## 2. Context

Smart Diff では DOCX / PDF / HTML / Markdown など異なる形式を比較する必要がある。各形式には固有問題がある。

| Format | 固有問題 |
|--------|----------|
| DOCX | XML 構造 · Style · Run |
| PDF | 座標中心 · Paragraph 概念なし |
| HTML | DOM Tree |
| Markdown | AST |

これらを直接比較すると形式依存になる。そのため中間表現を導入する。

```text
Parser
  ↓
Normalizer
  ↓
SLIR          ← 本 ADR
  ↓
Matcher / Diff
  ↓
Delta Tree
  ↓
Renderer
```

目的（Product）: 変更点を示すことで、確認作業そのものを短縮する。

---

## 3. Decision

### SLIR Definition

**SLIR** = Smart Logical Intermediate Representation  
（表記ゆれ: Smart Diff Logical Intermediate Representation。本 ADR では **Smart Logical Intermediate Representation** に統一。）

定義:

> 文書形式ではなく、人間が確認する意味構造を比較するための中間表現。

1. SLIR は表示用モデルではない（Renderer Independence）。
2. Parser 固有構造・Word XML・PDF 座標中心モデルを SLIR 核に持ち込まない。
3. Phase1 Table は **Atomic `TableNode`**。Row/Cell は Diff 対象 Node にしない。
4. Inline 比較粒度として **TextRunNode** を採用する（理由 §5 · Accepted との差分あり）。
5. Annotation は独立 Document Node 禁止 · Attach 型。
6. Stable Identity 問題は SLIR で解かない · Matcher（ADR-003）。
7. Loss Aware · Origin Isolation を必須とする。
8. Track Changes 完全対応は Product 未決定 · Metadata 候補記載のみ。

### Accepted 現行との差分（無断修正しない）

| 論点 | 本 Proposed | Accepted ADR-002 |
|------|-------------|------------------|
| Inline | **TextRunNode** | TextSpan（Node 非公開） |
| 原則数 | P1–P7 明示 | Principles 表（同趣旨） |
| Identity Score | 境界のみ · 詳細は ADR-003 | 暫定表あり · 正本は ADR-003 |

Board が Adopt するまで実装 SSOT は Accepted。

---

## 4. Design Principles

| ID | Principle | 意味 |
|----|-----------|------|
| **P1** | Semantic First | 表示ではなく意味単位を優先 |
| **P2** | Parser Independence | Parser 固有構造を持ち込まない |
| **P3** | Deterministic Normalization | 同じ入力は同じ SLIR になる |
| **P4** | Comparison Ready | Diff Engine が比較可能な粒度を保持 |
| **P5** | Loss Aware | 完全復元できない情報は明示する |
| **P6** | Origin Isolation | 元ファイル情報と SLIR 情報を分離する（ADR-001） |
| **P7** | Renderer Independence | 表示都合を SLIR へ入れない |

---

## 5. Node Schema

詳細型: [`schema/SLIR-v0.1.md`](schema/SLIR-v0.1.md)

### DocumentNode

役割: Root。

Fields: `id` · `metadata` · `sourceFormat` · `originMetadata` · `children`

### HeadingNode

Fields: `level` · `text` ·（任意）TextRun 子

### ParagraphNode

Fields: `children` · `semanticRole`（optional）

### TextRunNode — 採用理由（必須）

以前は「Paragraph → Text で十分」「Run は Parser 内部吸収」と判断した。

しかし DOCX 比較では text 変更と style 変更を区別する必要があり、Parser 内部情報として破棄すると将来的な Diff 品質を制限する。

よって:

> Word XML 構造（`<w:r>`）を持ち込むためではなく、**比較粒度を保持するため** TextRun を採用する。

Fields: `text` · `styleMetadata`（bold / italic / underline / fontSize 等の比較用抽象）· 推奨 `normalizedText`

### ListNode

Fields: `ordered` · `level` · `children`

### TableNode（Phase1 Atomic）

保持: table metadata · extracted text summary ·（推奨）`contentHash` / rowCount / columnCount

禁止: `TableRowNode` · `TableCellNode` を Diff 対象 Node として定義しない。

理由: Product Constitution — Table Diff は Phase2。Phase1 は「表が変更された」まで。

### ImageNode

Fields: `metadata` · `boundingBox`（optional · Origin 側が適切な場合あり）

### Annotation

独立 Node 禁止。**Attach 型**（親 Paragraph 等へ紐づけ）。

理由: 本文変更とコメント変更を混同しない。ChangeKind 詳細は Delta Tree。

---

## 6. Identity / Matching Boundary

SLIR では Stable ID 問題を解決しない。

| 禁止 | 理由 |
|------|------|
| Path Based ID（`1.2.4`） | 挿入で後続 Node が変更される |
| Random UUID only を Identity とする | 再 Parse で全変更になる |

SLIR が保持してよいもの:

- node identity metadata（**一時 id** · Stable ではない）
- origin metadata
- normalization metadata

SLIR が保持しないもの（ADR-003）:

- similarity score
- matching decision
- candidate judgement

Matcher 責務: Identity Score による推定。詳細は ADR-003。

---

## 7. Parser Boundary

| Parser | Normalizer / SLIR |
|--------|-------------------|
| 形式読取 · 抽出 · Origin 付与 | 意味構造への正規化 · SLIR Node 化 |
| Format Native Representation | Document/Heading/Paragraph/TextRun/… |

Parser 出力を直接比較しない（Rejected）。mammoth HTML を SLIR SSOT にしない。

---

## 8. Normalization Rules（境界）

本 ADR はルール詳細の完全カタログではない（Normalizer ADR へ詳細化可）。最低限:

- 同じ入力 → 同じ SLIR（P3）
- 空行・見出し判定・PDF Geometry → Block 化は Normalizer
- OpenXML / DOM / mdast / PDF raw を SLIR 型名にしない

---

## 9. Loss Aware Handling

完全な意味構造復元を保証しない（特に PDF）。

必須: `confidence` · `loss` / `lossMetadata`（命名は schema で統一可）

例（PDF）:

```text
confidence: 0.72
loss:
  - reading_order_uncertain
  - table_structure_missing
```

Parser 推測情報と元データ情報を混在させない（Origin vs quality/loss）。

---

## 10. Phase1 Scope

対象: 上記 Node · Atomic Table · TextRun · Annotation Attach · Origin Isolation · Loss Aware

### Out of Scope（Phase1 対象外）

- Table Cell Diff
- Move Detection
- Semantic AI Diff
- Track Changes 完全対応
- Renderer 仕様
- Export 仕様

Track Changes: Product 未決定。Parser が保持可能な Metadata 候補としてのみ記載可。対応方針は決めない（OQ-003）。

---

## 11. Phase2 Future Extension

- TableRow / TableCell Schema（Product が Table Diff 昇格時）
- Move Detection（UI Phase2）
- Track Changes（Product 後）
- GumTree 系 Tree Matching（採用可否は ADR-003）

---

## 12. Rejected Alternatives

詳細: [`decisions/rejected-alternatives.md`](decisions/rejected-alternatives.md)

| 案 | 理由 |
|----|------|
| Path Based Stable ID | 位置変更に弱い |
| Parser Output 直接比較 | 形式依存 |
| PDF 座標中心 SLIR | 意味構造比較にならない |
| mammoth HTML = SLIR SSOT | 比較構造不足 |
| AI Semantic Diff | No unnecessary AI · Local · 再現性 |
| TableRow/Cell を Phase1 Node 化 | Product Phase2 |

---

## 13. Open Questions

| ID | 内容 | 送り先 |
|----|------|--------|
| **OQ-001** | Identity Score 詳細 | ADR-003 |
| **OQ-002** | Candidate Match 状態（60–84）の扱い · UI | ADR-003（UI は Renderer） |
| **OQ-003** | DOCX Track Changes 対応 | Product 判断待ち |

Score の推奨数値（Heading 30 / Context 25 / Text 30 / Position 15 · 閾値 85/60）は **ADR-003 正本**。本 ADR に第二正本を作らない。

---

## 責務の一目（完成条件）

| 層 | 何をするか |
|----|------------|
| **SLIR** | 意味構造の比較用データ契約（入れる/入れないを本 ADR） |
| **Parser** | 形式抽出 · Origin · Diff しない |
| **Matcher** | 同一性推定 · Score · Candidate（ADR-003） |
| **Delta** | 変更状態モデル · ChangeKind（ADR-004） |
| **Renderer** | Delta のみ表示 · SLIR 直接参照しない |

---

## Review Checklist（Accepted 化判断用）

| 項目 | 結果 |
|------|------|
| SLIR に何を入れるか明確 | OK（§5） |
| 何を入れないか明確 | OK（§10–12） |
| Parser / Matcher / Delta 境界 | OK（§6–7 · 責務表） |
| TextRun 理由あり | OK |
| Table Atomic · Cell なし | OK |
| Track Changes を勝手決定していない | OK |
| Accepted を変更していない | OK |
| コードなし | OK |

**次:** レビュー後 Board が Adopt / Reject / 差分マージ。通った後 **ADR-003 Matcher Engine**（Identity Score 正式 · Candidate · Same/Modified 境界 · Myers/patience/GumTree 範囲 · Move→Phase2）。
