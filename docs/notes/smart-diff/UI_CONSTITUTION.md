# Smart Diff — UI Constitution

**更新:** 2026-08-06  
**索引:** [`DESIGN_PACK_MANIFEST.md`](DESIGN_PACK_MANIFEST.md)  
**関連:** [`PRODUCT_CONSTITUTION.md`](PRODUCT_CONSTITUTION.md) · [`../../architecture/adr/ADR-004-delta-tree-model.md`](../../architecture/adr/ADR-004-delta-tree-model.md)（ChangeKind モデル）· [`../../architecture/adr/ADR-002-slir-schema.md`](../../architecture/adr/ADR-002-slir-schema.md)

> 必要になるまで概念を増やさない。ChangeKind の詳細（Candidate · unchanged 構造）は ADR-004。色・ハイライトは ADR-005。

---

## A. ChangeKind

| Kind | MVP |
|------|-----|
| Added | 対象 |
| Deleted | 対象 |
| Modified | 対象 |
| Moved | **Phase2** |
| Conflict | **対象外** |

**追加しない:** Priority · Severity。

必要になるまで概念を増やさない。
