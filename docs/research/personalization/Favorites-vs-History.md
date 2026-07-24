# Favorites vs History — 調査メモ

**種別:** Research  
**判断:** [ADR-006](../../adr/ADR-006-search-ia-principles.md) — **Pin のみ · History なし**

---

## 問い

Hub で「よく使うツール」へ戻る手段をどう設計するか。

| 方式 | 概要 |
|------|------|
| **Pin（お気に入り）** | ユーザーが明示的に固定 |
| **History（最近使った）** | 自動記録 · 時系列 |
| **Main Grid ソート** | 利用頻度で並べ替え |

---

## SUGUDASU の決定（ADR-006）

- **Pin** — 別領域に限定。件数上限 · LocalStorage
- **History** — 採用しない
- **Main Grid** — 固定（利用順ソートしない）

---

## 参考プロダクト（追記用）

### IT-Tools

- Pin / カテゴリ / 検索の関係（Gemini 調査後に追記）

### DevToys

- ピン留めの有無 · ローカル設定（追記）

### 一般

| 観点 | Pin | History |
|------|-----|---------|
| 意図 | 明示的 | 暗黙的 |
| プライバシー期待 | 低（自分で選んだ） | 高（何を見たか残る） |
| メンテ | 上限 · 削除 UI | 順序 · 期限 · クリア |
| 空間記憶 | 別レーンなら Main Grid と両立 | 一覧の先頭が毎回変わり得る |

---

## Phase1 との関係

[`decision-log/2026-07-top-page-ux-review.md`](../../decision-log/2026-07-top-page-ux-review.md):

- Phase1: **お気に入り強調は非採用**（初見 UX 優先 · データ不足）
- Phase2 / ADR-006: **Pin 別領域**は「強調」とは別 — Main Grid を動かさない前提

[`cursor/guardrail.md`](../../cursor/guardrail.md) §5 — Phase1 実装中はお気に入り仕様禁止。Search v2 着手時に ADR-006 と整合確認。

---

## 追記ログ

| 日付 | 内容 |
|------|------|
| 2026-07-24 | 枠組み · ADR-006 決定を反映 |
