# Smart Diff — ADR-003 Matcher Engine v0.1 作成指示（COPYPASTE）

**更新:** 2026-08-06  
**種別:** Cursor / 外部 AI 投入用プロンプト  
**注意（リポジトリ現状）:** Matcher の **Accepted 正本は既にある** → [`../architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md)  
関連 Accepted: [`ADR-002-slir-schema.md`](../architecture/adr/ADR-002-slir-schema.md) · [`ADR-004-delta-tree-model.md`](../architecture/adr/ADR-004-delta-tree-model.md)

> **本ファイルはプロンプト保管。** Accepted ADR を本プロンプトで勝手に上書きしない。  
> 矛盾があれば書き始めず列挙。未決は Open Questions。Product Constitution 変更が要る事項は Board へ。

### 正本（Accepted）との主な差分 / 採番注意

| 本プロンプト案 | Accepted 正本 |
|----------------|---------------|
| Status Draft · 出力 `docs/architecture/ADR-003-Matcher-Engine-v0.1.md` | Accepted · `docs/architecture/adr/ADR-003-matcher-engine.md` |
| 出力名 Node Mapping / MATCH_CANDIDATE | **Match Map** · `confidence: "high" \| "candidate" \| "none"` |
| Strong Match 85+ | Same Node 85〜100（同趣旨） |
| Candidate 詳細は Delta Tree ADR | ADR-004 で `confidence: "candidate"` · UI は ADR-005 |
| Main Thread 禁止 · Worker | Accepted ADR-003 に未記載 → Open Question / 後続 ADR |
| 日本語 · Lindera 将来 | Accepted に未記載 → Open Question |
| 次工程 ADR-005 Parser · ADR-006 Renderer | 現状 Architecture 一覧の次は **ADR-005 Renderer**（Parser 未採番） |

再審・採番変更は Board。正しい設計順（人間の同一性 → 差分表現 → 入力解析）は維持。

---

## コピペ用（以下をそのまま投入）

````text
# Smart Diff
# ADR-003 Matcher Engine v0.1 作成指示

## Role

あなたは Smart Diff Document Difference Engine の Principal Architect です。

ADR-002 SLIR Schema v0.1 を前提として、
SLIR Node同士の同一性判定を担当する
Matcher Engineを設計してください。

目的:

「変更されていないものを、変更されたように見せない」

こと。

Smart Diffの品質は、
Diff Algorithmそのものより、
Matcherが人間の認識する同一性を維持できるかで決まる。

**リポジトリに Accepted の ADR-002〜004 がある場合:**
既存正本を開き整合を確認する。矛盾があれば ADR を書き始めず先に矛盾点を列挙する。
未解決事項を勝手に決定しない。

前提正本（あれば）:

- docs/architecture/adr/ADR-002-slir-schema.md
- docs/architecture/adr/ADR-003-matcher-engine.md（既にあれば上書きせず差分のみ）
- docs/architecture/adr/ADR-004-delta-tree-model.md
- docs/notes/smart-diff/PRODUCT_CONSTITUTION.md
- docs/notes/smart-diff/UI_CONSTITUTION.md

---

# 1. 責務境界

Matcher Engineの責務:

入力:

SLIR Tree A
SLIR Tree B


出力:

Node Mapping


例:

A:
Paragraph A-001

↓

B:
Paragraph B-024


として、

Same Logical Node

という関係を作る。


---

禁止:

Matcher内で

- UI判断
- 差分表示判断
- 色付け判断
- Accept/Reject管理

をしない。


それらはDelta Tree / Renderer責務。


---

# 2. Stable ID方針

禁止:

## Path Based ID

例:

1.2.3

理由:

途中挿入で後続ノードが全変更扱いになる。


禁止:

## Parser生成UUID

理由:

比較するたび全Nodeが別物になる。


採用:

Stable IdentityはMatcherが計算する。


---

# 3. Identity Score設計

採用方式:

複数特徴量によるScore Matching。


Score:

100点満点。


正式値:


Heading一致

30


Text Similarity

30


Context一致

25


Position近似

15


合計:

100


---

# 4. Score判定

以下をADRに明記。


## Strong Match

85以上

同一Nodeとして確定。


## Candidate Match

60〜84


候補。


自動確定しない。


## No Match

59以下


別Node。


---

# 5. Candidate Match処理

未定義を残さない。


ADRでは以下を書く。


Candidate Matchは:

Matcher Outputでは

MATCH_CANDIDATE

状態として保持する。


Delta Tree ADRで、

- Modified扱い
- Added+Deleted扱い
- User確認

を決定する。


Matcherは判断しない。


---

# 6. Matching Strategy

単純な全文比較は禁止。


以下の順序で設計。


## Step 1

Node Type Filter


例:

Paragraph

↓

Paragraph


Heading

↓

Heading


異なる種類は基本比較対象外。


---

## Step 2

Context Window取得


例:

前後Paragraph

Heading階層


人間が読む文脈を利用。


---

## Step 3

Similarity計算


利用候補:


Text:

diff-match-patch


Structure:

Node metadata


---

## Step 4

Position補正


PDFの場合:

page

bounding box


DOCXの場合:

paragraph order


を利用。


---

# 7. Move対応

Phase1:

Move Detectionなし。


ただしMatcher設計では、

「移動したNode」

を将来扱えるよう、

mapping情報は

sourceNode

targetNode

として独立保持。


Moved判定はPhase2。


---

# 8. Document単位Matching

最初にDocument Rootを比較。


次:

Heading hierarchy


次:

Block


最後:

Inline


という階層型Matching。


全文フラット比較は禁止。


---

# 9. 日本語文書対応

考慮する。


日本語では:

- 空白区切りがない
- 単純単語分割が弱い


ただしPhase1では:

形態素解析必須にはしない。


採用:

diff-match-patch
+
semantic cleanup


将来:

Lindera WASM等を検討。


---

# 10. Performance Constraint

ブラウザローカル動作。


前提:

- Worker利用可能
- 大規模文書でもUI停止禁止


Matcherは:

Main Thread禁止。


---

# 11. ADR構成

以下形式。


# ADR-003 Matcher Engine v0.1


## Status

Draft


## Context


## Decision


## Identity Score


## Matching Algorithm


## Candidate Match Handling


## Non Goals


## Rejected Alternatives


## Open Questions


---

# 12. Rejected Alternatives

必ず記録。


Rejected:

- Path Based Stable ID
- UUID固定
- 全文文字列Hash
- Pixel Diff Only
- Flat Text Diff Only
- AI Semantic Matching


理由を書く。


---

# 出力

保存先:

docs/architecture/ADR-003-Matcher-Engine-v0.1.md


Markdown形式。

実装可能な粒度まで落とす。

ただしコードは書かない。

（既存 Accepted 正本がある場合の推奨: 上書きせず、差分・Open Questions のみ。正本パスは docs/architecture/adr/ADR-003-matcher-engine.md）
````

---

## 推奨工程順（設計思想）

人間が同じと感じるものを定義 → 差分表現 → 入力解析（Parser → Diff → UI の順は失敗しやすい）。

| 状態 | 成果物 | 目的 |
|------|--------|------|
| 完了 | ADR-002 SLIR Schema | 比較対象の正規形 |
| 完了 | ADR-003 Matcher Engine | 同一性判定 |
| 完了 | ADR-004 Delta Tree | 変更表現 |
| 次（現状 Architecture） | **ADR-005 Renderer** | UI 表示 |
| 未採番 | Parser Architecture | DOCX/PDF/HTML/MD → SLIR |

本プロンプト末尾の「ADR-005 Parser · ADR-006 Renderer」は **採番案**。現状リポジトリの次欠落は Renderer（ADR-005）。Parser の番号は Board で決める。

## 関連

| 用途 | パス |
|------|------|
| Matcher 正本（Accepted） | [`../architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md) |
| ADR-002 作成指示 | [`smart-diff-adr-002-slir-schema-COPYPASTE.md`](smart-diff-adr-002-slir-schema-COPYPASTE.md) |
| Architecture 入口 | [`../notes/smart-diff/ARCHITECTURE.md`](../notes/smart-diff/ARCHITECTURE.md) |
