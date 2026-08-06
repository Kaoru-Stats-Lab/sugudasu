# Smart Diff — Matcher Engine Design v0.1 作成指示（COPYPASTE）

**更新:** 2026-08-06  
**種別:** Cursor 投入用 · **実装禁止** · Identity / Score / Candidate を正本化  
**Accepted 正本:** [`../architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md)  
**先行指示:** [`smart-diff-adr-003-matcher-engine-COPYPASTE.md`](smart-diff-adr-003-matcher-engine-COPYPASTE.md)

> **本ファイルはプロンプト保管。** Deep Research / 本プロンプトを「新 Matcher ADR の再発明」にしない。  
> **採番衝突:** 本プロンプトは「ADR-004 Matcher」と呼ぶ。リポジトリでは **ADR-003 = Matcher（Accepted）** · **ADR-004 = Delta Tree（Accepted）**。  
> 次工程「ADR-005 Delta Tree」も Accepted では既に ADR-004。ギャップ埋め・数値ブレ正本化のみ可。UI 表示は Renderer / Delta 側。

### 反映済み重要修正

| 項目 | 方針 |
|------|------|
| Path Based ID | 不採用 |
| Hash Only | 不採用 |
| Identity | Matcher が決定 |
| Identity Score | ADR で正本化（30/30/25/15） |
| Candidate Zone | 未定義のまま残さない |
| Move | Phase 境界を明確化（MVP なし） |
| Candidate → Deleted+Added | **禁止寄り**（Accepted: confidence 保持 · Option B は Reject 候補） |

Accepted ADR-003 では Candidate を `confidence: "candidate"` で保持し Deleted+Added 強制をしない。本プロンプト Option A/B は **Accepted と矛盾しうる** → 書く前に正本を優先し、変更なら差分を列挙。

---

## コピペ用（以下をそのまま投入）

````text
# Smart Diff ADR-004 — Matcher Engine Design v0.1 作成指示

## Role

あなたは Smart Diff の Principal Architect。

ADR-004として、
SLIR Node間のIdentity Matchingを担当する Matcher Engine を設計する。

**採番注意:** リポジトリで Matcher が ADR-003 Accepted・Delta が ADR-004 Accepted の場合、
本作業は「Matcher Engine のギャップ埋め / Score・Candidate の正本確認」とし、
新番号で再発明しない。矛盾は先に列挙。コード実装禁止。

前提正本:

- docs/architecture/adr/ADR-002-slir-schema.md
- docs/architecture/adr/ADR-003-matcher-engine.md
- docs/architecture/adr/ADR-004-delta-tree-model.md
- docs/notes/smart-diff/PRODUCT_CONSTITUTION.md
- docs/notes/smart-diff/UI_CONSTITUTION.md

---

# 目的

Matcher Engineの目的：

「変更された同じ対象」を正しく追跡する。

例：

変更前：

```
第3条
契約期間は1年
```

変更後：

```
第3条
契約期間は2年
```

これは：

Deleted + Added

ではなく：

Modified

として扱う。

（Modified の最終表現は Delta Tree。Matcher は Identity Map / Match Map のみ。）

---

# 前提

## Stable ID

採用しない：

* Path Based ID
* Position ID
* Full Content Hash

理由：

### Path Based

挿入削除で全体がChanged化する。

### Hash

内容変更するとIdentity消失。

---

# Identity責務

SLIR：

Node情報を提供。

Matcher：

Identityを決定。

---

# Architecture

定義：

```
SLIR Tree A

↓

Matcher Engine

↓

Identity Map（Match Map）

↓

Delta Tree生成
```

Matcher自身はDeltaを作らない。UI判断しない。

---

# Identity Score v0.1

以下を正本として採用する。

合計100点。

| 要素                | Weight |
| ----------------- | -----: |
| Heading / Label一致 |     30 |
| Text Similarity   |     30 |
| Context一致（前後Node） |     25 |
| 位置近似              |     15 |

合計：

100

（Accepted ADR-003 と同値なら「正本確認」と書く。ブレがあれば差分と推奨を列挙し勝手に改定しないか、改定理由を Intent に書く。）

---

# Score Calculation

例：

同一候補Node：

```
Heading一致 30
Text類似 25
Context一致 20
位置近似 10

Total 85
```

↓

同一Identity候補

---

# Threshold

必ず定義する。

## Strong Match

85以上

扱い：

Same Identity

---

## Candidate Zone

60〜84

扱い：

自動確定しない。

以下のどちらかを選択しADRで決定する。

Option A:

Delta Treeへ

```
Uncertain Match / confidence: candidate
```

として保持。

Option B:

Added + Deleted

として扱う。

ただしユーザーへ曖昧性を隠さない。

**推奨 / Accepted 整合:** Option A。Option B は誤差分で確認作業を増やすため原則 Reject（Smart Diff 北極星に反する）。

---

## Weak Match

59以下

扱い：

別Node。

---

# Text Matching

利用候補：

* diff-match-patch
* LCS
* token similarity

用途：

InlineText / TextSpan 内部の Similarity。

禁止：

全文書単位Hash比較。

最終文字ハイライトは Delta / Renderer 責務。

---

# Structural Matching

優先順位：

1. Heading
2. Section位置
3. Paragraph Context
4. Text Similarity
5. Spatial情報(PDFの場合 · origin 生比較ではなく Score 特徴)

---

# Context Window

定義する。

例：

Previous Node / Current Node / Next Node

理由：

同じ文章が複数存在する場合の識別。

---

# Move Detection

Phase境界を定義する。

MVP：

Move Detectionなし。

理由：

追加・削除・変更を正確にすることを優先。

Phase2：

Move Detection追加。

候補：Patience Diff · Histogram Diff · Tree Alignment

---

# Annotation Handling

Annotation追加：本文Modifiedではない。

本文 Unchanged + Comment Added として分離。

---

# Style Change Handling

推奨：B

A. Modified Text Attribute  
B. Text Content Unchanged + Style Change Metadata  

理由：文字内容変更と装飾変更を分離（Delta の changeReason:style と整合）。

---

# Table Handling

MVP：TableBlock単位。Same / Changed まで。Cell単位Matcher禁止。

---

# Matcher Output

出力：Identity Map / Match Map のみ。

例：Before Node A = After Node B

Delta Treeは次層（Accepted ADR-004）。

---

# Rejected Alternatives

必ず記載。

## UUID毎回生成 — 比較不能
## Content Hash Identity — 内容変更時Identity消失
## Path Based Identity — 位置変更に弱い
## AI Semantic Matching — 決定性不足
## Candidate の Deleted+Added 強制（推奨 Reject）

---

# OSS Reference

参考（依存しない）:

* Google diff-match-patch
* Git Histogram Diff
* Git Patience Diff
* GumTree AST Diff

---

# Open Questions

残す。

1. Candidate Zone UI表示方法（→ Renderer）
2. Identity Score閾値調整（Pilot 判例後）
3. 日本語類似度改善
4. 表Phase2設計
5. Move Detection追加条件
6. 本プロンプト番号と Accepted ADR-003 の関係

---

# 完了条件

□ Stable ID問題解決
□ Identity Score正本化
□ Candidate Zone定義済み（未定義のまま残さない）
□ Delta Tree責務分離
□ Table Phase2維持
□ AI依存なし
□ 決定性あり
□ Accepted 正本との差分を明示した（再発明していない）

次は **Delta Tree Design**（Added/Deleted/Modified/Style/Annotation/Confidence）。
リポジトリに Accepted ADR-004 がある場合は再発明せずギャップのみ。HCI 価値の中心はここ。
````

---

## 関連

| 用途 | パス |
|------|------|
| Matcher 正本 | [`../architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md) |
| Delta 正本 | [`../architecture/adr/ADR-004-delta-tree-model.md`](../architecture/adr/ADR-004-delta-tree-model.md) |
| 先行 Matcher 指示 | [`smart-diff-adr-003-matcher-engine-COPYPASTE.md`](smart-diff-adr-003-matcher-engine-COPYPASTE.md) |
| Normalizer 指示（003 呼称） | [`smart-diff-adr-003-normalizer-design-COPYPASTE.md`](smart-diff-adr-003-normalizer-design-COPYPASTE.md) |
