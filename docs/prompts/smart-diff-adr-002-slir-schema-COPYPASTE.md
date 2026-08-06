# Smart Diff — SLIR Schema v0.1（ADR-002）作成指示 · 固定条件版（COPYPASTE）

**更新:** 2026-08-06  
**種別:** Cursor 投入用 · **実装禁止** · 未解決事項を先に固定し、勝手に設計を広げさせない  
**Accepted 正本:** [`../architecture/adr/ADR-002-slir-schema.md`](../architecture/adr/ADR-002-slir-schema.md) · Origin: [`../notes/smart-diff/ADR-001-origin-metadata.md`](../notes/smart-diff/ADR-001-origin-metadata.md)

> **本ファイルはプロンプト保管。** 「Schemaを書け」より **固定条件の遵守** が先。矛盾は Schema 作成より先に指摘。Accepted を勝手に上書きしない。

### ⚠ Accepted 正本との重大差分（Board 再審前は正本優先）

| 本プロンプト | Accepted |
|--------------|----------|
| **TextRun 復活**（Paragraph └ TextRun） | TextRun **Node 禁止** · `TextSpan` / inline |
| Schema に `stableId` / `matcherMetadata` 格納 | SLIR は tempId のみ · Identity は Matcher（書き戻しなし） |
| `identityStatus` を Schema 上で表現 | Match Map / Delta の confidence（ADR-003/004） |
| bbox を Paragraph metadata 例示 | **origin** 隔離（ADR-001）· Core metadata に座標を置かない |
| ADR-001 =「SLIRは比較中間表現」 | ADR-001 = **Origin Metadata Isolation** |
| 次 = ADR-003 Matcher | Matcher は **Accepted ADR-003**（再発明禁止） |

TextRun 復活・stableId 格納は **再審案件**。Cursor が広げた場合は Reject / Open Question に落とす。

---

## コピペ用（以下をそのまま投入）

````text
# Smart Diff — SLIR Schema v0.1（ADR-002）作成指示

## Role

あなたは Smart Diff の Principal Architect です。

目的は「Document Difference Engine」のための中間表現
**SLIR (Smart Logical Intermediate Representation)**
の Schema v0.1 を設計することです。

これは表示用モデルではありません。

目的:

> Parserの違いを吸収し、意味単位で比較可能な中間表現を定義する。

RendererやUIの都合でSchemaを設計してはいけません。

**重要:** これまでの未解決事項（TextRun、Stable ID、Table、Track Changes、OSS境界）を本指示の固定条件として扱う。
勝手に設計を広げない。矛盾・再審が必要なら Schema 作成より先に指摘する。

**Accepted 正本がある場合:** docs/architecture/adr/ADR-002-slir-schema.md および ADR-001 Origin Metadata を開き、
本指示との差分を列挙してから書く。Board 承認なしに Accepted を破壊しない。

コード実装・npm 追加禁止。TypeScript 風設計用型のみ。

---

# Reference Documents

以下を前提条件として読むこと。

* Product Constitution（docs/notes/smart-diff/PRODUCT_CONSTITUTION.md · docs/product/PRODUCT_CONSTITUTION.md）
* Smart Diff Constitution / Development メモ（docs/notes/smart-diff/）
* ADR-001: Origin Metadata Isolation（比較中間表現の定義は ADR-002。ADR-001 は Origin 隔離）
* ADR-002 Accepted（あれば）
* ADR-003 Matcher / ADR-004 Delta（Identity・ChangeKind の正本。Schema に持ち込まない）
* Build vs Buy / OSS 方針（各 COPYPASTE · mammoth 非正本等）
* Stable ID再設計方針（Path ID 禁止 · Matcher 責務）

---

# 絶対条件

## 1. SLIRは表示モデルではない

禁止:

* Canvas座標中心の設計
* UI Component中心のNode設計
* React Component依存
* Renderer都合の属性追加

保持するもの:

* 意味構造
* 比較に必要な情報
* Origin Metadata
* Loss情報

---

# 2. Stable ID設計

以前のPath Based IDは禁止。

理由:

```
1.2
1.3
```

のような位置IDは途中挿入で後続Nodeが全変更扱いになるため。

採用方針:

Stable IDはParserが発行しない。

SLIR生成後のMatcher Layerで推定する。

必要情報（Matcher が読む特徴 · Schema が提供）:

* node content
* normalized text
* heading context
* parent context
* sibling context
* position proximity
* similarity score

Identity Scoreによって同一性候補を判断する。

ただしSchemaには（**再審中**）:

* stableId
* sourceId
* matcherMetadata

の格納場所を用意する、という案がある。

**Accepted 整合:** SLIR に Stable Identity を書き戻さない案が正本。
格納場所案を採るなら Trade-offs / Open Questions に「書き戻し vs Match Map のみ」を明示し、勝手に確定しない。
temporary id は木走査用として可。

---

# 3. Identity Score

数値はADR-002では仮置き可能。

ただし正本は以下に統一する（詳細は Matcher ADR-003 Accepted）:

```
Heading一致        30
Text Similarity    30
Context一致        25
Position近似       15

Total              100
```

60〜85の候補状態についてはSchema上:

