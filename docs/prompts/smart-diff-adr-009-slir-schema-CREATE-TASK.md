# Cursor Task: ADR-009 SLIR Schema Accepted化 CREATE TASK

**用途:** Cursor 投入用 COPYPASTE  
**成果物:** `docs/architecture/slir/` 配下の **Accepted 候補 ADR-009**（既存 Accepted ADR-002 を無断置換しない）  
**前提:** ADR-008 Option C（TextNode + styleSegments）を反映  
**後工程:** ADR-009 レビュー通過後に Renderer（既存 Pack ADR-005 / 採番案 010）

---

# 以下を Cursor に投入

```markdown
# Smart Diff ADR-009 SLIR Schema Accepted化 CREATE TASK

## Role

Software Architect。目的は SLIR Schema を Accepted 候補として整理すること。
実装コード禁止。Schema そのものより「何を入れ、何を絶対に入れないか」を固定する。

---

# 絶対条件

- docs/architecture/adr/ADR-002-slir-schema.md（Accepted）を無断で書き換えない
- 矛盾は差分表 + Board Adopt 手順として書く
- ADR-003/004/007/008 の責務を再発明しない

---

# パイプライン

```text
Parser (007) → Raw → Normalizer (008) → SLIR (009) → Matcher (003) → Delta (004) → Renderer
```

SLIR = 比較前の意味契約。Diff 結果・UI・Identity 決定を持たない。

---

# 必須決定

## 1. Node 構造（推奨を確認し確定）

```typescript
DocumentNode
SectionNode
HeadingNode
ParagraphNode
TextNode
ListNode
ListItemNode
TableNode
ImageNode
AnnotationNode
```

Unknown / Loss Aware 用ノードも定義可。

## 2. TextNode（ADR-008 反映）

```typescript
TextNode {
  content: string
  styleSegments?: [
    { start: number, end: number, style: Style }
  ]
  origin?: OriginReference  // 隔離 · Diff 非消費
}
```

TextRunNode を SLIR 公開型にしない（Word Run 漏洩防止）。
ADR-002 Proposed の TextRunNode との差分を明記し、Adopt 時は Accepted を最小更新する手順を書く。

## 3. Table

入れる: TableNode（Atomic）
入れない: RowNode / CellNode
理由: SLIR 保持と Diff 対象は別 · Phase1 は Table changed まで

## 4. Annotation

本文と分離。targetRef。本文 Modified にしない（Delta 側と整合）。

---

# 禁止（必ず明記）

### Stable ID
Matcher 責務。SLIR に入れない（一時 id のみ可）。

### ChangeKind
Delta Tree 責務。SLIR に入れない。

### UI 情報
highlightColor / displayPosition / expanded / collapsed 等 禁止。

### Diff 結果
SLIR は比較前。Match Map / Delta を埋め込まない。

---

# 責務境界チェック

| 層 | SLIR に入れないもの |
|----|---------------------|
| Parser | Format native の生露出 |
| Normalizer | 推測を confidence なしで確定したふり |
| Matcher | score / same-or-not |
| Delta | added/deleted/modified |
| Renderer | color / layout |

---

# 出力

1. docs/prompts/smart-diff-adr-009-slir-schema-CREATE-TASK.md（本ファイル）
2. docs/architecture/slir/ADR-009-SLIR-Schema-Accepted-Candidate-v0.1.md
3. docs/architecture/slir/schema/SLIR-v0.1.md を TextNode+segments に整合更新（Proposed）
4. Manifest / ARCHITECTURE 入口のみ更新

---

# 完了条件

- 入れる Node 一覧が固定
- 入れないもの（禁止）が固定
- TextNode が ADR-008 と一致
- Table Atomic / Annotation 分離
- Accepted ADR-002 との差分と Adopt 手順がある
- Renderer へ進んでよい状態かが判断できる
```
