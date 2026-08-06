# Cursor Task: Smart Diff Matcher Engine ADR-003 作成指示

**用途:** Cursor 投入用 COPYPASTE  
**成果物（作成済み Proposed Pack）:**

- [`docs/architecture/matcher/ADR-003-Smart-Diff-Matcher-Engine-v0.1.md`](../architecture/matcher/ADR-003-Smart-Diff-Matcher-Engine-v0.1.md)
- [`docs/architecture/matcher/matcher-design.md`](../architecture/matcher/matcher-design.md)

**注意:** Accepted [`docs/architecture/adr/ADR-003-matcher-engine.md`](../architecture/adr/ADR-003-matcher-engine.md) は上書き禁止。Score 数値は Accepted と同一（正本は一つ）。

---

# Cursor Task: Smart Diff Matcher Engine ADR-003 作成

## Role

Architecture 担当。実装ではなく Matcher Engine 設計正本を作る。

成果物: `ADR-003 …md` · `matcher-design.md`

## 前提

```text
Parser → Normalizer → SLIR → Matcher → Delta Tree → Renderer
```

Matcher = 同一性候補。Added/Deleted/Modified · UI · Renderer 情報は禁止。

## 禁止 Identity

Path Based · Content Hash Only · UUID 毎回 · AI Semantic

## Score 正本（唯一）

Heading 30 · Context 25 · Text Similarity 30 · Position 15 = 100

## Threshold

≥85 Strong · 60–84 Candidate · ≤59 No Match

Candidate → Delta Potential Modified。Deleted+Added 自動変換禁止。

## 順序

同一 type → Block → Inline。Table = Block のみ。Annotation 分離。

## 完了条件

Score 一つ · Candidate 定義 · Parser/Matcher 分離 · Delta 境界 · Table Phase2 · AI なし · OSS/Build 明確

次: ADR-004 Delta Tree Schema（Added / Deleted / Modified / Candidate）。
