# Cursor Task: ADR-002 SLIR Schema v0.1 作成（Proposed Draft）

**用途:** Cursor 投入用 COPYPASTE  
**成果物パス:** `docs/architecture/slir/`  
**Status:** Proposed のみ · Accepted 変更禁止  
**親プロンプト:** [`smart-diff-adr-002-slir-schema-CURSOR-PROMPT.md`](smart-diff-adr-002-slir-schema-CURSOR-PROMPT.md)（Final Validation 含む）

**作成後:** レビュー → Accepted 化は Board 判断。本 Agent は Accepted を自動昇格しない。

---

# 以下を Cursor に投入

```text
# Task

Smart Diff SLIR Schema v0.1（ADR-002）を作成してください。

対象：
docs/architecture/slir/

目的：
Smart Diffの中間表現（SLIR）の正本を定義する。

これは実装仕様ではなく、
Parser / Matcher / Delta / Renderer の境界を固定するArchitecture Decision Recordである。

---

# 作成ルール

必ず以下を守る。

## 1. Existing Acceptedを変更しない

既存のAccepted Architecture Documentは変更禁止。

今回作成するものは Proposed Draft。

既存決定との矛盾がある場合：

- 無断修正しない
- Open Questionへ送る
- ADR本文で理由を書く

リポジトリ参照：
- Accepted: docs/architecture/adr/ADR-002-slir-schema.md（TextSpan · TextRun Node 非公開）
- 本成果は Proposed。TextRun 採用は Accepted との差分を明示すること。

---

# ADR Header

以下形式。

ADR-002

Title:
Smart Diff SLIR Schema v0.1

Status:
Proposed

Date:

Decision Makers:

Related:

* Product Constitution
* ADR-001 Origin Metadata Isolation（リポジトリ正本名）
* ADR-003 Matcher Engine（予定 / Accepted ありなら参照のみ）

---

# Context

以下を書く。

Smart Diffでは、

DOCX
PDF
HTML
Markdown

など異なる形式を比較する必要がある。

各形式には固有問題がある。

DOCX:
- XML構造
- Style
- Run

PDF:
- 座標中心
- Paragraph概念なし

HTML:
- DOM Tree

Markdown:
- AST

これらを直接比較すると、
形式依存になる。

そのため、

Parser
 ↓
Normalizer
 ↓
SLIR
 ↓
Matcher/Diff
 ↓
Delta Tree

という中間表現を導入する。

---

# Decision

## SLIR Definition

SLIR:

Smart Diff Logical Intermediate Representation
（別名表記: Smart Logical Intermediate Representation も可。本文で統一すること）

定義：

「文書形式ではなく、人間が確認する意味構造を比較するための中間表現」

---

# Design Principle

以下7項目を定義。

## P1 Semantic First

表示ではなく意味単位を優先。

---

## P2 Parser Independence

Parser固有構造を持ち込まない。

---

## P3 Deterministic Normalization

同じ入力は同じSLIRになる。

---

## P4 Comparison Ready

Diff Engineが比較可能な粒度を保持。

---

## P5 Loss Aware

完全復元できない情報は明示する。

---

## P6 Origin Isolation

元ファイル情報とSLIR情報を分離する。

---

## P7 Renderer Independence

表示都合をSLIRへ入れない。

---

# Node Schema

以下を定義。

## DocumentNode

役割：
Root

Fields:

- id
- metadata
- sourceFormat
- originMetadata


---

## HeadingNode

Fields:

- level
- text


---

## ParagraphNode

Fields:

- children
- semanticRole(optional)


---

## TextRunNode

採用理由を必ず記載。

注意：

Word XMLの<w:r>コピーではない。

目的：

- text変更
- style変更

を区別可能にするため。


Fields:

- text
- styleMetadata


---

## ListNode

Fields:

- ordered
- level
- children


---

## TableNode

重要。

Phase1ではAtomic扱い。

保持：

- table metadata
- extracted text summary

禁止：

- TableRowNode
- TableCellNode

理由：

Product ConstitutionでTable DiffはPhase2。

---

## ImageNode

Fields:

- metadata
- boundingBox(optional)


---

## Annotation

独立Node禁止。

Attach型。

理由：

本文変更とコメント変更を混同しない。


---

# Identity Boundary

重要。

SLIRではStable ID問題を解決しない。

禁止：

Path Based ID

理由：

挿入で後続Nodeが変更される。

禁止：

Random UUID only

理由：

再Parse時に全変更になる。


Matcher責務：

Identity Scoreによる推定。

ADR-003へ分離。

---

# Loss Aware Model

定義。

例：

PDF:

confidence:
0.72

loss:
reading_order_uncertain
table_structure_missing

Parser推測情報と
元データ情報を混在させない。

---

# OSS Reference

参考として記載。

## DOCX

- mammoth.js
- docx-preview
- JSZip + OpenXML

採用判断：

SLIR生成はBuild。

---

## PDF

- pdf.js

採用。

---

## Markdown

- remark
- mdast


---

## Text Diff

- google diff-match-patch


---

## Tree Matching

参考：

- GumTree

ただし採用決定ではない。


---

# Out of Scope

明記。

## Phase1対象外

- Table Cell Diff
- Move Detection
- Semantic AI Diff
- Track Changes完全対応
- Renderer仕様
- Export仕様


---

# Open Questions

以下を残す。

## OQ-001

Identity Score詳細。

ADR-003へ。

---

## OQ-002

Candidate Match状態。

ADR-003へ。

---

## OQ-003

DOCX Track Changes対応。

Product判断待ち。


---

# Rejected Alternatives

必ず記載。

## Path Based Stable ID

Rejected

理由：

位置変更に弱い。


## Parser Output直接比較

Rejected

理由：

形式依存。


## PDF座標中心SLIR

Rejected

理由：

意味構造比較にならない。


---

# Final Validation（分類）

ADR-002で確定: Node Boundary · TextRun理由 · Identity責務境界のみ
ADR-003へ: Score詳細 · Candidate UI · 閾値 · Move · GumTree
Productへ: Track Changes（Metadata候補記載のみ）

---

# 完成条件

レビュー者が以下を判断できる状態。

- SLIRに何を入れるか
- SLIRに何を入れないか
- Parser責務
- Matcher責務
- Delta責務

が明確。

コードは禁止。

設計文書のみ作成。

Accepted docs/architecture/adr/ADR-002-slir-schema.md は変更しない。
```
