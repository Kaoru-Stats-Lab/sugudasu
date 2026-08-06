# Smart Diff — Golden Fixture Manifest（Wave 6.1）

| 項目 | 値 |
|------|-----|
| **Status** | Fixed for Validation |
| **Date** | 2026-08-06 |
| **Pack** | [`../VALIDATION_PACK.md`](../VALIDATION_PACK.md) |
| **Ledger** | [`Expected_Delta_Ledger.md`](Expected_Delta_Ledger.md) |
| **実装** | **変更なし**（検証資産のみ） |

> 変更量は **10〜15 / 文書**。多すぎると被験者が比較対象を理解できなくなる。

---

## Fixture A — `V-A-contract`

| Field | Value |
|-------|-------|
| **Fixture ID** | `V-A-contract` |
| **Persona** | 総務 · 法務 |
| **Document Type** | 業務委託契約書 |
| **Format** | DOCX |
| **Purpose** | 「全文読み直し」vs Navigator 確認の時間・見落とし比較。条番号は動かさず中身だけ変える。 |
| **Expected User Task** | 旧・新契約書の変更箇所をすべて確認し「完了」と告げる |
| **Expected Change Count** | **10** |
| **Expected Change Location** | 第1条期間 · 第3条責任 · 第5条報酬 · 第7条再委託 · 第8条秘密 · 第9条通知 · 別表料金 · 前文 · 第6条解除 · 第4条成果物 |
| **Expected Smart Diff Behavior** | Heading「第N条」は Unchanged のまま本文 Modified/Added/Deleted。表は `table_changed` + UI/Export「表に変更があります」。Cell Diff なし。 |

**必須変更（要約）**

1. 契約期間 12ヶ月 → 24ヶ月  
2. 責任「甲が負担する」→「甲乙協議する」  
3. 金額 月額300,000円 → 350,000円  
4. 条番号は変更しない  

---

## Fixture B — `V-B-work-rules`

| Field | Value |
|-------|-------|
| **Fixture ID** | `V-B-work-rules` |
| **Persona** | 人事 · 総務 |
| **Document Type** | 就業規則（抜粋） |
| **Format** | DOCX |
| **Purpose** | 文言・太字・箇条・表が混在しても Navigator で追えるか。Table Cell Diff を期待しないことの確認。 |
| **Expected User Task** | 就業規則の改訂差分をすべて確認する |
| **Expected Change Count** | **11** |
| **Expected Change Location** | 総則 · 労働時間 · 休日表 · 服務 · 懲戒 · 附則 等 |
| **Expected Smart Diff Behavior** | `style_only` は Modified（Filter/Style 次第で可視）。箇条 Added。表は Atomic「表に変更があります」のみ。Cell 座標を出さない。 |

---

## Fixture C — `V-C-construction-plan`

| Field | Value |
|-------|-------|
| **Fixture ID** | `V-C-construction-plan` |
| **Persona** | 建設業 現場管理 |
| **Document Type** | 施工計画書 / 工程関連（抜粋） |
| **Format** | PDF |
| **Purpose** | SUGUDASU 親和性。PDF 構造限界（Reading Order · 改ページ · OCR外）を Loss 込みで検証。 |
| **Expected User Task** | PDF 新旧の変更を確認する（OCR は対象外と明示してよい） |
| **Expected Change Count** | **8**（PDF ノイズを踏まえ契約より少なめ） |
| **Expected Change Location** | 表紙日付 · 工程名 · 数量 · 工期 · ページ跨ぎ本文 · （任意）2段組注記 |
| **Expected Smart Diff Behavior** | 抽出可能な Text は差分化。2段組等は Loss `reading_order_uncertain`。スキャンのみ頁は `ocr_required` · 比較対象外。Section ノードは出さない。表は Atomic。 |

---

## Binary 配置（未生成でも Wave 6.1 PASS）

| Fixture | 想定パス（準備タスクで生成） |
|---------|------------------------------|
| V-A | `packages/fixtures/validation/V-A-contract.{old,new}.docx` |
| V-B | `packages/fixtures/validation/V-B-work-rules.{old,new}.docx` |
| V-C | `packages/fixtures/validation/V-C-construction.{old,new}.pdf` |

Wave 6.1 の完了条件は **Manifest + Ledger（人間が5分で読める正解表）**。実バイナリは Wave 6.2 前に用意する。

---

## Validation 目的（一覧）

| ID | 一文 |
|----|------|
| V-A | 条を動かさず中身10変更を、並べ確認より速く・漏らさず潰せるか |
| V-B | 様式混在（太字・箇条・表）でも「どこを見ればいいか」迷わないか |
| V-C | 建設 PDF で Text 差分が使え、限界は Loss として受容できるか |
