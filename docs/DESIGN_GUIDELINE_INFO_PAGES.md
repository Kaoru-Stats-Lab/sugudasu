# SUGUDASU — 情報ページ統一ガイド（Info Pages）

**対象**: `/updates` · `/roadmap` · `/statements` · `/privacy` · `/terms` · `/disclaimer`  
**実装 SSOT**: `assets/sugudasu.css` の `.sg-info-page` · `.sg-info-prose`  
**親ガイド**: [`DESIGN_GUIDELINE.md`](DESIGN_GUIDELINE.md)（トーン · §1.2.1）  
**更新**: 2026-08-06（§3.1 縦リズム · `.sg-info-rhythm` / `.sg-info-stack`）

> **境界（MECE）:** 本ファイルは **情報ページの幅・タイポ・クラス** の正本。  
> 実務ツールの `sg-tool-lead`（What / light·heavy）は対象外 → [`notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md`](notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md)。  
> `.sg-info-page__lead` は **情報ページ用リードの見た目クラス**であり、tool lead の構造ルールとは別物。

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
| 表（データ） | 12px | slate-600 本文 · slate-800 ヘッダ | `.sg-info-prose table` · セル `0.625rem 0.75rem` · 隣接列 `padding-left: 1rem`（**左 padding 0 禁止**） |
| キャプション | 11px | slate-500 | `.sg-info-caption` |
| フッター日付 | 12px | slate-600 | `.sg-info-prose footer` |
| リンク | 14px semibold | blue-600 | `.sg-info-prose a` |

**行間**: 本文 `1.625`（`leading-relaxed` 相当）。

### 3.1 縦リズム（読みやすさ · 必須）

長文・図解・枠付きブロックが続くページは、**余白で階層を作る**（色や影で埋めるな）。

| トークン | 値 | 用途 |
|----------|-----|------|
| `--sg-info-rhythm-xs` | `0.5rem` | ピル同士 · 超近接 |
| `--sg-info-rhythm-sm` | `0.75rem` | 密接リスト · header 内 |
| `--sg-info-rhythm-md` | `1.25rem` | 見出し→本文 · 段落間の下限 · `.sg-info-stack` |
| `--sg-info-rhythm-lg` | `1.75rem` | 枠付きブロック同士 · 図解まわり · `.sg-info-stack--loose` |
| `--sg-info-rhythm-xl` | `2.5rem` | 記事内の主要セクション間 · `.sg-info-rhythm` |

**マークアップ:**

```html
<article class="sg-card p-6 lg:p-8 sg-info-prose sg-info-rhythm">
  <section class="sg-info-stack"><!-- 標準 --></section>
  <section class="sg-info-stack--loose"><!-- 図解 · 呼出し同士 --></section>
</article>
<!-- 法務（条文が細かい）: sg-info-rhythm sg-info-rhythm--compact（gap 2rem） -->
```

| 禁止 | 代替 |
|------|------|
| セクション内 `space-y-2` / `space-y-3` だけで長文を詰める | `.sg-info-stack` 以上 |
| 枠付きブロック（`.sg-note` · `.sg-copy-disclosure` · callout）を視覚的に密着させる | 親を `--loose`、またはブロック間 ≥ `lg` |
| 図解レイヤ（`.sg-diagram-stack`）の `gap` を 0.35rem 未満にする | CSS 正本の gap（約 0.6rem）を維持 |

**実装チェック:** 見出し直後・図解の上下・隣接カードのあいだに「指1本分」の白場があるか。なければ `md` / `lg` を上げる。

---

## 4. コンポーネント

| クラス | 用途 |
|--------|------|
| `.sg-info-callout` | 重要ボックス（privacy のデータ処理方式など） |
| `.sg-info-section-title` | 帯付き h2（statements · updates タイムライン以外） |
| `.sg-info-card-title` | sg-card 内 h3（updates フィードバック等） |
| `.sg-info-caption` | 10–11px の但し書き |
| `.sg-info-rhythm` | 記事内セクション間の縦ギャップ（§3.1） |
| `.sg-info-rhythm--compact` | 法務向け（gap 2rem） |
| `.sg-info-stack` / `--loose` / `--tight` | セクション内の縦スタック |
| `.sg-statements-*` | statements 専用（目次 · 図解 · ピル）— 本文色は prose に合わせる |

---

## 5. ページ別メモ

| ページ | 構造 |
|--------|------|
| **updates** | `main.sg-info-page` + ヘッダー + 複数 `section.sg-card` |
| **statements** | 単一 `article.sg-info-prose.sg-info-rhythm` + `.sg-info-stack*` · 目次 · 図解キット。Copy-first の意味は **チャネル非接続 / 手動持ち帰り**（CASE-2026-007 · 契約 §4）。ツール lead_profile テンプレは当てはめない |
| **guides** | 索引 `guides.html` + `guides/{slug}` · **`sg-guide-article`**（§9 UI_LAYOUT_REFRESH_GUIDE） |
| **privacy / terms / disclaimer** | 単一 `article.sg-info-prose.sg-info-rhythm.sg-info-rhythm--compact`、条文は `h3` + `p` / `ul` |

---

## 6. 実装チェックリスト

新規情報ページ追加時:

1. [`PAGE_LAYOUT_SELECTOR.md`](notes/PAGE_LAYOUT_SELECTOR.md) で **D（情報）か E（ガイド記事）か** を決める
2. `main` に `.sg-info-page`（D）または `.sg-guide-page`（E）を付ける（`max-w-*` は付けない）
3. 本文ラッパーに `.sg-info-prose`（D/E 共通本文）+ 長文は `.sg-info-rhythm`（法務は `--compact`）
4. セクション内は `.sg-info-stack`（詰めて見えるなら `--loose`）。`space-y-2/3` だけで済ませない（§3.1）
5. インライン `text-xs` / `text-sm` / `text-slate-*` を prose に任せる
6. `npm run build:pages` で dist 確認（見出し・図解・隣接カードの白場を目視）

---

## 7. 参照

- 配色トークン: `DESIGN_GUIDELINE.md` §2 · ユーザー向け語彙: §1.2.1
- ツールページ リード文（対象外だが境界確認用）: [`notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md`](notes/TOOL_LEAD_COPY_AGENT_PLAYBOOK.md)
- 廃止レイアウト経緯: [`archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md`](archive/DESIGN_LAYOUT_PRE_UI_REFRESH_2026-07.md)
- Notion Like カード: `DESIGN_GUIDELINE_NOTION_LIKE.md`（Schedule 参照分析。情報ページは **装飾控えめ**）
