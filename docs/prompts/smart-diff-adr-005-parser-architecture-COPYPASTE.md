# Smart Diff — ADR-005 Parser Architecture v0.1 作成指示（COPYPASTE）

**更新:** 2026-08-06  
**種別:** Cursor / 外部 AI 投入用プロンプト  
**前提 Accepted:** [`ADR-002`](../architecture/adr/ADR-002-slir-schema.md) · [`ADR-003`](../architecture/adr/ADR-003-matcher-engine.md) · [`ADR-004`](../architecture/adr/ADR-004-delta-tree-model.md)

> **本ファイルはプロンプト保管。** 未決を勝手に決めない。Product Constitution 変更が要る事項は Board へ。  
> **採番衝突（要 Board）:** 現状 [`ARCHITECTURE.md`](../notes/smart-diff/ARCHITECTURE.md) の欠落は **ADR-005 Renderer**。本プロンプトは **ADR-005 Parser** を提案。次プロンプト案は ADR-006 Normalizer。Renderer / Parser / Normalizer の番号は上書き前に整理すること。

### 固定事項（プロンプト意図 · 正本化前）

| 項目 | 方針 |
|------|------|
| DOCX | mammoth.js **のみ**は Reject · **JSZip + OpenXML 必要部分** |
| PDF | pdf.js · 構造推測は Geometry heuristic 限定 · AI 推測禁止 · Loss Aware |
| HTML | DOMParser（+ 必要なら DOMPurify） |
| Markdown | remark / mdast |
| Normalizer | **別 ADR**（Parser に混ぜない） |
| 目的 | 万能読込ではなく **比較可能な SLIR への入口** |

### 既存正本との接続注意

| 既存 | 本プロンプト |
|------|----------------|
| ADR-002: AnnotationNode 独立 · TextSpan · TableNode atomic · Origin Isolation | Parser は SLIR 完全生成しない · Intermediate → Normalizer → SLIR |
| ADR-001: Diff Engine は origin を比較しない | Origin Metadata は保持 · Matcher は利用しない（整合） |
| Track Changes | Product 未決定 → Open Question（プロンプトどおり） |

出力パス案 `docs/architecture/ADR-005-Parser-Architecture-v0.1.md` は Draft 置き場候補。Accepted 化時は `docs/architecture/adr/` へ揃え、採番を Board 確定後に決める。

---

## コピペ用（以下をそのまま投入）

````text
# Smart Diff
# ADR-005 Parser Architecture v0.1 作成指示

## Role

あなたは Smart Diff Document Difference Engine の Principal Architect です。

以下のADRを前提として、
Document Parser Architectureを設計してください。

- ADR-002 SLIR Schema v0.1
- ADR-003 Matcher Engine v0.1
- ADR-004 Delta Tree v0.1

**採番注意:** リポジトリの Architecture 一覧で ADR-005 が Renderer 欠落になっている場合、
本作業を「Parser Architecture」として書き、番号衝突を Open Question / 冒頭注記に残す。
勝手に Renderer ADR を消さない。Normalizer は本 ADR に混ぜない（別 ADR）。

目的:

DOCX / PDF / HTML / Markdown
それぞれ異なる形式の文書を、

比較可能なSLIRへ変換するための
Parser責務境界を定義する。

万能読込・完全再現が目的ではない。各形式固有情報をどこまで保持し、どこで捨てるかを決める。

前提正本（あれば）:

- docs/architecture/adr/ADR-002-slir-schema.md
- docs/architecture/adr/ADR-003-matcher-engine.md
- docs/architecture/adr/ADR-004-delta-tree-model.md
- docs/notes/smart-diff/ADR-001-origin-metadata.md
- docs/notes/smart-diff/PRODUCT_CONSTITUTION.md
- docs/notes/smart-diff/ARCHITECTURE.md

---

# 1. Parserの責務

Parserの責務:

Input Format
 ↓
Format Native Representation
 ↓
Parser Output
 ↓
Normalizer
 ↓
SLIR


Parser自身はSLIR完全生成を担当しない。


禁止:

Parser内で

- Diff計算
- Node Matching
- UI用変換
- Delta生成

を行う。


---

# 2. Architecture Principle

採用:

Format Adapter Pattern


各形式ごとにAdapterを持つ。


例:


DOCX Parser Adapter

PDF Parser Adapter

HTML Parser Adapter

Markdown Parser Adapter


共通出口:

Parser Intermediate Output


NormalizerがSLIRへ変換する。

---

# 3. DOCX Parser設計

## 採用

Hybrid。


利用:

JSZip

Build:

OpenXML必要部分解析


理由:

mammoth.jsは、

- Semantic HTML変換には優れる
- しかしDiff用情報が不足

