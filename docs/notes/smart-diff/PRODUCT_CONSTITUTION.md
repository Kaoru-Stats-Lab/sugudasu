# Smart Diff — Product Constitution

**更新:** 2026-08-06  
**Identity:** Product Constitution（Smart Diff / 変更確認専用 · 全体 [`docs/product/PRODUCT_CONSTITUTION.md`](../../product/PRODUCT_CONSTITUTION.md) とは別）  
**索引:** [`DESIGN_PACK_MANIFEST.md`](DESIGN_PACK_MANIFEST.md)  
**公開面:** **`/smart-diff`** · productName **SUGUDASU 変更確認（Smart Diff）** · id `smart-diff`  
**隣接:** テキスト貼付比較は既存 **`/diff`（差分チェック）** に残す（MECE 分離）。  
**UI:** [`UI_CONSTITUTION.md`](UI_CONSTITUTION.md) · **HOW:** [`ARCHITECTURE.md`](ARCHITECTURE.md) · ADR（SLIR = [`../../architecture/adr/ADR-002-slir-schema.md`](../../architecture/adr/ADR-002-slir-schema.md)）  
**命名:** [`PRODUCT_NAMING.md`](PRODUCT_NAMING.md)

> 上位 Product Constitution と同じ判定順に従う。技術・作れそう・ブランドコピーから始めない。  
> **Architect 2026-08-06:** 表示名は「変更確認」を主語、Smart Diff は補助名称。Validation 価値（承認信頼）と名前を一致させる。

---

## Why（前文 · 判定本文ではない）

文書改訂のあと、変更箇所を一覧から確認し、全文確認の心理的負担を減らして承認判断できるようにする。

---

## 判定順

```text
Persona
  ↓
JTBD（Pain）
  ↓
Market
  ↓
Constraints（F1〜F7 含む）
```

---

## Persona

契約書・規程・施工計画などの改訂を、登録なしで確認し承認してよいか判断したい人（`/smart-diff` を開く）。

---

## JTBD（Pain）

**Job:** 変更箇所を一覧から追い、見逃すとまずい変更を確認したうえで承認判断する。

**Success（変更確認単体で完結）:**

- 変更一覧だけで必要な箇所に到達できた
- 全文に戻らず承認判断できた（Trust）
- 必要なら PDF レポートで持ち帰れた

**Success に置かない:** テキスト貼付 Diff の代替（それは `/diff`）· AI 要約 · セル Diff 全面。

---

## Market

公開 URL `/smart-diff`（id `smart-diff`）。貼り付けテキスト Diff は `/diff`。市場性の詳細は全体 [`PRODUCT_IDEA_JUDGMENT_LEDGER.md`](../PRODUCT_IDEA_JUDGMENT_LEDGER.md) に従う。

---

## Constraints

上位 F1〜F7・Browser 完結・非送信・登録不要に適合する範囲。Enterprise / 大容量 / チームレビュー等は Sync 候補（Browser に載せない）。

### Table Diff

**対象外（MVP）** — TableNode atomic。Cell Diff は Phase2。

**使わない文言:** 「需要が低い」（採否理由にしない）。

---

## 設計参照（HOW · 正本は ADR）

| 題 | 正本 |
|----|------|
| Architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Validation | [`VALIDATION_PACK.md`](VALIDATION_PACK.md) · [`validation/WAVE6.3_FOCUS.md`](validation/WAVE6.3_FOCUS.md) |
