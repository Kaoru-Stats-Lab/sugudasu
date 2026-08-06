# ADR-010

| 項目 | 値 |
|------|-----|
| **Title** | Smart Diff Renderer Architecture v0.1 |
| **Status** | **Proposed** |
| **Date** | 2026-08-06 |
| **Decision Makers** | Board |
| **Related** | Accepted ADR-004 Delta · ADR-002 SLIR（直接消費しない）· ADR-001 Origin · ADR-006 Export · 先行草案 ADR-005 |
| **詳細** | [`renderer-design.md`](renderer-design.md) |
| **作成 Task** | [`../../prompts/smart-diff-adr-010-renderer-architecture-CREATE-TASK.md`](../../prompts/smart-diff-adr-010-renderer-architecture-CREATE-TASK.md) |

> **プロダクト転換点:** 「正しく比較できるか」→「人間が **3 分で確認できるか**」。  
> 入力 = **Delta Tree のみ**。View Model 必須。Phase1 = **Review View 優先**（Redline 完全再現ではない）。

---

## 1. Status

**Proposed**（Renderer 正本候補。ADR-005 は先行草案として本 ADR に従属）

---

## 2. Context

```text
Parser → Raw → Normalizer → SLIR（Accepted）
  → Matcher → Delta Tree（Accepted）→ Renderer → User
```

先行失敗パターン（回避済み前提）:

- SLIR を直接描画する
- Parser 都合を UI へ漏らす
- Diff 結果と表示状態を混ぜる

---

## 3. Decision（Architect 固定条件）

### D1 — 入力は Delta Tree のみ

禁止:

```text
Renderer → SLIR を見る / Parser Origin で差分判断 / 独自 Diff
```

採用:

```text
Delta Tree → Renderer → Render Projection Model → UI
```

「何が変更か」は Renderer 判断禁止。

Origin（page/bbox）は **Overlay 配置のみ**（ADR-001）。

### D2 — View Model（Render Projection）必須

禁止: Delta Tree → 直接 UI Component（expanded 等を Delta に混入）

Delta = 比較結果。View = expanded / selected / scroll / filter / density。**別物。**

### D3 — Review View と Redline View を分離

| View | 目的 | Phase1 |
|------|------|--------|
| **Review View** | 何を確認すべきか（旧/新の確認単位） | **優先 · MVP** |
| **Redline View** | 文字レベル変更 | **Phase2**（Phase1 必須でない） |

Word Compare 完全再現は目標にしない。

### D4 — Layout

**Before | After + Change Navigator**（ADR-005 判断維持）。Before/Diff/After 3 等分は不採用。Difference First · Delta Anchor Sync · PC First。

### D5 — Export 境界

印刷**表示**は可。PDF **生成**は ADR-006 Export。View 状態を Delta に書き戻さない。

### D6 — Render Projection の肥大化防止

**持ってよい:** 表示順序 · 折り畳み · ハイライト範囲 · 選択中 Node · フィルター状態  

**持ってはいけない:**

- 差分判定の再計算（例: `if (oldText !== newText)`）— Matcher/Delta 責務
- SLIR / Word 属性のコピー（例: `projection.fontSize` · `paragraphStyle`）— Word モデル化の入口

### D7 — Review View = Phase1 Primary UX

競争軸は Word Compare のブラウザ再現ではない。

```text
旧 + 新 + 変更一覧 → 確認対象だけを見る
```

Phase1: Review View（Before | After + Change Navigator / 一覧ジャンプ）  
**Redline View = Phase2**（色・打消し・位置調整・Word 互換沼を避ける）

### D8 — Accept / Reject 操作境界

状態の正本は **Delta（または Delta Controller）側**。Renderer は操作 UI とイベントのみ。

```text
User Click → Renderer Event → Delta Controller → Delta State Update
  → Projection 再生成 → Renderer 更新
```

禁止: Renderer が `deltaNode.accept = true` を直接書き込む。

### D9 — Non-Functional（大規模文書）

Renderer must support **incremental rendering**.  
Initial implementation may assume normal document size, but architecture must **not** require full-document re-render on every interaction.  
（契約書・規程の 100〜300 ページ · Browser 完結のためサーバ逃げ不可）

---

## 4. Renderer 責務

| YES | NO |
|-----|-----|
| Delta → Render Projection | ChangeKind / Identity 判定 |
| ナビゲーション · ハイライト · 同期 · 折りたたみ | SLIR / Matcher 再実行 |
| 表示状態管理（View Model） | UI 状態を Delta に永続化 |
| Review（+ 任意 Redline）投影 | Move / Cell Diff / Conflict UI |
| A11y（色だけに依存しない） | Word クローン · AI 要約 |

---

## 5. Phase1 表示範囲

**対象:** Added · Deleted · Modified · `style_only` · Candidate（自動判定候補として区別）

**非対象:** Move 表示 · Table Cell Diff · Auto Merge · Conflict UI

Candidate UX 文言は本 ADR / design で例示可（最終コピーは Product 調律可）。

---

## 6. PDF / DOCX 表示方針

| 項目 | 方針 |
|------|------|
| 原本ビュー | 参考表示可（比較判断の正本は Delta） |
| 差分ビュー | Review View が主 |
| 座標 Map / BoundingBox | Highlight Overlay **配置のみ** · 「変わったか」判断に使わない |
| DOCX | OpenXML を Renderer が読まない · Delta +（必要なら）配置用 Origin |

---

## 7. Accessibility（最低限）

- 色だけで差分表現しない
- Added / Deleted / Modified / Candidate を記号・ラベルでも表現
- キーボードで次/前変更 · フォーカス移動可能

---

## 8. Rejected

- SLIR 直接描画
- Delta → Component 直結（View 混入）
- Phase1 Redline 必須化
- Before/Diff/After 3 等分
- Infinite Canvas · AI 要約 Diff · Mobile First

---

## 9. Open Questions

| ID | 内容 |
|----|------|
| OQ-NAV | Navigator 下配置 vs 左サイド |
| OQ-RL | Redline View 詳細（Phase2） |
| OQ-CANVAS | Canvas vs DOM 選定（後続可） |
| OQ-VIRT | Virtualization 実装詳細（NFR D9 方針のみ固定） |
| OQ-COPY | Candidate ラベル正式文言 |

---

## 10. Intent

確認作業を短縮する表示層を固定する。比較核を汚さず、Review First で 3 分確認を狙う。

次: **ADR-011 Interaction Architecture**（Navigator · 同期スクロール · Filter · Candidate/Table/Annotation 表示インタラクション）。Export は既存 ADR-006（採番案 ADR-012 と衝突しうる）。
