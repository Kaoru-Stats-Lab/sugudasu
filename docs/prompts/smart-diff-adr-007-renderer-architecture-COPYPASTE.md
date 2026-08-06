# Smart Diff — ADR-007 Renderer Architecture v0.1 作成指示（COPYPASTE）

**更新:** 2026-08-06  
**種別:** Cursor / 外部 AI 投入用プロンプト  
**前提 Accepted:** [`ADR-002`](../architecture/adr/ADR-002-slir-schema.md) · [`ADR-003`](../architecture/adr/ADR-003-matcher-engine.md) · [`ADR-004`](../architecture/adr/ADR-004-delta-tree-model.md)  
**Parser / Normalizer 指示（未実体）:** [`smart-diff-adr-005-parser-architecture-COPYPASTE.md`](smart-diff-adr-005-parser-architecture-COPYPASTE.md) · [`smart-diff-adr-006-normalizer-architecture-COPYPASTE.md`](smart-diff-adr-006-normalizer-architecture-COPYPASTE.md)

> **本ファイルはプロンプト保管。** Accepted ADR を勝手に上書きしない。UI を実装しない。未決は Open Questions。  
> **採番衝突（要 Board）:** Architecture 一覧の欠落は **ADR-005 Renderer**。プロンプト列は ADR-005 Parser → 006 Normalizer → **007 Renderer** → 008 Export。実体化前に番号を整理すること。

### 固定事項

| 項目 | 方針 |
|------|------|
| 入力 | **Delta Tree のみ**（ADR-004）· SLIR 直接読まない |
| 禁止 | 差分再計算 · Matching · 内容理解 · AI 判断 |
| 色 / UI 状態 | Renderer 内部責務 · Delta Tree に保存しない |
| UX | 原本再現ではなく **変更点だけ確認** · Changed First |
| Conflict / Move / Cell Diff | Product / UI / ADR-004 どおり Phase1 禁止 |
| Export | 本 ADR 外（案 ADR-008） |

### UX 北極星

> Delta Tree を、人間が短時間で確認できる形へ変換する。  
> 左右に Word を並べるビューアが目的ではない。

---

## コピペ用（以下をそのまま投入）

````text
# Smart Diff
# ADR-007 Renderer Architecture v0.1 作成指示

## Role

あなたは Smart Diff Document Difference Engine の Principal Architect です。

以下ADRを前提として、
Renderer Architectureを設計してください。

- ADR-002 SLIR Schema v0.1
- ADR-003 Matcher Engine v0.1
- ADR-004 Delta Tree v0.1
- ADR-005 Parser Architecture v0.1
- ADR-006 Normalizer Architecture v0.1

**採番注意:** リポジトリで ADR-005 が Renderer 欠落の場合、本作業を Renderer Architecture として書き、
番号（005 vs 007）衝突を冒頭 Open Question に残す。勝手に Accepted ADR-002〜004 を書き換えない。

目的:

Delta Treeを、
実務者が短時間で確認できる表示へ変換する
Renderer層の責務を定義する。

左右にWordを並べるビューア再現が目的ではない。変更点だけ読む体験を優先する。

前提正本（あれば）:

- docs/architecture/adr/ADR-002-slir-schema.md
- docs/architecture/adr/ADR-003-matcher-engine.md
- docs/architecture/adr/ADR-004-delta-tree-model.md
- docs/notes/smart-diff/UI_CONSTITUTION.md
- docs/notes/smart-diff/PRODUCT_CONSTITUTION.md
- docs/notes/smart-diff/ARCHITECTURE.md
- docs/prompts/smart-diff-adr-005-parser-architecture-COPYPASTE.md
- docs/prompts/smart-diff-adr-006-normalizer-architecture-COPYPASTE.md

---

# 1. Renderer責務

入力:

Delta Tree


出力:

User Interface Representation


Rendererは、

「何が変わったか」

を伝える。


---

# 2. 絶対禁止

Rendererが判断してはいけない。


禁止:

- SLIR直接解析
- 差分再計算
- Node Matching
- 内容理解
- AI判断


理由:

表示層と比較ロジックを分離するため。


---

# 3. Architecture

構造:


Delta Tree

↓

View Model Adapter

↓

