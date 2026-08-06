# Cursor Task: ADR-004 Delta Tree Schema v0.1 作成

**用途:** Cursor 投入用 COPYPASTE  
**成果物パス:** `docs/architecture/delta/`  
**Status:** Proposed のみ · Accepted [`docs/architecture/adr/ADR-004-delta-tree-model.md`](../architecture/adr/ADR-004-delta-tree-model.md) 変更禁止  
**依存:** Matcher ADR-003（Candidate）· UI ChangeKind · Renderer は表示のみ

---

# 以下を Cursor に投入

```text
# Task

Smart Diff ADR-004
Delta Tree Schema v0.1

を作成してください。

対象:
docs/architecture/delta/

目的:

Matcher Engineの結果を、
ユーザー確認可能な差分モデルへ変換する
Delta Treeの責務とSchemaを定義する。

これはRenderer仕様ではない。

Delta Treeは、

「何が変わったか」

を表現する中間モデルである。

既存Accepted docs/architecture/adr/ADR-004-delta-tree-model.md は変更しない。
矛盾は Open Question / 差分表へ。

---

# Architecture Flow

以下を前提とする。

Parser
 ↓
Normalizer
 ↓
SLIR
 ↓
Matcher
 ↓
Delta Tree
 ↓
Renderer


責務:

SLIR:
比較対象の意味構造

Matcher:
同一性推定

Delta Tree:
変更状態表現

Renderer:
表示


---

# Existing Decisions

## ChangeKind

基本状態:

- Added
- Deleted
- Modified


以下は禁止:

- Conflict
- Auto Merge


理由:

Smart Diffは変更確認ツールであり、
編集統合ツールではない。

---

# Delta Tree Definition

Delta Tree:

Before SLIR と After SLIR の関係を保持する。

目的:

RendererがSLIR比較ロジックを知らずに、
差分結果だけを描画できるようにする。

---

# Delta Node

定義する。

基本構造:

DeltaNode

fields:

- id
- changeKind
- beforeNodeReference
- afterNodeReference
- children
- metadata


---

# ChangeKind Definition

## Unchanged

定義:

変更なし。

注意:

Rendererでは通常非表示。

ただしContext表示用に保持可能。


---

## Added

定義:

After側に存在し、
Before側に対応Nodeが存在しない。


---

## Deleted

定義:

Before側に存在し、
After側に対応Nodeが存在しない。


---

## Modified

定義:

Matcherにより同一Nodeと判断され、
内容または属性が変化した状態。


例:

Paragraph:

旧:
株式会社ABC

新:
株式会社XYZ


---

# Candidate Match

重要。

ADR-003から受け取る。

60-84 Score。

ADR-004では以下だけ定義。

Candidate状態を保持可能。

ただし：

- 自動的にModified化しない
- 自動的にAdded+Deleted化しない

具体的なUX表現はRenderer側で決定。

（Acceptedが confidence:candidate の場合は差分表で接続。kindにCandidateを載せるかはBoard。）

---

# TextRun変更

TextRun採用による影響を定義。

区別:

1.
Text変更

2.
Style変更

3.
Text + Style変更


ただしChangeKindは増やさない。

例:

Style変更:

Modified

metadata:

changeDetail:
style_only


理由:

Added/Deleted/Modifiedの単純モデルを維持するため。


---

# Annotation変更

重要。

Annotationは本文Nodeと分離。

例:

本文:
Unchanged

Comment:
Added


として表現する。

禁止:

本文ParagraphをModified扱いする。


---

# Table

Phase1:

TableNode Atomic。

表現:

TableNode

changeKind:

Modified


metadata:

changeDetail:
table_changed


禁止:

Cell Delta


理由:

Table Diff Phase2。


---

# Delta Tree Example

例を記載。

Before:

Document
 └ Paragraph
      A


After:

Document
 └ Paragraph
      B


Result:

DocumentDelta
 └ Modified ParagraphDelta


---

# Renderer Boundary

Delta Treeが提供するもの:

- changed node
- relationship
- change metadata


提供しないもの:

- color
- layout
- animation
- UI state


---

# Export Boundary

禁止:

Delta TreeがPDF生成情報を持つ。

理由:

Renderer/Exporter責務。


---

# Phase1 Scope

対応:

- Heading
- Paragraph
- TextRun
- List
- Image
- Table Atomic
- Annotation


---

# Out of Scope

禁止:

- Merge
- Accept/Reject workflow
- Move Detection
- Cell-level Table Diff
- Semantic AI explanation


---

# Open Questions

## OQ-001

Candidate Match UI

Renderer ADRへ。


## OQ-002

ChangeDetail metadata粒度

実データ評価後調整。


## OQ-003

Move Detection

Phase2。


---

# Rejected Alternatives

## ChangeKindを増やす

Rejected:

例:

StyleChanged
Moved
Conflict

理由:

ユーザー理解コスト増加。


---

## Delta TreeでUI状態管理

Rejected:

Renderer責務侵害。


---

# Output Rule

ADR形式。

コード禁止。

Schema定義と責務境界のみ。

実装方法を書かない。

docs/architecture/delta/ に ADR と delta-tree-schema.md を更新。
通し検証サンプルがあれば接続を維持。
```
