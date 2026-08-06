# Interaction Spec — Wave 4

## Select change

```text
click list item
 → selectedId = item.id
 → Anchor = { deltaId, semanticNodeId, originHint }
 → Review pane shows beforeText / afterText
 → list item [aria-selected] · scroll-into-view（補助）は可
```

Anchor 正本は **semantic ids**。`scrollTop` / pixel は正本にしない。

## Next / Prev

`navigatorNextId` / `navigatorPrevId`（visible · non-unchanged のみ）

## Filter

toggle → Projection `visible` 更新  
非表示 item は `hidden` / `aria-hidden` · **removeChild 禁止**

## Table

`changeDetail === "table_changed"`:

```text
Review: 「表に変更があります」
```

セル座標・行列番号を出さない。

## Candidate

```text
? {label}
一致度 / candidate
```

Modified バッジを付けない。

## Perf

- list は Projection.items の差分パッチ or 軽量再描画
- 選択時に全リスト再生成してよいが 1000 件 <100ms 目標
- SLIR ツリーを持たない
