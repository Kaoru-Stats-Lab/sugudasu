# Cursor Task: ADR-003 Matcher Engine / Stable Identity Design v0.1 作成

**用途:** Cursor 投入用 COPYPASTE  
**成果物パス:** `docs/architecture/matcher/`（※投入文の `slir/` は誤り · Matcher Pack）  
**Status:** Proposed のみ · Accepted [`docs/architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md) 変更禁止  
**依存:** SLIR Proposed / Accepted · Candidate UX は ADR-004

**Score 正本:** Heading 30 · Context 25 · Text 30 · Position 15 · 閾値 ≥85 / 60–84 / &lt;60（二重定義禁止）

---

# 以下を Cursor に投入

```text
# Task

Smart Diff ADR-003
Matcher Engine / Stable Identity Design v0.1

を作成してください。

対象:
docs/architecture/matcher/

目的:

SLIR Node Tree間で、
「同じ意味単位が変化したもの」
を認識するMatcher Engineの責務と設計境界を定義する。

これはDiff Algorithm実装仕様ではない。

Architecture Decision Recordとして、
Matcherが何を判断し、
何を判断しないかを固定する。

既存Accepted docs/architecture/adr/ADR-003-matcher-engine.md は変更しない。
矛盾は Open Question / 差分表へ。

---

# Existing Decision

必ず以下を前提にする。

## SLIR

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

MatcherはSLIRとDelta Treeの間に存在する。

---

# Important Constraint

Stable ID問題について：

## Reject

### Path Based ID

例:

1
1.2
1.2.4

理由:

文書途中への挿入で後続NodeのIDが変化する。

変更されていないNodeがModified扱いになる。

---

### Random UUID Only

理由:

同じ文書を再Parseすると、
全Nodeが別IDになる。

---

# Decision

Stable Identityは、

SLIR Node自身が固定IDを持つ問題ではなく、

Matcher Engineが比較時に推定する問題

として扱う。

---

# Matcher Responsibility

Matcherは以下を担当する。

## Input

Before SLIR

After SLIR


## Output

Node Relationship

例:

Same

Modified Candidate

Added

Deleted


---

# Matcher Does NOT Do

禁止:

- UI表示判断
- Redline生成
- Accept/Reject管理
- Renderer制御
- AI意味理解
- OCR補正


---

# Identity Score

正式化する。

以下を採用候補としてADR化する。

Total 100 points

|項目|Score|
|-|-:|
|Heading similarity|30|
|Context similarity|25|
|Text similarity|30|
|Position proximity|15|

合計:

100

リポジトリにAccepted ADR-003がある場合、数値は一致させ第二正本を作らない。

---

# Threshold

定義。

## >=85

Same Node

意味:

同一Nodeが変更された可能性が高い。


## 60-84

Candidate Match

意味:

同一候補だが確信不足。


## <60

Different Node

意味:

別Node。


---

# Candidate Match

重要。

この扱いは未確定。

ADRでは以下を記載。

候補状態は存在する。

しかし、

- Delta Treeでどう表現するか
- UIで表示するか
- 自動確定するか

はADR-004 Delta Treeで決定する。

禁止: Candidateを自動Deleted+Addedへ変換する決定を本ADRでしない（原則禁止は記載可）。

---

# Matching Features

各Score項目を定義する。

## Heading Similarity

利用:

- heading level
- normalized text


---

## Context Similarity

利用:

前後Node情報。

目的:

同じ文章位置に存在するか判断。


---

## Text Similarity

利用:

TextRun / Paragraph text

参考:

google diff-match-patch

---

## Position Proximity

利用:

Document order

ただし：

位置は補助情報。

Identityの主情報ではない。

---

# Algorithm Reference

OSS/Research Referenceとして記載。

## Text

google diff-match-patch

用途:

TextRun内比較。


---

## Sequence Alignment

参考:

Myers Diff

Patience Diff

用途:

Node列アライメント。


---

## Tree Matching

参考:

GumTree Algorithm

用途:

将来の構造比較。

Phase1では採用判断しない。


---

# Matching Flow

ADRに以下を書く。


Example:

Before SLIR

Document
 ├ Heading A
 ├ Paragraph X
 └ Paragraph Y


After SLIR

Document
 ├ Heading A
 ├ Paragraph X'
 └ Paragraph Y


Flow:

1.
Candidate generation

2.
Identity Score calculation

3.
Relationship assignment

4.
Delta Treeへ渡す


---

# ChangeKindとの境界

MatcherではChangeKindを完全決定しない。

理由:

Matcher:
「同じものか」

Delta Tree:
「どう変化したか」

を担当する。


---

# Phase1 Scope

対象:

- Heading
- Paragraph
- TextRun
- List
- Image
- Table Atomic


---

# Phase1 Out of Scope

禁止:

- Move Detection
- Table Cell Matching
- Semantic AI Matching
- Cross-document entity recognition


---

# Open Questions

## OQ-001

Identity Score weight tuning

理由:

実データ評価が必要。


## OQ-002

Candidate Match UX

ADR-004へ。


## OQ-003

Move Detection

Phase2。


---

# Rejected Alternatives

## Hash Only

Rejected

理由:

一文字変更でも別物扱いになる。

例:

株式会社ABC
↓
株式会社XYZ


---

## Position Only

Rejected

理由:

挿入削除に弱い。


---

## AI Semantic Matching

Rejected

理由:

- Local First
- Non Send
- Explainability不足


---

# Output

ADR形式で作成。

コード禁止。

Implementation Detail禁止。

Architecture Decisionとして読める文書にする。

docs/architecture/matcher/ に ADR と必要なら matcher-design.md を更新。
```
