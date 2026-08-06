# ADR-006 Export — Architecture Confirmation（post ADR-010/011）

| 項目 | 値 |
|------|-----|
| **Date** | 2026-08-06 |
| **正本** | [`ADR-006-Export-Architecture-v0.1.md`](ADR-006-Export-Architecture-v0.1.md) |
| **Status** | **Confirmed for MVP path**（Proposed のまま · 再設計不要） |

> ADR-011 完了後の確認。Export は「ADR-012」に採番し直さない（既存 006）。

---

## Confirmation Checklist

| 項目 | 結果 |
|------|------|
| 入力 = Delta Tree（+ Report Model）· Renderer DOM を正本にしない | OK · 010/011 と整合 |
| Local Only · 非アップロード | OK · 憲法整合 |
| Phase1 = PDF Report（pdf-lib） | OK |
| DOCX Track Changes / 元文書書き換え | 非対応 · OK |
| Review 結果の提出物化（Print First） | OK · Interaction 終了後の導線 |
| Redline PDF 完全再現 | Phase2 · Review/Text Redline で足りる |
| UI 状態（expanded 等）を Export に埋め込まない | OK · DiffReport は Delta 由来 |

## MVP 導線

```text
Interaction で確認完了
  → Export（DiffReport → pdf-lib → Download）
```

Projection/ViewState は Export 入力にしない（必要なら「現在の Filter 適用後の変更一覧」を明示オプションにする場合は Export ADR に追記してから実装）。

## Residual（Wave 5 で閉鎖）

| Residual | Wave 5 決定 |
|----------|-------------|
| Filter 適用結果を PDF に反映するか | **MVP = 全変更**（表示中のみ Export 禁止） |
| Export 入力 | **Projection Model**（[`export/export-design.md`](export/export-design.md)） |

**判定: Export MVP 実装可 · Architecture Freeze 対象。**
