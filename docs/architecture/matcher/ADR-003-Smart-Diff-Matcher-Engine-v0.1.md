# ADR-003

| 項目 | 値 |
|------|-----|
| **Title** | Smart Diff Matcher Engine / Stable Identity Design v0.1 |
| **Status** | **Proposed** |
| **Date** | 2026-08-06 |
| **Decision Makers** | Board（レビュー後に Accepted 化判断） |
| **Related** | SLIR Pack / Accepted ADR-002 · Accepted ADR-003 · Delta ADR-004 · Product / UI Constitution |
| **詳細** | [`matcher-design.md`](matcher-design.md) |
| **Accepted 現行（変更禁止）** | [`../adr/ADR-003-matcher-engine.md`](../adr/ADR-003-matcher-engine.md) |
| **作成 Task** | [`../../prompts/smart-diff-adr-003-matcher-engine-CREATE-TASK.md`](../../prompts/smart-diff-adr-003-matcher-engine-CREATE-TASK.md) |

> **Proposed Draft。** Diff Algorithm 実装仕様ではない。Matcher が何を判断し、何を判断しないかを固定する ADR。  
> Identity Score 数値は Accepted と一致（第二正本を作らない）。

---

## 1. Status

**Proposed**

---

## 2. Context

SLIR が「何を比較するか」なら、Matcher は **「同じ意味単位が変化したもの」を認識するか** の定義である。

```text
Parser → Normalizer → SLIR → Matcher → Delta Tree → Renderer
```

Matcher は SLIR と Delta Tree の間に存在する。Smart Diff の差別化（人間が確認しやすい差分）のコア層。

---

## 3. Decision

1. **Stable Identity** は SLIR Node が固定 ID を持つ問題ではなく、**Matcher が比較時に推定する問題**として扱う。
2. Path Based ID · Random UUID Only を Identity とする案は **Reject**。
3. **Identity Score** 正本 = Heading 30 · Context 25 · Text Similarity 30 · Position 15（合計 100）。
4. **Threshold** = ≥85 Same · 60–84 Candidate · &lt;60 Different。
5. 出力は **Node Relationship / Match Map**。ChangeKind の完全決定はしない（Delta Tree）。
6. Candidate 状態は存在する。Delta 表現 · UI · 自動確定は **ADR-004**（本 ADR で勝手に UI 決定しない）。
7. Candidate を自動 Deleted+Added へ変換しない（原則）。
8. Move / Cell / AI Matching は Phase1 Out of Scope。
9. GumTree 系は参考のみ · Phase1 採用判断しない。

### Accepted との関係

数値・閾値・Match Map・Candidate 保持は Accepted と同趣旨。本 Draft は Stable Identity 設計言語・Flow・OQ・ChangeKind 境界をレビュー用に再整理する。実装 SSOT は Accepted のまま。

---

## 4. Stable Identity Constraint

### Reject: Path Based ID

例: `1` / `1.2` / `1.2.4`

理由: 文書途中への挿入で後続 Node の ID が変化し、変更されていない Node が Modified 扱いになる。

### Reject: Random UUID Only

理由: 同じ文書を再 Parse すると全 Node が別 ID になる。

### Adopt: Matcher 推定

比較時の Identity Score により同一候補を推定する。SLIR の `id` は一時参照のみ。

---

## 5. Matcher Responsibility

### Input

- Before SLIR
- After SLIR

### Output — Node Relationship

例:

| Relationship | 意味 |
|--------------|------|
| Same | 同一 Node（Strong · ≥85） |
| Modified Candidate | 同一候補だが確信不足（Candidate · 60–84）※命名は Match Map と整合 |
| Added | After のみ（Different 由来） |
| Deleted | Before のみ（Different 由来） |

Accepted Match Map 表記: `confidence: high | candidate | none`。用語統一は Board。

### Does NOT Do

- UI 表示判断
- Redline 生成
- Accept/Reject 管理
- Renderer 制御
- AI 意味理解
- OCR 補正
- ChangeKind の最終確定（内容のどう変化したか）

