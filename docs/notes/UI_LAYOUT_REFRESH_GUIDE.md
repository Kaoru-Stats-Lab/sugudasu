# Core UI Refresh Guide (Core)

更新: 2026-07-03  
対象: `sugudasu.com` の core ツール全ページ（`tools/*.html`）

## 1. 目的

- ヘッダー情報量の増加による過密を解消し、主要導線を見失わない。
- `ヘッダー / 作業エリア / 使い方 / FAQ` の横幅・余白・文字サイズを統一する。
- スマホで読める最小サイズを保証しつつ、PCで情報密度を維持する。

## 2. 変更しない原則

- 命名3層（`id / conceptName / productName`）は維持。
- `#sg-chrome-top` + `sugudasu-shell.js` の自動マウント契約は維持。
- 色意味は維持（L1: 無彩色セグメント, L2: 青CTA, L3: 緑印刷）。
- Notion資料の色は直採用しない。`assets/sugudasu.css` のトークン経由でのみ調整。

## 3. レイアウト基準（PC / Mobile）

### 3.1 共通コンテナ

- 標準本文: `max-width: 76rem`（1216px）
- ワイド例外: 帳票プレビュー系のみ `max-width: 92rem`（1472px）まで許容
- 印刷作業幅: `max-width: 120rem`（1920px）— `sg-main-shell--print`（shift · label · receipt）
- 左右余白:
  - Mobile: `16px`
  - Tablet: `24px`
  - Desktop: `32px`

### 3.2 セクション間余白

- ブロック間: `24px`（Desktop） / `16px`（Mobile）
- カード内: `20px`（Desktop） / `16px`（Mobile）
- FAQセクション上下: `32px`（Desktop） / `24px`（Mobile）

### 3.3 タイポスケール（最小可読サイズを固定）

- 本文: `14px` 以上
- 補助文: `12px` 以上
- マイクロコピー: `11px` 以上（10pxを原則禁止）
- セクション見出し: `15px`（Desktop） / `14px`（Mobile）
- FAQ summary: `14px`（Desktop） / `13px`（Mobile）

## 4. ヘッダー情報設計

### 4.1 目的

- ツール数増加時でも「現在ページ」「主要導線」「一覧復帰」が一目で分かること。

### 4.2 ルール

- モバイルはナビを横スクロール化し、1列固定グリッドをやめる。
- ラベル最小サイズは `11px`。
- ページタイトル補助文は狭幅時に優先度を下げる（主タイトルを残す）。
- ナビ行高さは `40px` 以上を確保（誤タップ抑制）。

## 5. FAQ統一仕様

- FAQ外枠は `max-width: 56rem`（896px）で中央配置。
- タイトルと導入文は中央寄せ、QA本体は左寄せ。
- `.sg-faq` の1パターンに統一し、`sg-notion-toggle` との差を縮小。
- summary行は `13px` 以上、本文は `13px` / 行高 `1.65` を基準。

## 6. 先行適用（完了 · アーカイブ）

2026-07 パイロット4本 → 2026-07-03 に core 全ページへ展開済み。詳細は [`archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md`](../archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md) §4。

## 7. 受け入れ条件（Refresh 完了）

- `/link-qr` と `/normalize` のFAQが中央コンテナで揃い、見出し導入が中央化される。
- モバイルでヘッダーナビが詰まらず、横スクロールで全ツールへ到達できる。
- 本文・補助文の最小フォント下限（14/12/11）が守られる。
- `npm run validate:tool-naming` と `npm run build:pages` が成功する。

## 8. 情報ページ（例外幅）

対象: `/guides` · `/not-a-car` · `/privacy` · `/terms` · `/disclaimer` · `/statements` · `/updates`

- 本文幅は **48rem**（`--sg-info-max-width`）を維持。長文・法務の可読性優先。
- 横 padding · 縦 padding · タイポ下限は §3 と同型（`DESIGN_GUIDELINE_INFO_PAGES.md` 参照）。
- `main` は `.sg-info-page`（ツールの `.sg-main-shell` とは別系統）。
- `/updates` は **改善タイムラインを上・報告フォームを下** に固定。タイムライン縦線は changelog 1 箇所のみ。

## 9. 実務ガイド記事（第4系統）

対象: `tools/guides/*.html`（8本 + 索引 `guides.html`）

- `main.sg-guide-page`（**52rem**）— 法務よりやや広く、比較表の可読性優先。
- `article.sg-guide-article.sg-guide-article--{pillar}` — 柱カラー（event / production / team / docs）。
- 構造: パンくず → ヘッダー（`.sg-guide-lead-deck` でリード**単列**）→ 要点 → 本文 → FAQ → 関連ツール CTA。
- 表は `.sg-guide-table-scroll` で横スクロール（3/4/5列は `table-layout: fixed` で列幅配分）。当日手順の `ol` は `.sg-guide-steps`。
- 新規記事は `scripts/migrate-guide-article-layout.mjs` を雛形参照、または手動で同構造を踏襲。

## 10. レイアウト選定（Agent 必須）

**SSOT:** [`PAGE_LAYOUT_SELECTOR.md`](PAGE_LAYOUT_SELECTOR.md)

新規ページ・大幅改稿の前に、内容に応じて系統 A–F を1つ選ぶ。ガイド記事（E）と法務（D）・実務ツール（A–C）を混同しない。

廃止したレイアウト指定の経緯: [`archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md`](../archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md)
