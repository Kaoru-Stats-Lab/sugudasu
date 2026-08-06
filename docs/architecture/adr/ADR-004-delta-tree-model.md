# ADR-004 Delta Tree Model v0.1

| 項目 | 値 |
|------|-----|
| **Status** | Accepted |
| **Date** | 2026-08-06 |
| **Scope** | Smart Diff · Delta Tree（Match Map → 人間が確認可能な変更モデル） |
| **Related** | [`ADR-002-slir-schema.md`](ADR-002-slir-schema.md) · [`ADR-003-matcher-engine.md`](ADR-003-matcher-engine.md) · [`../../notes/smart-diff/ADR-001-origin-metadata.md`](../../notes/smart-diff/ADR-001-origin-metadata.md) · [`../../notes/smart-diff/PRODUCT_CONSTITUTION.md`](../../notes/smart-diff/PRODUCT_CONSTITUTION.md) · [`../../notes/smart-diff/UI_CONSTITUTION.md`](../../notes/smart-diff/UI_CONSTITUTION.md) · [`../../notes/smart-diff/ARCHITECTURE.md`](../../notes/smart-diff/ARCHITECTURE.md) · **ADR-005**（Renderer · 未作成） |

> **正本:** Delta Tree Schema · ChangeKind（変更単位）· Candidate 保持 · Inline / Style / Annotation / Table の Delta 表現。UI・色・CSS は本 ADR に書かない（→ ADR-005）。

---

## Status

Accepted

---

## Context

Delta Tree は Smart Diff における「何が変わったか」を表す中間モデルである。

責務:

> **Matcher Engine の同一性判断結果（Match Map）を、人間が確認可能な変更単位へ変換する。**

```text
Parser → SLIR（ADR-002）
  → Matcher Engine → Match Map（ADR-003）
  → Delta Tree（本 ADR）
  → Renderer（ADR-005 · 入力は Delta Tree のみ）
```

### 上位決定（維持）

| 決定 | 出典 |
|------|------|
| ChangeKind = Added / Deleted / Modified | UI Constitution |
| Conflict 禁止 | UI Constitution |
| Move = Phase2 | UI Constitution |
| Table Diff = Phase2 | Product Constitution |
| Renderer 入力 = Delta Tree | Architecture / ADR-002 |
| SLIR と Delta は別モデル | 本 ADR |

### Delta Tree が担当すること

- 変更種別（ChangeKind）
- Before / After 参照（SLIR tempId）
- Confidence（high / candidate）
- 階層化された変更状態
- Inline 差分情報の保持

### 担当しない（禁止）

色 · CSS · UI 配置 · ボタン状態 · Accept/Reject · PDF 座標描画 · Export 形式 · Matcher 再実行 · SLIR 同士の直接比較

---

## Decision

1. Delta Tree は SLIR のコピーではない。**変更状態を持つ別モデル**とする。
2. **ChangeKind** は `added` | `deleted` | `modified` のみ（Conflict / Moved 禁止）。
3. 階層維持のため構造上 `unchanged` を許す。これは **ChangeKind ではない**（フィルター対象の「変更」に含めない）。
4. ADR-003 の Candidate は `confidence: "candidate"` で保持し、Deleted+Added へ強制変換しない。
5. Inline / Style 差分は Delta が結果を保持する（アルゴリズムは Matcher 責務ではない）。
6. Annotation Delta は本文 Delta と分離する。
7. Table は Atomic（Added / Deleted / Modified のみ）。Row/Cell Delta 禁止。
8. Renderer の入力契約は **Delta Tree のみ**。

---

## ChangeKind Definition

UI Constitution と整合する **変更単位**（ユーザーが「変わった」と認識する種別）:

### Added

新 Node のみ存在。

例: 旧なし → 新「追加条項」

### Deleted

旧 Node のみ存在。

例: 旧「有効期間5年間」→ 新なし

### Modified

Matcher が同一 Node（Same または Candidate）と判断したが内容が変更。

例: 契約期間 1年間 → 2年間

### Forbidden ChangeKind

| Kind | 扱い |
|------|------|
| **Conflict** | 禁止（判断責任をユーザーへ戻さない） |
| **Moved** | Phase2（高度な移動検出が必要） |

### Structural `unchanged`（ChangeKind 外）

本文不変・子に Annotation Added がある場合など、階層を保つために Node を残す:

- Paragraph: `kind: "unchanged"`
- Annotation: `kind: "added"`

`unchanged` を UI の ChangeKind フィルターに「変更」として載せない。表示の見せ方は ADR-005。

---

## Delta Tree Schema

```typescript
type ChangeKind = "added" | "deleted" | "modified";

/** 階層用。ChangeKind ではない */
type DeltaKind = ChangeKind | "unchanged";

type DeltaConfidence = "high" | "candidate";

type InlineChange = {
  type: "replace" | "insert" | "delete";
  before?: string;
  after?: string;
};

type ChangeReason = "content" | "style" | string;

interface DeltaNode {
  id: string;
  kind: DeltaKind;

  /** SLIR tempId（ADR-002）。存在側のみ */
  oldNodeRef?: string;
  newNodeRef?: string;

  /**
   * Same / Candidate 由来。
   * added/deleted で Matcher が none の場合は省略可。
   */
  confidence?: DeltaConfidence;

  /** Modified 時の理由。style のみ変更を本文変更と混同しない */
  changeReason?: ChangeReason;

  /** Paragraph 等の文字差分保持。計算自体は本モデル外 */
  inlineChanges?: InlineChange[];

  children: DeltaNode[];
}

interface DeltaTree {
  root: DeltaNode; // 通常 type 相当の document 階層
}
```

