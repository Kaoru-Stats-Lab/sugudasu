# Smart Diff — ADR-006 Normalizer Architecture v0.1 作成指示（COPYPASTE）

**更新:** 2026-08-06  
**種別:** Cursor / 外部 AI 投入用プロンプト  
**前提 Accepted:** [`ADR-002`](../architecture/adr/ADR-002-slir-schema.md) · [`ADR-003`](../architecture/adr/ADR-003-matcher-engine.md) · [`ADR-004`](../architecture/adr/ADR-004-delta-tree-model.md)  
**Parser 指示（未実体）:** [`smart-diff-adr-005-parser-architecture-COPYPASTE.md`](smart-diff-adr-005-parser-architecture-COPYPASTE.md)

> **本ファイルはプロンプト保管。** Accepted ADR を勝手に上書きしない。未決は Open Questions。  
> **採番衝突（要 Board）:** Architecture 一覧の ADR-005 は Renderer 欠落。プロンプト列は ADR-005 Parser → **ADR-006 Normalizer** → ADR-007 Renderer 案。番号確定前に実体を `adr/` へ Accepted 化しないこと。

### 固定事項（過去議論 · 正本と整合させる）

| 項目 | 方針 |
|------|------|
| TextRun | SLIR Node にしない · Text / TextSpan Metadata へ吸収（ADR-002） |
| Path ID | 禁止（Stable Identity は Matcher · ADR-003） |
| Table | Phase1 は Atomic · Row/Cell Node 禁止（Product · ADR-002/004） |
| Loss Aware | 必須 · 破棄せず flag / confidence |
| Renderer 都合 | 混入禁止 |
| Determinism | 時刻・Random UUID・外部 API・AI 推測禁止 |
| 内容改変変換 | 全角半角・旧字体など Diff を歪める変換は禁止 |

### 層の役割（中核）

| 層 | 役割 |
|----|------|
| Parser | 形式固有データを読む |
| **Normalizer** | **比較可能な意味構造へ整える（品質の本丸）** |
| SLIR | 比較対象の正規形 |

---

## コピペ用（以下をそのまま投入）

````text
# Smart Diff
# ADR-006 Normalizer Architecture v0.1 作成指示

## Role

あなたは Smart Diff Document Difference Engine の Principal Architect です。

以下ADRを前提として、
Normalizer Architectureを設計してください。

- ADR-002 SLIR Schema v0.1
- ADR-003 Matcher Engine v0.1
- ADR-004 Delta Tree v0.1
- ADR-005 Parser Architecture v0.1

**採番注意:** リポジトリで ADR-005 が Renderer 欠落の場合、Parser/Normalizer/Renderer の番号衝突を冒頭 Open Question に残す。
勝手に Accepted ADR-002〜004 を書き換えない。矛盾があれば列挙してから書く。

目的:

異なるParser Outputを、
比較可能なCanonical SLIRへ変換する
Normalizer層の責務を定義する。

DOCX比較品質・PDF比較品質の差を吸収する場所である。万能変換・見た目再現が目的ではない。

前提正本（あれば）:

- docs/architecture/adr/ADR-002-slir-schema.md
- docs/architecture/adr/ADR-003-matcher-engine.md
- docs/architecture/adr/ADR-004-delta-tree-model.md
- docs/notes/smart-diff/ADR-001-origin-metadata.md
- docs/notes/smart-diff/PRODUCT_CONSTITUTION.md
- docs/notes/smart-diff/ARCHITECTURE.md
- docs/prompts/smart-diff-adr-005-parser-architecture-COPYPASTE.md

---

# 1. Normalizerの位置づけ

Architecture:

Parser

↓

Parser Output

↓

Normalizer

↓

SLIR

↓

Matcher

↓

Delta Tree


Normalizerは、

Smart Diffの意味構造を決める層

である。

---

# 2. Normalizer責務

担当:

- 構造正規化
- ノード統合
- Metadata整理
- Loss情報付与
- Canonical化


禁止:

- Diff計算
- 同一性判定
- UI判断
- 表示用加工

---

# 3. Canonical Model Principle

同じ意味の文書は、
可能な限り同じSLIRになる。


例:


DOCX:

<w:p>

↓

Paragraph


HTML:

<p>

↓

Paragraph


Markdown:

paragraph node

↓

Paragraph


---

# 4. Node Mapping

基本変換:


Heading

↓

HeadingBlock


Paragraph

↓

ParagraphBlock


List

↓

ListBlock


Text

↓

Text


Image

↓

ImageBlock


Table

↓

TableBlock


