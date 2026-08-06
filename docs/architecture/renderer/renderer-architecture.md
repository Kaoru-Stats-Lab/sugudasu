# Renderer Architecture Design v0.1

| 項目 | 値 |
|------|-----|
| **Status** | Proposed Pack 付属 |
| **ADR** | [`ADR-005-Smart-Diff-Renderer-Architecture-v0.1.md`](ADR-005-Smart-Diff-Renderer-Architecture-v0.1.md) |
| **入力契約** | Delta Tree（Accepted ADR-004 / Delta Pack） |

> 実装コードではない。Delta → UI の設計契約。

---

## 1. Input Contract

```text
Renderer.input = DeltaTree
```

許可（表示補助のみ）:

- Origin Metadata（ADR-001）— PDF page / bbox の **Overlay 配置**
- ユーザー UI 状態（フィルタ ON/OFF · 現在の変更 index）— **Delta に書き戻さない**

禁止:

- SLIR 再読込による比較
- Matcher / Score 再計算
- OpenXML / Parser 生データ依存の判定
- PDF 座標による「変わったか」判断

---

## 2. MVP Layout Mapping

```text
ComparePane
  ├ DocumentView(Before)  ← kind Deleted / Modified.before / Unchanged 文脈
  └ DocumentView(After)   ← kind Added / Modified.after / Unchanged 文脈
ChangeNavigator
  ├ ChangeList
  ├ Prev / Next
  └ FilterControl
SearchBar（v0.1 可）
```

### Layout 比較メモ（ADR 結論の根拠）

| | 2+Navigator（採用） | Before/Diff/After（不採用） |
|--|---------------------|---------------------------|
| 前後同時比較 | 強い | 弱い（中央に引っ張られる） |
| 情報量 | 制御しやすい | 過多 |
| 確認短縮 | Difference First と相性良 | 全文+中央 Diff で探索増 |

---

## 3. Delta → UI Mapping

| Delta | Before ペイン | After ペイン | Navigator |
|-------|---------------|--------------|-----------|
| Added | —（または空スロット） | 追加表示 | 「追加」 |
| Deleted | 削除表示 | — | 「削除」 |
| Modified | before テキスト | after テキスト · 差分強調 | 「変更」+ 要約 |
| Candidate | before | after · **候補ラベル必須** | 「自動判定候補」 |
| Unchanged | 文脈として表示可 | 同左 | 一覧の主対象外（フィルタで隠せる） |

Candidate（Accepted: `confidence: "candidate"`）は通常 Modified と視覚・文言で区別する。

Style（`changeReason: StyleChanged`）: Noise Filter 既定 OFF 可。表示時は「書式変更」ラベル。

Annotation Added: 本文 Unchanged と並べ、コメント領域として分離表示（本文 Modified に見せない）。

---

## 4. Change Navigation

データ源: Delta Tree の変更ノード走査（Added/Deleted/Modified/Candidate）。

| 操作 | 挙動 |
|------|------|
| 次 / 前 | 変更リスト順にフォーカス移動 |
| 一覧クリック | 該当 Delta Anchor へ Jump |
| フィルタ | 種別の表示/非表示（一覧とペイン強調の両方） |

キーボード: 次/前 · フォーカス移動（最低限）。

---

## 5. Highlight 粒度

正:

```text
契約期間: 1年 → 2年
```

禁止を正としない:

```text
契約期[間]1年
```

`inlineChanges` / `beforeText` / `afterText` は Delta から読む。**Renderer 内再 Diff 禁止。**

---

## 6. Noise Filter（v0.1 範囲）

設計上のトグル例:

```text
☑ 文字変更（内容）     ← 初期 ON
☑ 追加・削除           ← 初期 ON
□ 書式変更             ← 初期 OFF
□ コメント変更         ← 初期 OFF
```

v0.1: UI 実装は限定してよい。フィルタ状態は Renderer ローカル。Engine へ逆流させない。

Priority / Severity 体系は新設しない（UI Constitution）。

---

## 7. Synchronization — Delta Anchor Sync

必要: Scroll Sync · Section Jump · Change Jump。

禁止: 単純 `scrollTop` 左右コピー（ページ高さが違う）。

採用: **同一 Delta Node id** をアンカーに位置合わせ。

共同編集: 対象外。WebSocket / WebRTC 禁止。

---

## 8. PDF Rendering Path

```text
Delta Tree
  ↓
PDF page reference（Origin）
  ↓
pdf.js page view
  ↓
Highlight Overlay（Delta kind 由来）
```

- pdf.js = **表示**ライブラリ
- 座標 = Overlay 配置のみ
- 「この bbox が変わったから Modified」という判断はしない

---

## 9. Accessibility

- 色だけで変更表現しない
- Added / Deleted / Modified / Candidate を文字・アイコン・下線・背景で併用
- キーボード操作可能

---

## 10. Browser / Responsive

| 制約 | 方針 |
|------|------|
| Browser Only | 必須 |
| No Upload Server | 必須 |
| Local Processing | 必須 |
| No Account | 必須 |
| Desktop | 優先 |
| Mobile | 最適化対象外 |

Print 表示は可。PDF ファイル生成は **Export Layer**（ADR-006）。

---

## 11. Component Boundary

```text
Renderer
 ├ ChangeList
 ├ ComparePane
 │   ├ DocumentView
 │   └ DeltaHighlight
 ├ SearchBar
 └ FilterControl
```

Virtual Rendering（大文書）は Performance 後続と整合。おおよそ 100 ページ級を想定。

---

## 12. Phase2 余地

- 単一 Redline ビュー
- Mobile
- Accept/Reject UI（Delta は Read Only のまま編集層を別立て）
- Visual Diff Overlay 強化

---

## 13. Open Questions

1. Navigator を下配置か左サイドか（Desktop 幅前提で後決め可）
2. Candidate の正式ラベル文言（「自動判定候補」でよいか）
3. Unchanged 文脈の初期折りたたみ量
4. pdf.js Worker と Virtual の実装境界
5. Export 印刷プレビューとの見た目一致度
