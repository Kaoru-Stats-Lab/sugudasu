# SUGUDASU — 情報ページ統一ガイド（Info Pages）

**対象**: `/updates` · `/statements` · `/privacy` · `/terms` · `/disclaimer`  
**実装 SSOT**: `assets/sugudasu.css` の `.sg-info-page` · `.sg-info-prose`  
**親ガイド**: [`DESIGN_GUIDELINE.md`](DESIGN_GUIDELINE.md)  
**更新**: 2026-06-25

---

## 1. 目的

法務・約束・更新履歴は **実務ツールと同じトーン** で読めること。横幅・文字サイズ・色がページごとにバラつくと「別サイト」と感じられ、AdSense 審査・信頼性にも不利。

| 問題（統一前） | 方針 |
|----------------|------|
| `max-w-3xl` と `max-w-4xl` が混在 | **48rem（768px）** に固定 |
| 本文が 12px / 14px / 16px 混在 | 本文 **14px** に統一 |
| 見出しが h1/h2 でサイズ不揃い | 階層トークンで固定 |
| リンク色・太さがバラつく | `sg-info-prose a` に集約 |

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
| **privacy / terms / disclaimer** | 単一 `article.sg-info-prose`、条文は `h3` + `p` / `ul` |

---

## 6. 実装チェックリスト

新規情報ページ追加時:

1. `main` に `.sg-info-page` を付ける（`max-w-*` は付けない）
2. 本文ラッパーに `.sg-info-prose`
3. インライン `text-xs` / `text-sm` / `text-slate-*` を prose に任せる
4. `npm run build:pages` で dist 確認

---

## 7. 参照

- 配色トークン: `DESIGN_GUIDELINE.md` §2
- Notion Like カード: `DESIGN_GUIDELINE_NOTION_LIKE.md`（ツール向け。情報ページは **装飾控えめ**）
