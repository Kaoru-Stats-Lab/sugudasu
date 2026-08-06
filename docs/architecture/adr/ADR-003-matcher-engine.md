# ADR-003 Matcher Engine v0.1

| 項目 | 値 |
|------|-----|
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Scope** | Smart Diff · Matcher Engine（責務境界 · Identity Score · Match Map） |
| **Related** | [`ADR-002-slir-schema.md`](ADR-002-slir-schema.md) · [`../../notes/smart-diff/ADR-001-origin-metadata.md`](../../notes/smart-diff/ADR-001-origin-metadata.md) · [`../../notes/smart-diff/PRODUCT_CONSTITUTION.md`](../../notes/smart-diff/PRODUCT_CONSTITUTION.md) · [`../../notes/smart-diff/UI_CONSTITUTION.md`](../../notes/smart-diff/UI_CONSTITUTION.md) · [`../../notes/smart-diff/ARCHITECTURE.md`](../../notes/smart-diff/ARCHITECTURE.md) · [`ADR-004-delta-tree-model.md`](ADR-004-delta-tree-model.md) · **ADR-005**（Renderer · 未作成） |

> **正本:** Identity Score・Match Map・Matcher 責務境界は本 ADR。UI 文言・Delta 表現は ADR-004。Schema は ADR-002。

---

## Status

Accepted

---

## Context

Matcher Engine は Document Difference Engine の信頼性を決める中核である。

責務は次のみ:

> **2 つの SLIR Tree 間で、同じ意味単位が存在するかを推定する。**

パイプライン（既存 Architecture / ADR-002 と整合）:

```text
SLIR Node（tempId のみ · Stable ID なし · ADR-002）
  ↓
Matcher Engine（本 ADR）
  ↓
Match Map
  ↓
Delta Tree（ADR-004）
  ↓
Renderer / Export layer（ADR-001）
```

### 上位決定（維持）

| 決定 | 出典 |
|------|------|
| Table Diff = Phase2 | Product Constitution |
| Move Detection = Phase2 | UI ChangeKind · 本 ADR Non Goals |
| Conflict 概念は採用しない | UI Constitution |
| Annotate 依存禁止 | Product Constitution |
| Renderer は Matcher 責務ではない | ADR-001 / ADR-002 |

### Matcher が行わないこと（禁止）

差分表示 · 色付け · UI 判断 · Accept/Reject 管理 · PDF 描画 · Export 生成 · Delta Tree の最終 ChangeKind 文言決定

---

## Decision

1. **Composite Identity Matching** を採用する（Path ID / Parser UUID / Content Hash Only は不採用）。
2. **Identity Score** の正式 Weight / 閾値は本 ADR を正本とする（ADR-002 の暫定表を本 ADR が引き継ぐ）。
3. 出力は **Match Map** であり、Delta Tree ではない。
4. **Candidate（60〜84）は削除しない**。UI / Possible Modified 等の表現は **ADR-004**。
5. MVP は **階層マッチング**（Document → Section → Block → Paragraph → Inline feature）。
6. Table は Atomic（存在・summary・contentHash）。Row/Cell Matching 禁止。
7. Annotation Match は本文 Paragraph Match と **分離**。Comment 追加を本文 Modified に変換しない。
8. Move Detection は MVP 対象外。

---

## Identity Matching Model

### 不採用

| 手法 | 理由 |
|------|------|
| **Path Based ID** | 途中挿入で後続 Node が全変更扱いになる |
| **Parser UUID** | 実行ごとに変わり、同一文書でも Identity が失われる |
| **Content Hash Only** | 小さな文字変更が Deleted+Added になる（例: 株式会社ABC→XYZ は「同じ条項の修正」） |

### 採用: Composite Identity Matching

Node Identity Score（特徴量の加重和）で同一意味単位を推定する。  
SLIR に Stable ID を書き戻さない。Match Map の `oldNodeId` / `newNodeId` は ADR-002 の **tempId** 参照である。

---

## Score Calculation

### Weights（正本）

| Feature | Weight |
|---------|-------:|
| Heading 一致 | 30 |
| Text Similarity | 30 |
| Context 一致 | 25 |
| Position 近似 | 15 |
| **Total** | **100** |

### 閾値

| Score | 判定 | 意味 |
|------:|------|------|
| 85〜100 | **Same Node** | 同一 Node。変更候補（内容差分は後段） |
| 60〜84 | **Candidate** | 同一候補。**自動確定しない** |
| 0〜59 | **Different** | 別 Node |

### Text Similarity（MVP）

- 採用候補ライブラリ: **diff-match-patch**（Similarity 算出用）
- diff-match-patch は Matcher の一部。最終差分表示は Delta Tree（ADR-004）責務
- Paragraph 配下の **TextNode.content**（および必要なら連結テキスト）を特徴に使う。**TextRunNode は存在しない**（ADR-002 · 009 Adopt）。styleSegments は Identity の主因にしない（Style 差分は Delta）

### Context Matching

