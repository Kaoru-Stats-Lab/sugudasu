# SUGUDASU — 情報ページ統一ガイド（Info Pages）

**対象**: `/updates` · `/statements` · `/privacy` · `/terms` · `/disclaimer`  
**実装 SSOT**: `assets/sugudasu.css` の `.sg-info-page` · `.sg-info-prose`  
**親ガイド**: [`DESIGN_GUIDELINE.md`](DESIGN_GUIDELINE.md)  
**更新**: 2026-06-25

---

## 1. 目的

法務・約束・更新履歴は **実務ツールと同じトーン** で読めること。横幅・文字サイズ・色は `sg-info-page` / `sg-guide-page` で系統ごとに固定（選定: [`notes/PAGE_LAYOUT_SELECTOR.md`](notes/PAGE_LAYOUT_SELECTOR.md)）。

統一前の課題・旧 `max-w-*` 指定の経緯は [`archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md`](archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md)（アーカイブ）。

---

## 2. レイアウト

```html
<main class="sg-info-page">
  <article class="sg-card sg-info-prose …">…</article>
</main>
```

| トークン | 値 | 備考 |
|----------|-----|------|
| `--sg-info-max-width` | `48rem` | 全情報ページ共通 |
| 横 padding | `1rem` → sm `1.5rem` → lg `2rem` | ツールページと同型 |
| 縦 padding | `2rem` | `py-8` 相当 |

**updates** のみカードを複数並べるが、`main` は同じ `.sg-info-page`。各 `section.sg-card` はそのまま。

---

## 3. タイポグラフィ

| 要素 | サイズ | 色 | クラス / セレクタ |
|------|--------|-----|-------------------|
| ページタイトル | 20px / bold | slate-900 | `.sg-info-page__title` または `h1` |
| ブランド副題 | 12px | slate-500 | `.sg-info-page__subtitle` |
| リード文 | 14px | slate-600 | `.sg-info-page__lead` |
|  eyebrow バッジ | 11px bold | emerald / violet | 既存 pill（変更しない） |
| セクション h2 | 16px bold | slate-900 | `.sg-info-section-title` |
| 条文 h3 / 小見出し | 14px bold | slate-900 | `.sg-info-prose h3` |
| 本文 p / li | 14px | slate-700 | `.sg-info-prose` 継承 |
| カード内見出し | 14px bold | slate-900 | `.sg-info-card-title` |
| 表（データ） | 12px | slate-600 本文 · slate-800 ヘッダ | `.sg-info-prose table` |
| キャプション | 11px | slate-500 | `.sg-info-caption` |
| フッター日付 | 12px | slate-600 | `.sg-info-prose footer` |
| リンク | 14px semibold | blue-600 | `.sg-info-prose a` |

**行間**: 本文 `1.625`（`leading-relaxed` 相当）。

---

## 4. コンポーネント

| クラス | 用途 |
|--------|------|
| `.sg-info-callout` | 重要ボックス（privacy のデータ処理方式など） |
| `.sg-info-section-title` | 帯付き h2（statements · updates タイムライン以外） |
| `.sg-info-card-title` | sg-card 内 h3（updates フィードバック等） |
| `.sg-info-caption` | 10–11px の但し書き |
| `.sg-statements-*` | statements 専用（目次 · 図解 · ピル）— 本文色は prose に合わせる |

---

## 5. ページ別メモ

| ページ | 構造 |
|--------|------|
| **updates** | `main.sg-info-page` + ヘッダー + 複数 `section.sg-card` |
| **statements** | 単一 `article.sg-info-prose` + 目次 · 図解キット |
| **guides** | 索引 `guides.html` + `guides/{slug}` · **`sg-guide-article`**（§9 UI_LAYOUT_REFRESH_GUIDE） |
| **privacy / terms / disclaimer** | 単一 `article.sg-info-prose`、条文は `h3` + `p` / `ul` |

---

## 6. 実装チェックリスト

新規情報ページ追加時:

1. [`PAGE_LAYOUT_SELECTOR.md`](notes/PAGE_LAYOUT_SELECTOR.md) で **D（情報）か E（ガイド記事）か** を決める
2. `main` に `.sg-info-page`（D）または `.sg-guide-page`（E）を付ける（`max-w-*` は付けない）
3. 本文ラッパーに `.sg-info-prose`（D/E 共通本文）
4. インライン `text-xs` / `text-sm` / `text-slate-*` を prose に任せる
5. `npm run build:pages` で dist 確認

---

## 7. 参照

- 配色トークン: `DESIGN_GUIDELINE.md` §2
- 廃止レイアウト経緯: [`archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md`](archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md)
- Notion Like カード: `DESIGN_GUIDELINE_NOTION_LIKE.md`（ツール向け。情報ページは **装飾控えめ**）
