# Projection View Model — Wave 4

UI が読んでよい唯一の入力。Delta / SLIR は見ない。

## Shape

[`packages/projection/CONTRACT.md`](../../packages/projection/CONTRACT.md) を正本とする。

```ts
type ProjectionModel = {
  items: ProjectionItem[];
  view: {
    selectedId?: string | null;
    filter: FilterState;
    activeView: "review";
    expandedIds: string[];
  };
  changeCount: number;
};

type ProjectionItem = {
  id: string;              // deltaId
  kind: "added" | "deleted" | "modified" | "unchanged";
  label: string;
  visible: boolean;        // Filter 結果 · DOM 削除しない
  selected?: boolean;
  candidate?: boolean;
  confidence?: "high" | "candidate" | number;
  changeDetail?: string;
  beforeText?: string;
  afterText?: string;
  oldNodeRef?: string;     // semanticNodeId 候補
  newNodeRef?: string;
  originHint?: { page?: number; bbox?: object };
};
```

## Rules

1. `kind` / `changeDetail` を UI で再判定しない
2. Filter は `visible` を切り替えるだけ（Projection 再生成 or ViewState 更新）
3. `originHint` は表示・Anchor 補助のみ · 変更判定に使わない
4. Candidate は表示フラグ · ChangeKind ではない
