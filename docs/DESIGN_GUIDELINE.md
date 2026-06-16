# SUGUDASU デザインガイドライン

**対象**: `tools/*.html` 全8本（見積・ラベル・シフト・議事録・逆引き・割り勘・プレゼント・SNS）  
**読者**: Claude / 人間の実装者  
**更新**: 2026-06

---

## 0. このガイドの目的

Gemini 生成物にありがちな「PROバッジ・絵文字多め・ギフトショップ風・色がツールごとにバラバラ」を抑え、**20〜30代・ITリテラシーあり**が日常的に触る **無料Webツール / 軽量SaaS**（Notion・freee風の入力、Stripe Docs・Vercel Dashboard 風の余白とコントラスト）に寄せる。

> 参考イメージ: [invoice-pdf-generator](https://github.com/Kaoru-Stats-Lab/invoice-pdf-generator) の **2カラム＋用紙プレビュー＋印刷分離** は採用。**過剰な装飾・バッジ・FAQの装いすぎ** は採用しない。

---

## 1. ペルソナとトーン

| 項目 | 方針 |
|------|------|
| ユーザー | 20〜30代、副業・フリマ・小規模店舗・オフィスワーカー。ITに慣れ、ログイン不要ツールを好む |
| 言葉 | 敬体だが堅すぎない。「すぐ終わる」「ブラウザだけで完結」「データは送らない」 |
| 見た目 | **実用ファースト**。装飾より読みやすさ・タップしやすさ・印刷の確実さ |
| 避ける | キラキラ感、和風セリフ多用、PRO/AI感の強いバッジ、絵文字の連打、ダークヘッダー＋蛍光グリーンの定型 |

---

## 2. デザイントークン（全ツール共通）

### 2.1 カラー

```text
ページ背景      #F1F5F9  (slate-100)
カード背景      #FFFFFF
ボーダー        #E2E8F0  (slate-200)
本文            #1E293B  (slate-800)
補助テキスト    #64748B  (slate-500)
プライマリ      #2563EB  (blue-600)   … 主CTA・リンク
プライマリ hover #1D4ED8  (blue-700)
セカンダリ      #0F172A  (slate-900)   … ヘッダー・強調ボタン
成功・印刷CTA   #059669  (emerald-600) … 印刷/PDFのみ（1画面1つまで）
警告            #D97706  (amber-600)
エラー          #DC2626  (rose-600)
```

- **ツールごとに indigo / amber / rose のテーマ色を変えない**（差別化はアイコン1つ＋ページタイトルのみ）。
- プレビュー用紙内の **帳票・ラベル** はモノクロ＋1アクセント（表ヘッダー `slate-800` など）に限定。

### 2.2 タイポグラフィ

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
```

| 用途 | サイズ | ウェイト |
|------|--------|----------|
| ページタイトル（ヘッダー内） | 15–16px | 700 |
| セクション見出し | 13–14px | 700 |
| ラベル | 11–12px | 600, `text-slate-600` |
| 入力・本文 | 13–14px | 400–500 |
| 金額・型番 | `Roboto Mono` or `Inter` tabular | 500–700 |

- **Shippori Mincho / Marcellus 等の装飾フォントは使わない**（プレゼント・逆引きも Noto のみで統一）。
- 見出しに絵文字を付ける場合は **最大1つ/セクション**。

### 2.3 余白・角丸・影

| トークン | 値 |
|----------|-----|
| ページ左右 padding | `px-4 sm:px-6 lg:px-8` |
| カード padding | `p-5 lg:p-6` |
| カード角丸 | `rounded-xl`（`2xl` はヒーローのみ） |
| カード影 | `shadow-sm` + `border border-slate-200`（影だけに頼らない） |
| 入力角丸 | `rounded-lg` |
| セクション間 | `space-y-5` または `gap-6` |

### 2.4 レイアウト

```text
┌─────────────────────────────────────────────┐
│ Header（slate-900・高さ 56–64px・sticky可）    │
├──────────────────┬──────────────────────────┤
│ フォームカード     │ プレビューカード            │
│ lg:col-span-6    │ lg:col-span-6            │
│ .no-print        │ .print-target 含む        │
└──────────────────┴──────────────────────────┘
│ Footer / FAQ（.no-print）                     │
└─────────────────────────────────────────────┘
```

- **max-width**: `max-w-7xl`（請求書）〜 `max-w-[1600px]`（ラベル）。中央寄せ `mx-auto`。
- スマホ: 1カラム。**フォーム → プレビュー** の順（プレビューが先だと入力しづらい）。

---

## 3. コンポーネント規約

### 3.1 ヘッダー（全ツール同一構造）

```html
<header class="no-print bg-slate-900 text-slate-100 border-b border-slate-800">
  <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
    <div class="flex items-center gap-2 min-w-0">
      <!-- 任意: 24px SVG アイコン。絵文字でも可だが1つのみ -->
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

- **「PRO」バッジは付けない**（有料感・チープ感が出る）。
- サブタイトル `sugudasu.online/xxx` は `text-[10px] text-slate-400`。

### 3.2 ボタン

| 種別 | クラス |
|------|--------|
| プライマリ | `bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg` |
| 印刷・PDF | `bg-emerald-600 hover:bg-emerald-500`（ヘッダーに1つ） |
| セカンダリ | `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50` |
| 危険 | `text-rose-600 hover:text-rose-700`（テキストのみで可） |

- グラデーションボタン（`from-emerald-600 to-indigo-600`）は **使わない**。

### 3.3 タブ・セグメント

```html
<div class="bg-slate-100 p-1 rounded-lg grid grid-cols-N gap-1 border border-slate-200">
  <button class="... bg-white text-slate-900 shadow-sm">選択中</button>
  <button class="... text-slate-500 hover:text-slate-800">未選択</button>
</div>
```

- 見積/納品/請求、ローカル/Gemini タブは **同じパターン**。

### 3.4 入力

```html
<label class="block text-xs font-semibold text-slate-600 mb-1">ラベル</label>
<input class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white
  focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500">
```

- ファイルアップロード: `border-2 border-dashed border-slate-200 rounded-lg` の正方形エリア。

### 3.5 プレビュー「用紙」

| 種類 | 画面 | 印刷 |
|------|------|------|
| A4縦（請求書・ラベル・カード） | `width: 210mm`、影 `shadow-md`、背景白 | 影なし・scale(1) |
| A4横（シフト） | 同上 `297mm × 210mm` | `@page { size: A4 landscape }` |

- 画面内縮小: `transform: scale(0.65~0.85)` + `origin-top-left`。**印刷時は必ず scale(1)**。

### 3.6 信頼バッジ

```html
<p class="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
  ブラウザ内完結・外部送信なし
</p>
```

- ヘッダー右 or フォーム直上。緑は **この用途のみ**。

### 3.7 AdSense プレースホルダ（導入時）

```html
<aside class="no-print ad-slot border border-dashed border-slate-200 rounded-lg bg-slate-50
  text-[10px] text-slate-400 text-center py-6">
  広告枠
</aside>
```

- プレビュー用紙・入力テーブルの **上に重ねない**。

---

## 4. 印刷ガイドライン（@media print）

### 4.1 原則

1. **操作用UIは一切印刷しない**（フォーム・ヘッダー・FAQ・広告・ツールチップ）。
2. **用紙1枚＝意図した物理サイズ**（A4縦が基本。シフトのみ横）。
3. ブラウザのヘッダー/フッター（URL・日付）はユーザー側でオフ推奨（UIに短い注記）。
4. 色は `-webkit-print-color-adjust: exact` で表ヘッダー等を維持。

### 4.2 必須クラス命名

| クラス | 意味 |
|--------|------|
| `.no-print` | 印刷時 `display: none !important` |
| `.print-only` | 画面では非表示、印刷時のみ表示（稀に使用） |
| `.print-target` | 印刷対象のルート（プレビュー親） |
| `.a4-page` / `.a4-sheet` | 物理用紙1枚 |

**ルール**: ボタン・ナビ・フォームには必ず `no-print`。プレビュー用紙自体には付けない。

### 4.3 標準 CSS スニペット（A4縦）

各 `tools/*.html` の `<style>` にコピーし、ツール固有部分だけ上書きする。

```css
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  html, body {
    width: 210mm;
    min-height: 297mm;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
  }

  .no-print {
    display: none !important;
  }

  .print-target {
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    background: transparent !important;
  }

  .print-target .preview-scaler {
    transform: none !important;
    scale: 1 !important;
  }

  .a4-page,
  .a4-sheet {
    box-shadow: none !important;
    margin: 0 !important;
    width: 210mm !important;
    min-height: 297mm !important;
    page-break-after: always;
    break-after: page;
  }

  .a4-page:last-child,
  .a4-sheet:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  .label-cell {
    border-color: transparent !important; /* 補助破線を消す */
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

### 4.4 ツール別印刷仕様

| ツール | 用紙 | 余白（印刷） | 改ページ |
|--------|------|--------------|----------|
| `index.html` 請求書 | A4縦 | 15–20mm（帳票内 padding） | 明細が長い場合は用紙内で改ページ検討 |
| `label.html` | A4縦 | **0mm `@page margin`**。シール寸法は JS 規格マスタ通り | 24面/12面/10面ごとに1枚 |
| `shift.html` | A4横 | 5mm 程度 | **月ごと** `page-break-before: always` |
| `present.html` 等（印刷なし） | — | 印刷ボタン非表示 or 印刷対象なし | — |
| `warikan.html` | 任意 | 結果エリアのみ印刷する場合は `.print-target` を結果カードに限定 | 1ページ想定 |

### 4.5 画面用 scale と印刷の分離（重要）

```html
<div class="print-target bg-slate-200/50 p-4 rounded-xl no-print:bg-slate-100">
  <div class="preview-scaler scale-[0.75] origin-top-left ...">
    <div class="a4-page">...</div>
  </div>
</div>
```

```css
@media print {
  .preview-scaler { transform: none !important; margin: 0 !important; }
}
```

- **よくあるバグ**: 画面用 `scale(0.45)` が印刷に残り、用紙が小さくなる → 必ずリセット。

### 4.6 印刷前チェックリスト

- [ ] ヘッダー・フォーム・FAQ が消える
- [ ] 用紙が A4 1枚に収まる（Chrome 印刷プレビューで確認）
- [ ] 罫線・表ヘッダー色が消えない
- [ ] ラベル: 補助破線が印刷されない
- [ ] シフト: 2ヶ月目が2枚目に改ページされる

---

## 5. Gemini 生成物からの修正チェックリスト

実装・レビュー時に以下があれば **ガイドライン違反** として直す。

| 違反例 | 修正 |
|--------|------|
| `PRO` / `AI` バッジ | 削除 |
| ヘッダーがツールごとに indigo/amber/stone | `slate-900` に統一 |
| グラデーションCTA | 単色 `blue-600` or `emerald-600` |
| セリフ・ギフトショップフォント | Noto Sans JP のみ |
| 絵文字だらけの見出し | 0〜1個に |
| Tailwind CDN v3 と v4 混在 | **v4 browser** か **v3 CDN** をプロジェクトで1つに（推奨: `@tailwindcss/browser@4`） |
| `<head>` 内の長文プロンプトコメント | `docs/prompts/` へ移し HTML から削除 |
| `flex-col` の typo (`flex-col: column`) | 修正 |
| 印刷時に `scale` 残存 | `@media print` で解除 |

---

## 6. ツール別の最小差分（アイコン・印刷の有無）

| ファイル | ヘッダーアイコン | 印刷 |
|----------|------------------|------|
| index.html | 書類 SVG | ○ A4縦 |
| label.html | ラベル SVG | ○ A4縦 |
| shift.html | カレンダー SVG | ○ A4横 |
| report.html | 文書 SVG | △（コピー中心・印刷任意） |
| reverse.html | 辞書 SVG | × |
| present.html | ギフト SVG | × |
| warikan.html | 天秤 SVG | △（清算文のみ） |
| sns.html | テキスト SVG | × |

---

## 7. 共通化（実装済み）

| レイヤ | パス | 役割 |
|--------|------|------|
| トークン・印刷・コンポーネント | `assets/sugudasu.css` | `:root` トークン、`sg-card` / `sg-input` / `sg-trust-badge`、`@media print`（請求・ラベル・シフト含む） |
| クローム | `assets/sugudasu-shell.js` | ヘッダー・9本ナビ・フッター。`SUGUDASU_SHELL.mount({ title, print, landscape })` |
| ツール本体 | `tools/*.html` | **帳票ロジック・規格マスタ・ツール固有 DOM のみ**（`<style>` は原則なし） |

### 各 HTML の最小ヘッド

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<link rel="stylesheet" href="../assets/sugudasu.css">
```

### 各 HTML の末尾

```html
<div id="sg-chrome-top"></div>
<!-- main … -->
<div id="sg-chrome-bottom"></div>
<script src="../assets/sugudasu-shell.js"></script>
<script>SUGUDASU_SHELL.mount({ title: 'ツール名', print: true });</script>
```

- シフトのみ `landscape: true` を追加。
- フォントは `sugudasu.css` の `@import` に集約（HTML に Google Fonts を書かない）。

### 本番ビルド（Cloudflare Pages）

```bash
npm run build:pages   # → dist/（/assets/ 絶対パス・index.html = hub）
```

開発時は従来どおり `cd tools && python -m http.server`（`../assets/` 相対パス）。

---

## 8. 参照

- 請求書リファレンス実装: [Kaoru-Stats-Lab/invoice-pdf-generator](https://github.com/Kaoru-Stats-Lab/invoice-pdf-generator)  
- プロンプト履歴: `docs/prompts/`  
- サイト構成: 別紙（統合ドメイン設計）
