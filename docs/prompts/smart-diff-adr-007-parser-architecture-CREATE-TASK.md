# Cursor Task: ADR-007 Parser Architecture CREATE TASK

**用途:** Cursor 投入用 COPYPASTE  
**成果物:**
- `docs/architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md`
- `docs/architecture/parser/parser-design.md`

**絶対条件:** Accepted 変更禁止 · Parser は **SLIR を作らない**（素材抽出のみ）  
**逆算軸:** 「採用 OSS」ではなく **SLIR 生成に必要な情報**から決める

---

# 以下を Cursor に投入

```markdown
# Smart Diff ADR-007 Parser Architecture CREATE TASK

## Role

あなたはSUGUDASU Smart DiffのSoftware Architectです。

目的はSmart DiffにおけるDocument Parser Architectureを定義することです。

この文書は実装指示ではなく、Architecture Decision Record（ADR）作成タスクです。

---

# 絶対条件

## Accepted変更禁止

既存ADRのAccepted決定事項を書き換えない。

変更が必要な場合は必ず Proposed として記載し、別ADRで扱う。

---

# 設計上の正本パイプライン

```

Input Format
    ↓
Format Parser          ← 本ADR（SLIRを作らない）
    ↓
Raw Document Model     ← Parser Output Contract（SLIRではない）
    ↓
SLIR Normalizer        ← ADR-008
    ↓
SLIR v0.1
    ↓
Matcher Engine
    ↓
Delta Tree
    ↓
Renderer / Export

```

ParserはSLIR生成責務を持たない。

責務:

YES:
- Input format解析
- 構造情報抽出
- Metadata抽出
- Origin情報保持

NO:
- 差分計算
- Stable ID生成
- ChangeKind判定
- UI表示判断

OSS選定は「有名だから」ではなく、
Normalizer / SLIR が要求する情報（Paragraph, Heading, Text, Style, Table Atomic, Annotation, Origin）から逆算する。

---

# 参照ADR

必ず以下を前提にする。

## ADR-002 SLIR Schema

SLIRは比較のための中間表現。

## ADR-003 Matcher Engine

Stable IdentityはMatcher責務。

ParserはIDを決定しない。

## ADR-004 Delta Tree

ParserはDelta状態を作らない。

---

# Parser対象

Phase1対象:

## DOCX

検討:

- mammoth.js
- docx-preview
- JSZip + OpenXML XML解析

判断すること:

- 採用
- 不採用
- Hybrid

特に以下を評価（SLIR必要情報との対応表を書く）:

- Paragraph抽出
- Heading抽出
- Text抽出
- Style情報
- Table扱い
- Comment扱い
- Track Changes扱い

---

## PDF

利用候補:

- Mozilla pdf.js

評価:

- Text extraction
- BoundingBox
- Page情報
- Reading order
- Layout情報

明記:

PDFは構造文書ではなく描画情報である。

そのため完全なParagraph/Table復元は保証しない。

---

## HTML

候補:

- Browser DOMParser

評価:

- DOM Tree
- Semantic HTML

---

## Markdown

候補:

- remark / unified

評価:

- mdast AST
- Heading
- Paragraph
- List

---

# 必須判断事項

## 1. Parser Output Contract

Parser結果の形式を定義する。

例:

Raw Document Model
{
format,
metadata,
blocks[],
originMetadata
}

SLIRではないことを明確化。

---

## 2. Origin Metadata扱い

ADR-002 P6 Origin Isolation / ADR-001 に従う。

保持:

- source format
- page number
- xml reference
- coordinates

禁止:

SLIR比較ロジックへの混入。

---

## 3. DOCX方針決定

以下を明確化。

Option A mammoth.js / Option B OpenXML直接 / Option C Hybrid

Track Changes対応をParser採用理由の唯一根拠にしない。

---

# Track Changesについて

Product Constitution未確定事項。

対応する場合 / しない場合を分離。

---

# 出力成果物

docs/prompts/smart-diff-adr-007-parser-architecture-CREATE-TASK.md
docs/architecture/parser/ADR-007-Smart-Diff-Parser-Architecture-v0.1.md
docs/architecture/parser/parser-design.md

---

# 禁止事項

- Parser内でDiffしない
- Parser内でAI判断しない
- Parser内で重要度判定しない
- Parser内でStable ID生成しない
- Parser内でUI情報を持たない

---

# 完了条件

1. 各Format Parserの責務境界
2. OSS利用範囲
3. Build範囲
4. Parser Output Contract
5. SLIRとの境界
6. Phase1 / Phase2分離
7. 未確定事項の隔離
```
