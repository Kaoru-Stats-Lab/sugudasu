# ADR-001 — Origin Metadata の責務分離

| 項目 | 値 |
|------|-----|
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Scope** | Smart Diff · Diff Engine / SLIR / Origin Metadata |
| **Related** | [`DESIGN_PACK_MANIFEST.md`](DESIGN_PACK_MANIFEST.md) · [`PRODUCT_CONSTITUTION.md`](PRODUCT_CONSTITUTION.md) · [`../../architecture/adr/ADR-002-slir-schema.md`](../../architecture/adr/ADR-002-slir-schema.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) |

## Purpose

Diff Engine が Origin Metadata に依存して肥大化・形式結合しないよう、データ責務を固定する（**Origin Metadata Isolation**）。

## Context

Smart Diff は中間表現（SLIR）で差分し、元形式固有情報は別経路で保持する必要がある。SLIR の Schema 正本は [`../../architecture/adr/ADR-002-slir-schema.md`](../../architecture/adr/ADR-002-slir-schema.md)。Export 層の正式定義は Architecture 未整備。

## Decision

1. Diff Engine **MUST ONLY** consume SLIR（比較対象に `origin` を含めない）。
2. Diff Engine **MUST NOT** access Origin Metadata for comparison.
3. Origin Metadata is available only to **Renderer or Export layer**（Delta Tree 経由の表示と併用可）。
4. Origin Metadata exists solely to preserve format-specific information needed for render/export（例: PDF bbox）。

Architecture 内で Export layer を正式定義するまでは、受け手を **「Renderer or Export layer」** という抽象表現に留める。  
**Export Adapter** という具体名はまだ使わない。

## Intent（なぜ）

形式固有メタを Engine に漏らすと、DOCX/PDF 等の分岐が差分核に侵入し、Browser 肥大と保守不能を招く。表示・出力だけが元形式情報を必要とする。

## Trade-offs

- Positive: Engine が SLIR のみでテスト・置換可能
- Negative: Renderer / Export 側で Origin Metadata 結合の設計が必要（後日 Architecture で定義）

## Rejected Alternatives

- Diff Engine が Origin Metadata を直接読む — 形式結合・責務崩壊
- いま「Export Adapter」を正式コンポーネント名にする — Architecture 未定義のうちの具体化が早い

## Future Revisit Conditions

Architecture で Export layer を正式定義したとき（抽象表現を具体名に置換する）。
