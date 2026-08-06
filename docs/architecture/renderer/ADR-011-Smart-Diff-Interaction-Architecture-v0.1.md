# ADR-011

| 項目 | 値 |
|------|-----|
| **Title** | Smart Diff Interaction Architecture v0.1 |
| **Status** | **Proposed**（Architect レビュー反映済み） |
| **Date** | 2026-08-06 |
| **Related** | ADR-010 Renderer · Accepted ADR-004 Delta · UI Constitution |
| **詳細** | [`interaction-design.md`](interaction-design.md) |
| **作成 Task** | [`../../prompts/smart-diff-adr-011-interaction-architecture-CREATE-TASK.md`](../../prompts/smart-diff-adr-011-interaction-architecture-CREATE-TASK.md) |

> **製品価値層。** 普通の Diff Viewer（左右をスクロールして探す）にしない。  
> Primary = Change Navigator driven review。Document canvas は secondary。

---

## 1. Status

**Proposed**（レビュー反映 · Go）

---

## 2. Context

```text
変更一覧を見る → 変更を選ぶ → 該当箇所だけ確認する
```

禁止される中心体験:

```text
左右の文書をスクロールして探す
```

---

## 3. Decision

### D1 — Primary Interaction

```text
Primary interaction: Change Navigator driven review
Document canvas is secondary.
```

### D2 — Anchor Sync

```text
Anchor Sync is semantic-node based, not pixel-scroll based.
```

同一 Delta Node の Before Position / After Position を対応させる。  
`scrollTop` 百分率・単純コピーは禁止（高さ不一致で破綻する）。

### D3 — Filter = 視界制御

Filter は DOM からノードを削除しない。  
**Projection の visibility / hidden** で扱う（選択・Anchor を壊さない）。ADR-010 Projection と整合。

### D4 — Candidate 表示のみ（判定しない）

表示例（コピーは調律可）:

```text
同一候補として推定
confidence: 72%
[確認する]
```

禁止: Candidate を Interaction が Modified 扱いする · Deleted+Added 化する（Matcher/Delta 侵食）。

### D5 — Table Atomic

OK: 「表1 · 変更があります」  
NG: 「3行2列目変更」（Phase2）

### D6 — Phase1 操作優先度

| 操作 | 優先 |
|------|------|
| 次の変更へ移動 | **必須** |
| 前の変更へ移動 | **必須** |
| 変更数表示 | **必須** |
| Modified / Added / Deleted のみ表示 | **高** |
| キーボード操作 | **中**（最低限は必須寄り） |
| コメント追加（編集） | Phase2 |
| Redline 操作 | Phase2 |

### D7 — Accept/Reject

ある場合のみ Delta Controller 経由（010 D8）。Interaction が Delta を直接 mutate しない。

---

## 4. Phase1 Interaction Map

| 機能 | 方針 |
|------|------|
| Change Navigator | Primary · 件数 · 一覧 · 次/前 · Jump |
| 選択同期 | 一覧 ↔ 両ペイン同一 Delta |
| Anchor Sync | semantic deltaNodeId · 非 pixel |
| 折り畳み | Unchanged 文脈 · 変更は隠さない（既定） |
| Filter | visibility · DOM 削除しない |
| Candidate | 推定ラベル + 確認 · 判定しない |
| Table | 表単位 1 エントリ |
| Annotation | 本文と分離ナビ |
| Keyboard | 次/前 · フォーカス（中優先だが Phase1 に含める） |

---

## 5. Forbidden

- スクロール探索を Primary にする
- pixel / scrollTop 同期
- Filter による DOM 削除で Anchor 破壊
- Candidate → Modified 自動昇格
- Cell Diff UI
- Diff 再計算 · SLIR 参照 · Delta 直接 mutate

---

## 6. Open Questions

| ID | 内容 |
|----|------|
| OQ-NAV-POS | Navigator 下 vs 左 |
| OQ-ACCEPT | Phase1 に Accept/Reject を出すか |
| OQ-FOLD | Unchanged 初期折りたたみ量 |
| OQ-CAND-COPY | Candidate 文言の最終コピー |

---

## 7. Intent

確認対象だけを辿れる操作系を固定し、普通の Diff Viewer 化と Word 沼を避ける。

次: **ADR-006 Export 確認** → **Performance Budget** → **MVP Implementation Plan**。
