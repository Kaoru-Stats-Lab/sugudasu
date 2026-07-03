# レイアウト指定 — Core UI Refresh 前（アーカイブ）

**Status:** ARCHIVED（2026-07-03）  
**廃止理由:** Core UI Refresh 完了 · `sg-main-shell` / `sg-guide-page` 系統へ移行  
**正本:** [`notes/PAGE_LAYOUT_SELECTOR.md`](../notes/PAGE_LAYOUT_SELECTOR.md) · [`notes/UI_LAYOUT_REFRESH_GUIDE.md`](../notes/UI_LAYOUT_REFRESH_GUIDE.md)

---

## 1. ページ幅（Refresh 前）

| ページ種別 | 旧指定 | 問題 |
|------------|--------|------|
| 実務ツール | `max-w-7xl`（請求書）〜 `max-w-[1600px]`（ラベル）· `mx-auto` | ツールごとに幅がバラつく |
| 情報ページ | `max-w-3xl` / `max-w-4xl` 混在 | 法務の行長が不揃い |
| ガイド記事 | `main.sg-info-page` + `article.sg-card.sg-info-prose` | 長文・比較表が窮屈 · 柱別デザインなし |

**Refresh 後:** `sg-main-shell`（76 / 92 / 120rem）· `sg-info-page`（48rem）· `sg-guide-page`（52rem）。

---

## 2. ヘッダー HTML（Refresh 前 · 各 HTML 直書き時代）

`sugudasu-shell.js` 導入前は、ツールごとに `<header class="no-print bg-slate-900 …">` を直書きしていた。

```html
<header class="no-print bg-slate-900 text-slate-100 border-b border-slate-800">
  <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
    <div class="flex items-center gap-2 min-w-0">
      <div class="min-w-0">
        <p class="text-[10px] text-slate-400 tracking-wide">SUGUDASU</p>
        <h1 class="text-sm font-bold truncate">ツール名</h1>
      </div>
    </div>
    <button type="button" onclick="window.print()"
      class="no-print shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg">
      印刷 / PDF
    </button>
  </div>
</header>
```

**正本（現行）:** `#sg-chrome-top` + `data-sg-*` · [`notes/CHROME_HEADER_GUARDRAILS.md`](../notes/CHROME_HEADER_GUARDRAILS.md)

---

## 3. ガイド記事の旧マークアップ

```html
<main class="sg-info-page">
  <article class="sg-card sg-info-prose">
    <!-- 本文 h2/h3 + FAQ はプレーン見出し -->
  </article>
</main>
```

拡張ルール（`GUIDES_CONTENT_STRATEGY.md` 旧版）:

- `tools/guides/{slug}.html` に `sg-info-prose` · 関連ツール CTA

**正本（現行）:** `sg-guide-page` + `sg-guide-article--{pillar}` · `UI_LAYOUT_REFRESH_GUIDE.md` §9

---

## 4. UI Refresh 先行適用フェーズ（完了）

2026-07 パイロット対象（横展開前）:

- `tools/normalize.html`
- `tools/link-qr.html`
- `tools/invoice.html`
- `tools/fair-draw.html`

**2026-07-03:** core 全ツール + 情報ページ + ガイド8本へ展開済み（DEPLOY-014）。

---

## 5. 情報ページ統一前の課題（経緯）

| 問題 | 方針（Refresh で解消） |
|------|------------------------|
| `max-w-3xl` と `max-w-4xl` が混在 | 48rem 固定 |
| 本文 12/14/16px 混在 | 14px 統一 |
| 見出しサイズ不揃い | 階層トークン固定 |

現行タイポ・コンポーネントは [`DESIGN_GUIDELINE_INFO_PAGES.md`](../DESIGN_GUIDELINE_INFO_PAGES.md) を参照。
