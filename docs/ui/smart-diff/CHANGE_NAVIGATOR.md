# Change Navigator — Wave 4

| 項目 | 値 |
|------|-----|
| **Status** | Active |
| **ADR** | ADR-011 |
| **Input** | Projection Model only |

## Primary

```text
変更一覧 → 選択 → Semantic Anchor → Before / After Review
```

Document canvas / PDF ページ表示は secondary（Phase1 は Review pane で十分）。

## Layout

```text
[ Changes N ]  [ filters ]
[ list items… ]
────────────────
[ Before | After ]
```

## List item

- index · label · kind badge（Added / Deleted / Modified / Changed）
- Candidate: `?` + 一致度表示のみ · Modified にしない
- Table (`table_changed`): ラベルは要約可 · 本文は「表に変更があります」

## Controls

- 次へ / 前へ（visible changes のみ）
- Filter: Modified · Added · Deleted · Style（visibility）
- Unchanged は default OFF

## Forbidden

差分再計算 · SLIR 読取 · Delta mutate · セル Diff UI
