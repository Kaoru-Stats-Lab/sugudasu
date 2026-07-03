# ページレイアウト選定ガイド（Agent SSOT）

**更新:** 2026-07-03  
**目的:** ページの**内容・役割**に応じて、正しい `main` レイアウト系統を選ぶ。誤った系統（例: ガイド記事に法務幅）を防ぐ。  
**実装正本:** `assets/sugudasu.css` · 数値詳細は [`UI_LAYOUT_REFRESH_GUIDE.md`](UI_LAYOUT_REFRESH_GUIDE.md)

---

## 1. 着手前（必須）

新規 HTML 追加 · 大幅リライト · UI Refresh 横展開の**前**に、下表で系統を1つ決める。複数当てはまる場合は **§2 優先順位** に従う。

---

## 2. 系統一覧（MECE）

| # | 系統 | `main` クラス | 最大幅 | いつ使う |
|---|------|---------------|--------|----------|
| A | **実務ツール（標準）** | `sg-main-shell` | 76rem | 入力フォーム · プレビュー · 使い方 · FAQ が主役の `tools/{id}.html` |
| B | **実務ツール（ワイド）** | `sg-main-shell sg-main-shell--wide` | 92rem | 横長プレビュー・多列 UI（hub · warikan · timeline 等） |
| C | **実務ツール（印刷作業）** | `sg-main-shell sg-main-shell--print` | 120rem | 用紙プレビュー・印刷レイアウトが画面の主役（shift · label · receipt） |
| D | **情報ページ（法務・約束）** | `sg-info-page` | 48rem | privacy · terms · disclaimer · statements · updates · not-a-car · **guides 索引** |
| E | **実務ガイド記事** | `sg-guide-page` | 52rem | `tools/guides/{slug}.html` — 長文・比較表・柱カラー・関連ツール CTA |
| F | **Sync / Schedule** | Sync 専用 | — | `sync.sugudasu.com` · Notion Like 表。本ガイドの A–E と**混ぜない** |

**優先順位（衝突時）:** F（Sync）> C（印刷）> B（ワイド）> A（標準）> E（ガイド記事）> D（情報）

例: 請求書は印刷もするが、編集 UI が主 → **A**（帳票タブのみ `sg-section-shell`）。シフト表はプレビューが画面の大半 → **C**。

---

## 3. 決定フロー（コピペ用）

```
1. URL は sync.sugudasu.com か？
   YES → F（DESIGN_GUIDELINE_SYNC / sugudasu-design-schedule.mdc）
   NO  → 2

2. パスは /guides/{slug} か？（索引 /guides は除く）
   YES → E（sg-guide-page + sg-guide-article--{pillar}）
   NO  → 3

3. 法務・約束・更新履歴・ブランド説明か？（privacy / terms / disclaimer / statements / updates / not-a-car / guides 索引）
   YES → D（sg-info-page + sg-info-prose）
   NO  → 4

4. 画面の主役は「用紙・印刷キャンバス」か？（編集よりプレビューが横に広い）
   YES → C（sg-main-shell--print）
   NO  → 5

5. 横長プレビュー・3列以上の作業 UI が必要か？
   YES → B（sg-main-shell--wide）
   NO  → A（sg-main-shell）
```

---

## 4. 系統別 · 必須マークアップ

### A–C 実務ツール

```html
<main class="sg-main-shell"><!-- または --wide / --print -->
  <section class="sg-section-shell">…</section>
</main>
```

- ヘッダー: `#sg-chrome-top` + `data-sg-tool-id` / `data-sg-title`（命名は `TOOL_NAMING_AGENT_PLAYBOOK.md`）
- FAQ: `.sg-faq-section` + `.sg-faq`（§5 UI_LAYOUT_REFRESH_GUIDE）

### D 情報ページ

```html
<main class="sg-info-page">
  <article class="sg-card sg-info-prose">…</article>
</main>
```

- 詳細: [`DESIGN_GUIDELINE_INFO_PAGES.md`](../DESIGN_GUIDELINE_INFO_PAGES.md)
- **ガイド記事本文に `sg-info-page` を使わない**

### E 実務ガイド記事

```html
<main class="sg-guide-page">
  <article class="sg-guide-article sg-guide-article--{pillar}">
    <nav class="sg-guide-breadcrumb">…</nav>
    <header class="sg-guide-header">…</header>
    <section class="sg-guide-takeaways">…</section>
    <div class="sg-guide-body sg-info-prose">…</div>
    <section class="sg-guide-faq sg-faq-section">…</section>
    <aside class="sg-guide-tools">…</aside>
    <p class="sg-guide-back">…</p>
  </article>
</main>
```

- `pillar`: `data/guides.json` の `event` | `production` | `team` | `docs`
- 新規記事: `scripts/migrate-guide-article-layout.mjs` を雛形参照
- 索引 `guides.html` のみ **D**（`sg-info-page`）

---

## 5. よくある誤り

| 誤り | 正しい対応 |
|------|------------|
| ガイド記事に `sg-info-page` | **E** に移行。表・FAQ・CTA 用の構造が欠ける |
| 法務ページに `sg-main-shell`（76rem） | **D**。長文は 48rem で行長を抑える |
| ツールに `max-w-*` を直書き | 系統クラスに任せる。例外は C/B の modifier のみ |
| hub を標準幅のまま | カード多列 → **B** `--wide` |
| 印刷ツールを標準幅 | プレビューが窮屈 → **C** `--print` |

---

## 6. 完了条件

- [ ] 上表の系統が1つに決まっている
- [ ] `main` に正しいクラスが付いている
- [ ] ガイド記事なら `guides.json` の pillar と `--{pillar}` が一致
- [ ] `npm run validate:tool-naming` · `npm run build:pages` が pass

---

## 7. 参照

| ドキュメント | 内容 |
|--------------|------|
| [`UI_LAYOUT_REFRESH_GUIDE.md`](UI_LAYOUT_REFRESH_GUIDE.md) | 幅 · 余白 · タイポ · §8–9 各系統 |
| [`DESIGN_GUIDELINE_INFO_PAGES.md`](../DESIGN_GUIDELINE_INFO_PAGES.md) | D 系統の prose ルール |
| [`DESIGN_GUIDELINE.md`](../DESIGN_GUIDELINE.md) | 色 · 3層アクション · ツール UI |
| [`CHROME_HEADER_GUARDRAILS.md`](CHROME_HEADER_GUARDRAILS.md) | ヘッダー未表示時 |