```
identityStatus:
- confirmed
- candidate
- unknown
```

を表現可能にする、という案がある。

**Accepted 整合:** Candidate は Match Map / Delta の confidence。Schema への identityStatus 混入は責務侵食になりうる → Open Question または Reject。

---

# 4. TextRun問題

以前:

「Paragraph → Textで十分。RunはParser内部吸収」

という判断が存在した。

しかしDeep Researchにより、

DOCX比較では

* style変更
* text変更
* formatting変更

を区別する必要があるため再評価する。

今回の判断（**プロンプト案 · Accepted と衝突しうる**）:

TextRunは復活する。

ただし理由をADRに明記する。

目的:

Word XML構造をそのまま持ち込むためではない。

あくまで:

```
Paragraph
 └ TextRun
```

として、

「意味単位内部の比較粒度」

として利用する。

**Accepted:** TextRun Node 禁止 · TextSpan として Paragraph.inline。復活する場合は ADR で Rejected 初稿からの変更 Intent を書き、Board 再審を前提にする。OpenXML `<w:r>` 露出は引き続き禁止。

---

# 5. Node設計

基本Node（案）:

```
Document
 ├ Section
 ├ Heading
 ├ Paragraph
 │    └ TextRun
 │
 ├ List
 │    └ ListItem
 │
 ├ TableBlock
 │
 ├ Image
 │
 └ Annotation
```

MVPで使わない抽象は追加しない。

---

# 6. Table扱い

Product Constitution:

Phase1:
Table Diff 非対応

を維持する。

したがって、

MVPでは:

```
TableBlock
```

は存在してよい。

しかし:

禁止:

```
Table
 ├ Row
 │   └ Cell
```

をDiff対象Nodeとして扱うこと。

Phase1では:

```
TableBlock hash/context comparison
↓
changed / unchanged
```

程度。Schema上は将来拡張可能な余地のみ残す。

---

# 7. Annotation設計

Commentは独立Document Nodeではなく、Annotationとして扱う。

例:

```
Paragraph
 └ Annotation
```

または

```
TextRun
 └ Annotation
```

ただし本文変更と混同しない。

Annotation変更:

本文Modifiedではない。

Delta Tree側で別分類可能な設計にする。

（Accepted: AnnotationNode 独立 · 本文 Modified に畳まない。）

---

# 8. PDF対応

PDFは構造文書ではない。

pdf.jsから得られる:

* text
* font
* bbox
* page number

を **Origin Metadata** として保持。

ただしSLIR Coreでは:

PDF座標を意味構造にしない。

悪い例（Core metadata に bbox）は Origin Isolation 違反になりうる。
良い例: origin.pdf.page / origin.pdf.bbox

---

# 9. Loss Aware

Parserが判断できない場合:

推測で構造化しない。

例: UnknownBlock · lossFlags · confidence · sourceType

必須。

---

# 10. OSS利用前提

参考実装（コピーしない）:

DOCX: JSZip · OpenXML document.xml解析（mammoth HTML を SLIR 正本にしない）
PDF: pdf.js
Markdown: remark / mdast
HTML: DOMParser
Text Diff: google diff-match-patch（Inline のみ）
Tree Diff: 完全依存しない · SLIR特有比較はBuild

---

# 作成物

## ADR-002

タイトル: Smart Diff SLIR Schema v0.1

内容:

1. Decision
2. Why
3. Non Goals
4. Schema Definition
5. Node Type一覧
6. Metadata Definition
7. Identity / Matchingへの接続（書き戻しの可否を明示）
8. Loss Handling
9. Future Extension
10. Rejected Alternatives
11. Open Questions（TextRun復活 · stableId格納 · identityStatus 等）

Draft保存候補: docs/architecture/ADR-002-SLIR-Schema-v0.1.md

---

## TypeScript型定義

設計用 pseudo schema のみ。実装ファイル生成禁止。

---

# 最後に確認すること

作成後、以下を自己レビューする。

□ Product Constitutionと矛盾していないか
□ Table Diff Phase1非対応を破っていないか
□ TextRun復活理由がADRに残っているか（復活する場合）/ または Accepted TextSpan を維持したか
□ Stable IDがPath Basedになっていないか
□ UI都合のSchemaになっていないか
□ RendererがSLIRへ依存する設計になっていないか
□ Origin Metadata Isolation（ADR-001）を破っていないか
□ Matcher / Delta の責務を Schema に侵食していないか

問題があればSchema作成より先に指摘すること。

次工程: Matcher Engine（Identity Score / Stable ID / Candidate）。
リポジトリに Accepted ADR-003 がある場合は再発明せずギャップのみ。
````

---

## 関連

| 用途 | パス |
|------|------|
| Accepted SLIR | [`../architecture/adr/ADR-002-slir-schema.md`](../architecture/adr/ADR-002-slir-schema.md) |
| Accepted Matcher | [`../architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md) |
| 本体作成版（前回） | 同ファイルの履歴 · 本版が最新の「固定条件」投入用 |
| Architecture | [`../notes/smart-diff/ARCHITECTURE.md`](../notes/smart-diff/ARCHITECTURE.md) |
