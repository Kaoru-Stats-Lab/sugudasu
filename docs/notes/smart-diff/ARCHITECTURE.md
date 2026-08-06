# Smart Diff — Architecture（Pack 入口）

**更新:** 2026-08-06  
**成熟度:** Draft（Pack 組み立て中）  
**索引:** [`DESIGN_PACK_MANIFEST.md`](DESIGN_PACK_MANIFEST.md)

> 設計判断の正本は各 ADR。本ファイルは入口と参照のみ（複写禁止）。

## ADR 一覧

| ID | 題 | Status | 正本 |
|----|-----|--------|------|
| ADR-001 | Origin Metadata Isolation | Accepted | [`ADR-001-origin-metadata.md`](ADR-001-origin-metadata.md) |
| ADR-002 | SLIR Schema v0.1 | **Accepted**（009 Adopt · TextNode+segments） | [`../../architecture/adr/ADR-002-slir-schema.md`](../../architecture/adr/ADR-002-slir-schema.md) |
| ADR-002 | SLIR Proposed（旧 TextRun） | **Superseded** | [`../../architecture/slir/ADR-002-Smart-Diff-SLIR-Schema-v0.1.md`](../../architecture/slir/ADR-002-Smart-Diff-SLIR-Schema-v0.1.md) |
| ADR-009 | SLIR Adopt Decision Log | **Adopted** | [`../../architecture/slir/ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md`](../../architecture/slir/ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md) · [`Brief`](../../architecture/slir/BOARD_ADOPT_BRIEF_ADR-009.md) |
| ADR-003 | Matcher Engine v0.1 | Accepted | [`../../architecture/adr/ADR-003-matcher-engine.md`](../../architecture/adr/ADR-003-matcher-engine.md) |
| ADR-003 | Matcher Engine Proposed Pack | **Proposed** | [`../../architecture/matcher/ADR-003-Smart-Diff-Matcher-Engine-v0.1.md`](../../architecture/matcher/ADR-003-Smart-Diff-Matcher-Engine-v0.1.md) · [`matcher-design`](../../architecture/matcher/matcher-design.md) |
| ADR-004 | Delta Tree Model v0.1 | Accepted | [`../../architecture/adr/ADR-004-delta-tree-model.md`](../../architecture/adr/ADR-004-delta-tree-model.md) |
| ADR-004 | Delta Tree Proposed Pack | **Proposed** | [`../../architecture/delta/ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md`](../../architecture/delta/ADR-004-Smart-Diff-Delta-Tree-Schema-v0.1.md) · [`schema`](../../architecture/delta/delta-tree-schema.md) · [`sample`](../../architecture/delta/samples/fictional-contract-walkthrough.md) |
| ADR-005 | Renderer Architecture Pack（先行） | **Superseded → 010** | [`../../architecture/renderer/ADR-005-Smart-Diff-Renderer-Architecture-v0.1.md`](../../architecture/renderer/ADR-005-Smart-Diff-Renderer-Architecture-v0.1.md) |
| ADR-010 | Renderer Architecture | **Proposed**（正本候補 · レビュー反映済み） | [`../../architecture/renderer/ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md`](../../architecture/renderer/ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md) · [`renderer-design`](../../architecture/renderer/renderer-design.md) |
| ADR-011 | Interaction Architecture | **Proposed**（レビュー反映済） | [`../../architecture/renderer/ADR-011-Smart-Diff-Interaction-Architecture-v0.1.md`](../../architecture/renderer/ADR-011-Smart-Diff-Interaction-Architecture-v0.1.md) · [`interaction-design`](../../architecture/renderer/interaction-design.md) |
| ADR-006 | Export Architecture | **Proposed** · Confirmed | [`../../architecture/ADR-006-Export-Architecture-v0.1.md`](../../architecture/ADR-006-Export-Architecture-v0.1.md) · [`Confirmation`](../../architecture/ADR-006-Export-Confirmation-2026-08-06.md) |
| ADR-007 | Parser Architecture Pack | **Proposed** | [`../../architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md`](../../architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md) · [`parser-design`](../../architecture/parser/parser-design.md) |
| ADR-008 | Normalizer Architecture Pack | **Proposed** | [`../../architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md`](../../architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md) · [`normalizer-design`](../../architecture/normalizer/normalizer-design.md) |
| ADR-013 | Performance Budget | **Proposed** | [`../../architecture/ADR-013-Performance-Budget-v0.1.md`](../../architecture/ADR-013-Performance-Budget-v0.1.md) |

## データ境界（要約 · 詳細は ADR）

```text
Input Format
  → Format Parser（ADR-007）→ Raw Document Model（≠ SLIR）
  → SLIR Normalizer（ADR-008）→ SLIR（**Accepted ADR-002** · 009 Adopt）
  → Matcher Engine → Match Map（ADR-003）
  → Delta Tree（ADR-004）
  → Render Projection（ADR-010）→ Interaction（ADR-011 · Navigator Primary）→ UI
  → Export（ADR-006）
```

- **SLIR（正本）:** [`../../architecture/adr/ADR-002-slir-schema.md`](../../architecture/adr/ADR-002-slir-schema.md) · Decision Log [`../../architecture/slir/ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md`](../../architecture/slir/ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md)
- **Normalizer Proposed:** [`../../architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md`](../../architecture/normalizer/ADR-008-Smart-Diff-Normalizer-Architecture-v0.1.md)
- **Matcher / Match Map:** [`../../architecture/adr/ADR-003-matcher-engine.md`](../../architecture/adr/ADR-003-matcher-engine.md)
- **Delta Tree:** [`../../architecture/adr/ADR-004-delta-tree-model.md`](../../architecture/adr/ADR-004-delta-tree-model.md)
- **Origin Metadata:** [`ADR-001-origin-metadata.md`](ADR-001-origin-metadata.md)
- **Renderer / Interaction:** ADR-010 · ADR-011
- **Export:** ADR-006 · [`Confirmation`](../../architecture/ADR-006-Export-Confirmation-2026-08-06.md)
- **Performance:** [`../../architecture/ADR-013-Performance-Budget-v0.1.md`](../../architecture/ADR-013-Performance-Budget-v0.1.md)
- **MVP Plan:** [`MVP_IMPLEMENTATION_PLAN.md`](MVP_IMPLEMENTATION_PLAN.md)
- **Parser Proposed:** ADR-007
- **Table Diff 採否:** [`PRODUCT_CONSTITUTION.md`](PRODUCT_CONSTITUTION.md)
- **ChangeKind:** [`UI_CONSTITUTION.md`](UI_CONSTITUTION.md)

Navigator driven review。Export = Local PDF Report。サーバ compute 禁止（013）。

## 未整備

Interface Contract 詳細 · Security · Redline Phase2 · 013 数値の Pilot 改定。  
**MVP Architecture Freeze（Wave 0–5 ✅）。現行 = Wave 6 実務検証（非実装）。**
Validation: [`VALIDATION_PACK.md`](VALIDATION_PACK.md) · Task: [`../../prompts/smart-diff-wave6-validation-plan-CREATE-TASK.md`](../../prompts/smart-diff-wave6-validation-plan-CREATE-TASK.md)

