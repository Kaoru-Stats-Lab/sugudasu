# ADR-008

| 項目 | 値 |
|------|-----|
| **Title** | Smart Diff Normalizer Architecture v0.1 |
| **Status** | **Proposed** |
| **Date** | 2026-08-06 |
| **Decision Makers** | Board |
| **Related** | Parser ADR-007 · SLIR ADR-002 · Matcher ADR-003 · Delta ADR-004 |
| **詳細** | [`normalizer-design.md`](normalizer-design.md) |
| **作成 Task** | [`../../prompts/smart-diff-adr-008-normalizer-architecture-CREATE-TASK.md`](../../prompts/smart-diff-adr-008-normalizer-architecture-CREATE-TASK.md) |

> **競争領域:** 汚い入力 → 比較可能な意味構造。Parser でも Diff でもない。  
> Accepted 変更禁止。コード禁止。Text 表現は **Option C（TextNode + styleSegments）** を推奨採用。

---

## 1. Status

**Proposed**

---

## 2. Context

```text
Input Format → Format Parser → Raw Document Model
  → Normalizer（本 ADR）→ SLIR v0.1 → Matcher → Delta → Renderer / Export
```

| 層 | 問い |
|----|------|
| Parser | ファイルに何が書いてあるか |
| **Normalizer** | **比較可能な意味単位へ再構成するか** |
| SLIR | 何を比較契約として持つか |
| Matcher | 同じものか |
| Delta | どう変わったか |

DOCX の `<w:p>` / `<w:r>` / `<w:t>` をそのまま SLIR へ流さない。

---

## 3. Decision

1. Normalizer が **Raw → SLIR** の唯一の意味再構成点である。
2. Inline 表現は **Option C** を採用する（§5）。
3. Table は Raw で構造を読めても SLIR では **TableNode Atomic** のみ。
4. Loss Aware: 低確度の黙った Paragraph 化を禁止。`unknown` + `confidence` / `loss`。
5. Deterministic: 同じ Raw → 同じ SLIR（同一 Normalizer 版）。
6. Diff / Identity / ChangeKind / UI を持たない。
7. SLIR Schema への TextNode 反映は **ADR-009 Accepted 化**で閉じる（本 ADR は方針決定）。

---

## 4. Responsibility

### YES

- Raw blocks → Heading / Paragraph / List / TableNode / Image / Annotation Attach
- Text 正規化（normalized / content）
- Style の比較用抽象（styleSegments）
- PDF Geometry → Block 推定
- Loss / confidence 付与

### NO

- Diff · Identity Score · ChangeKind · Stable ID
- UI / Export
- OpenXML / PDF 生型を SLIR 型として露出
- AI 意味理解 · 重要度判定

---

## 5. Text / Style — Options と採用

| Option | 形 | 判定 |
|--------|-----|------|
| **A** | Paragraph → Text · Style は粗 metadata | 不採用（Style Diff 弱い） |
| **B** | Paragraph → TextRunNode | 不採用（Word 依存 Node 化リスク） |
| **C** | Paragraph → **TextNode** + **styleSegments[]** | **採用（推奨）** |

### Option C（採用）

```text
Paragraph
 └ TextNode
      ├ content（比較の意味単位）
      └ styleSegments[]（range + style）
```

例:

```json
{
  "type": "text",
  "content": "重要事項",
  "styleSegments": [
    { "range": [0, 4], "style": { "bold": true } }
  ]
}
```

効果:

- SLIR は意味中心（content）
- Word `<w:r>` を Node 型として漏らさない
- Style Diff 可能（Delta: `changeDetail: style_only` 等）

### ADR-002 Proposed（TextRunNode）との関係

本 ADR は TextRunNode 公開案を **Option C に置き換える方針**を出す。  
無断で Accepted / Proposed SLIR を書き換えない → **ADR-009** で Schema Accepted 化判断。

---

## 6. Table Atomic 接続

| 層 | 扱い |
|----|------|
| Parser Raw | tbl/tr/tc 等を持てる |
| Normalizer | **TableNode**（summary / contentHash / 寸法メタ）へ正規化 |
| Diff Phase1 | Table changed（ADR-004） |
| 禁止 | SLIR に TableRow / TableCell Node |

---

## 7. Loss Aware

悪い設計: 確度低くても黙って Paragraph 化  
良い設計: Unknown + confidence

```json
{
  "type": "unknown",
  "origin": "pdf",
  "confidence": 0.42,
  "loss": ["reading_order_uncertain"]
}
```

PDF: 文字+座標から Paragraph 候補を推定してよいが、閾値未満は `unknown`。  
詳細閾値は Pilot で調整（OQ）。SLIR P5 の実装接点。

---

## 8. Raw → SLIR（要約）

| Raw（例） | SLIR |
|-----------|------|
| DOCX p/r/t · HTML p · MD paragraph | Paragraph + TextNode(+segments) |
| heading 相当 | HeadingNode |
| table 構造 | TableNode Atomic |
| comment | Annotation Attach |
| PDF glyphs 低確度 | unknown + loss |

詳細表: [`normalizer-design.md`](normalizer-design.md)

---

## 9. Phase1 / Out of Scope

**Phase1:** Option C · Atomic Table · Loss Aware · 主要 Block  
**Out:** Cell SLIR · AI Normalization · Track Changes 意味解釈 · Renderer

---

## 10. Open Questions

| ID | 内容 | 送り先 |
|----|------|--------|
| OQ-009 | TextNode+segments を SLIR Accepted に採るか | **ADR-009** |
| OQ-RANGE | range の単位（UTF-16 code unit vs 文字） | ADR-009 / 実装規約 |
| OQ-PDF-TH | PDF Paragraph 推定閾値 | Pilot |
| OQ-TC | Track Changes | Product |

---

## 11. Rejected

- Raw / OpenXML 直 SLIR  
- Option B をそのまま Word Run Node 化  
- 低確度の強制 Paragraph  
- mammoth HTML = SLIR  
- Normalizer 内 Diff  

---

## 12. Handoff

```text
ADR-008（本）→ ADR-009 SLIR Accepted化 → その後 Renderer（ADR-010 相当）
```

Renderer を Schema 確定前に進めない（Delta が受け取る形が SLIR に依存するため）。

---

## Intent

比較可能な意味構造を、形式リークなしに確定する。Style は segments で保持し、Run を Node として持ち込まない。
