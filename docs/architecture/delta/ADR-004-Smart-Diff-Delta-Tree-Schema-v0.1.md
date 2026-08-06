# ADR-004

| 項目 | 値 |
|------|-----|
| **Title** | Smart Diff Delta Tree Schema v0.1 |
| **Status** | **Proposed** |
| **Date** | 2026-08-06 |
| **Decision Makers** | Board（レビュー後に Accepted 化判断） |
| **Related** | Matcher Pack / Accepted ADR-003 · Accepted ADR-004 · UI Constitution · Renderer ADR-005 |
| **Schema** | [`delta-tree-schema.md`](delta-tree-schema.md) |
| **通し検証** | [`samples/fictional-contract-walkthrough.md`](samples/fictional-contract-walkthrough.md) |
| **Accepted 現行（変更禁止）** | [`../adr/ADR-004-delta-tree-model.md`](../adr/ADR-004-delta-tree-model.md) |
| **作成 Task** | [`../../prompts/smart-diff-adr-004-delta-tree-CREATE-TASK.md`](../../prompts/smart-diff-adr-004-delta-tree-CREATE-TASK.md) |

> **Proposed Draft。** Renderer 仕様ではない。「何が変わったか」の中間モデル。コード・実装方法は書かない。

---

## 1. Status

**Proposed**

---

## 2. Context

Matcher は同一性を推定する。Delta Tree は **変更状態を表現する**。

```text
Parser → Normalizer → SLIR → Matcher → Delta Tree → Renderer
```

| 層 | 責務 |
|----|------|
| SLIR | 比較対象の意味構造 |
| Matcher | 同一性推定 |
| **Delta Tree** | **変更状態表現** |
| Renderer | 表示 |

目的: Renderer が SLIR 比較ロジックを知らずに、差分結果だけを描画できるようにする。

---

## 3. Decision

1. ユーザー向け ChangeKind 核 = **Added / Deleted / Modified**（Conflict · Auto Merge 禁止）。
2. **Unchanged** は階層・文脈用に保持可能（通常 Renderer 非表示）。
3. **Candidate Match**（Score 60–84）は保持可能。自動 Modified 化しない · 自動 Added+Deleted 化しない。UX は Renderer。
4. Text / Style / Text+Style は **ChangeKind を増やさず** `Modified` + `metadata.changeDetail`。
5. Annotation は本文と分離（本文 Unchanged + Comment Added 可）。本文 Paragraph を Modified にしない。
6. Table は Atomic · `Modified` + `changeDetail: table_changed` · Cell Delta 禁止。
7. color / layout / animation / UI state / PDF 生成情報は持たない。

### Accepted との接続

| 本 Pack | Accepted |
|---------|----------|
| changeKind + Unchanged | `kind`: added/deleted/modified + unchanged（ChangeKind 外） |
| Candidate 保持 · 非自動変換 | `confidence: "candidate"`（多くは modified 上） |
| changeDetail: style_only | `changeReason: "style"` |
| before/afterNodeReference | oldNodeRef / newNodeRef |

Candidate を独立 `changeKind` にするか `confidence` にするかは Board（OQ 接続）。実装 SSOT は Accepted。

---

## 4. Delta Tree Definition

Before SLIR と After SLIR の関係を保持する木。SLIR のコピーではない。

---

## 5. Delta Node

```text
DeltaNode
  - id
  - changeKind
  - beforeNodeReference
  - afterNodeReference
  - children
  - metadata
```

詳細: [`delta-tree-schema.md`](delta-tree-schema.md)

---

## 6. ChangeKind Definition

### Unchanged

変更なし。Renderer では通常非表示。Context 表示用に保持可能。

### Added

After に存在し、Before に対応 Node がない。

### Deleted

Before に存在し、After に対応 Node がない。

### Modified

Matcher により同一 Node（Same）と判断され、内容または属性が変化。

例: 株式会社ABC → 株式会社XYZ。

### Forbidden

- **Conflict**
- **Auto Merge**

理由: 変更確認ツールであり、編集統合ツールではない。

---

## 7. Candidate Match

ADR-003 から受け取る（60–84）。

本 ADR で定義すること:

- Candidate 状態を **保持可能**
- 自動的に Modified 化しない
- 自動的に Added+Deleted 化しない

具体的 UX 表現は **Renderer**（OQ-001）。

---

## 8. TextRun 変更

区別（ChangeKind は増やさない）:

1. Text 変更  
2. Style 変更  
3. Text + Style 変更  

例（Style のみ）:

```text
changeKind: Modified
metadata.changeDetail: style_only
```

理由: Added / Deleted / Modified の単純モデルを維持する。

---

## 9. Annotation / Table

**Annotation:** 本文 Unchanged · Comment Added 等。本文 Paragraph を Modified にしない。

**Table（Phase1）:**

```text
changeKind: Modified
metadata.changeDetail: table_changed
```

Cell Delta 禁止（Table Diff Phase2）。

---

## 10. Example

```text
Before: Document → Paragraph A
After:  Document → Paragraph B

Result: DocumentDelta → Modified ParagraphDelta
```

（通し検証: [`samples/fictional-contract-walkthrough.md`](samples/fictional-contract-walkthrough.md)）

---

## 11. Renderer / Export Boundary

**提供:** changed node · relationship · change metadata  

**提供しない:** color · layout · animation · UI state  

**禁止:** Delta Tree が PDF 生成情報を持つ（Renderer / Exporter 責務）。

---

## 12. Phase1 Scope / Out of Scope

**対応:** Heading · Paragraph · TextRun · List · Image · Table Atomic · Annotation  

**禁止:** Merge · Accept/Reject workflow · Move Detection · Cell-level Table Diff · Semantic AI explanation  

---

## 13. Open Questions

| ID | 内容 | 送り先 |
|----|------|--------|
| **OQ-001** | Candidate Match UI | Renderer ADR |
| **OQ-002** | ChangeDetail metadata 粒度 | 実データ評価後 |
| **OQ-003** | Move Detection | Phase2 |

---

## 14. Rejected Alternatives

| 案 | 理由 |
|----|------|
| ChangeKind 増加（StyleChanged / Moved / Conflict） | ユーザー理解コスト増加 |
| Delta Tree で UI 状態管理 | Renderer 責務侵害 |
| Candidate → 自動 Added+Deleted | 誤認識 · Matcher 方針と矛盾 |
| Annotation → 本文 Modified | 確認ノイズ |

---

## Review Checklist

| 項目 | 結果 |
|------|------|
| Matcher = 同一性 · Delta = 変更状態 | OK |
| Added/Deleted/Modified 定義 | OK |
| Candidate 保持 · 非自動変換 | OK |
| Style = Modified + changeDetail | OK |
| Annotation / Table Atomic | OK |
| Renderer / Export 境界 | OK |
| コードなし | OK |
| Accepted 未変更 | OK |

---

## Intent

比較結果を、確認可能な変更モデルへ落とす。ChangeKind を増やさず、Candidate と Annotation / Style / Table を壊さない。

次: **Parser Architecture**（mammoth 範囲 · OpenXML · pdf.js · Normalizer）— Architecture 採番では Parser=007 の場合あり。
