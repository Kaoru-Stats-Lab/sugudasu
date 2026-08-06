# Renderer Design v0.1（ADR-010）

| 項目 | 値 |
|------|-----|
| **ADR** | [`ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md`](ADR-010-Smart-Diff-Renderer-Architecture-v0.1.md) |
| **先行草案** | [`renderer-architecture.md`](renderer-architecture.md)（ADR-005 · 本ファイルを正とする） |

> 実装コードではない。Delta → Projection → UI の契約。

---

## 1. Pipeline

```text
Delta Tree                    （比較結果 · 変更状態）
  ↓
Render Projection Model       （表示用 · UI 状態を含みうる）
  ↓
UI Components                 （React 等 · 本 ADR 外）
```

---

## 2. Render Projection Model（例）

```typescript
/** Delta 由来 · 書き戻さない · 再計算しない */
type ProjectedChange = {
  deltaNodeId: string;
  visibility: boolean;
  highlightRanges?: Array<{ start: number; end: number }>; // 表示用 · Diff 再計算結果ではない
  collapsed?: boolean;
  selected?: boolean;
  /** 以下は Delta から投影 · Renderer が再判定しない */
  changeKind: "Added" | "Deleted" | "Modified" | "Unchanged";
  candidate?: boolean;
  changeDetail?: "style_only" | "text_only" | "text_and_style" | "table_changed" | string;
  beforeText?: string;
  afterText?: string;
  summary?: string;
  originHint?: { page?: number; bbox?: unknown }; // 配置のみ
};

type ViewState = {
  expandedIds: string[];
  selectedId?: string;
  filter: {
    content: boolean;
    addedDeleted: boolean;
    style: boolean;
    comments: boolean;
  };
  density?: "comfortable" | "compact";
  activeView: "review"; // Phase1。redline は Phase2
};
```

### Projection 禁止

```text
if (oldText !== newText) { ... }   // Diff 再計算
projection.fontSize / paragraphStyle // SLIR/Word 属性コピー
deltaNode.accept = true              // 直接状態書込
```

Accept/Reject:

```text
Renderer Event → Delta Controller → Delta update → Projection rebuild → UI
```

---

## 3. Review View vs Redline View

### Review（Phase1 Primary）

```text
左 Before | 右 After
+ Change Navigator / Change List → クリックでジャンプ
```

確認対象だけを見る。Word 再現ではない。

### Redline（Phase2）

```text
契約期間 ~~1年~~ → 2年
```

Phase1 で作らない（Renderer 沼回避）。

---

## 4. Phase1 Mapping

| Delta | Review 表示 |
|-------|-------------|
| Added | After 強調 + ラベル「追加」 |
| Deleted | Before 強調 +「削除」 |
| Modified | 旧/新並記 · 要約 |
| style_only | 「書式変更」· 既定フィルタ OFF 可 |
| candidate | 「自動判定候補 · 確認してください」 |
| Unchanged | 文脈 · 一覧の主対象外 |

---

## 5. Navigation / Sync

- 次/前 · 一覧 · 種別フィルタ
- **Delta Anchor Sync**（scrollTop 単純同期禁止）
- Keyboard: 次/前 · フォーカス

---

## 6. PDF Overlay

```text
Delta Projection → page/bbox（Origin）→ pdf.js view + highlight
```

bbox は「どこに印を付けるか」のみ。「何か変わったか」は Delta。

---

## 7. Noise Filter（ViewState）

初期: 内容変更 + 追加削除 ON · 書式/コメント OFF 可。  
Engine へ逆流させない。

---

## 8. Export

画面 Print 可。ファイル生成 = Export ADR-006。Projection を PDF レイアウトの正本にしない（Report Model 経由）。

---

## 9. HCI 成功条件（定性）

実務者が変更一覧から重要変更へ飛び、旧/新を見比べ、確認を終えられる（おおよそ 3 分を目指す）。全文探索させない。

## 10. NFR

Incremental rendering。毎操作フル document re-render を前提にする設計を禁止。Virtualization / Canvas vs DOM は後続詳細可。
