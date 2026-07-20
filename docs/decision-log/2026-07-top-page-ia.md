# SUGUDASU Top IA Decision Log

**日付:** 2026-07-20  
**対象:** Hub（トップ / ツール一覧）  
**状態:** 短いセッションメモ。**設計凍結・Phase・Rejected Ideas の正本は** [`2026-07-top-page-ux-review.md`](2026-07-top-page-ux-review.md)  
**関連:** [`HUB_IA_REFRESH_V2.md`](../notes/HUB_IA_REFRESH_V2.md) · [`TOOL_CARD_WRITING_GUIDELINE.md`](../notes/TOOL_CARD_WRITING_GUIDELINE.md) · [`../cursor/guardrail.md`](../cursor/guardrail.md)

---

## 採用

### 検索チップ

理由

初見ユーザーが検索を始めやすい。

実装: `hub-config.searchExampleChips` · Hero 下のクリック可能 Chip（新規コンポーネントなし）。

---

### ゼロ件UX

理由

離脱率低下。

検索体験維持。

実装: 0件時に「おすすめ / 人気検索 / 検索例」Chip + 検索解除を維持。キーワード本文は GA に送らない。

---

### バッジ整理

理由

情報階層を改善。

カードサイズ変更不要。

実装: status（NEW / Beta / 正式）を強調、仕様（完全ローカル / PC推奨）を弱表示、カード上の「人気」バッジは非表示（押し売り禁止）。

---

### 同義語辞書

理由

ブランド用語を維持しながらSEO改善。

実装: `data/synonyms.json` のみ追加（conceptName / 表示名は不変）。例: ハンコ→印鑑、OCR→QR読取、スクショ→マスク、写真→画像系。

---

## 保留

### マルチカテゴリ

理由

今後100ツールを超えたら必要。

現段階では実装コストが大きい。

TODO のみ: `hub-ia.js` · `categories.json` disclaimer。

---

## 非採用

### 人気カード強調

理由

検索主導思想と矛盾。

一覧性を壊す。

---

### Hero大型カード

理由

UIノイズ増加。

引き算思想に反する。

---

### おすすめランキング

理由

目的検索より誘導を優先してしまう。

---

## Future Review

100ツール到達時に再評価
