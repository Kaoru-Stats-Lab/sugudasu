# Smart Diff — ADR-004 Delta Tree v0.1 作成指示（COPYPASTE）

**更新:** 2026-08-06  
**種別:** Cursor / 外部 AI 投入用プロンプト  
**注意（リポジトリ現状）:** Delta Tree の **Accepted 正本は既にある** → [`../architecture/adr/ADR-004-delta-tree-model.md`](../architecture/adr/ADR-004-delta-tree-model.md)  
関連 Accepted: [`ADR-002-slir-schema.md`](../architecture/adr/ADR-002-slir-schema.md) · [`ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md)

> **本ファイルはプロンプト保管。** Accepted ADR を本プロンプトで勝手に上書きしない。  
> 矛盾があれば書き始めず列挙。未決は Open Questions。Product Constitution 変更が要る事項は Board へ。

### 正本（Accepted）との主な差分 / 採番注意

| 本プロンプト案 | Accepted 正本 |
|----------------|---------------|
| Status Draft · 出力 `docs/architecture/ADR-004-Delta-Tree-v0.1.md` | Accepted · `docs/architecture/adr/ADR-004-delta-tree-model.md` |
| Candidate を `type:"Candidate"` ノード | `kind: modified`（等）+ `confidence: "candidate"` · Deleted+Added 強制なし |
| MATCH_CANDIDATE 名 | Match Map の `confidence: "candidate"`（ADR-003） |
| TextDelta を Deleted/Added 子として保持 | `inlineChanges[]`（replace/insert/delete） |
| Style = `metadataChange: style` | `changeReason: "style"` |
| Image Added/Deleted（内容解析禁止） | Accepted ADR-004 に Image 節は薄い → Open Question / 追記候補 |
| 次工程 ADR-005 **Parser** | 現状 Architecture 一覧の次欠落は **ADR-005 Renderer**（Parser 未採番） |

中核3層（SLIR → Matcher「同じか」→ Delta「変わったか」→ Renderer「見せ方」）は維持。

---

## コピペ用（以下をそのまま投入）

````text
# Smart Diff
# ADR-004 Delta Tree v0.1 作成指示

## Role

あなたは Smart Diff Document Difference Engine の Principal Architect です。

ADR-002 SLIR Schema v0.1
ADR-003 Matcher Engine v0.1

を前提として、

比較結果を表現する
Delta Treeモデルを設計してください。

**リポジトリに Accepted の ADR-002〜004 がある場合:**
既存正本を開き整合を確認する。矛盾があれば ADR を書き始めず先に矛盾点を列挙する。
未解決事項を勝手に決定しない。UI語彙・色・ハイライトを混入しない。

前提正本（あれば）:

- docs/architecture/adr/ADR-002-slir-schema.md
- docs/architecture/adr/ADR-003-matcher-engine.md
- docs/architecture/adr/ADR-004-delta-tree-model.md（既にあれば上書きせず差分のみ）
- docs/notes/smart-diff/PRODUCT_CONSTITUTION.md
- docs/notes/smart-diff/UI_CONSTITUTION.md

---

# 1. Delta Treeの役割

Delta Treeは、

「SLIR AとSLIR Bの違いを、人間が確認可能な単位へ変換したモデル」

である。


責務:

Matcher:

「同じものか」

を判断。


Delta Tree:

「何が変わったか」

を表現。


Renderer:

「どう見せるか」

を担当。


---

# 2. Product Constitutionとの接続

Smart Diffの目的:

変更点を示すことで、
確認作業そのものを短縮する。


したがってDelta Treeは、

内部比較結果ではなく、

確認作業単位

として設計する。

---

# 3. ChangeKind v0.1

正式採用:

## Added

新規追加。


例:

新しいParagraph。


---

## Deleted

削除。


例:

以前存在したParagraph。


---

## Modified

同一Nodeだが内容変更。


例:

契約期間:

1年

↓

2年


---

禁止:

Conflict


理由:

ユーザーに判断を丸投げする状態分類であり、
確認作業短縮にならないため。


---

# 4. Moved

Phase1:

非対応。


ただし将来拡張可能な設計。


禁止:

Modifiedとして偽装。


理由:

移動と内容変更は意味が異なる。


---

# 5. Candidate Match処理

ADR-003で定義した。


MATCH_CANDIDATE:

状態として保持。


Delta Treeでは以下を表現可能にする。


例:


{
 type:"Candidate",
 sourceNode,
 targetNode,
 confidence
}


ただし、

自動的にModifiedへ変換しない。


理由:

誤った同一性判断は、
確認作業を増やすため。


---

# 6. Node Level Diff

Delta Treeは階層を保持する。


例:


DocumentDelta

↓

SectionDelta

↓

ParagraphDelta


↓

TextDelta


---

# 7. Paragraph Diff

基本単位。


例:


Before:

契約期間は1年間とする。


After:

契約期間は2年間とする。


結果:


Paragraph

 Modified


TextDelta:

1年

Deleted


2年

Added


---

# 8. Text Diff

利用:

diff-match-patch


ただし、

そのまま表示しない。


Semantic Cleanup後の結果を保持。


---

# 9. Style変更

重要。


SLIRでText metadataとして保持する。


Delta Treeでは分類する。


例:

文字:

変更なし


Style:

太字追加


結果:


Modified

metadataChange:

style


とする。


本文変更とは分離可能にする。


---

# 10. Annotation変更

Annotationは本文とは別管理。


禁止:

コメント追加
=
本文Modified


例:


本文:

Unchanged


Annotation:

Added


として保持。


---

# 11. Table扱い

Product Constitution準拠。


Phase1:

TableBlock単位。


例:


Table changed


まで。


禁止:

Cell Delta


Row Delta


Phase2。


---

# 12. Image扱い

Phase1:


存在差分のみ。


例:


Image Added


Image Deleted


画像内容解析は禁止。


---

# 13. Delta Tree Schema

TypeScript型を意識したJSON Schemaレベルで定義。


例:


DeltaNode:


{
 id,
 kind,
 source,
 target,
 children,
 metadata
}


など。


ただしコード生成は禁止。


---

# 14. UI非依存

禁止:

- red
- green
- highlight
- sidebar
- button


などUI語彙。


Delta Treeは純粋なデータモデル。


---

# 15. ADR構成

以下。


# ADR-004 Delta Tree v0.1


## Status

Draft


## Context


## Decision


## ChangeKind Definition


## Delta Structure


## Candidate Match Handling


## Non Goals


## Rejected Alternatives


## Open Questions


---

# 16. Rejected Alternatives

必ず記載。


Rejected:

- Conflict分類
- Pixel Difference as primary diff
- Table Cell Diff Phase1
- Annotation as Content Change
- UI状態をDelta Treeへ混入


---

# 出力

保存先:

docs/architecture/ADR-004-Delta-Tree-v0.1.md


Markdown。

技術者が実装可能な粒度。

コードではなく設計文書として作成。

（既存 Accepted 正本がある場合の推奨: 上書きせず、差分・Open Questions のみ。正本パスは docs/architecture/adr/ADR-004-delta-tree-model.md）
````

---

## 中核3層（固定）

```text
SLIR（ADR-002）
  ↓ 何が同じか
Matcher（ADR-003）
  ↓ 何が変わったか
Delta Tree（ADR-004）
  ↓ どう見せるか
Renderer（現状 ADR-005 欠落）
```

| 状態 | 成果物 | 目的 |
|------|--------|------|
| 完了 | ADR-002 SLIR | 比較対象の正規形 |
| 完了 | ADR-003 Matcher | 同一性判定 |
| 完了 | ADR-004 Delta Tree | 変更表現 |
| 次（Architecture 一覧） | **ADR-005 Renderer** | UI 表示 |
| 未採番 | Parser Architecture | DOCX/PDF/HTML/MD → SLIR |

本プロンプト末尾の「次は ADR-005 Parser」は **採番案**。Parser を先にすると抽出できるもの基準になりやすい、という設計順の注意は有効。番号は Board で Renderer と整理する。

## 関連

| 用途 | パス |
|------|------|
| Delta 正本（Accepted） | [`../architecture/adr/ADR-004-delta-tree-model.md`](../architecture/adr/ADR-004-delta-tree-model.md) |
| ADR-002 / 003 作成指示 | [`smart-diff-adr-002-slir-schema-COPYPASTE.md`](smart-diff-adr-002-slir-schema-COPYPASTE.md) · [`smart-diff-adr-003-matcher-engine-COPYPASTE.md`](smart-diff-adr-003-matcher-engine-COPYPASTE.md) |
| Architecture 入口 | [`../notes/smart-diff/ARCHITECTURE.md`](../notes/smart-diff/ARCHITECTURE.md) |
