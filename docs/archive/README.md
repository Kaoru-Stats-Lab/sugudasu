# ドキュメントアーカイブ（SUGUDASU）

**目的:** 実装・デザインが更新され、**正本から外れた**ガイドライン・文案・指定を保管する。  
**Agent:** 新規実装の参照先にしない。現行 SSOT は各ファイル先頭のリンクを優先。

---

## 現行 SSOT（アーカイブではない）

| 用途 | 正本 |
|------|------|
| ページ種別ごとのレイアウト選定 | [`notes/PAGE_LAYOUT_SELECTOR.md`](../notes/PAGE_LAYOUT_SELECTOR.md) |
| 幅・余白・FAQ · ガイド記事 | [`notes/UI_LAYOUT_REFRESH_GUIDE.md`](../notes/UI_LAYOUT_REFRESH_GUIDE.md) |
| 色 · 3層アクション · コンポーネント | [`DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) |
| 法務・約束ページ | [`DESIGN_GUIDELINE_INFO_PAGES.md`](../DESIGN_GUIDELINE_INFO_PAGES.md) |
| 共通ヘッダー | [`notes/CHROME_HEADER_GUARDRAILS.md`](../notes/CHROME_HEADER_GUARDRAILS.md) |

---

## アーカイブ一覧

| ファイル | 廃止理由 | 置き換え |
|----------|----------|----------|
| [`DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md`](DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md) | Core UI Refresh（2026-07-03）前の幅・ヘッダー・ガイド記事指定 | `PAGE_LAYOUT_SELECTOR` · `UI_LAYOUT_REFRESH_GUIDE` |
| [`UI_MODE_SWITCH_DESIGN_PROPOSAL.md`](UI_MODE_SWITCH_DESIGN_PROPOSAL.md) | モード切替 PoC 提案 — `DESIGN_GUIDELINE` §3.3 に統合済（2026-06-19） | `DESIGN_GUIDELINE.md` §3.2–3.3 · `sugudasu.css` `.sg-segment*` |
| [`cursor-specs-20260715/`](cursor-specs-20260715/) | 2026-07-15 実装済み Cursor 向け仕様書（time-calc v2 · 日付統一 · マスク注釈 · 画像切出し） | `TIME_CALC_TOOL_SPEC` · `NORMALIZE_TEXT_TOOL_SPEC` · `MASK_TOOL_SPEC` · `image-trim` |

---

## 追記ルール

- 正本から削除する歴史的記述は、**要約 + リンク**を正本に残し、全文を本ディレクトリへ移す。
- ファイル名は `テーマ_廃止時期.md` または元ファイル名のまま移動。
- アーカイブ先頭に `Status: ARCHIVED` · 廃止日 · 正本リンクを必ず書く。