するため。


---

# 4. DOCX保持対象

保持:

## Paragraph

<w:p>


## Text

<w:t>


## Style Metadata

<w:rPr>


例:

- bold
- italic
- underline
- font size


## Heading情報

<w:pStyle>


## Table存在情報

<w:tbl>


ただしPhase1では内部Cell Diffしない。


---

# 5. DOCX非対象

Phase1では以下を保証しない。


- Word完全再現
- Track Changes互換
- コメント完全互換
- レイアウト完全保持


Track Changesについて:


Product Constitution未決定。


ADRではOpen Questionとして残す。


---

# 6. PDF Parser設計

## 採用

pdf.js


理由:

ブラウザ標準級。

---

# 7. PDF抽出モデル

PDFは構造文書ではない。


取得:

- text content
- font
- position
- page
- bounding box


まで。


---

# 8. PDF Structure Reconstruction

禁止:

AI推測。


限定:

Geometry heuristic。


例:

- 行統合
- 近接文字結合


ただし確信度を保持。


---

# 9. PDF Loss Aware

必須。


例:


PDF上:


A B C


が


表なのか

配置された文字なのか


判断不能。


その場合:

Unknownとして保持。


例:


structureConfidence

lossFlags


---

# 10. HTML Parser

採用:


Browser DOMParser


必要なら:

DOMPurify


利用。


保持:


- heading
- paragraph
- list
- table
- image


---

# 11. Markdown Parser

採用:


remark / unified


理由:

mdastがSLIRと相性良い。


保持:


- heading
- paragraph
- list
- code block


---

# 12. Parser Output Contract

各Parserは共通形式を返す。


例:


ParsedDocument


{

format,

nodes,

originMetadata,

warnings

}


など。


---

# 13. Origin Metadata

保持。


例:


DOCX:

XML location


PDF:

page / bbox


HTML:

DOM path


Markdown:

source position


ただし:

Matcherは利用しない。


（注: Position 特徴量として Matcher が bbox を使う場合は ADR-003 と矛盾しないよう、origin 生比較ではなく Score 特徴への写像として Open Question で扱うか、ADR-001/003 を参照して整合させる。）


---

# 14. Error Handling

失敗時:


Silent fallback禁止。


例:


PDF table detection失敗


↓

warning:

TABLE_STRUCTURE_UNKNOWN


として保持。


---

# 15. OSS / Build Boundary

ADR内に明記。


## OSS

pdf.js

JSZip

DOMParser

remark


## Build

Format Adapter

OpenXML Mapping

PDF Geometry Reconstruction

Parser Output Contract


---

# 16. ADR構成

以下。


# ADR-005 Parser Architecture v0.1


## Status

Draft


## Context


## Decision


## DOCX Parser


## PDF Parser


## HTML Parser


## Markdown Parser


## Loss Aware Handling


## OSS / Build Boundary


## Non Goals


## Rejected Alternatives


## Open Questions


---

# 17. Rejected Alternatives

必ず記録。


Rejected:

- mammoth.jsのみ利用
- PDFを完全構造化できる前提
- OCR中心設計
- AIによる文書理解
- ParserとNormalizerの混在


---

# 出力

保存先:

docs/architecture/ADR-005-Parser-Architecture-v0.1.md


Markdown。

実装前のArchitecture Decision Record品質で作成。

コードは書かない。未決は Open Questions。採番衝突は冒頭に明記。
````

---

## 推奨後続（プロンプト著者案 · 採番は Board）

| 案 | 成果物 | 目的 |
|----|--------|------|
| 本プロンプト | Parser Architecture | 形式 → Intermediate（比較可能な入口） |
| 次案 | **Normalizer Architecture** | SLIR 品質の本丸（空行 · Run 吸収 · Style · Loss Flag · Canonical） |
| 現状 Architecture 欠落 | Renderer | どう見せるか |

Parser を先にすると「抽出できるもの基準」になりやすい、という警告は中核3層（002–004）完了後だからこそ Parser に進む、という文脈で読む。

## 関連

| 用途 | パス |
|------|------|
| Architecture 入口 | [`../notes/smart-diff/ARCHITECTURE.md`](../notes/smart-diff/ARCHITECTURE.md) |
| ADR-002〜004 作成指示 | [`smart-diff-adr-002-slir-schema-COPYPASTE.md`](smart-diff-adr-002-slir-schema-COPYPASTE.md) · [`smart-diff-adr-003-matcher-engine-COPYPASTE.md`](smart-diff-adr-003-matcher-engine-COPYPASTE.md) · [`smart-diff-adr-004-delta-tree-COPYPASTE.md`](smart-diff-adr-004-delta-tree-COPYPASTE.md) |