周辺文脈（前後 Heading / 隣接 Block 等）を評価し、Identity Score へ加算する。

例: Target「第3条 契約期間」に対し、前後が「第2条 契約目的」「第4条 報酬」と整合すれば Context 一致として加点。

### Position Matching

補助情報のみ（Weight 15）。

利用可能: ページ位置 · Block index · BoundingBox（`origin` 由来でも **比較対象は Score 特徴量としてのみ**。Origin Metadata Isolation は維持し、origin 生値を Diff 本文にしない）

ページ追加・レイアウト変更に弱いため主判定にしない。

---

## Matching Flow

MVP: **階層マッチング**

```text
Document
  ↓
Section
  ↓
Block（Heading / Paragraph / List / Table / Unknown 等）
  ↓
Paragraph
  ↓
Inline（TextNode.content 特徴 · TextRunNode なし · styleSegments は Identity 補助にしない）
```

理由: 探索範囲削減 · 誤マッチ低減 · 実務文書の階層と一致。

### Table Handling

Product Constitution 優先。`TableNode` = Atomic Block（ADR-002）。

```text
Table 存在 → summary → contentHash
```

禁止（Phase2）: Row Matching · Cell Matching · Cell Highlight

### Annotation Handling

```text
本文:     Paragraph Match
Annotation: Annotation Match（別管理）
```

禁止: Comment 追加 → 本文 Modified への変換

### Move Detection

MVP 対象外（複雑性増）。将来候補: Patience Diff · Histogram Diff（本 ADR では採用しない）。

---

## Candidate Handling

- Candidate は **Matcher Engine 内部状態**（Match Map の `confidence: "candidate"`）
- **削除しない**（誤った Deleted+Added より不確実性の明示が Smart Diff の価値に合う）
- Delta Tree 上の表現（`confidence: "candidate"` 等）は [`ADR-004-delta-tree-model.md`](ADR-004-delta-tree-model.md)。UI 文言は **ADR-005**
- 本 ADR では UI 文言を決めない

---

## Output Model

Matcher 出力 = **Match Map**（Delta Tree ではない）。

```typescript
type MatchConfidence = "high" | "candidate" | "none";

/** Same Node または Candidate */
type MatchEntry = {
  oldNodeId: string; // SLIR tempId
  newNodeId: string; // SLIR tempId
  score: number;
  confidence: "high" | "candidate";
};

/** Different（片側のみ） */
type UnmatchedEntry = {
  oldNodeId: string;
  newNodeId: null;
  confidence: "none";
  // または new 側のみ: oldNodeId: null, newNodeId: string
};

type MatchMap = Array<MatchEntry | UnmatchedEntry>;
```

`confidence: "high"` ⇔ Same Node（85+）。`"candidate"` ⇔ 60〜84。

---

## Non Goals

- 差分表示 · 色付け · Accept/Reject · PDF 描画 · Export
- UI 文言 · ChangeKind 最終表現（UI Constitution / ADR-004）
- Delta Tree スキーマ（ADR-004）
- Table Row/Cell Matching · Move Detection（Phase2）
- Conflict 概念
- Annotate ツール連携
- SLIR への Stable ID 書き戻し
- TextRunNode の再導入（009 Adopt で確定 Reject）
- Content Hash Only / Path ID / Parser UUID を Identity とする

---

## Consequences

**メリット**

- 小さな修正を Deleted+Added に潰しにくい
- Candidate で不確実性を保持できる
- SLIR / Renderer / Delta と責務分離が明確

**デメリット**

- Matcher 実装・チューニングが必要
- Candidate の後段（ADR-004）設計が必須
- MVP では Move / セル単位一致ができない

---

## Intent（なぜ）

Smart Diff の価値は「見逃すとまずい変更の確認」であり、誤った全削除・全追加表示は JTBD を壊す。Composite Score と Candidate 保持により、意味単位の同一性推定に閉じ、表示は Delta Tree に委ねる。

## Rejected Alternatives

- Path Based ID · Parser UUID · Content Hash Only
- Candidate の自動 Same 昇格または削除
- Matcher が Delta Tree / UI を直接出力
- MVP Move Detection
- Annotation → 本文 Modified 変換

## Future Revisit Conditions

- Pilot で Score 閾値の過検出・見逃しが判例化したとき
- Product が Table Diff / Move を昇格したとき
- ADR-004 が Match Map → Delta 変換契約を固定したとき

---

## Validation Checklist

| 項目 | 結果 |
|------|------|
| ADR-002 SLIR Schema と矛盾していない | OK |
| Stable ID を SLIR へ戻していない | OK（tempId + Match Map） |
| Path Based ID を採用していない | OK |
| TextRun を Matcher 責務（Node）にしていない | OK（TextNode.content · 009 Adopt） |
| Table Diff Phase1 禁止を守っている | OK |
| UI 表現を決めていない | OK（→ ADR-004） |
| Delta Tree 責務を侵食していない | OK（出力 = Match Map） |
