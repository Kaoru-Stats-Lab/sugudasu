# Smart Diff — Interview Guide（Wave 6.2）

| 項目 | 値 |
|------|-----|
| **Audience** | Evaluator が読み上げ · 被験者には質問のみ見せてよい |
| **Date** | 2026-08-06 |
| **Protocol** | [`SESSION_PROTOCOL.md`](SESSION_PROTOCOL.md) |
| **短縮版** | [`../VALIDATION_INTERVIEW_SCRIPT.md`](../VALIDATION_INTERVIEW_SCRIPT.md) |

> Ledger・変更件数・正解はインタビュー中も出さない。  
> 発言を「慎重だから」「法務だから」と **解釈・補正しない**。理由分析は 6.4。  
> **沈黙も記録**（無言で全文へ＝一覧だけでは判断できず）。  
> 全文復帰は `正常確認` vs `Trust Failure 候補` を分ける。  
> Candidate/Loss の存在自体は失敗にしない（境界理解して判断できたか）。  
> 欲しい機能は **Feature Request** へ隔離（MVP 失敗と直結させない）。

---

## 導入（共通 · 1分）

今日は製品の採点ではなく、**確認作業のやり方の比較**です。正解を急がなくて構いません。思ったことをそのまま話してください。

---

## 条件 A（並べ確認）直後

1. 確認を始めるとき、最初に何をしましたか？  
2. 自信が持てなかった箇所はありますか？  
3. 時間を最も食ったのはどの種類でしたか？（数字 / 文言 / 表 / その他）

---

## 条件 B（Smart Diff）直後 — 必須

1. **最初にどこを見ればよいかわかりましたか？**  
2. **見落としが不安になる箇所はありましたか？**  
3. **差分表示を信用できましたか？**  
4. **全部確認したと思える瞬間はありましたか？**（Confidence）  
5. 「次の変更 / 一覧」は使いましたか？使わなかった理由は？  
6. 「表に変更があります」は分かりましたか？  
7. **「候補」と表示された変更は、確認対象として十分理解できましたか？**（Candidate ≠ Modified · UX）  
8. （V-C）画面の順番と紙のイメージがずれましたか？ / Loss・注意表示は信頼できましたか？  
9. （任意）途中で全文を読み直しましたか？「念のため全部」と思いましたか？

---

## クロージング

1. 日常業務なら A（並べて）と B（Smart Diff）どちらを使いたいですか？理由は？  
2. 足りないものは何ですか？（今は作りません）  
   - Evaluator: **`failure_*`（理解できない）か `wish_phase2`（細かくしたい）か** を必ず分ける。セル単位要望は後者なら MVP 失敗ではない。  
3. 同僚に勧めるなら一言で？  
4. **どこが重要か分かりましたか？**  
5. （成功/失敗コメント）「ここだけ見ればよい」/「一応全部読んだ」等を **同じ重みで** 記録（後者＝Trust 形成失敗）。

---

## タグ付け（Evaluator Only · 事後）

| タグ | 付けるとき |
|------|------------|
| `nav_clear` | 見る場所がすぐ分かった |
| `nav_unused` | Navigator をほぼ使わない |
| `table_where` | 表のどこ？が残った（→ Scope メモ可） |
| `pdf_noise` | PDF の順序・誤認 |
| `candidate_ok` / `candidate_confusing` / `candidate_anxiety` | 確認候補の理解 · 不安 |
| `trust_high` / `trust_low` | 差分表示への信用 |
| `full_read_fallback` | 一覧後に全文へ戻った |
| `confidence_yes` / `confidence_partial` / `confidence_no` | 全部見たか |
| `behavior_success` / `behavior_stop_candidate` / `behavior_stop` / `behavior_go` | [`WAVE6.3_FOCUS.md`](WAVE6.3_FOCUS.md) §1 行動コード |

---

## 記録欄（1セッション）

```text
Q1_where_to_look:
Q2_miss_anxiety:
Q3_trust_diff:
Q4_all_done_moment:
Q5_nav_used:
Q6_table:
Q7_candidate_understood:  (十分理解できたか)
Q8_pdf_order_or_loss: (V-C)
Q9_full_read_fallback:
prefer_A_or_B:
wish:  (セル差分等 → Scope)
one_liner:
behavior_code: success | stop_candidate | stop | go
failure_class: Detection | Presentation | Trust | Scope
tags:
```
