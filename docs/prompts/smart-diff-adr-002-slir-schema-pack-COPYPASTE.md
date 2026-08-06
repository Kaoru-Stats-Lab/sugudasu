# Cursor Task: Smart Diff SLIR Schema v0.1（ADR-002）作成指示

**用途:** Cursor 投入用 COPYPASTE  
**成果物（作成済み Proposed Pack）:**

- [`docs/architecture/slir/ADR-002-Smart-Diff-SLIR-Schema-v0.1.md`](../architecture/slir/ADR-002-Smart-Diff-SLIR-Schema-v0.1.md)
- [`docs/architecture/slir/schema/SLIR-v0.1.md`](../architecture/slir/schema/SLIR-v0.1.md)
- [`docs/architecture/slir/decisions/rejected-alternatives.md`](../architecture/slir/decisions/rejected-alternatives.md)

**注意:** Accepted 正本 [`docs/architecture/adr/ADR-002-slir-schema.md`](../architecture/adr/ADR-002-slir-schema.md) は **上書き禁止**（Board 承認後のみ）。本指示の TextRun 採用は Accepted（TextSpan）と衝突する。

---

（以下、投入プロンプト本文）

# Cursor Task: Smart Diff SLIR Schema v0.1（ADR-002）作成

## Role

あなたは Smart Diff の Software Architecture 担当です。目的はコードを書くことではありません。

Document Difference Engine の中核となる中間表現 **SLIR** の v0.1 Schema と ADR-002 を作成してください。

## 前提（変更禁止）

目的: 変更点を示すことで確認作業を短縮する。  
SLIR: 表示モデルではなく比較用中間表現。Renderer は SLIR を直接参照しない。

```text
Parser → Normalizer → SLIR → Matcher / Diff Engine → Delta Tree → Renderer
```

## 既存 ADR 整合

ADR-001: Viewer DOM / PDF 描画構造 / Word XML のそのまま持ち込み禁止。

## 修正済み設計判断

1. Path Based Stable ID 禁止。Identity Score は Matcher。Stable ID は結果であり Parser が決定しない。
2. Table は TableBlock まで。Row/Cell Diff 禁止（Phase2）。
3. TextRun 採用。「Word XML 持ち込みではない」「比較上必要な最小 Inline 単位」。

## 必須章立て

Context · Decision · SLIR Layer · Node Schema · Identity Responsibility · Parser Boundary · Diff Boundary · Non Goals · Future Extension · Rejected Alternatives

## 成果物

1. ADR-002 Smart Diff SLIR Schema v0.1.md
2. schema/SLIR-v0.1.md
3. decisions/rejected-alternatives.md

## 完了条件

Product 矛盾なし · Stable ID 再発なし · Table Phase2 · TextRun 理由明文化 · Parser/SLIR 境界 · Renderer 非依存 · Delta 接続可能

次工程: ADR-003 Matcher Engine（Identity Score · 候補ゾーン · Node Matching）。