### Match Map → Delta（変換契約 · 要約）

| Match Map | Delta |
|-----------|--------|
| high + 内容同一 | `unchanged`（または省略方針は実装詳細 · モデル上は可） |
| high + 内容差 | `modified` · `confidence: "high"` |
| candidate | `modified`（または対になる単位）· `confidence: "candidate"` · **Deleted+Added にしない** |
| old only · none | `deleted` |
| new only · none | `added` |

UI 文言（Possible Modified 等）は本 ADR で固定しない → ADR-005。

### 禁止フィールド例

`color` · `isExpanded` · `buttonState` · その他 UI 状態

---

## Candidate Handling

ADR-003: Score 60〜84 = Candidate。削除しない。

Delta Tree:

```typescript
confidence: "candidate"
```

- Deleted + Added へ強制変換しない（誤差分は信頼性を破壊する）
- UI での強調・ラベルは **ADR-005 Renderer**

---

## Inline Difference Model

Paragraph 内部の文字差分を保持可能にする。

例: 「契約期間は1年間」→「契約期間は2年間」

```typescript
inlineChanges: [
  { type: "replace", before: "1", after: "2" }
]
```

注意: 差分計算アルゴリズムは Matcher 責務ではない（ADR-003 の Text Similarity は Identity 用）。  
Delta Builder（Match Map → Delta Tree）が結果を載せる。アルゴリズム選定の詳細は本 ADR 外（必要なら後続 HOW）。

---

## Style Change Handling

ADR-002 **TextNode + styleSegments** と整合（009 Adopt）。スタイルのみ変更:

- `kind: "modified"`
- `changeReason: "style"`（または `changeDetail: style_only`）

比較: 文言は TextNode.content · 書式は styleSegments 差分。  
禁止: スタイルのみを「本文 content 変更」と区別なく扱うこと（`changeReason` なしの content 扱い）。  
Candidate / confidence は Matcher→Delta。**SLIR に candidate を載せない。**

---

## Annotation Handling

本文と分離（ADR-002 / ADR-003 と整合）。

例: 本文変更なし · Comment 追加

```text
ParagraphDelta:  kind = unchanged
AnnotationDelta: kind = added
```

禁止: Comment 追加 → 本文 `modified` への変換。

---

## Table Handling

Product Constitution 優先。MVP: Table = Atomic。

許可: Table `added` | `deleted` | `modified`（contentHash / summary 差）

禁止: Row Delta · Cell Delta · Cell Highlight（Phase2）

---

## Renderer Contract

| 項目 | 契約 |
|------|------|
| 入力 | **Delta Tree のみ**（+ 表示に必要な Origin Metadata は ADR-001 経路で別途。比較し直さない） |
| 禁止 | SLIR を直接比較する · Matcher を呼ぶ · Diff を再計算する |

理由: 比較ロジックと表示ロジックの分離。

ハイライト色 · 2 ペイン · フィルター UI は **ADR-005**。

---

## Non Goals

- UI / CSS / 色 / ボタン / Accept-Reject
- Conflict · Moved（MVP）
- Table Row/Cell Diff
- SLIR の複製を Delta と名乗ること
- Matcher / Identity Score の再定義
- Annotate ツール連携
- Export 形式・PDF 描画手順

---

## Consequences

**メリット**

- Match Map の不確実性（Candidate）を壊さず変更モデル化できる
- Renderer が比較ロジックを持たなくてよい
- Annotation / Style / Inline を本文変更と分離できる

**デメリット**

- Delta Builder 実装が必要
- `unchanged` 階層の扱いを Renderer と契約する必要（ADR-005）
- MVP では移動・セル単位変更を表現できない

---

## Intent（なぜ）

Smart Diff の価値は確認可能な変更単位の提示である。Matcher の推定を Deleted+Added に潰すと JTBD が壊れる。Delta Tree は推定結果を構造化し、表示は Renderer に委ねる。

## Rejected Alternatives

- Conflict / Moved を MVP ChangeKind に含める
- Candidate の Deleted+Added 強制変換
- Delta に UI 状態を載せる
- Renderer が SLIR/Matcher を直接叩く
- SLIR Node の浅いコピーを Delta とする
- Annotation を本文 Modified に畳む

## Future Revisit Conditions

- ADR-005 が Candidate / unchanged の表示契約を固定したとき
- Product が Table / Move を昇格したとき
- Pilot で inlineChanges 粒度の過不足が判例化したとき

---

## Validation Checklist

| 項目 | 結果 |
|------|------|
| ADR-002 と矛盾していない | OK |
| ADR-003 Match Map を正しく受ける | OK |
| ChangeKind が Added/Deleted/Modified のみ | OK（`unchanged` は構造用 · ChangeKind 外） |
| Conflict を復活させていない | OK |
| Move Detection を混入していない | OK |
| Table Cell Diff を混入していない | OK |
| UI 仕様を混入していない | OK |
| Renderer 責務を侵食していない | OK（契約のみ · → ADR-005） |
| Delta が SLIR のコピーになっていない | OK |