Renderer

↓

UI


---

# 4. Primary UX Principle

Smart Diffの価値:


全文を読む時間を減らす。


したがって初期表示は:


Changed First


とする。


優先順位:


1 Modified
2 Added
3 Deleted
4 Unchanged


---

# 5. Display Modes

Phase1:


## Review Mode


目的:

変更確認。


表示:


変更あり部分中心。


---

## Context Mode


目的:

前後文脈確認。


表示:


変更周辺のみ。


---

禁止:

Word完全比較ビュー再現。


---

# 6. ChangeKind表示

Delta Tree:

Added

Deleted

Modified


を表示。


ただし:

UI名称は利用者向けに変換可能。


例:


Added

↓

追加


Deleted

↓

削除


Modified

↓

変更


---

# 7. Candidate Match表示

MATCH_CANDIDATEの場合。


禁止:

勝手に変更確定。


表示:


「同一候補」

など。


ユーザーへ不確実性を伝える。


（ADR-004 の confidence:"candidate" と整合。Deleted+Added 強制禁止。）


---

# 8. Text Diff Rendering

TextDeltaを表示。


原則:

意味単位。


禁止:

1文字単位の大量ハイライト。


diff-match-patch結果は、

Semantic Cleanup後利用。


---

# 9. Style Change Rendering

本文変更と分離。


例:


本文:

変更なし


書式:

太字化


表示:

書式変更


として扱える設計。


---

# 10. Annotation Rendering

Annotation変更。


本文変更と混同禁止。


例:


本文:

変更なし


コメント:

追加


として表示。


---

# 11. Table Rendering

Product Constitution準拠。


Phase1:


Table changed


まで。


禁止:

Cell単位表示。


---

# 12. Layout Principle

採用:


比較対象:

Document A

Document B


ただし、

左右完全同期コピーではない。


理由:

ユーザー目的は閲覧比較ではなく、

変更確認。


---

# 13. Navigation

必要機能:


- 次の変更へ移動
- 前の変更へ移動
- 変更一覧


ただし:

Delta Treeを基準にする。


---

# 14. Performance

ブラウザローカル。


要求:

- 大規模文書対応
- Virtual Rendering
- Worker連携可能


---

# 15. Accessibility

考慮:


色だけで変更を表現しない。


必須:


- Icon
- Label
- Text


---

# 16. Export連携

RendererはExportしない。


Exportは別ADR。


Renderer:

表示のみ。


---

# 17. ADR構成


# ADR-007 Renderer Architecture v0.1


## Status

Draft


## Context


## Decision


## Rendering Pipeline


## Display Mode


## Change Visualization


## Accessibility


## Performance


## Non Goals


## Rejected Alternatives


## Open Questions


---

# 18. Rejected Alternatives


Rejected:

- SLIR直接Renderer
- Pixel Diff UI
- Word Compare完全再現
- 色だけによる差分表現
- UI状態をDelta Treeへ保存


---

# 出力

保存先:

docs/architecture/ADR-007-Renderer-Architecture-v0.1.md


Markdown。

実装前Architecture Decision Record品質で作成。

コードは書かない。採番衝突は Open Questions。
````

---

## 基本 Architecture 像（プロンプト列）

```text
DOCX / PDF / HTML / MD
  → Parser（案 005）
  → Normalizer（案 006）
  → SLIR（002 Accepted）
  → Matcher（003 Accepted）
  → Delta Tree（004 Accepted）
  → Renderer（案 007 / 現状一覧では 005 欠落）
  → Export（案 008 · 次）
```

次プロンプト案: **Export** — Redline PDF · 比較結果 PDF · 印刷 · pdf-lib · 確認用と提出用の分離。

## 関連

| 用途 | パス |
|------|------|
| Delta 正本（入力契約） | [`../architecture/adr/ADR-004-delta-tree-model.md`](../architecture/adr/ADR-004-delta-tree-model.md) |
| UI Constitution | [`../notes/smart-diff/UI_CONSTITUTION.md`](../notes/smart-diff/UI_CONSTITUTION.md) |
| Architecture 入口 | [`../notes/smart-diff/ARCHITECTURE.md`](../notes/smart-diff/ARCHITECTURE.md) |
