# Cursor Task: Smart Diff SLIR Schema v0.1（ADR-002）作成プロンプト

**用途:** Cursor 投入用 COPYPASTE（設計文書生成 · **実装禁止**）  
**更新:** 2026-08-06  
**意図:** レビュー矛盾を潰したうえで ADR-002 を生成する。Schema のいきなり実装はしない。  
**追記:** Final Validation（002確定 / 003送り / Product戻し）· Output Rule（Design Document · コード禁止）。

## 既存資産（上書き注意）

| 種別 | パス | 扱い |
|------|------|------|
| **Accepted 正本** | [`docs/architecture/adr/ADR-002-slir-schema.md`](../architecture/adr/ADR-002-slir-schema.md) | **勝手に置換禁止** · Board 承認後のみ |
| Proposed Pack | [`docs/architecture/slir/`](../architecture/slir/) | 再生成時は差分を明示 · TextRun 等は Board 再審 |
| Identity Score 正本 | [`docs/architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md) | Score 数値は ADR-003 と **二重定義しない**（本プロンプトの推奨値は 003 と一致） |

## 固定条件（必須）

- Stable ID は **Path Based 禁止**（UUID 毎回も禁止）
- **TextRun 復活**は ADR 本文に理由を書く（Word XML コピーではない）
- Table は **Atomic Node（MVP）** · Row/Cell Diff 対象にしない
- **Track Changes** は未決定スコープ（勝手に決めるな）
- Identity Score は仮数値ではなく **ADR 化**（詳細正本は Matcher ADR）
- OSS は参考 · **SLIR 自体は SUGUDASU 独自モデル**
- 参考: google diff-match-patch / mdast / pdf.js / OpenXML 構造
- **Parser 内部モデルと SLIR を混同しない**

## 推奨工程順（本プロンプトの後）

```text
ADR-002 SLIR Schema v0.1
  ↓
ADR-003 Matcher Engine / Stable Identity
  ↓
ADR-004 Delta Tree Schema
  ↓
ADR-005 Parser Architecture   ← Architecture 採番では Parser=007 の場合あり
  ↓
ADR-006 Renderer Architecture ← Architecture では Renderer=005 · Export=006 あり
```

**先に Parser を作ると危険。** SLIR → Matcher → Delta を先に固定する。

（Architecture 一覧の実番号は [`docs/notes/smart-diff/ARCHITECTURE.md`](../notes/smart-diff/ARCHITECTURE.md) を正とする。）

---

# 以下を Cursor に投入

```text
# Role

あなたは Document Difference Engine（Smart Diff）の
Software Architect / Information Architecture Designer です。

目的はコードを書くことではありません。

Smart Diff の中核となる
「SLIR（Smart Logical Intermediate Representation）Schema v0.1」
の設計文書 ADR-002 を作成してください。

この文書は今後10年間維持する中間表現の正本になります。

---

# Product Context

Smart Diff は SUGUDASU の Document Difference Engine。

目的：

「変更点を示すことで、確認作業そのものを短縮する」

比較対象：

- DOCX
- PDF
- HTML
- Markdown

入力形式が異なっても、
ユーザーが理解する意味単位で比較できることを目的とする。

SLIRは表示用モデルではない。

禁止：

- Renderer都合のモデル化
- PDF座標中心のモデル化
- Word XMLそのもののコピー
- Parser内部構造の露出

SLIRは：

Parser
 ↓
Normalizer
 ↓
SLIR
 ↓
Diff Engine
 ↓
Delta Tree
 ↓
Renderer

という中間層。

---

# Existing ADR / Constitutionとの整合条件

必ず以下を守る。

## 判定順

Persona
 ↓
Pain
 ↓
Market
 ↓
Function

## Product Principles

- Local First
- Non Send
- Practical 3 minutes
- Change visibility first
- No unnecessary AI

---

# 重要な過去決定

## 1. Stable ID

過去案：

Path Based ID

例：

1
1.2
1.2.4

これは却下。

理由：

文書途中への挿入で後続Node全体のIDが変化するため。

UUID完全ランダム方式も却下。

理由：

同一文書を再Parseすると全Node Changedになる。

採用方針：

Stable IDはSLIR Node自身が固定保持するものではなく、

Matcher Engine が比較時に

Identity Score

によって候補Nodeを推定する。

SLIR v0.1では以下を定義する。

- node_id
- origin_id
- matcher metadata

を分離する。

---

# Identity Score

Stable matching用。

以下をADR内で正式化する。

候補：

Heading一致
Context一致
Position近似
Text Similarity

ただし、

文書17
文書19

で数字が違っているため、
必ず1つに統一する。

推奨：

Heading 30
Context 25
Text Similarity 30
Position 15

合計100

Threshold：

>=85 : Same Node
60-84 : Candidate Match
<60 : Different Node

ただし、

Candidate Matchの扱いはDelta Tree ADRで継続検討。

※ リポジトリに Accepted ADR-003 がある場合、Score 正本はそちらと一致させ、本 ADR は接続情報に留めること。Accepted ADR-002 がある場合は上書きせず Proposed 差分を明示すること。

---

# Node設計

## Root

DocumentNode

保持：

- document metadata
- source format
- parser information

---

## Block Layer

採用：

HeadingNode

ParagraphNode

ListNode

TableNode

ImageNode


---

# Tableについて

重要。

Product Constitutionでは：

Non Target:
Table Diff Phase2

である。

したがってSLIR v0.1では：

採用：

TableNode

のみ。

禁止：

TableRowNode
TableCellNode

をDiff対象Nodeとして定義しない。

理由：

SLIRが将来拡張可能であることと、
MVPでTable Diffを提供することは別。

Phase1：

「表が変更された」

まで。

Phase2：

Cell単位比較。

---

# TextRunについて

過去：

「Paragraph → Textで十分」
「RunはParser内部吸収」

という判断があった。

しかしDeep Researchにより、

DOCXでは

<w:r>

が

- style変更
- text変更

を区別する重要単位

であることが判明。

よってTextRunを復活する。

ただし必ずADR本文に理由を書く。

方針：

SLIRでは意味単位として保持する。

Word XML依存ではない。

例：

ParagraphNode
 └ TextRunNode
       ├ text
       ├ style

---

# Annotation

Commentは独立Node禁止。

採用：

Annotation

として他NodeにAttach。

理由：

本文変更とコメント追加を混同しないため。

---

# Loss Aware

PDFなど構造欠落形式では、

完全な意味構造復元を保証しない。

必須：

confidence

lossMetadata

を保持。

例：

PDFの場合：

paragraph detected confidence: 0.72

など。

Parserが推測した構造と、
元ファイルに存在した構造を分離する。

---

# OSS Reference

設計時に以下を参考にする。

## DOCX

参考：

mammoth.js

docx-preview

JSZip + OpenXML DOM

ただし：

SLIR生成は独自実装。

---

## PDF

参考：

pdf.js

用途：

text extraction
bounding box

---

## Markdown

参考：

remark / mdast

---

## Text Diff

参考：

google diff-match-patch

用途：

TextRun内部比較。

---

## Tree Diff

参考：

GumTree Algorithm

ただし：

そのまま採用しない。

SLIR向けMatcherを設計する。

---

# ADR-002 出力形式

以下の章構成で作成。

## ADR-002 SLIR Schema v0.1

1. Status

2. Context

3. Decision

4. Design Principles

5. Node Schema

6. Identity / Matching Boundary

7. Parser Boundary

8. Normalization Rules

9. Loss Aware Handling

10. Phase1 Scope

11. Phase2 Future Extension

12. Rejected Alternatives

13. Open Questions


---

# 禁止事項

以下は禁止。

- 実装コードを書く
- React設計を書く
- Renderer設計を書く
- UI仕様を書く
- Table Cell DiffをMVP扱いする
- Track Changes対応を勝手に決定する
- AI Semantic Diffを追加する

---

# 完成条件

読んだエンジニアが、

「何をSLIRに入れるか」
「何を入れないか」
「どこから先がDiff Engine責務か」

を迷わない状態にする。

Smart Diffの技術的憲法として成立する文書を作成する。

---

# Final Validation Before ADR-002 Generation

ADR-002 SLIR Schema v0.1を生成する前に、
以下の論点を分類してください。

## ADR-002で確定するもの

### A. SLIR Node Boundary

確定：

- DocumentNode
- HeadingNode
- ParagraphNode
- TextRunNode
- ListNode
- TableNode
- ImageNode
- Annotation

ただし：

TableRow / TableCell はPhase1 SLIR Nodeとして定義しない。

---

### B. TextRun復活理由

ADR本文に必ず記載する。

理由：

以前はParagraph→Textのみで十分と判断した。

しかしDOCX比較では、

- style変更
- text変更

を区別する必要があり、
Parser内部情報として破棄すると将来的なDiff品質を制限する。

よって、

「Word XML構造を持ち込むためではなく、
比較粒度を保持するため」

TextRunを採用する。

---

### C. Stable Identity Boundary

ADR-002ではMatcher Algorithmを決めない。

定義するのは責務境界のみ。

SLIR:

保持するもの
- node identity metadata
- origin metadata
- normalization metadata

保持しないもの
- similarity score
- matching decision
- candidate judgement

これらはADR-003 Matcher Engineで扱う。

---

## ADR-003へ送るもの

以下はOpen Questionとして残す。

1. Identity Score詳細

2. Candidate Match 60-84のUI扱い

3. Same Node判定閾値

4. Move Detection

5. GumTree系Tree Matching採用可否

---

## Product判断へ戻すもの

以下はADR-002で勝手に決定しない。

### Track Changes

DOCXの<w:ins>, <w:del>対応。

扱い：

未決定。

理由：

Product Constitutionで対象範囲未定義。

ADR-002では

「Parserが保持可能なMetadata候補」

として記載するだけ。

---

# Output Rule

ADR-002は

Design Document

として作成する。

Implementation Planではない。

コードは禁止。
```

---

## 投入前チェック（本追記の意図）

| 分類 | 扱い |
|------|------|
| Node Boundary · TextRun 理由 · Identity 責務境界 | **ADR-002 で確定** |
| Score 詳細 · Candidate UI · 閾値運用 · Move · GumTree | **ADR-003 へ送る** |
| Track Changes | **Product 判断へ戻す**（Metadata 候補記載のみ） |

## 投入後の推奨チェック

生成物が次を満たすか:

- [ ] Path ID / UUID-as-Identity を採用していない
- [ ] TextRun 復活理由が本文にある
- [ ] Table Atomic · Cell Diff MVP なし
- [ ] Track Changes を未決定のままにしている（勝手決定していない）
- [ ] Identity Score / Candidate 判定を ADR-002 に閉じ込めていない（境界のみ）
- [ ] Identity Score 数値が ADR-003 と矛盾する二重正本になっていない
- [ ] Parser 内部 ≠ SLIR
- [ ] Accepted を黙って上書きしていない
- [ ] Design Document であり Implementation Plan / コードではない
