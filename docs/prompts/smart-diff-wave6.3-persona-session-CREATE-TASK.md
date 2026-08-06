# Cursor Task: Smart Diff Wave 6.3 — Persona Session（記録）

**用途:** Cursor 投入用 COPYPASTE  
**前提:** Wave 6.2 SESSION_PROTOCOL · Assignment · Evaluation Sheet · **WAVE6.3_FOCUS §0–§3**  
**禁止:** Implementation / Fixture / Ledger / UI 変更 · Telemetry 取得

---

# 以下を Cursor に投入

```markdown
# Smart Diff Wave 6.3 CREATE TASK（Persona Session 記録）

## Goal

Persona Session の実施記録フォーマットを固定し、GO/STOP 判定の入力を揃える。
コード変更・UI改善・Fixture 変更は行わない。

## 開始前ロック（文書済み）

1. 成功 = 判断成功（操作成功ではない）— Miss 最重要 · 「全文を読んだ」は赤信号
2. Participant 説明 = 「この文書変更を承認してよいか判断してください」（「差分を探して」禁止）
3. STOP 条件を GO より先に見る（全文へ戻る · 重要不明 · Candidate不安 · PDF Loss信用不可）

唯一の問い: 承認者は差分一覧で全文確認から解放されたか。

## ログ粒度（認知負荷評価のみ）

必須: 開始 / 最初の変更発見 / 完了 / Miss / 誤認 / 全文へ戻ったか / コメント  
不要: クリック数 · スクロール · 滞在 · マウス · 座標 · 詳細操作イベント

## 作成物

docs/notes/smart-diff/validation/
- WAVE6.3_FOCUS.md（判断成功 · 説明文 · STOP · Session焦点）
- SESSION_LOG_TEMPLATE.md
- SESSION_RESULTS_ROLLUP.md
- SESSION_PROTOCOL.md §2（説明文正本）

## Done when

実施者が Protocol + Focus に従い、テンプレへ記入できる。コードは触らない。
```
