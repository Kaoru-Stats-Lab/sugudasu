# Smart Diff — Normalizer Design v0.1 作成指示（COPYPASTE）

**更新:** 2026-08-06  
**種別:** Cursor 投入用 · **実装禁止** · Parser と SLIR の境界を固定  
**前提 Accepted:** [`ADR-002 SLIR`](../architecture/adr/ADR-002-slir-schema.md)  
**関連指示:** [`smart-diff-adr-006-normalizer-architecture-COPYPASTE.md`](smart-diff-adr-006-normalizer-architecture-COPYPASTE.md)（同趣旨の先行版）

> **本ファイルはプロンプト保管。** Deep Research をそのまま「DOCX/PDF parser を作る」に落とさない。  
> **採番衝突（要 Board）:** 本プロンプトは「ADR-003 Normalizer」と呼ぶ。リポジトリ Accepted の **ADR-003 は Matcher**。Normalizer 実体化時の番号は Board 決定（案: ADR-006）。次工程「ADR-004 Matcher」も Accepted では既に ADR-003。

### 方針（固定）

| 項目 | 方針 |
|------|------|
| OSS | 入力解析に使う |
| 意味構造への変換 | **自作**（Normalizer） |
| SLIR Core | Parser 固有概念を入れない |
| DOCX | JSZip + XML · **mammoth HTML を SLIR 正本にしない** |
| PDF | pdf.js 取得 → 意味推定は inferred |
| Table | Atomic · Cell Diff 禁止 |
| Diff / UI | Normalizer に入れない |

```
DOCX/PDF/HTML/MD Parser ─> Raw Intermediate ─> Normalizer ─> SLIR ─> Matcher
```

---

## コピペ用（以下をそのまま投入）

````text
# Smart Diff ADR-003 — Normalizer Design v0.1 作成指示

## Role

あなたは Smart Diff の Principal Architect。

ADR-003として、Parser出力からSLIRへ変換する Normalizer Architecture を設計する。

目的：

異なるDocument Formatを、
比較可能な共通意味構造（SLIR）へ正規化する。

**重要:** Deep Research結果をそのまま「DOCX parserを作る」「PDF parserを作る」にしない。
Normalizerは ParserとSLIRの境界である。

**採番注意:** リポジトリで ADR-003 が Matcher Engine（Accepted）の場合、
本作業を Normalizer Architecture として書き、番号衝突を冒頭 Open Question に残す。
Accepted ADR-002〜004 を勝手に上書きしない。

コード実装・依存追加は禁止。ADR 文書のみ。

前提正本:

- docs/architecture/adr/ADR-002-slir-schema.md
- docs/architecture/adr/ADR-003-matcher-engine.md（責務境界の参照 · 本作業で再発明しない）
- docs/architecture/adr/ADR-004-delta-tree-model.md
- docs/notes/smart-diff/PRODUCT_CONSTITUTION.md
- docs/prompts/smart-diff-adr-005-parser-architecture-COPYPASTE.md

---

# 前提ADR

必ず以下を遵守する。

## ADR-002 SLIR

SLIRは：

* 比較用モデル
* 表示用ではない
* 編集用ではない

---

## Parser責務

Parser：

「元ファイルから情報を取り出す」

Normalizer：

「比較可能な意味構造へ変換する」

責務混在禁止。

MVP方針:

* OSSは入力解析に使う
* 意味構造への変換は自作
* SLIR CoreへParser固有概念を入れない
* Parserごとの独自意味モデルを増やしすぎない

---

# Architecture

以下を基本形とする。

```
Input File

↓

Format Parser

↓

Raw Intermediate Model

↓

Normalizer

↓

SLIR

↓

Matcher
```

```
DOCX Parser       ┐
PDF Parser        ├─> Raw Document Model ─> Normalizer ─> SLIR
HTML Parser       │
Markdown Parser   ┘
```

---

# Build vs Buy方針

## DOCX

参考OSS：

* JSZip
* DOMParser

利用：

ZIP展開
XML解析

Build：

OpenXML → （Raw）→ Normalizer → SLIR変換

禁止：

mammoth.js HTML出力をSLIR正本にする。

理由：

* Run情報欠落
* Track Changes情報欠落
* 比較用構造として不足

---

## PDF

利用：

pdf.js

取得：

* text
* font
* bbox
* page

Normalizer責務：

座標情報から意味構造推定。

例：

```
文字群

↓

Line

↓

Paragraph候補

↓

SLIR Paragraph
```

ただし推定結果は：

```
confidence=inferred
```

を付与。

---

## HTML

利用：

Browser DOMParser

変換：

```
DOM

↓

Section
Heading
Paragraph
List
```

---

## Markdown

利用：

remark/unified/mdast

変換：

mdast

↓

SLIR

（mdast を SLIR として採用しない。変換する。）

---