（命名は ADR-002 正本の type 名と整合させる。矛盾時は ADR-002 を優先し Open Question に書く。）


---

# 5. Text Normalization

実施:

- 連続空白整理
- 改行コード統一
- 不要な空Text除去
- Unicode正規化


ただし:

内容変更になる変換は禁止。


例:

禁止:

全角半角自動変換

旧字体変換


理由:

Diff結果へ影響するため。


（既存 /diff の比較前クレンジング任意オプションとの境界は Open Question。normalize ツールルールの無断移植禁止。）


---

# 6. TextRun処理

過去Decisionを維持。


禁止:

TextRun Node


採用:

Text Metadata


例:


Text:

"契約期間"


metadata:

style:

{
 bold:true
}


理由:

Word内部構造をSLIRへ露出しない。


---

# 7. Paragraph Normalization

統合ルール。


例:


DOCX:

空Paragraph

空Paragraph


↓

必要に応じて除去。


ただし、

意味がある空行は保持可能。


判断不能の場合:

Loss Flag。


---

# 8. Heading Normalization

Headingレベルを保持。


例:


Heading 1

HeadingBlock(level=1)


ただし、

見た目だけの太字文字列を
勝手にHeading化しない。


---

# 9. Table Normalization

Product Constitution準拠。


Phase1:


TableBlockとして保持。


禁止:

Row Node

Cell Node


ただしOrigin Metadataとして

元構造情報保持可能。


---

# 10. List Normalization

保持:


- ordered
- unordered
- nesting level


例:


ListBlock

 ListItem


---

# 11. Image Normalization

Phase1:


存在単位。


保持:


- type
- origin
- size metadata


画像内容解析は禁止。


---

# 12. Loss Aware

必須。


Normalizerは、

変換できなかった情報を破棄しない。


例:


{
 lossFlags:[
   "TABLE_STRUCTURE_UNKNOWN"
 ]
}


---

# 13. Confidence Metadata

必要。


例:


PDF解析:


{
 structureConfidence:0.65
}


意味推定が入る場合、

必ず明示する。


---

# 14. Origin Metadata Isolation

保持。


例:


DOCX:

xmlPath


PDF:

page,bbox


HTML:

domPath


Markdown:

sourceRange


ただし:

SLIR比較ロジックは禁止利用。


（ADR-001 / ADR-003: Diff Engine は origin を比較しない。Position Score 特徴への写像は ADR-003 整合を確認。）


---

# 15. Determinism

重要。


同じ入力:

↓

必ず同じSLIR


禁止:

- 現在時刻依存
- Random UUID
- 外部API依存
- AI推測


---

# 16. Performance

ブラウザローカル。


要求:

- 大規模文書でもUI停止しない
- Worker利用可能


---

# 17. ADR構成

以下。


# ADR-006 Normalizer Architecture v0.1


## Status

Draft


## Context


## Decision


## Canonicalization Rules


## Text Normalization


## Structure Normalization


## Loss Aware


## Origin Metadata


## Determinism


## Non Goals


## Rejected Alternatives


## Open Questions


---

# 18. Rejected Alternatives

必ず記載。


Rejected:

- Parserから直接SLIR生成
- Word XML構造をSLIR化
- TextRun Node採用
- AI Semantic Normalization
- 表セル構造復元 Phase1


---

# 出力

保存先:

docs/architecture/ADR-006-Normalizer-Architecture-v0.1.md


Markdown。

実装前Architecture Decision Record品質で作成。

コードは書かない。採番衝突・ADR-002命名差分は Open Questions。
````

---

## データパイプライン（確定イメージ）

```text
DOCX / PDF / HTML / MD
  → Parser（案 ADR-005）
  → Normalizer（案 ADR-006）← 品質の本丸
  → SLIR（ADR-002 Accepted）
  → Matcher（ADR-003 Accepted）
  → Delta Tree（ADR-004 Accepted）
  → Renderer（案 ADR-007 / 現状一覧では ADR-005 欠落）
```

次プロンプト案: **Renderer** — 左右比較そのものではなく「変更点だけ確認する閲覧環境」。

## 関連

| 用途 | パス |
|------|------|
| Parser 作成指示 | [`smart-diff-adr-005-parser-architecture-COPYPASTE.md`](smart-diff-adr-005-parser-architecture-COPYPASTE.md) |
| SLIR / Matcher / Delta 正本 | `docs/architecture/adr/ADR-002` … `ADR-004` |
| Architecture 入口 | [`../notes/smart-diff/ARCHITECTURE.md`](../notes/smart-diff/ARCHITECTURE.md) |