---

## 6. Identity Score（正本 · 唯一）

| 項目 | Score |
|------|------:|
| Heading similarity | 30 |
| Context similarity | 25 |
| Text similarity | 30 |
| Position proximity | 15 |
| **Total** | **100** |

### Threshold

| Score | 判定 | 意味 |
|------:|------|------|
| ≥85 | Same Node | 同一 Node が変更された可能性が高い |
| 60–84 | Candidate Match | 同一候補だが確信不足 |
| &lt;60 | Different Node | 別 Node |

Weight tuning は実データ評価が必要（OQ-001）。数値正本を他文書に複製しない。

---

## 7. Candidate Match

候補状態は存在する。

本 ADR では **決めない**（ADR-004）:

- Delta Tree でどう表現するか
- UI で表示するか
- 自動確定するか

原則記載: 自動 Deleted+Added 変換はしない。

---

## 8. Matching Features

| Feature | 利用 | 注意 |
|---------|------|------|
| Heading Similarity | heading level · normalized text | Heading なし Paragraph は 0 点帯 |
| Context Similarity | 前後 Node | 同じ文章位置かの判断を補助 |
| Text Similarity | TextRun / Paragraph text | 参考: diff-match-patch |
| Position Proximity | Document order | **補助のみ** · Identity の主情報ではない |

---

## 9. Algorithm Reference

| 層 | 参考 | Phase1 |
|----|------|--------|
| Text | google diff-match-patch | Similarity 用途候補 |
| Sequence | Myers · Patience | Node 列アライメント参考 |
| Tree | GumTree | **採用判断しない**（将来） |

実装詳細・必須依存は本 ADR 外。

---

## 10. Matching Flow

例:

```text
Before: Document → Heading A · Paragraph X · Paragraph Y
After:  Document → Heading A · Paragraph X' · Paragraph Y
```

Flow:

1. Candidate generation（同一 type 等）
2. Identity Score calculation
3. Relationship assignment（Same / Candidate / Different→Added|Deleted 材料）
4. Delta Tree へ渡す（Match Map）

---

## 11. ChangeKind との境界

| 層 | 問い |
|----|------|
| **Matcher** | 同じものか |
| **Delta Tree** | どう変化したか |

Matcher は ChangeKind を完全決定しない。

---

## 12. Phase1 Scope / Out of Scope

**対象:** Heading · Paragraph · TextRun · List · Image · Table Atomic

**禁止:** Move Detection · Table Cell Matching · Semantic AI Matching · Cross-document entity recognition

---

## 13. Open Questions

| ID | 内容 | 送り先 |
|----|------|--------|
| **OQ-001** | Identity Score weight tuning | 実データ評価後 · 本 ADR 数値更新規則 |
| **OQ-002** | Candidate Match UX | ADR-004（+ Renderer） |
| **OQ-003** | Move Detection | Phase2 |

---

## 14. Rejected Alternatives

| 案 | 理由 |
|----|------|
| Hash Only | 一文字変更で別物（例: 株式会社ABC→XYZ） |
| Position Only | 挿入削除に弱い |
| Path Based ID | 後続 ID 連鎖変化 |
| Random UUID Only | 再 Parse で全変更 |
| AI Semantic Matching | Local First · Non Send · Explainability 不足 |

---

## Review Checklist

| 項目 | 結果 |
|------|------|
| Stable ID を SLIR 固定にしていない | OK |
| Score 正本が一つ | OK（Accepted 同値） |
| Candidate を捨てていない · UX を勝手決めしていない | OK |
| ChangeKind を完全決定していない | OK |
| Move/Cell/AI を Phase1 に入れていない | OK |
| コード / Implementation Detail なし | OK |
| Accepted 未変更 | OK |

---

## Intent

「同じ条項が変わった」を人間認知に合わせて追跡する。雑な Matcher は Word Compare との差別化（確認しやすい差分）を壊す。

次: **ADR-004 Delta Tree**（Added / Deleted / Modified / Candidate / Annotation / Table 通知の表示モデル接続）。
