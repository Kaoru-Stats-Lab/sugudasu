# 2026-07-27 — SUGUDASU Mention 憲法レビュー（判例候補）

**状態:** 判例候補（立法者確認後に Case Law へ要約）  
**製品:** `mention` · 正本 [`../../products/mention/`](../../products/mention/)

---

## 要約

Mention は言及の分析・監視・管理ツールではない。**今見ているページを終わらせる Action Engine**（ルール + 編集可能テンプレ）として、条件付き GO（Chrome Extension Side Panel 先行 · LLM なし）。

---

## 争点

1. 感情分類・「返信を推奨しない」は Anti（評価しない · 判断しない）· F7 に抵触しないか  
2. 返信文の提示は Anti（創造しない）に抵触しないか  
3. Chrome Extension は F3/F4（静的 Pages · 1 HTML）とどう両立するか  
4. Webhook 送信は F2（非送信）に抵触しないか  
5. Inbox / Done は Clip Stash 判例の「管理」に落ちないか  

---

## 立法事実メモ

- ユーザー決定: **1-A** Extension Side Panel 先行 · **2-A** ルール + テンプレのみ（LLM なし）
- Pain は「見つけたあとの往復」であり、レポート視聴ではない
- LLM は品質変動と「炎上しないか」判断を増やし、Zero Thinking と衝突

---

## 適用条文

WHY · Domain · Persona · Anti（創造しない · 評価しない · 提案しすぎない · AIらしさを出さない）  
Commentary C-01 · C-05 · C-07 · C-08  
Product F1 · F2 · F5 · F7（F3/F4 は Extension レーン明示）  
類推: [CASE-2026-002](../CASE_LAW.md#case-2026-002)（管理 Reject）· [CASE-2026-003](../CASE_LAW.md#case-2026-003)（競合名で語らない）· [CASE-2026-005](../CASE_LAW.md#case-2026-005)（F2 字面ではない）

---

## 判決案（条件付き GO）

| 争点 | 判決案 |
|------|--------|
| 感情分析 | **Reject**（画面・内部スコアとも持たない）。Action は構造シグナルのみ |
| 「返信するな」断定 | **Reject**。低星は社内共有 · 確認メモ等の注意付き Action |
| 文面提示 | **GO** — ユーザー編集テンプレの `{{変数}}` 展開のみ。LLM 生成は **Reject** |
| Extension | **GO（別レーン）** — Pages `/mention` は LP のみ。処理・履歴は端末内 |
| Webhook | **条件付き GO** — ユーザー明示ボタン · ユーザー設定 URL · SUGUDASU 管理下へ保存しない |
| Inbox/Done | **GO** — 終わらせるための一時状態。検索・担当・期限・分析は **Reject**（管理軸） |

**総合ラベル:** 条件付き GO（コア思想 · Extension 先行）· Sync 不要

---

## 今後への影響

- 「認識エンジン」ではなく「Action 選択エンジン」として他ツールにも類推可能
- LLM を「文案品質」目的で核心に据える案は、判断負荷増加を理由に原則 HOLD/Reject
- Case Law 昇格時は CASE 番号を付与し、本ログを関連付ける

---

## 関連

- [`../../products/mention/philosophy.md`](../../products/mention/philosophy.md)
- [`../../products/mention/specification.md`](../../products/mention/specification.md)
- 台帳 [`../../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md`](../../notes/PRODUCT_IDEA_JUDGMENT_LEDGER.md) §20