# Normalizer Pipeline

ADR内で以下を定義する。

## Step 1 Parse

入力形式を読む。

Output:

Raw Model

（Parse ステップ自体は Parser Adapter 側でも可。Normalizer ADR では境界を明記。）

---

## Step 2 Structural Detection

検出：

* Heading
* Paragraph
* List
* Table
* Image

---

## Step 3 Canonicalization

正規化。

例：

空白：

```
"abc  def"
```

↓

```
"abc def"
```

ただし原文保持はOriginへ。

内容改変変換禁止（全角半角・旧字体など Diff を歪めるもの）。既存 /diff 比較前クレンジングとの境界は Open Question。

---

## Step 4 Coalescing

結合。

例：

連続Text:

```
Hello
World
```

↓

```
Hello World
```

---

## Step 5 SLIR生成

最終Node生成。（ADR-002 の型・命名に整合。TextRun Node 禁止 / TextSpan or InlineText は正本に従う。）

---

# Normalization Rules

ADR内で定義する。

## Text

保持：

* normalized text
* original text reference

---

## Paragraph

以下を統一：

DOCX: <w:p>  
PDF: 推定Paragraph  
HTML: <p>  
Markdown: paragraph node  

↓

SLIR Paragraph

---

## Heading

levelを正規化。

DOCX Heading1 / HTML h1 / Markdown #

↓

Heading(level=1)

見た目だけの太字を勝手に Heading 化しない。

---

## Table

MVP：Atomic。

入力：DOCX tbl / HTML table / PDF table候補

↓

TableBlock / TableNode（ADR-002 命名に合わせる）

confidence保持。内部セルDiff禁止。

---

# Loss Aware Rules

必須。

DOCX：Paragraph exact  
PDF：Paragraph inferred  

同じSLIRでも信頼度を保持。破棄しない。

---

# Error Handling

定義する。

PDF二段組など。誤推定して無理にParagraph化しない。

Fallback: UnknownBlock または confidence=unknown

Silent fallback 禁止。warnings 保持。

---

# 禁止事項

## Parser依存Node

禁止：WordRun / PDFTextBox / HTMLDiv

## UI情報

禁止：highlight / color / diff badge

## Diff情報

禁止：added / deleted / modified（Delta Tree責務）

---

# OSS Reference

ADRに記載。

## DOCX

* JSZip · DOMParser · Office Open XML specification

## PDF

* pdf.js

## HTML

* Browser DOMParser

## Markdown

* remark/unified/mdast

---

# Open Questions

残す。勝手に閉じない。

1. PDF Reading Order推定精度
2. 日本語文書の段落境界検出
3. 表検出精度
4. OCR PDF対応
5. Track Changes対応
6. 本ADRの正式番号（003 vs 006 等）

---

# ADR構成（推奨）

# ADR-00X Normalizer Architecture v0.1

## Status: Draft
## Context
## Decision
## Pipeline
## Format Rules (DOCX/PDF/HTML/MD)
## Loss Aware
## Determinism
## OSS / Build Boundary
## Non Goals
## Rejected Alternatives
## Open Questions

保存候補: docs/architecture/ADR-006-Normalizer-Architecture-v0.1.md（番号は Board）

---

# 完了条件

□ ParserとNormalizerの責務分離
□ SLIR Schema v0.1へ変換可能
□ DOCX/PDF/HTML/MD対応方針決定
□ Loss Aware実装方針あり
□ Table Phase2境界維持
□ Parser固有概念をSLIRへ流入させない
□ mammoth HTML を SLIR 正本にしていない
□ 採番衝突を Open Questions に残した

次工程は **Matcher Engine設計**（Stable Identity · Identity Score · Candidate · LCS/Patience/Histogram · Move Phase1?）。
リポジトリに Accepted ADR-003 Matcher がある場合は再発明せず、数値ブレの正本化・ギャップだけを扱う。
````

---

## 次工程メモ（採番は Accepted 優先）

| プロンプト上の呼称 | リポジトリ実体 |
|--------------------|----------------|
| ADR-003 Normalizer | **未実体** · 案 ADR-006 |
| ADR-004 Matcher | **Accepted ADR-003**（再発明禁止 · Score 正本化のみ可） |

## 関連

| 用途 | パス |
|------|------|
| 先行 Normalizer 指示 | [`smart-diff-adr-006-normalizer-architecture-COPYPASTE.md`](smart-diff-adr-006-normalizer-architecture-COPYPASTE.md) |
| Parser 指示 | [`smart-diff-adr-005-parser-architecture-COPYPASTE.md`](smart-diff-adr-005-parser-architecture-COPYPASTE.md) |
| SLIR 正本 | [`../architecture/adr/ADR-002-slir-schema.md`](../architecture/adr/ADR-002-slir-schema.md) |
| Matcher 正本 | [`../architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md) |
